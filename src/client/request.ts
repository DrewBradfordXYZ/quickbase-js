/**
 * Request execution module
 *
 * Handles the full request lifecycle:
 * 1. Authentication
 * 2. Throttling (if enabled)
 * 3. Request execution
 * 4. Error handling with retry
 */

import type { RequestContext, ResolvedConfig } from '../core/types.js';
import type { AuthStrategy } from '../auth/types.js';
import type { Logger } from '../core/logger.js';
import type { Throttle } from './throttle.js';
import {
  QuickbaseError,
  RateLimitError,
  TimeoutError,
  ReadOnlyError,
  NetworkError,
  LineErrorsError,
  parseErrorResponse,
} from '../core/errors.js';
import { calculateBackoffDelay, extractRateLimitInfo, sleep } from './retry.js';
import { getRealmHostname } from '../core/config.js';
import { convertRecordDates } from '../core/dates.js';
import {
  transformRequest,
  transformResponse,
  extractTableIdFromRequest,
} from '../core/transform.js';
import { resolveTableAlias } from '../core/schema.js';
import { injectAppToken, injectUserToken } from '../xml/request.js';

// =============================================================================
// Read-Only Mode - Defense-in-Depth
// =============================================================================

/**
 * JSON API endpoints that modify data.
 * Layer 1 of defense-in-depth - explicit blocklist.
 * Uses "METHOD /path" for exact match, "METHOD /path/" for prefix match.
 * Note: Paths do not include /v1 prefix as the SDK uses relative paths.
 */
const jsonWriteEndpoints: Record<string, boolean> = {
  // Records
  'POST /records': true, // Upsert
  'DELETE /records': true, // DeleteRecords

  // Apps
  'POST /apps': true, // CreateApp
  'DELETE /apps': true, // DeleteApp (prefix)
  'POST /apps/': true, // UpdateApp, CopyApp (prefix)
  'DELETE /apps/': true, // DeleteApp (prefix)

  // Tables
  'POST /tables': true, // CreateTable
  'DELETE /tables': true, // DeleteTable (prefix)
  'POST /tables/': true, // UpdateTable, relationships (prefix)
  'DELETE /tables/': true, // DeleteRelationship (prefix)

  // Fields
  'POST /fields': true, // CreateField
  'DELETE /fields': true, // DeleteFields
  'POST /fields/': true, // UpdateField (prefix)

  // Files
  'DELETE /files/': true, // DeleteFile (prefix)

  // User tokens
  'POST /usertoken': true, // Clone, Transfer, Deactivate
  'DELETE /usertoken': true, // Delete

  // Users and groups
  'PUT /users': true, // DenyUsers, UndenyUsers
  'PUT /users/': true, // DenyUsersAndGroups (prefix)
  'POST /groups/': true, // AddMembers, AddManagers, AddSubgroups (prefix)
  'DELETE /groups/': true, // RemoveMembers, RemoveManagers, RemoveSubgroups (prefix)

  // Solutions
  'POST /solutions': true, // CreateSolution
  'PUT /solutions/': true, // UpdateSolution, ChangesetSolution (prefix)

  // Document generation (GET but writes)
  'GET /docTemplates/': true, // GenerateDocument (prefix)

  // Solutions to and from records are GETs that write: see SOLUTION_RECORD_WRITE_PATH
};

/**
 * Solution endpoints that are GETs but write: createSolutionFromRecord
 * (/solutions/fromrecord) and updateSolutionToRecord (/solutions/{id}/fromrecord)
 * change apps, and exportSolutionToRecord (/solutions/{id}/torecord) writes a
 * record. changesetSolutionFromRecord (/solutions/{id}/changeset/fromrecord)
 * only reads, and doesn't match.
 */
const SOLUTION_RECORD_WRITE_PATH = /\/solutions\/(fromrecord|[^/]+\/(fromrecord|torecord))$/;

/**
 * POST endpoints that are actually read-only (allowlist).
 * These are exceptions to the "POST = write" rule.
 * Note: Paths do not include /v1 prefix as the SDK uses relative paths.
 */
const jsonReadOnlyPOSTEndpoints: Record<string, boolean> = {
  'POST /records/query': true, // RunQuery - read-only
  'POST /reports/': true, // RunReport - read-only (prefix)
  'POST /formula/run': true, // RunFormula - read-only
  'POST /audit': true, // Audit logs - read-only
  'POST /users': true, // GetUsers - read-only despite POST
  'POST /analytics/': true, // Analytics - read-only (prefix)
};

/**
 * Check if HTTP method is a write operation.
 */
function isWriteMethod(method: string): boolean {
  const upper = method.toUpperCase();
  return upper === 'POST' || upper === 'PUT' || upper === 'DELETE' || upper === 'PATCH';
}

/**
 * Check if request matches a known write endpoint.
 * Uses both exact matching and prefix matching for paths with IDs.
 */
function isJSONWriteEndpoint(method: string, path: string): boolean {
  if (method === 'GET' && SOLUTION_RECORD_WRITE_PATH.test(path)) {
    return true;
  }

  const key = `${method} ${path}`;

  // Exact match
  if (jsonWriteEndpoints[key]) {
    return true;
  }

  // Prefix match for paths with IDs (e.g., "POST /v1/apps/" matches "POST /v1/apps/abc123")
  for (let i = path.length - 1; i >= 0; i--) {
    if (path[i] === '/') {
      const prefixKey = `${method} ${path.slice(0, i + 1)}`;
      if (jsonWriteEndpoints[prefixKey]) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if a POST request is actually read-only (allowlist).
 */
function isJSONReadOnlyPOSTEndpoint(path: string): boolean {
  const key = `POST ${path}`;

  // Exact match
  if (jsonReadOnlyPOSTEndpoints[key]) {
    return true;
  }

  // Prefix match
  for (let i = path.length - 1; i >= 0; i--) {
    if (path[i] === '/') {
      const prefixKey = `POST ${path.slice(0, i + 1)}`;
      if (jsonReadOnlyPOSTEndpoints[prefixKey]) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if request is blocked by read-only mode.
 * Uses two layers of defense:
 * 1. Explicit blocklist of known write endpoints
 * 2. HTTP method check (catch-all for POST/PUT/DELETE/PATCH)
 */
function checkReadOnly(config: ResolvedConfig, method: string, path: string): void {
  if (!config.readOnly) {
    return;
  }

  if (isJSONWrite(method, path)) {
    throw new ReadOnlyError(method, path);
  }
}

/**
 * Whether a request can change data: a known write endpoint (including GETs
 * that write), or any POST, PUT, DELETE or PATCH that isn't a known read sent
 * as POST (runQuery, runReport, ...). Read-only mode refuses these, and they
 * aren't retried after a timeout or 5xx.
 */
function isJSONWrite(method: string, path: string): boolean {
  if (method === 'POST' && isJSONReadOnlyPOSTEndpoint(path)) {
    return false;
  }
  return isJSONWriteEndpoint(method, path) || isWriteMethod(method);
}

// =============================================================================
// Request Types
// =============================================================================

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: unknown;
  /** Content type of a body that isn't JSON (QBL is application/x-yaml); the body is sent as given */
  bodyType?: string;
  /** 'text' returns the response body unparsed (QBL, file content) instead of parsing JSON */
  responseType?: 'json' | 'text';
  query?: Record<string, string | number | boolean | undefined>;
  /** Database ID for temp token auth */
  dbid?: string;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Cancels the request, and any retry wait, when it aborts */
  signal?: AbortSignal;
}

export interface RequestExecutorOptions {
  config: ResolvedConfig;
  auth: AuthStrategy;
  throttle: Throttle;
  logger: Logger;
}

/**
 * Extract dbid from request options for temp-token auth.
 * Checks multiple locations where table/app ID may appear.
 * Resolves aliases to IDs if schema is provided.
 */
export function extractDbid(
  options: RequestOptions,
  config?: ResolvedConfig
): string | undefined {
  // 1. Explicit dbid takes priority
  if (options.dbid) {
    return config?.schema
      ? resolveTableAlias(config.schema, options.dbid)
      : options.dbid;
  }

  // 2. Check query params for tableId
  if (options.query?.tableId) {
    const tableId = String(options.query.tableId);
    return config?.schema ? resolveTableAlias(config.schema, tableId) : tableId;
  }

  // 3. Check query params for appId (for app-level operations)
  if (options.query?.appId) {
    return String(options.query.appId);
  }

  // 4. Check path for tableId (e.g., /v1/tables/{tableId}/...)
  const tableIdMatch = options.path.match(/\/tables\/([^/?]+)/);
  if (tableIdMatch) {
    return tableIdMatch[1];
  }

  // 5. Check path for appId (e.g., /v1/apps/{appId}/...)
  const appIdMatch = options.path.match(/\/apps\/([^/?]+)/);
  if (appIdMatch) {
    return appIdMatch[1];
  }

  // 6. Check request body for 'from' or 'to' fields
  if (options.body && typeof options.body === 'object') {
    const tableId = extractTableIdFromRequest(
      options.body as Record<string, unknown>,
      config?.schema
    );
    if (tableId) return tableId;
  }

  return undefined;
}

/**
 * Build URL with query parameters
 */
function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined>
): string {
  // Ensure baseUrl ends with / and path doesn't start with / to properly join them
  // new URL('/apps/x', 'https://api.quickbase.com/v1') would give https://api.quickbase.com/apps/x (wrong)
  // new URL('apps/x', 'https://api.quickbase.com/v1/') gives https://api.quickbase.com/v1/apps/x (correct)
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = new URL(normalizedPath, normalizedBase);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

/**
 * Create request headers
 */
async function buildHeaders(
  auth: AuthStrategy,
  realmHostname: string,
  dbid?: string,
  customHeaders?: Record<string, string>
): Promise<Record<string, string>> {
  const token = await auth.getToken(dbid);
  const authHeader = auth.getAuthorizationHeader(token);

  return {
    'Content-Type': 'application/json',
    'QB-Realm-Hostname': realmHostname,
    'Authorization': authHeader,
    ...customHeaders,
  };
}

/**
 * Execute a single request (no retry logic)
 */
async function executeSingleRequest(
  options: RequestOptions,
  executor: RequestExecutorOptions,
  context: RequestContext
): Promise<Response> {
  const { config, auth, throttle, logger } = executor;
  const url = buildUrl(config.baseUrl, options.path, options.query);
  const realmHostname = getRealmHostname(config.realm);

  // Get auth headers (use extracted dbid from context)
  const headers = await buildHeaders(auth, realmHostname, context.dbid, options.headers);

  // Apply throttling if enabled
  await throttle.acquire();

  // Build fetch options
  // Use credentials: 'omit' to avoid CORS issues (temp token fetch uses 'include' separately)
  const fetchOptions: RequestInit = {
    method: options.method,
    headers,
    credentials: 'omit',
  };

  if (options.body !== undefined) {
    if (options.bodyType) {
      headers['Content-Type'] = options.bodyType;
      fetchOptions.body = options.body as string;
    } else {
      fetchOptions.body = JSON.stringify(options.body);
    }
  }

  // One controller for our timeout and the caller's signal
  options.signal?.throwIfAborted();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);
  const onAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onAbort, { once: true });
  fetchOptions.signal = controller.signal;

  const startTime = Date.now();

  try {
    const response = await config.fetchApi(url, fetchOptions);
    const duration = Date.now() - startTime;

    logger.timing(options.method, options.path, duration);

    return response;
  } catch (error) {
    // The caller cancelled: their reason, not a timeout of ours
    if (options.signal?.aborted) {
      throw options.signal.reason;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(config.timeout);
    }
    throw new NetworkError(error);
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener('abort', onAbort);
  }
}

/**
 * Handle response and throw appropriate errors
 */
async function handleResponse(
  response: Response,
  requestUrl: string,
  context: RequestContext,
  executor: RequestExecutorOptions
): Promise<Response> {
  const { config, logger } = executor;

  if (response.ok) {
    return response;
  }

  // Extract rate limit info for 429s
  if (response.status === 429) {
    const rateLimitInfo = extractRateLimitInfo(response, requestUrl, context.attempt);

    logger.rateLimit({
      url: requestUrl,
      status: 429,
      retryAfter: rateLimitInfo.retryAfter,
      attempt: context.attempt,
      rayId: rateLimitInfo.qbApiRay || rateLimitInfo.cfRay,
    });

    // Notify callback
    if (config.onRateLimit) {
      config.onRateLimit(rateLimitInfo);
    }

    throw new RateLimitError(rateLimitInfo);
  }

  // Parse and throw appropriate error
  throw await parseErrorResponse(response, requestUrl);
}

/**
 * Execute a request, retrying it with backoff:
 * - after a 429, always (QuickBase didn't process it), waiting Retry-After
 *   when given;
 * - after a 401 the auth strategy has a new token for;
 * - after a timeout, a network error or a 5xx only when the request can't
 *   change data. A write (an upsert, a create) that timed out or got a 502
 *   may have been applied, and sending it again could, for example, add its
 *   records twice. A write whose connection never opened is retried.
 */
export async function executeRequest<T = unknown>(
  options: RequestOptions,
  executor: RequestExecutorOptions
): Promise<T> {
  const { config } = executor;
  const maxAttempts = config.retry.maxAttempts;

  // Check read-only mode before making any request
  checkReadOnly(config, options.method, options.path);
  const retrySafe = !isJSONWrite(options.method, options.path);

  // Extract dbid for temp-token auth (resolves aliases if schema provided)
  const dbid = extractDbid(options, config);

  // Transform the request body: resolve schema aliases when there is a
  // schema, and wrap plain record values ({ '6': 'x' } -> { '6': { value: 'x' } })
  // always. Raw (non-JSON) bodies are strings and pass through.
  let transformedOptions = options;
  if (options.body && typeof options.body === 'object' && !Array.isArray(options.body)) {
    const transformedBody = transformRequest(
      options.body as Record<string, unknown>,
      { schema: config.schema, tableId: dbid }
    );
    transformedOptions = { ...options, body: transformedBody };
  }

  const context: RequestContext = {
    methodName: `${options.method} ${options.path}`,
    attempt: 1,
    maxAttempts,
    dbid,
    startTime: Date.now(),
  };

  return withRetries(context, retrySafe, options.signal, executor, async () => {
    const response = await executeSingleRequest(transformedOptions, executor, context);
    const url = buildUrl(config.baseUrl, options.path, options.query);

    await handleResponse(response, url, context, executor);

    // A response that isn't JSON (QBL, file content) comes back as text
    if (options.responseType === 'text') {
      return (await response.text()) as T;
    }

    // Parse JSON response
    let data = await response.json();

    // An upsert's rejected values (QuickBase saved the records anyway)
    if (config.throwOnLineErrors && options.method === 'POST' && options.path === '/records') {
      const lineErrors = (data as { metadata?: { lineErrors?: Record<string, string[]> } })?.metadata?.lineErrors;
      if (lineErrors && Object.keys(lineErrors).length > 0) {
        throw new LineErrorsError(lineErrors, data);
      }
    }

    // Date and Date/Time values by the result's field types; first, while
    // records are still keyed by field ID
    if (config.convertDates) {
      data = convertRecordDates(data);
    }

    // Transform response if schema is configured
    if (config.schema && dbid) {
      data = transformResponse(data, { schema: config.schema, tableId: dbid });
    }

    return data as T;
  });
}

/**
 * Run attempts until one succeeds, retrying as described on executeRequest.
 * `context.attempt` is the current attempt.
 */
async function withRetries<T>(
  context: RequestContext,
  retrySafe: boolean,
  signal: AbortSignal | undefined,
  executor: RequestExecutorOptions,
  attemptOnce: () => Promise<T>
): Promise<T> {
  const { config, auth, logger } = executor;
  const maxAttempts = context.maxAttempts;

  for (let attempt = 1; ; attempt++) {
    context.attempt = attempt;
    try {
      return await attemptOnce();
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      const last = attempt >= maxAttempts;

      // A 401 retries once the strategy has a new token (temp token, SSO).
      // It isn't a retryable error otherwise, so this comes first.
      if (error instanceof QuickbaseError && error.statusCode === 401 && !last) {
        const refreshed = await auth.handleAuthError(context.dbid);
        if (!refreshed) {
          throw error;
        }
        logger.debug('Token refreshed, retrying request');
        continue;
      }

      if (last) {
        throw error;
      }

      let delayMs: number;
      let reason: string;
      if (error instanceof RateLimitError) {
        delayMs = error.retryAfter
          ? error.retryAfter * 1000
          : calculateBackoffDelay(attempt, config.retry);
        reason = 'Rate limited (429)';
      } else if (!retrySafe && !(error instanceof NetworkError && error.neverSent)) {
        // A write that may have been applied
        throw error;
      } else if (error instanceof TimeoutError) {
        delayMs = calculateBackoffDelay(attempt, config.retry);
        reason = 'Timeout';
      } else if (error instanceof QuickbaseError && error.statusCode >= 500) {
        delayMs = calculateBackoffDelay(attempt, config.retry);
        reason = `Server error (${error.statusCode})`;
      } else if (error instanceof NetworkError) {
        delayMs = calculateBackoffDelay(attempt, config.retry);
        reason = 'Network error';
      } else {
        throw error;
      }

      logger.retry(attempt, maxAttempts, delayMs, reason);
      await sleep(delayMs, signal);
    }
  }
}

// XML-API: remove when QuickBase discontinues the XML API
/**
 * Send an XML API request (body without app token or auth) through the same
 * auth, throttle, timeout, retry and errors as JSON requests. A write action
 * (isXmlWrite) retries only after a 429, like a JSON write. Returns the
 * response body; the XML client reads errcode from it.
 */
export interface XmlRequestOptions {
  dbid: string;
  action: string;
  /** The request body, without app token or auth */
  body: string;
  /** Whether the action changes data (it isn't retried after a timeout or 5xx) */
  write: boolean;
  /** Overrides the client's appToken */
  appToken?: string;
  signal?: AbortSignal;
}

export async function executeXmlRequest(
  { dbid, action, body, write, appToken = undefined, signal }: XmlRequestOptions,
  executor: RequestExecutorOptions
): Promise<string> {
  const { config, auth, throttle } = executor;
  const xmlAppToken = appToken ?? config.appToken;
  const url = `https://${config.realm}.quickbase.com/db/${encodeURIComponent(dbid)}`;
  const context: RequestContext = {
    methodName: `XML ${action}`,
    attempt: 1,
    maxAttempts: config.retry.maxAttempts,
    dbid,
    startTime: Date.now(),
  };

  return withRetries(context, !write, signal, executor, async () => {
    signal?.throwIfAborted();
    const token = await auth.getToken(dbid);
    const authHeader = auth.getAuthorizationHeader(token);
    let finalBody = xmlAppToken ? injectAppToken(body, xmlAppToken) : body;
    const headers: Record<string, string> = {
      'Content-Type': 'application/xml',
      'QUICKBASE-ACTION': action,
    };
    // The XML API takes a user token as a body element; other tokens
    // (ticket, temp token) go in the Authorization header
    if (authHeader.startsWith('QB-USER-TOKEN ')) {
      finalBody = injectUserToken(finalBody, token);
    } else {
      headers['Authorization'] = authHeader;
    }

    await throttle.acquire();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    let response: Response;
    try {
      response = await config.fetchApi(url, {
        method: 'POST',
        headers,
        body: finalBody,
        signal: controller.signal,
        credentials: 'omit',
      });
    } catch (error) {
      if (signal?.aborted) {
        throw signal.reason;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(config.timeout);
      }
      throw new NetworkError(error);
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onAbort);
    }

    await handleResponse(response, url, context, executor);
    return response.text();
  });
}

/**
 * Create a request executor
 */
export function createRequestExecutor(options: RequestExecutorOptions) {
  return {
    execute: <T = unknown>(requestOptions: RequestOptions) =>
      executeRequest<T>(requestOptions, options),
  };
}
