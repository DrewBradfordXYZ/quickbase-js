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

  /**
   * In query and report results, make Date field values QuickbaseDate and
   * Date/Time field values QuickbaseDateTime, by the result's field types
   * (default: true). False keeps the strings QuickBase sends.
   */
  convertDates?: boolean;

  /**
   * Schema aliases for tables and fields.
   * Allows using readable names instead of QuickBase IDs in queries.
   *
   * @example
   * ```typescript
   * schema: {
   *   tables: {
   *     projects: {
   *       id: 'bqw3ryzab',
   *       fields: {
   *         name: 6,
   *         status: 7,
   *         dueDate: 12,
   *       }
   *     }
   *   }
   * }
   * ```
   */
  schema?: Schema;

  /**
   * Read-only mode prevents any write operations.
   * Uses defense-in-depth with two layers:
   * 1. Explicit blocklist of known write endpoints
   * 2. HTTP method check (blocks POST/PUT/DELETE/PATCH unless allowlisted)
   *
   * @example
   * ```typescript
   * const qb = createClient({
   *   realm: 'myrealm',
   *   auth: { type: 'user-token', userToken: '...' },
   *   readOnly: true,
   * });
   * // qb.runQuery() works
   * // qb.upsert() throws ReadOnlyError
   * ```
   */
  readOnly?: boolean;

  /**
   * Limit writes to the apps named here. Any other write throws a
   * WriteScopeError before it is sent; reads are never limited. With
   * `readOnly` as well, nothing is written.
   *
   * @example
   * ```typescript
   * const qb = createClient({
   *   realm: 'myrealm',
   *   auth: { type: 'user-token', userToken: '...' },
   *   writeScope: { appIds: [appId] },
   * });
   * ```
   */
  writeScope?: WriteScope;

  /**
   * Throw a LineErrorsError when an upsert's values are rejected (default:
   * false). QuickBase still saves those records, with the rejected fields
   * blank, and answers 207; without this the rejections are only in the
   * response's `metadata.lineErrors`. The error carries the response, so the
   * saved records' IDs aren't lost.
   */
  throwOnLineErrors?: boolean;

  /**
   * Application token for XML API calls.
   *
   * App tokens are only needed for the XML API when:
   * - The app has "Require Application Tokens" enabled, AND
   * - You're NOT using user token authentication (which bypasses app token checks)
   *
   * The JSON API does not use app tokens.
   *
   * @example
   * ```typescript
   * const qb = createClient({
   *   realm: 'myrealm',
   *   auth: { type: 'ticket', username: 'user@example.com', password: 'pass' },
   *   appToken: 'your-app-token',
   * });
   * ```
   */
  appToken?: string;
}

// =============================================================================
// Schema Types
// =============================================================================

/**
 * Field alias mapping: alias name -> field ID
 * @example { name: 6, status: 7, dueDate: 12 }
 */
export interface FieldSchema {
  [alias: string]: number | FieldDefinition;
}

/**
 * A field with the type QuickBase reports for it, as `npx quickbase-js schema`
 * writes it. Declared `as const`, field types type query results and upsert
 * data by field name.
 * @example { id: 12, type: 'date' }
 */
export interface FieldDefinition {
  /** QuickBase field ID */
  id: number;
  /** QuickBase field type, as getFields reports it: 'text', 'numeric', 'date', 'timestamp', ... */
  type?: string;
  /** 'formula', 'lookup' or 'summary': QuickBase computes the value, so upserts can't set it */
  mode?: string;
}

/**
 * Table schema with ID and field mappings
 * @example { id: 'bqw3ryzab', fields: { name: 6, status: 7 } }
 */
export interface TableSchema {
  /** QuickBase table ID (dbid) */
  id: string;
  /** Field alias mappings */
  fields: FieldSchema;
}

/**
 * Complete schema definition with table aliases
 */
export interface Schema {
  tables: {
    [alias: string]: TableSchema;
  };
}

/**
 * Resolved schema with bidirectional lookup maps for efficient alias resolution
 */
export interface ResolvedSchema {
  /** Original schema definition */
  original: Schema;

  /** Table alias -> table ID */
  tableAliasToId: Map<string, string>;

  /** Table ID -> table alias */
  tableIdToAlias: Map<string, string>;

  /** Table ID -> (field alias -> field ID) */
  fieldAliasToId: Map<string, Map<string, number>>;

  /** Table ID -> (field ID -> field alias) */
  fieldIdToAlias: Map<string, Map<number, string>>;
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
  /** Callback invoked when ticket expires - use to show login UI */
  onExpired?: () => void;
  /** Persist ticket to storage for session survival (default: none) */
  persist?: 'sessionStorage' | 'localStorage';
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
  /** Resolved schema with lookup maps (undefined if no schema provided) */
  schema?: ResolvedSchema;
  /** Read-only mode - blocks all write operations */
  readOnly: boolean;
  /** Write scope, with the tables known to be in its apps (undefined: no limit) */
  writeScope?: WriteScopeState;
  /** Throw LineErrorsError when an upsert's values are rejected */
  throwOnLineErrors: boolean;
  /** App token for XML API calls (optional) */
  appToken?: string;
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

/**
 * What a client may write to. See QuickbaseConfig.writeScope. A write whose
 * target can be checked is allowed when the target is listed; a write that
 * creates something, or acts on the realm's users or your own credentials,
 * is allowed by a switch. Nothing is allowed unless it is named.
 */
export interface WriteScope {
  /**
   * Apps the client may change: the apps themselves (update, delete,
   * trustees, roles, variables, code pages), and every table in them,
   * including tables created later (fields, relationships, records, files,
   * document generation).
   */
  appIds?: string[];
  /** Allow createApp, copyApp, and XML API_CreateDatabase and API_CloneDatabase. A new app isn't added to appIds. */
  createApps?: boolean;
  /** Solutions the client may update (updateSolution, updateSolutionToRecord). Updating a solution changes its apps. */
  solutionIds?: string[];
  /** Allow createSolution and createSolutionFromRecord, which create their apps. */
  createSolutions?: boolean;
  /**
   * Groups whose members, managers and subgroups the client may change, and
   * that it may rename or delete (XML). Matched exactly, as the request writes
   * them: the JSON API writes a group's ID as a number ('1217'), and the XML
   * API's examples write one with a suffix ('1217.dgpt'); list each form the
   * client will use.
   */
  groupIds?: Array<string | number>;
  /** Allow creating and copying groups (XML). */
  createGroups?: boolean;
  /** Allow denying and undenying users in the account, and, with the app in appIds, XML API_ProvisionUser (which can create the realm user). */
  manageUsers?: boolean;
  /** Allow changing your own credentials: clone, transfer, deactivate and delete user tokens, and sign out (XML). */
  manageTokens?: boolean;
}

/** A client's write scope, resolved. */
export interface WriteScopeState {
  apps: Set<string>;
  createApps: boolean;
  solutions: Set<string>;
  createSolutions: boolean;
  groups: Set<string>;
  createGroups: boolean;
  manageUsers: boolean;
  manageTokens: boolean;
  /** Table ID -> app ID, for the scope's apps; filled on demand */
  tableApp: Map<string, string>;
  /** The listing in progress, shared by requests that miss at the same time */
  loading?: Promise<void>;
}
