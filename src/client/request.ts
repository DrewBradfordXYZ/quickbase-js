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
  parseErrorResponse,
  isRetryableError,
} from '../core/errors.js';
import { extractRateLimitInfo, sleep } from './retry.js';
import { getRealmHostname } from '../core/config.js';
import { transformDates } from '../core/dates.js';
import {
  transformRequest,
  transformResponse,
  extractTableIdFromRequest,
} from '../core/transform.js';
import { resolveTableAlias } from '../core/schema.js';

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Database ID for temp token auth */
  dbid?: string;
  /** Custom headers */
  headers?: Record<string, string>;
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
    fetchOptions.body = JSON.stringify(options.body);
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);
  fetchOptions.signal = controller.signal;

  const startTime = Date.now();

  try {
    const response = await config.fetchApi(url, fetchOptions);
    const duration = Date.now() - startTime;

    logger.timing(options.method, options.path, duration);

    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(config.timeout);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
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
 * Execute a request with full retry logic
 */
export async function executeRequest<T = unknown>(
  options: RequestOptions,
  executor: RequestExecutorOptions
): Promise<T> {
  const { config, auth, logger } = executor;
  const maxAttempts = config.retry.maxAttempts;

  // Extract dbid for temp-token auth (resolves aliases if schema provided)
  const dbid = extractDbid(options, config);

  // Transform request body if schema is configured
  let transformedOptions = options;
  if (config.schema && options.body && typeof options.body === 'object') {
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

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    context.attempt = attempt;

    try {
      const response = await executeSingleRequest(transformedOptions, executor, context);
      const url = buildUrl(config.baseUrl, options.path, options.query);

      await handleResponse(response, url, context, executor);

      // Parse JSON response
      let data = await response.json();

      // Transform response if schema is configured
      if (config.schema && dbid) {
        data = transformResponse(data, { schema: config.schema, tableId: dbid });
      }

      // Optionally transform dates
      return transformDates(data, config.convertDates) as T;
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= maxAttempts) {
        throw error;
      }

      // Handle auth errors specially - try to refresh token
      if (error instanceof QuickbaseError && error.statusCode === 401) {
        const refreshed = await auth.handleAuthError(dbid);
        if (!refreshed) {
          throw error;
        }
        logger.debug('Token refreshed, retrying request');
        continue;
      }

      // Calculate retry delay
      let delayMs: number;
      let reason: string;

      if (error instanceof RateLimitError) {
        delayMs = error.retryAfter
          ? error.retryAfter * 1000
          : calculateBackoff(attempt, config.retry);
        reason = 'Rate limited (429)';
      } else if (error instanceof TimeoutError) {
        delayMs = calculateBackoff(attempt, config.retry);
        reason = 'Timeout';
      } else if (error instanceof QuickbaseError && error.statusCode >= 500) {
        delayMs = calculateBackoff(attempt, config.retry);
        reason = `Server error (${error.statusCode})`;
      } else {
        delayMs = calculateBackoff(attempt, config.retry);
        reason = 'Retryable error';
      }

      logger.retry(attempt, maxAttempts, delayMs, reason);
      await sleep(delayMs);
    }
  }

  throw lastError || new Error('Request failed');
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoff(
  attempt: number,
  config: { initialDelayMs: number; maxDelayMs: number; multiplier: number }
): number {
  const delay = config.initialDelayMs * Math.pow(config.multiplier, attempt - 1);
  const jitter = delay * 0.1 * (Math.random() * 2 - 1);
  return Math.min(delay + jitter, config.maxDelayMs);
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
