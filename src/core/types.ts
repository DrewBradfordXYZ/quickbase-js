/**
 * Core types for the QuickBase SDK v2
 */

// =============================================================================
// Configuration Types
// =============================================================================

export interface QuickbaseConfig {
  /** Your QuickBase realm (e.g., "mycompany" for mycompany.quickbase.com) */
  realm: string;

  /** Authentication configuration */
  auth: AuthConfig;

  /** Rate limiting and retry configuration */
  rateLimit?: RateLimitConfig;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Enable debug logging (default: false) */
  debug?: boolean;

  /** Custom fetch implementation (default: global fetch) */
  fetchApi?: typeof fetch;

  /** Base URL override (default: https://api.quickbase.com/v1) */
  baseUrl?: string;

  /** Automatically paginate all paginated requests when awaited (default: false) */
  autoPaginate?: boolean;

  /** Convert ISO date strings in responses to JavaScript Date objects (default: true) */
  convertDates?: boolean;
}

export type AuthConfig =
  | UserTokenAuthConfig
  | TempTokenAuthConfig
  | SsoTokenAuthConfig
  | TicketAuthConfig;

export interface UserTokenAuthConfig {
  type: 'user-token';
  /** Your QuickBase user token */
  userToken: string;
}

export interface TempTokenAuthConfig {
  type: 'temp-token';
  /**
   * User token used to fetch temporary tokens (optional)
   * Not required when running in QuickBase Code Pages - the browser session is used
   */
  userToken?: string;
  /** App token (optional, for apps that require it) */
  appToken?: string;
  /** Token lifespan in milliseconds (default: 290000 = ~4m50s) */
  tokenLifespanMs?: number;
}

export interface SsoTokenAuthConfig {
  type: 'sso';
  /** SAML token for SSO authentication */
  samlToken: string;
}

/**
 * Ticket authentication using username/password via XML API_Authenticate.
 * Unlike user tokens, tickets properly attribute record changes (createdBy/modifiedBy)
 * to the authenticated user.
 *
 * XML-API-TICKET: Remove this interface if XML API is discontinued.
 */
export interface TicketAuthConfig {
  type: 'ticket';
  /** QuickBase username (email address) */
  username: string;
  /** QuickBase password */
  password: string;
  /** Ticket validity in hours (default: 12, max: 4380 ~6 months) */
  hours?: number;
}

export interface RateLimitConfig {
  /**
   * Client-side proactive throttling (optional)
   * QuickBase allows 100 requests per 10 seconds per user token
   */
  proactiveThrottle?: {
    enabled: boolean;
    /** Requests allowed per 10 seconds (default: 100) */
    requestsPer10Seconds?: number;
  };

  /** Retry configuration for rate limit and server errors */
  retry?: RetryConfig;

  /** Callback when rate limited */
  onRateLimit?: (info: RateLimitInfo) => void;
}

export interface RetryConfig {
  /** Maximum retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelayMs?: number;
  /** Backoff multiplier (default: 2) */
  multiplier?: number;
}

// =============================================================================
// Runtime Types
// =============================================================================

export interface RequestContext {
  /** The API method being called */
  methodName: string;
  /** Current attempt number (1-based) */
  attempt: number;
  /** Maximum attempts allowed */
  maxAttempts: number;
  /** Database ID (for temp token auth) */
  dbid?: string;
  /** Request start timestamp */
  startTime: number;
}

export interface RateLimitInfo {
  /** When the rate limit occurred */
  timestamp: Date;
  /** The request URL */
  requestUrl: string;
  /** HTTP status code */
  httpStatus: number;
  /** Retry-After header value (seconds) */
  retryAfter?: number;
  /** Cloudflare ray ID */
  cfRay?: string;
  /** Transaction ID */
  tid?: string;
  /** QuickBase API ray ID */
  qbApiRay?: string;
  /** Which retry attempt this was */
  attempt: number;
}

// =============================================================================
// Response Types
// =============================================================================

export interface PaginationMetadata {
  totalRecords: number;
  numRecords: number;
  numFields: number;
  skip?: number;
  top?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  metadata: PaginationMetadata;
  fields?: FieldInfo[];
}

export interface FieldInfo {
  id: number;
  label: string;
  type: string;
}

// =============================================================================
// Internal Types
// =============================================================================

export interface ResolvedConfig {
  realm: string;
  baseUrl: string;
  timeout: number;
  debug: boolean;
  fetchApi: typeof fetch;
  auth: AuthConfig;
  retry: Required<RetryConfig>;
  proactiveThrottle: {
    enabled: boolean;
    requestsPer10Seconds: number;
  };
  onRateLimit?: (info: RateLimitInfo) => void;
  autoPaginate: boolean;
  convertDates: boolean;
}

/** Default configuration values */
export const DEFAULT_CONFIG = {
  baseUrl: 'https://api.quickbase.com/v1',
  timeout: 30000,
  debug: false,
  retry: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    multiplier: 2,
  },
  proactiveThrottle: {
    enabled: false,
    requestsPer10Seconds: 100,
  },
  tempTokenLifespanMs: 290000, // ~4m50s (QuickBase tokens expire at 5m)
  autoPaginate: false,
  convertDates: true,
} as const;
