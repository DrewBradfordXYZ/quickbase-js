/**
 * XML API Types
 *
 * Type definitions for the legacy QuickBase XML API.
 *
 * XML-API: Remove this file when QuickBase discontinues the XML API.
 * To find all XML API code, search for: XML-API
 */

/**
 * Minimal interface for making XML API calls.
 * This interface avoids circular dependencies between the xml package
 * and the main client.
 */
export interface XmlCaller {
  /**
   * Get the QuickBase realm name (e.g., "mycompany")
   */
  realm(): string;

  /**
   * Execute an XML API request
   * @param dbid - The database ID to make the request against
   * @param action - The QUICKBASE-ACTION header value (e.g., "API_GetRoleInfo")
   * @param body - The XML request body (wrapped in <qdbapi> tags)
   * @returns The raw XML response body as a string
   */
  doXml(dbid: string, action: string, body: string): Promise<string>;
}

/**
 * Base structure for all XML API responses.
 * Every XML response contains these fields.
 */
export interface BaseResponse {
  action: string;
  errcode: number;
  errtext: string;
  errdetail?: string;
}

// ============================================================================
// Role Types
// ============================================================================

/**
 * Access level for a role
 */
export interface RoleAccess {
  /** Access level ID: 1=Administrator, 2=Basic Access with Share, 3=Basic Access */
  id: number;
  /** Text description of the access level */
  description: string;
}

/**
 * A role defined in a QuickBase application
 */
export interface Role {
  /** Unique role ID */
  id: number;
  /** Display name of the role */
  name: string;
  /** Access level granted by this role */
  access: RoleAccess;
}

/**
 * Role with membership information (from GetUserRole)
 */
export interface UserRole extends Role {
  /** How this role was assigned (only present when includeGroups=true) */
  member?: RoleMember;
}

/**
 * Describes how a role was assigned to a user
 */
export interface RoleMember {
  /** "user", "group", or "domainGroup" */
  type: string;
  /** Name of the user or group */
  name: string;
}

/**
 * User with their assigned roles
 */
export interface UserWithRoles {
  /** QuickBase user ID (e.g., "112149.bhsv") */
  id: string;
  /** "user" for individual users or "group" for groups */
  type: string;
  /** Display name */
  name: string;
  /** First name (may be empty for groups) */
  firstName?: string;
  /** Last name (may be empty for groups) */
  lastName?: string;
  /** Timestamp of last access (milliseconds since epoch) */
  lastAccess?: string;
  /** Human-readable last access time */
  lastAccessAppLocal?: string;
  /** Roles assigned to this user */
  roles: Role[];
}

// ============================================================================
// Group Types
// ============================================================================

/**
 * A QuickBase group
 */
export interface Group {
  /** Group ID (e.g., "1217.dgpt") */
  id: string;
  /** Group name */
  name: string;
  /** Group description */
  description?: string;
  /** Whether the group is managed by a user (vs. system) */
  managedByUser?: boolean;
}

/**
 * User within a group
 */
export interface GroupUser {
  /** User ID */
  id: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Email address */
  email: string;
  /** Screen name */
  screenName?: string;
  /** Whether the user is an admin */
  isAdmin?: boolean;
}

/**
 * Manager of a group
 */
export interface GroupManager {
  /** Manager ID */
  id: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Email address */
  email: string;
  /** Screen name */
  screenName?: string;
  /** Whether the manager is also a member */
  isMember?: boolean;
}

/**
 * Subgroup reference
 */
export interface Subgroup {
  /** Subgroup ID */
  id: string;
}

// ============================================================================
// User Types
// ============================================================================

/**
 * User information from GetUserInfo
 */
export interface UserInfo {
  /** QuickBase user ID */
  id: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Login name (may be undefined for anonymous users or when email was provided) */
  login?: string;
  /** Email address (may be undefined for anonymous users) */
  email?: string;
  /** Screen name */
  screenName?: string;
  /** Whether the user's email is verified */
  isVerified?: boolean;
  /** Whether the user uses external authentication (SSO) */
  externalAuth?: boolean;
}

// ============================================================================
// Schema Types
// ============================================================================

/**
 * Field definition from GetSchema
 */
export interface SchemaField {
  /** Field ID */
  id: number;
  /** Field type (e.g., "text", "numeric", "date") */
  fieldType: string;
  /** Base type (e.g., "text", "int64") */
  baseType?: string;
  /** Field mode (e.g., "lookup", "formula") */
  mode?: string;
  /** Field label */
  label: string;
  /** Help text */
  fieldHelp?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field must be unique */
  unique?: boolean;
  /** No text wrap */
  nowrap?: boolean;
  /** Bold text */
  bold?: boolean;
  /** Appears by default in reports */
  appearsByDefault?: boolean;
  /** Find enabled */
  findEnabled?: boolean;
  /** Allow new choices (for multi-choice fields) */
  allowNewChoices?: boolean;
  /** Sort choices as given */
  sortAsGiven?: boolean;
  /** Carry choices */
  carryChoices?: boolean;
  /** Is foreign key */
  foreignKey?: boolean;
  /** Does total */
  doesTotal?: boolean;
  /** Does average */
  doesAverage?: boolean;
  /** Default value kind */
  defaultKind?: string;
  /** Default value */
  defaultValue?: string;
  /** Choices for multi-choice fields */
  choices?: string[];
  /** Summary reference field ID */
  summaryReferenceFid?: number;
  /** Summary target field ID */
  summaryTargetFid?: number;
  /** Summary function (Total, Average, etc.) */
  summaryFunction?: string;
}

/**
 * Query/Report definition from GetSchema
 */
export interface SchemaQuery {
  /** Query ID */
  id: number;
  /** Query name */
  name: string;
  /** Query type (e.g., "table", "calendar") */
  type?: string;
  /** Query description */
  description?: string;
  /** Query criteria */
  criteria?: string;
  /** Column list */
  columnList?: string;
  /** Sort list */
  sortList?: string;
  /** Query options */
  options?: string;
  /** Calculated fields list */
  calcFields?: string;
}

/**
 * Application variable from GetSchema
 */
export interface SchemaVariable {
  /** Variable name */
  name: string;
  /** Variable value */
  value: string;
}

/**
 * Child table reference from GetSchema
 */
export interface SchemaChildTable {
  /** Child table name reference */
  name: string;
  /** Child table DBID */
  dbid: string;
}

/**
 * Original info block from GetSchema
 */
export interface SchemaOriginal {
  appId?: string;
  tableId?: string;
  /** Creation time (ms since epoch) */
  createdTime?: string;
  /** Modification time (ms since epoch) */
  modifiedTime?: string;
  nextRecordId?: number;
  nextFieldId?: number;
  nextQueryId?: number;
  defaultSortFid?: number;
  defaultSortOrder?: number;
}

/**
 * Table/App schema from GetSchema
 */
export interface SchemaTable {
  /** Table/App name */
  name: string;
  /** Description */
  description?: string;
  /** Original metadata */
  original?: SchemaOriginal;
  /** Application variables */
  variables?: SchemaVariable[];
  /** Child tables (for app-level schema) */
  childTables?: SchemaChildTable[];
  /** Fields (for table-level schema) */
  fields?: SchemaField[];
  /** Queries/Reports */
  queries?: SchemaQuery[];
}

// ============================================================================
// App Discovery Types
// ============================================================================

/**
 * Database info from GrantedDBs
 */
export interface DatabaseInfo {
  /** Database ID */
  dbid: string;
  /** Database name */
  name: string;
  /** Ancestor app ID (if copied from another app) */
  ancestorAppId?: string;
  /** Oldest ancestor app ID */
  oldestAncestorAppId?: string;
}

/**
 * Database info from GetDBInfo
 */
export interface DBInfo {
  /** Database/table name */
  name: string;
  /** Number of records */
  numRecords: number;
  /** Manager's user ID */
  managerId?: string;
  /** Manager's name */
  managerName?: string;
  /** Last record modification time (ms since epoch) */
  lastRecModTime?: string;
  /** Last schema modification time (ms since epoch) */
  lastModifiedTime?: string;
  /** Creation time (ms since epoch) */
  createdTime?: string;
  /** Time zone */
  timeZone?: string;
  /** Version */
  version?: string;
}

// ============================================================================
// Record Types
// ============================================================================

/**
 * Field value from GetRecordInfo
 */
export interface RecordField {
  /** Field ID */
  id: number;
  /** Field name */
  name: string;
  /** Field type */
  type: string;
  /** Raw value */
  value: string;
  /** Human-readable value (for dates, etc.) */
  printable?: string;
}

// ============================================================================
// Code Page Types
// ============================================================================

/**
 * Page type for AddReplaceDBPage
 */
export enum PageType {
  /** XSL stylesheet or HTML page */
  XSLOrHTML = 1,
  /** Exact Form */
  ExactForm = 3,
}

// ============================================================================
// Webhook Types
// ============================================================================

/**
 * Webhook trigger type
 */
export type WebhookTrigger = 'add' | 'update' | 'delete' | 'any';

/**
 * Options for creating/editing a webhook
 */
export interface WebhookOptions {
  /** Webhook name */
  name?: string;
  /** URL to call */
  url?: string;
  /** Trigger type */
  trigger?: WebhookTrigger;
  /** Fields to include in payload */
  fields?: number[];
  /** Whether to include old values on update */
  includeOldValues?: boolean;
}

// ============================================================================
// Result Types (returned by XmlClient methods)
// ============================================================================

export interface GetRoleInfoResult {
  roles: Role[];
}

export interface UserRolesResult {
  users: UserWithRoles[];
}

export interface GetUserRoleResult {
  userId: string;
  userName: string;
  roles: UserRole[];
}

export interface GetSchemaResult {
  timeZone?: string;
  dateFormat?: string;
  table: SchemaTable;
}

export interface GrantedDBsResult {
  databases: DatabaseInfo[];
}

export interface FindDBByNameResult {
  dbid: string;
  /** Echoed from request (may not always be present) */
  name?: string;
}

export interface GetUsersInGroupResult {
  id: string;
  name: string;
  description?: string;
  users: GroupUser[];
  managers: GroupManager[];
  subgroups: Subgroup[];
}

export interface CreateGroupResult {
  group: Group;
}

export interface GetGroupRoleResult {
  roles: Array<{ id: number; name: string }>;
}

export interface ProvisionUserResult {
  userId: string;
}

export interface AddReplaceDBPageResult {
  pageId: number;
}

export interface FieldAddChoicesResult {
  fieldId: number;
  fieldName: string;
  numAdded: number;
}

export interface FieldRemoveChoicesResult {
  fieldId: number;
  fieldName: string;
  numRemoved: number;
}

export interface DoQueryCountResult {
  numMatches: number;
}

export interface GetRecordInfoResult {
  recordId: number;
  numFields: number;
  updateId?: string;
  fields: RecordField[];
}

export interface GrantedGroupsResult {
  groups: Array<{ id: string; name: string }>;
}

export interface GrantedDBsForGroupResult {
  databases: Array<{ dbid: string; name: string }>;
}

export interface GetAppDTMInfoResult {
  appId: string;
  lastModifiedTime?: string;
  lastRecModTime?: string;
  tables: Array<{ id: string; lastModifiedTime?: string; lastRecModTime?: string }>;
}

export interface GetAncestorInfoResult {
  ancestorAppId?: string;
  oldestAncestorAppId?: string;
}

export interface ImportFromCSVResult {
  numRecsAdded: number;
  numRecsUpdated: number;
  numRecsInput: number;
  recordIds: Array<{ recordId: number; updateId?: string }>;
}

export interface CopyMasterDetailResult {
  newRid: number;
  numCreated: number;
}

export interface WebhookResult {
  webhookId: number;
}
