/**
 * QuickBase SDK v2
 *
 * A TypeScript/JavaScript client for the QuickBase JSON RESTful API.
 *
 * @example
 * ```typescript
 * import { createClient } from 'quickbase-js';
 *
 * const client = createClient({
 *   realm: 'mycompany',
 *   auth: {
 *     type: 'user-token',
 *     userToken: 'your-user-token',
 *   },
 * });
 *
 * const app = await client.getApp({ appId: 'bpqe82s1' });
 * console.log(app.name);
 * ```
 */

// Core exports
export type {
  QuickbaseConfig,
  AuthConfig,
  UserTokenAuthConfig,
  TempTokenAuthConfig,
  SsoTokenAuthConfig,
  TicketAuthConfig, // XML-API-TICKET: Remove if XML API discontinued
  RateLimitConfig,
  RetryConfig,
  RateLimitInfo,
  PaginationMetadata,
  PaginatedResponse,
  FieldInfo,
  // Schema types
  Schema,
  TableSchema,
  FieldSchema,
  FieldDefinition,
  ResolvedSchema,
} from './core/index.js';

// Schema utilities
export { SchemaError } from './core/schema.js';

// Date and Date/Time field values
export { QuickbaseDate, QuickbaseDateTime } from './core/dates.js';

export {
  QuickbaseError,
  RateLimitError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  TimeoutError,
  ServerError,
  QuickbaseTicketError,
  QuickbaseAppTokenError,
  QuickbaseXmlError,
  ReadOnlyError,
  NetworkError,
  LineErrorsError,
} from './core/index.js';

// Auth exports (for advanced usage)
export type { AuthStrategy } from './auth/index.js';
export {
  UserTokenStrategy,
  TempTokenStrategy,
  SsoTokenStrategy,
  TicketStrategy, // XML-API-TICKET: Remove if XML API discontinued
  createAuthStrategy,
} from './auth/index.js';
import type { AuthStrategy } from './auth/index.js';

// Client exports
export type { RequestOptions } from './client/index.js';
export type { XmlRequestOptions } from './client/request.js';
export { SlidingWindowThrottle, NoOpThrottle } from './client/index.js';

// Generated types and client
export type { QuickbaseAPI } from './generated/types.js';
export * from './generated/types.js';
export { createApiMethods } from './generated/client.js';

// Main client factory
import type { QuickbaseConfig, ResolvedConfig } from './core/types.js';
import { resolveConfig } from './core/config.js';
import { createLogger } from './core/logger.js';
import { createAuthStrategy } from './auth/index.js';
import { createThrottle } from './client/throttle.js';
import { createRequestExecutor } from './client/request.js';
import type {
  QuickbaseAPI,
  RunQueryRequest,
  RunQueryResponse,
  RunReportParams,
  RunReportResponse,
  UpsertRequest,
  UpsertResponse,
} from './generated/types.js';
import { createApiMethods, type RequestFn } from './generated/client.js';
import { executeXmlRequest, type XmlRequestOptions } from './client/request.js';
import type { PaginatedRequest } from './client/pagination.js';
import type {
  FieldRef,
  IsTypedSchema,
  QueryRecord,
  SchemaQueryBody,
  SchemaQueryResponse,
  SchemaRecord,
  SchemaUpsert,
  SchemaUpsertResponse,
  TableName,
} from './core/typed-schema.js';

export type {
  AnyFieldValue,
  FieldRef,
  FieldTypeInput,
  FieldTypeValue,
  QueryRecord,
  QuickbaseUser,
  SchemaQueryBody,
  SchemaQueryResponse,
  SchemaRecord,
  SchemaRecordInput,
  SchemaUpsert,
  SchemaUpsertResponse,
  TableName,
} from './core/typed-schema.js';

/**
 * runQuery, runReport and upsert typed by a schema whose fields carry their
 * types (see guides/schema-aliases.md): a schema table's name types the body
 * and the result. Any other table (a table ID) takes the untyped forms.
 */
export interface SchemaMethods<S, Dates extends boolean> {
  /** Run a query on a schema table: the result has the selected fields, typed */
  runQuery<T extends TableName<S>, const Selected extends readonly FieldRef<S, T>[] = []>(
    body: SchemaQueryBody<S, T, Selected>
  ): PaginatedRequest<SchemaQueryResponse<QueryRecord<S, T, Selected, Dates>>>;
  /** Run a query on a table the schema doesn't name */
  runQuery<From extends string>(
    body: RunQueryRequest & { from: From extends TableName<S> ? never : From }
  ): PaginatedRequest<RunQueryResponse>;

  /** Run a report on a schema table: a report's columns aren't known in advance, so every field is optional */
  runReport<T extends TableName<S>>(
    params: Omit<RunReportParams, 'tableId'> & { tableId: T }
  ): PaginatedRequest<SchemaQueryResponse<Partial<SchemaRecord<S, T, Dates>>>>;
  /** Run a report on a table the schema doesn't name */
  runReport<Table extends string>(
    params: RunReportParams & { tableId: Table extends TableName<S> ? never : Table }
  ): PaginatedRequest<RunReportResponse>;

  /** Add or update records in a schema table: writable fields by name, typed */
  upsert<T extends TableName<S>>(body: SchemaUpsert<S, T>): PaginatedRequest<SchemaUpsertResponse<S, T>>;
  /** Add or update records in a table the schema doesn't name */
  upsert<To extends string>(
    body: UpsertRequest & { to: To extends TableName<S> ? never : To }
  ): PaginatedRequest<UpsertResponse>;
}

/**
 * The API methods: typed by the schema when it is declared `as const` with
 * field types, as `npx quickbase-js schema` writes it.
 */
export type QuickbaseMethods<S = unknown, Dates extends boolean = true> =
  IsTypedSchema<S> extends true
    ? Omit<QuickbaseAPI, 'runQuery' | 'runReport' | 'upsert'> & SchemaMethods<S, Dates>
    : QuickbaseAPI;

/**
 * QuickBase client with typed API methods. `S` is the schema's type and
 * `Dates` whether dates are converted (`convertDates`); createClient infers
 * both.
 */
export type QuickbaseClient<S = unknown, Dates extends boolean = true> = QuickbaseMethods<S, Dates> &
  QuickbaseClientExtras<S, Dates>;

/** The client's methods besides the API */
export interface QuickbaseClientExtras<S = unknown, Dates extends boolean = true> {
  /** Execute a raw request (for custom API calls) */
  request: <T = unknown>(options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
    dbid?: string;
    signal?: AbortSignal;
  }) => Promise<T>;

  /**
   * The same client with every request tied to `signal`: aborting it cancels
   * requests in flight and retry waits, which reject with the signal's reason.
   *
   * @example
   * ```typescript
   * const controller = new AbortController();
   * const records = qb.withSignal(controller.signal).runQuery({ from: tableId }).all();
   * controller.abort(); // records rejects
   * ```
   */
  withSignal: (signal: AbortSignal) => QuickbaseClient<S, Dates>;

  /** Get the resolved configuration */
  getConfig: () => ResolvedConfig;

  /**
   * XML-API: send an XML API request through the client's auth, throttle,
   * retry and errors. Used by createXmlClient(); returns the response body.
   */
  requestXml: (options: Omit<XmlRequestOptions, 'signal'>) => Promise<string>;

  /**
   * Get the auth strategy for advanced usage (e.g., XML API client).
   * XML-API: Used by createXmlClient() to access authentication.
   */
  getAuthStrategy: () => AuthStrategy;
}

/**
 * Create a QuickBase client
 *
 * @example User token authentication
 * ```typescript
 * const client = createClient({
 *   realm: 'mycompany',
 *   auth: {
 *     type: 'user-token',
 *     userToken: 'your-user-token',
 *   },
 * });
 * ```
 *
 * @example Temporary token authentication
 * ```typescript
 * const client = createClient({
 *   realm: 'mycompany',
 *   auth: {
 *     type: 'temp-token',
 *     userToken: 'your-user-token',
 *     appToken: 'optional-app-token',
 *   },
 * });
 * ```
 *
 * @example With rate limiting callback
 * ```typescript
 * const client = createClient({
 *   realm: 'mycompany',
 *   auth: { type: 'user-token', userToken: 'token' },
 *   rateLimit: {
 *     onRateLimit: (info) => {
 *       console.log(`Rate limited! Retry after ${info.retryAfter}s`);
 *     },
 *   },
 * });
 * ```
 */
export function createClient<const C extends QuickbaseConfig>(
  config: C
): QuickbaseClient<C['schema'], C extends { convertDates: false } ? false : true> {
  const resolvedConfig = resolveConfig(config);
  const logger = createLogger(resolvedConfig.debug);

  const authContext = {
    realm: resolvedConfig.realm,
    baseUrl: resolvedConfig.baseUrl,
    fetchApi: resolvedConfig.fetchApi,
    logger,
  };

  const auth = createAuthStrategy(resolvedConfig.auth, authContext);
  const throttle = createThrottle(resolvedConfig.proactiveThrottle);

  const executorOptions = {
    config: resolvedConfig,
    auth,
    throttle,
    logger,
  };
  const executor = createRequestExecutor(executorOptions);

  type Client = QuickbaseClient<C['schema'], C extends { convertDates: false } ? false : true>;
  const build = (signal?: AbortSignal): Client => {
    const request: RequestFn = signal
      ? (options) => executor.execute({ ...options, signal })
      : executor.execute;
    return {
      // Typed API methods
      ...createApiMethods(request, resolvedConfig.autoPaginate),
      request,
      withSignal: (next: AbortSignal) => build(next),
      requestXml: (options: Omit<XmlRequestOptions, 'signal'>) =>
        executeXmlRequest({ ...options, signal }, executorOptions),
      getConfig: () => resolvedConfig,
      // XML-API: Expose auth strategy for XML client
      getAuthStrategy: () => auth,
    } as unknown as Client;
  };
  return build();
}

// XML-API: XML API exports - remove when QuickBase discontinues XML API
export {
  createXmlClient,
  XmlClient,
  XmlError,
  XmlErrorCode,
  checkError,
  isUnauthorized as isXmlUnauthorized,
  isNotFound as isXmlNotFound,
  isInvalidTicket as isXmlInvalidTicket,
  isXmlWriteAction,
} from './xml/index.js';
export type {
  XmlCaller,
  XmlClientOptions,
  XmlExecutor,
  // Role types
  Role,
  RoleAccess,
  UserRole,
  RoleMember,
  UserWithRoles,
  // Group types
  Group,
  GroupUser,
  GroupManager,
  Subgroup,
  // User types
  UserInfo,
  // Schema types (XML)
  SchemaField,
  SchemaQuery,
  SchemaVariable,
  SchemaChildTable,
  SchemaOriginal,
  SchemaTable,
  // App discovery types
  DatabaseInfo,
  DBInfo,
  // Record types (XML)
  RecordField,
  // Code page types
  PageType,
  // Webhook types
  WebhookTrigger,
  WebhookOptions,
  // Result types
  GetRoleInfoResult,
  UserRolesResult,
  GetUserRoleResult,
  GetSchemaResult,
  GrantedDBsResult,
  FindDBByNameResult,
  GetUsersInGroupResult,
  CreateGroupResult,
  GetGroupRoleResult,
  ProvisionUserResult,
  AddReplaceDBPageResult,
  FieldAddChoicesResult,
  FieldRemoveChoicesResult,
  DoQueryCountResult,
  GetRecordInfoResult,
  GrantedGroupsResult,
  GrantedDBsForGroupResult,
  GetAppDTMInfoResult,
  GetAncestorInfoResult,
  ImportFromCSVResult,
  CopyMasterDetailResult,
  WebhookResult,
} from './xml/index.js';

// Default export
export default createClient;
