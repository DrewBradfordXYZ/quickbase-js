/**
 * Core module exports
 */

export type {
  QuickbaseConfig,
  AuthConfig,
  UserTokenAuthConfig,
  TempTokenAuthConfig,
  SsoTokenAuthConfig,
  TicketAuthConfig, // XML-API-TICKET: Remove if XML API discontinued
  RateLimitConfig,
  RetryConfig,
  RequestContext,
  RateLimitInfo,
  PaginationMetadata,
  PaginatedResponse,
  FieldInfo,
  ResolvedConfig,
  // Schema types
  Schema,
  TableSchema,
  FieldSchema,
  ResolvedSchema,
} from './types.js';

export { DEFAULT_CONFIG } from './types.js';

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
  parseErrorResponse,
  isRetryableError,
} from './errors.js';

export { Logger, createLogger } from './logger.js';

export { resolveConfig, getRealmHostname } from './config.js';

export { transformDates, isIsoDateString } from './dates.js';
