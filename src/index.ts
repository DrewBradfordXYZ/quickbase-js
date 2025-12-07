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
  ResolvedSchema,
} from './core/index.js';

// Schema utilities
export { SchemaError } from './core/schema.js';

export {
  QuickbaseError,
  RateLimitError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  TimeoutError,
  ServerError,
  ReadOnlyError,
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
import type { QuickbaseAPI } from './generated/types.js';
import { createApiMethods } from './generated/client.js';

/**
 * QuickBase client with typed API methods
 */
export interface QuickbaseClient extends QuickbaseAPI {
  /** Execute a raw request (for custom API calls) */
  request: <T = unknown>(options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined>;
    dbid?: string;
  }) => Promise<T>;

  /** Get the resolved configuration */
  getConfig: () => ResolvedConfig;

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
export function createClient(config: QuickbaseConfig): QuickbaseClient {
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

  const executor = createRequestExecutor({
    config: resolvedConfig,
    auth,
    throttle,
    logger,
  });

  // Create typed API methods
  const apiMethods = createApiMethods(executor.execute, resolvedConfig.autoPaginate);

  return {
    ...apiMethods,
    request: executor.execute,
    getConfig: () => resolvedConfig,
    // XML-API: Expose auth strategy for XML client
    getAuthStrategy: () => auth,
  };
}

// XML-API: XML API exports - remove when QuickBase discontinues XML API
export {
  createXmlClient,
  XmlClient,
  XmlError,
  XmlErrorCode,
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
