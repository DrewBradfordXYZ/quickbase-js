/**
 * XML API Client Module
 *
 * Provides access to legacy QuickBase XML API endpoints that have no
 * JSON API equivalent (roles, groups, DBVars, code pages, etc.).
 *
 * XML-API: Remove this file when QuickBase discontinues the XML API.
 * To find all XML API code, search for: XML-API
 *
 * @example
 * ```typescript
 * import { createClient } from 'quickbase-js';
 * import { createXmlClient } from 'quickbase-js/xml';
 *
 * const qb = createClient({
 *   realm: 'myrealm',
 *   auth: { type: 'user-token', userToken: '...' },
 * });
 *
 * const xml = createXmlClient(qb);
 *
 * // Get all roles in an app
 * const roles = await xml.getRoleInfo('bqxyz123');
 * ```
 */

// Re-export types
export * from './types.js';
export { XmlError, XmlErrorCode, isUnauthorized, isNotFound, isInvalidTicket, isInvalidInput } from './errors.js';

// Import ReadOnlyError for consistent error handling
import { ReadOnlyError } from '../core/errors.js';
import type { ResolvedSchema } from '../core/types.js';
import { resolveTableAlias, resolveFieldAlias } from '../core/schema.js';
import { injectAppToken, injectUserToken } from './request.js';

// Import response transformation functions and types
import {
  transformGetRecordInfoResult,
  transformGetSchemaResult,
  transformFieldAddChoicesResult,
  transformFieldRemoveChoicesResult,
  transformGrantedDBsResult,
  transformGrantedDBsForGroupResult,
  transformGetAppDTMInfoResult,
  transformFindDBByNameResult,
  type GetRecordInfoResultWithAlias,
  type GetSchemaResultWithAlias,
  type FieldAddChoicesResultWithAlias,
  type FieldRemoveChoicesResultWithAlias,
  type GrantedDBsResultWithAlias,
  type GrantedDBsForGroupResultWithAlias,
  type GetAppDTMInfoResultWithAlias,
  type FindDBByNameResultWithAlias,
} from './transform.js';

// Re-export transformation types for consumers
export type {
  RecordFieldWithAlias,
  SchemaFieldWithAlias,
  DatabaseInfoWithAlias,
  SchemaChildTableWithAlias,
  GetRecordInfoResultWithAlias,
  GetSchemaResultWithAlias,
  FieldAddChoicesResultWithAlias,
  FieldRemoveChoicesResultWithAlias,
  GrantedDBsResultWithAlias,
  GrantedDBsForGroupResultWithAlias,
  GetAppDTMInfoResultWithAlias,
  FindDBByNameResultWithAlias,
} from './transform.js';

// Import types for XmlClient
import type { XmlCaller } from './types.js';
import type {
  GetRoleInfoResult,
  UserRolesResult,
  GetUserRoleResult,
  GetUsersInGroupResult,
  CreateGroupResult,
  GetGroupRoleResult,
  ProvisionUserResult,
  UserInfo,
  DBInfo,
  AddReplaceDBPageResult,
  PageType,
  DoQueryCountResult,
  GrantedGroupsResult,
  GetAncestorInfoResult,
  ImportFromCSVResult,
  CopyMasterDetailResult,
  WebhooksCreateOptions,
  WebhooksEditOptions,
} from './types.js';

// Import endpoint implementations
import {
  getRoleInfo as getRoleInfoImpl,
  userRoles as userRolesImpl,
  getUserRole as getUserRoleImpl,
  addUserToRole as addUserToRoleImpl,
  removeUserFromRole as removeUserFromRoleImpl,
  changeUserRole as changeUserRoleImpl,
} from './roles.js';

import {
  createGroup as createGroupImpl,
  deleteGroup as deleteGroupImpl,
  copyGroup as copyGroupImpl,
  changeGroupInfo as changeGroupInfoImpl,
  getUsersInGroup as getUsersInGroupImpl,
  addUserToGroup as addUserToGroupImpl,
  removeUserFromGroup as removeUserFromGroupImpl,
  getGroupRole as getGroupRoleImpl,
  addGroupToRole as addGroupToRoleImpl,
  removeGroupFromRole as removeGroupFromRoleImpl,
  grantedGroups as grantedGroupsImpl,
  grantedDBsForGroup as grantedDBsForGroupImpl,
  addSubgroup as addSubgroupImpl,
  removeSubgroup as removeSubgroupImpl,
} from './groups.js';

import {
  getUserInfo as getUserInfoImpl,
  provisionUser as provisionUserImpl,
  sendInvitation as sendInvitationImpl,
  changeManager as changeManagerImpl,
  changeRecordOwner as changeRecordOwnerImpl,
} from './users.js';

import {
  grantedDBs as grantedDBsImpl,
  findDBByName as findDBByNameImpl,
  getDBInfo as getDBInfoImpl,
  getNumRecords as getNumRecordsImpl,
  getSchema as getSchemaImpl,
} from './schema.js';

import {
  getDBVar as getDBVarImpl,
  setDBVar as setDBVarImpl,
} from './dbvars.js';

import {
  getDBPage as getDBPageImpl,
  addReplaceDBPage as addReplaceDBPageImpl,
} from './codepages.js';

import {
  doQueryCount as doQueryCountImpl,
  getRecordInfo as getRecordInfoImpl,
  getRecordInfoByKey as getRecordInfoByKeyImpl,
  importFromCSV as importFromCSVImpl,
  runImport as runImportImpl,
  copyMasterDetail as copyMasterDetailImpl,
} from './records.js';

import {
  webhooksCreate as webhooksCreateImpl,
  webhooksEdit as webhooksEditImpl,
  webhooksDelete as webhooksDeleteImpl,
  webhooksActivate as webhooksActivateImpl,
  webhooksDeactivate as webhooksDeactivateImpl,
  webhooksCopy as webhooksCopyImpl,
} from './webhooks.js';

import {
  fieldAddChoices as fieldAddChoicesImpl,
  fieldRemoveChoices as fieldRemoveChoicesImpl,
  setKeyField as setKeyFieldImpl,
} from './fields.js';

import {
  genAddRecordForm as genAddRecordFormImpl,
  genResultsTable as genResultsTableImpl,
  getRecordAsHTML as getRecordAsHTMLImpl,
} from './html.js';

import {
  getAppDTMInfo as getAppDTMInfoImpl,
  getAncestorInfo as getAncestorInfoImpl,
  signOut as signOutImpl,
} from './metadata.js';

/**
 * Set of XML API actions that modify data.
 * Used to enforce read-only mode.
 */
const xmlWriteActions = new Set([
  // User/Role management
  'API_AddUserToRole',
  'API_RemoveUserFromRole',
  'API_ChangeUserRole',
  'API_ProvisionUser',
  'API_SendInvitation',
  'API_ChangeManager',
  'API_ChangeRecordOwner',

  // Group management
  'API_CreateGroup',
  'API_DeleteGroup',
  'API_AddUserToGroup',
  'API_RemoveUserFromGroup',
  'API_AddGroupToRole',
  'API_RemoveGroupFromRole',
  'API_CopyGroup',
  'API_ChangeGroupInfo',
  'API_AddSubgroup',
  'API_RemoveSubgroup',

  // Variables
  'API_SetDBVar',

  // Code pages
  'API_AddReplaceDBPage',

  // Fields
  'API_FieldAddChoices',
  'API_FieldRemoveChoices',
  'API_SetKeyField',

  // Webhooks
  'API_Webhooks_Create',
  'API_Webhooks_Edit',
  'API_Webhooks_Delete',
  'API_Webhooks_Activate',
  'API_Webhooks_Deactivate',
  'API_Webhooks_Copy',

  // Records/Import
  'API_ImportFromCSV',
  'API_RunImport',
  'API_CopyMasterDetail',
  'API_PurgeRecords',
  'API_AddRecord',
  'API_EditRecord',
  'API_DeleteRecord',

  // Auth (clears session state)
  'API_SignOut',
]);

/**
 * Check if an XML API action modifies data.
 */
export function isXmlWriteAction(action: string): boolean {
  return xmlWriteActions.has(action);
}

/**
 * Options for creating an XML client
 */
export interface XmlClientOptions {
  /** Block all write operations (read-only mode) */
  readOnly?: boolean;
  /** Schema for table/field alias resolution (typically inherited from main client) */
  schema?: ResolvedSchema;
  /** App token for apps that require application tokens (XML API only) */
  appToken?: string;
}

/**
 * XML API Client
 *
 * Provides methods for calling legacy QuickBase XML API endpoints.
 * Create using the `createXmlClient()` function.
 */
export class XmlClient {
  private readonly caller: XmlCaller;
  private readonly readOnly: boolean;
  private readonly schema?: ResolvedSchema;

  constructor(caller: XmlCaller, options?: XmlClientOptions) {
    this.caller = caller;
    this.readOnly = options?.readOnly ?? false;
    this.schema = options?.schema;
    // Note: appToken is handled by the caller closure, not stored here
  }

  /**
   * Resolve a table alias to its ID using the configured schema.
   * If no schema is configured or the input is already a table ID, returns unchanged.
   */
  private resolveTable(tableRef: string): string {
    return resolveTableAlias(this.schema, tableRef);
  }

  /**
   * Resolve a field alias to its ID using the configured schema.
   * If no schema is configured or the input is already a field ID, returns unchanged.
   */
  private resolveField(tableId: string, fieldRef: string | number): number {
    return resolveFieldAlias(this.schema, tableId, fieldRef);
  }

  /**
   * Check if an action is allowed (not blocked by read-only mode).
   * Throws ReadOnlyError if the action is blocked.
   */
  private checkWriteAllowed(action: string): void {
    if (this.readOnly && isXmlWriteAction(action)) {
      throw new ReadOnlyError('POST', `/db/${this.caller.realm()}`, action);
    }
  }

  /**
   * Execute a raw XML API request.
   * Enforces read-only mode if enabled.
   * This is exposed for direct XML API calls not covered by typed methods.
   */
  async executeXml(dbid: string, action: string, body: string): Promise<string> {
    this.checkWriteAllowed(action);
    return this.caller.doXml(dbid, action, body);
  }

  /**
   * Get the realm name
   */
  realm(): string {
    return this.caller.realm();
  }

  // ============================================================================
  // Role Management
  // ============================================================================

  /**
   * Get all roles defined in an application.
   * @see https://help.quickbase.com/docs/api-getroleinfo
   */
  async getRoleInfo(appId: string): Promise<GetRoleInfoResult> {
    return getRoleInfoImpl(this.caller, this.resolveTable(appId));
  }

  /**
   * Get all users in an application and their role assignments.
   * @see https://help.quickbase.com/docs/api-userroles
   */
  async userRoles(appId: string): Promise<UserRolesResult> {
    return userRolesImpl(this.caller, this.resolveTable(appId));
  }

  /**
   * Get roles for a specific user.
   * @see https://help.quickbase.com/docs/api-getuserrole
   */
  async getUserRole(
    appId: string,
    userId?: string,
    includeGroups?: boolean
  ): Promise<GetUserRoleResult> {
    return getUserRoleImpl(this.caller, this.resolveTable(appId), userId, includeGroups);
  }

  /**
   * Assign a user to a role.
   * @see https://help.quickbase.com/docs/api-addusertorole
   */
  async addUserToRole(appId: string, userId: string, roleId: number): Promise<void> {
    this.checkWriteAllowed('API_AddUserToRole');
    return addUserToRoleImpl(this.caller, this.resolveTable(appId), userId, roleId);
  }

  /**
   * Remove a user from a role.
   * @see https://help.quickbase.com/docs/api-removeuserfromrole
   */
  async removeUserFromRole(appId: string, userId: string, roleId: number): Promise<void> {
    this.checkWriteAllowed('API_RemoveUserFromRole');
    return removeUserFromRoleImpl(this.caller, this.resolveTable(appId), userId, roleId);
  }

  /**
   * Change a user's role.
   * @see https://help.quickbase.com/docs/api-changeuserrole
   */
  async changeUserRole(
    appId: string,
    userId: string,
    currentRoleId: number,
    newRoleId?: number
  ): Promise<void> {
    this.checkWriteAllowed('API_ChangeUserRole');
    return changeUserRoleImpl(this.caller, this.resolveTable(appId), userId, currentRoleId, newRoleId);
  }

  // ============================================================================
  // Group Management
  // ============================================================================

  /**
   * Create a new group.
   * @see https://help.quickbase.com/docs/api-creategroup
   */
  async createGroup(
    name: string,
    description?: string,
    accountId?: string
  ): Promise<CreateGroupResult> {
    this.checkWriteAllowed('API_CreateGroup');
    return createGroupImpl(this.caller, name, description, accountId);
  }

  /**
   * Delete a group.
   * @see https://help.quickbase.com/docs/api-deletegroup
   */
  async deleteGroup(groupId: string): Promise<void> {
    this.checkWriteAllowed('API_DeleteGroup');
    return deleteGroupImpl(this.caller, groupId);
  }

  /**
   * Copy a group.
   * @see https://help.quickbase.com/docs/api-copygroup
   */
  async copyGroup(
    groupId: string,
    name?: string,
    description?: string,
    accountId?: string
  ): Promise<CreateGroupResult> {
    this.checkWriteAllowed('API_CopyGroup');
    return copyGroupImpl(this.caller, groupId, name, description, accountId);
  }

  /**
   * Change group information.
   * @see https://help.quickbase.com/docs/api-changegroupinfo
   */
  async changeGroupInfo(
    groupId: string,
    name?: string,
    description?: string,
    accountId?: string
  ): Promise<void> {
    this.checkWriteAllowed('API_ChangeGroupInfo');
    return changeGroupInfoImpl(this.caller, groupId, name, description, accountId);
  }

  /**
   * Get users and managers in a group.
   * @see https://help.quickbase.com/docs/api-getusersingroup
   */
  async getUsersInGroup(groupId: string, includeManagers?: boolean): Promise<GetUsersInGroupResult> {
    return getUsersInGroupImpl(this.caller, groupId, includeManagers);
  }

  /**
   * Add a user to a group.
   * @see https://help.quickbase.com/docs/api-addusertogroup
   */
  async addUserToGroup(
    groupId: string,
    userId: string,
    allowAdminAccess?: boolean
  ): Promise<void> {
    this.checkWriteAllowed('API_AddUserToGroup');
    return addUserToGroupImpl(this.caller, groupId, userId, allowAdminAccess);
  }

  /**
   * Remove a user from a group.
   * @see https://help.quickbase.com/docs/api-removeuserfromgroup
   */
  async removeUserFromGroup(groupId: string, userId: string): Promise<void> {
    this.checkWriteAllowed('API_RemoveUserFromGroup');
    return removeUserFromGroupImpl(this.caller, groupId, userId);
  }

  /**
   * Get roles assigned to a group in an app.
   * @see https://help.quickbase.com/docs/api-getgrouprole
   */
  async getGroupRole(appId: string, groupId: string): Promise<GetGroupRoleResult> {
    return getGroupRoleImpl(this.caller, this.resolveTable(appId), groupId);
  }

  /**
   * Assign a group to a role.
   * @see https://help.quickbase.com/docs/api-addgrouptorole
   */
  async addGroupToRole(appId: string, groupId: string, roleId: number): Promise<void> {
    this.checkWriteAllowed('API_AddGroupToRole');
    return addGroupToRoleImpl(this.caller, this.resolveTable(appId), groupId, roleId);
  }

  /**
   * Remove a group from a role.
   * @see https://help.quickbase.com/docs/api-removegroupfromrole
   */
  async removeGroupFromRole(
    appId: string,
    groupId: string,
    roleId: number,
    allRoles?: boolean
  ): Promise<void> {
    this.checkWriteAllowed('API_RemoveGroupFromRole');
    return removeGroupFromRoleImpl(this.caller, this.resolveTable(appId), groupId, roleId, allRoles);
  }

  /**
   * Get groups a user belongs to.
   * @see https://help.quickbase.com/docs/api-grantedgroups
   */
  async grantedGroups(userId?: string, adminOnly?: boolean): Promise<GrantedGroupsResult> {
    return grantedGroupsImpl(this.caller, userId, adminOnly);
  }

  /**
   * Get apps a group can access.
   * @see https://help.quickbase.com/docs/api-granteddbsforgroup
   */
  async grantedDBsForGroup(groupId: string): Promise<GrantedDBsForGroupResultWithAlias> {
    const result = await grantedDBsForGroupImpl(this.caller, groupId);
    return transformGrantedDBsForGroupResult(result, this.schema);
  }

  /**
   * Add a subgroup to a group.
   * @see https://help.quickbase.com/docs/api-addsubgroup
   */
  async addSubgroup(groupId: string, subgroupId: string): Promise<void> {
    this.checkWriteAllowed('API_AddSubgroup');
    return addSubgroupImpl(this.caller, groupId, subgroupId);
  }

  /**
   * Remove a subgroup from a group.
   * @see https://help.quickbase.com/docs/api-removesubgroup
   */
  async removeSubgroup(groupId: string, subgroupId: string): Promise<void> {
    this.checkWriteAllowed('API_RemoveSubgroup');
    return removeSubgroupImpl(this.caller, groupId, subgroupId);
  }

  // ============================================================================
  // User Management
  // ============================================================================

  /**
   * Get user information by email.
   * @see https://help.quickbase.com/docs/api-getuserinfo
   */
  async getUserInfo(email?: string): Promise<UserInfo> {
    return getUserInfoImpl(this.caller, email);
  }

  /**
   * Create a new unregistered user.
   * @see https://help.quickbase.com/docs/api-provisionuser
   */
  async provisionUser(
    appId: string,
    email: string,
    firstName: string,
    lastName: string,
    roleId?: number
  ): Promise<ProvisionUserResult> {
    this.checkWriteAllowed('API_ProvisionUser');
    return provisionUserImpl(this.caller, this.resolveTable(appId), email, firstName, lastName, roleId);
  }

  /**
   * Send invitation email to a user.
   * @see https://help.quickbase.com/docs/api-sendinvitation
   */
  async sendInvitation(appId: string, userId: string, userText?: string): Promise<void> {
    this.checkWriteAllowed('API_SendInvitation');
    return sendInvitationImpl(this.caller, this.resolveTable(appId), userId, userText);
  }

  /**
   * Change the application manager.
   * @see https://help.quickbase.com/docs/api-changemanager
   */
  async changeManager(appId: string, newManagerEmail: string): Promise<void> {
    this.checkWriteAllowed('API_ChangeManager');
    return changeManagerImpl(this.caller, this.resolveTable(appId), newManagerEmail);
  }

  /**
   * Change the owner of a record.
   * @see https://help.quickbase.com/docs/api-changerecordowner
   */
  async changeRecordOwner(
    tableId: string,
    recordId: number,
    newOwner: string
  ): Promise<void> {
    this.checkWriteAllowed('API_ChangeRecordOwner');
    return changeRecordOwnerImpl(this.caller, this.resolveTable(tableId), recordId, newOwner);
  }

  // ============================================================================
  // App Discovery
  // ============================================================================

  /**
   * List all apps/tables the user can access.
   * @see https://help.quickbase.com/docs/api-granteddbs
   */
  async grantedDBs(options?: {
    parentsOnly?: boolean;
    excludeParents?: boolean;
    adminOnly?: boolean;
    includeAncestors?: boolean;
    withEmbeddedTables?: boolean;
    realmAppsOnly?: boolean;
  }): Promise<GrantedDBsResultWithAlias> {
    const result = await grantedDBsImpl(this.caller, options);
    return transformGrantedDBsResult(result, this.schema);
  }

  /**
   * Find an app by name.
   * @see https://help.quickbase.com/docs/api-finddbbyname
   */
  async findDBByName(name: string, parentsOnly?: boolean): Promise<FindDBByNameResultWithAlias> {
    const result = await findDBByNameImpl(this.caller, name, parentsOnly);
    return transformFindDBByNameResult(result, this.schema);
  }

  /**
   * Get app/table metadata.
   * @see https://help.quickbase.com/docs/api-getdbinfo
   */
  async getDBInfo(dbid: string): Promise<DBInfo> {
    return getDBInfoImpl(this.caller, this.resolveTable(dbid));
  }

  /**
   * Get total record count for a table.
   * @see https://help.quickbase.com/docs/api-getnumrecords
   */
  async getNumRecords(tableId: string): Promise<number> {
    return getNumRecordsImpl(this.caller, this.resolveTable(tableId));
  }

  // ============================================================================
  // Schema Information
  // ============================================================================

  /**
   * Get comprehensive app/table metadata.
   * @see https://help.quickbase.com/docs/api-getschema
   */
  async getSchema(dbid: string): Promise<GetSchemaResultWithAlias> {
    const resolvedDbid = this.resolveTable(dbid);
    const result = await getSchemaImpl(this.caller, resolvedDbid);
    return transformGetSchemaResult(result, this.schema, resolvedDbid);
  }

  // ============================================================================
  // Application Variables (DBVars)
  // ============================================================================

  /**
   * Get an application variable value.
   * @see https://help.quickbase.com/docs/api-getdbvar
   */
  async getDBVar(appId: string, varName: string): Promise<string> {
    return getDBVarImpl(this.caller, this.resolveTable(appId), varName);
  }

  /**
   * Set an application variable value.
   * @see https://help.quickbase.com/docs/api-setdbvar
   */
  async setDBVar(appId: string, varName: string, value: string): Promise<void> {
    this.checkWriteAllowed('API_SetDBVar');
    return setDBVarImpl(this.caller, this.resolveTable(appId), varName, value);
  }

  // ============================================================================
  // Code Pages
  // ============================================================================

  /**
   * Get stored code page content.
   * @see https://help.quickbase.com/docs/api-getdbpage
   */
  async getDBPage(appId: string, pageIdOrName: string | number): Promise<string> {
    return getDBPageImpl(this.caller, this.resolveTable(appId), pageIdOrName);
  }

  /**
   * Create or update a code page.
   * @see https://help.quickbase.com/docs/api-addreplacedbpage
   */
  async addReplaceDBPage(
    appId: string,
    pageName: string,
    pageId: number | undefined,
    pageType: PageType,
    pageBody: string
  ): Promise<AddReplaceDBPageResult> {
    this.checkWriteAllowed('API_AddReplaceDBPage');
    return addReplaceDBPageImpl(this.caller, this.resolveTable(appId), pageName, pageId, pageType, pageBody);
  }

  // ============================================================================
  // Field Management
  // ============================================================================

  /**
   * Add choices to a multiple-choice field.
   * @see https://help.quickbase.com/docs/api-fieldaddchoices
   */
  async fieldAddChoices(
    tableId: string,
    fieldId: number | string,
    choices: string[]
  ): Promise<FieldAddChoicesResultWithAlias> {
    this.checkWriteAllowed('API_FieldAddChoices');
    const resolvedTableId = this.resolveTable(tableId);
    const resolvedFieldId = this.resolveField(resolvedTableId, fieldId);
    const result = await fieldAddChoicesImpl(this.caller, resolvedTableId, resolvedFieldId, choices);
    return transformFieldAddChoicesResult(result, this.schema, resolvedTableId);
  }

  /**
   * Remove choices from a multiple-choice field.
   * @see https://help.quickbase.com/docs/api-fieldremovechoices
   */
  async fieldRemoveChoices(
    tableId: string,
    fieldId: number | string,
    choices: string[]
  ): Promise<FieldRemoveChoicesResultWithAlias> {
    this.checkWriteAllowed('API_FieldRemoveChoices');
    const resolvedTableId = this.resolveTable(tableId);
    const resolvedFieldId = this.resolveField(resolvedTableId, fieldId);
    const result = await fieldRemoveChoicesImpl(this.caller, resolvedTableId, resolvedFieldId, choices);
    return transformFieldRemoveChoicesResult(result, this.schema, resolvedTableId);
  }

  /**
   * Set the key field for a table.
   * @see https://help.quickbase.com/docs/api-setkeyfield
   */
  async setKeyField(tableId: string, fieldId: number | string): Promise<void> {
    this.checkWriteAllowed('API_SetKeyField');
    const resolvedTableId = this.resolveTable(tableId);
    const resolvedFieldId = this.resolveField(resolvedTableId, fieldId);
    return setKeyFieldImpl(this.caller, resolvedTableId, resolvedFieldId);
  }

  // ============================================================================
  // Record Information
  // ============================================================================

  /**
   * Get count of matching records without fetching data.
   * @see https://help.quickbase.com/docs/api-doquerycount
   */
  async doQueryCount(tableId: string, query?: string): Promise<DoQueryCountResult> {
    return doQueryCountImpl(this.caller, this.resolveTable(tableId), query);
  }

  /**
   * Get a record with field metadata.
   * @see https://help.quickbase.com/docs/api-getrecordinfo
   */
  async getRecordInfo(tableId: string, recordId: number): Promise<GetRecordInfoResultWithAlias> {
    const resolvedTableId = this.resolveTable(tableId);
    const result = await getRecordInfoImpl(this.caller, resolvedTableId, recordId);
    return transformGetRecordInfoResult(result, this.schema, resolvedTableId);
  }

  /**
   * Get a record by key field value.
   * @see https://help.quickbase.com/docs/api-getrecordinfo
   */
  async getRecordInfoByKey(tableId: string, keyValue: string): Promise<GetRecordInfoResultWithAlias> {
    const resolvedTableId = this.resolveTable(tableId);
    const result = await getRecordInfoByKeyImpl(this.caller, resolvedTableId, keyValue);
    return transformGetRecordInfoResult(result, this.schema, resolvedTableId);
  }

  /**
   * Bulk import/update records from CSV data.
   * @see https://help.quickbase.com/docs/api-importfromcsv
   */
  async importFromCSV(
    tableId: string,
    options: {
      recordsCsv: string;
      clist?: (number | string)[];
      skipFirst?: boolean;
      mergeFieldId?: number | string;
      decimalPercent?: boolean;
    }
  ): Promise<ImportFromCSVResult> {
    this.checkWriteAllowed('API_ImportFromCSV');
    const resolvedTableId = this.resolveTable(tableId);
    // Resolve field aliases in clist and mergeFieldId
    const resolvedOptions = {
      ...options,
      clist: options.clist?.map(f => this.resolveField(resolvedTableId, f)),
      mergeFieldId: options.mergeFieldId !== undefined
        ? this.resolveField(resolvedTableId, options.mergeFieldId)
        : undefined,
    };
    return importFromCSVImpl(this.caller, resolvedTableId, resolvedOptions);
  }

  /**
   * Execute a saved import definition.
   * @see https://help.quickbase.com/docs/api-runimport
   */
  async runImport(tableId: string, importId: number): Promise<ImportFromCSVResult> {
    this.checkWriteAllowed('API_RunImport');
    return runImportImpl(this.caller, this.resolveTable(tableId), importId);
  }

  /**
   * Copy a master record with its detail records.
   * @see https://help.quickbase.com/docs/api-copymasterdetail
   */
  async copyMasterDetail(
    tableId: string,
    options: {
      rid: number;
      copyfid?: number | string;
      recurse?: boolean;
      relfids?: (number | string)[];
    }
  ): Promise<CopyMasterDetailResult> {
    this.checkWriteAllowed('API_CopyMasterDetail');
    const resolvedTableId = this.resolveTable(tableId);
    // Resolve field aliases in copyfid and relfids
    const resolvedOptions = {
      ...options,
      copyfid: options.copyfid !== undefined
        ? this.resolveField(resolvedTableId, options.copyfid)
        : undefined,
      relfids: options.relfids?.map(f => this.resolveField(resolvedTableId, f)),
    };
    return copyMasterDetailImpl(this.caller, resolvedTableId, resolvedOptions);
  }

  // ============================================================================
  // App Metadata
  // ============================================================================

  /**
   * Get modification timestamps (fast, no auth required).
   * @see https://help.quickbase.com/docs/api-getappdtminfo
   */
  async getAppDTMInfo(appId: string): Promise<GetAppDTMInfoResultWithAlias> {
    const result = await getAppDTMInfoImpl(this.caller, this.resolveTable(appId));
    return transformGetAppDTMInfoResult(result, this.schema);
  }

  /**
   * Get app copy/template lineage info.
   * @see https://help.quickbase.com/docs/api-getancestorinfo
   */
  async getAncestorInfo(appId: string): Promise<GetAncestorInfoResult> {
    return getAncestorInfoImpl(this.caller, this.resolveTable(appId));
  }

  // ============================================================================
  // Webhooks
  // ============================================================================

  /**
   * Create a webhook.
   * @see https://help.quickbase.com/docs/api-webhooks-create
   */
  async webhooksCreate(tableId: string, options: WebhooksCreateOptions): Promise<void> {
    this.checkWriteAllowed('API_Webhooks_Create');
    return webhooksCreateImpl(this.caller, this.resolveTable(tableId), options);
  }

  /**
   * Edit a webhook.
   * @see https://help.quickbase.com/docs/api-webhooks-edit
   */
  async webhooksEdit(
    tableId: string,
    actionId: string,
    options: WebhooksEditOptions
  ): Promise<void> {
    this.checkWriteAllowed('API_Webhooks_Edit');
    return webhooksEditImpl(this.caller, this.resolveTable(tableId), actionId, options);
  }

  /**
   * Delete webhooks.
   * @see https://help.quickbase.com/docs/api-webhooks-delete
   */
  async webhooksDelete(tableId: string, actionIds: string[]): Promise<{ numChanged: number }> {
    this.checkWriteAllowed('API_Webhooks_Delete');
    return webhooksDeleteImpl(this.caller, this.resolveTable(tableId), actionIds);
  }

  /**
   * Activate webhooks.
   * @see https://help.quickbase.com/docs/api-webhooks-activate
   */
  async webhooksActivate(tableId: string, actionIds: string[]): Promise<{ numChanged: number }> {
    this.checkWriteAllowed('API_Webhooks_Activate');
    return webhooksActivateImpl(this.caller, this.resolveTable(tableId), actionIds);
  }

  /**
   * Deactivate webhooks.
   * @see https://help.quickbase.com/docs/api-webhooks-deactivate
   */
  async webhooksDeactivate(tableId: string, actionIds: string[]): Promise<{ numChanged: number }> {
    this.checkWriteAllowed('API_Webhooks_Deactivate');
    return webhooksDeactivateImpl(this.caller, this.resolveTable(tableId), actionIds);
  }

  /**
   * Copy a webhook.
   * @see https://help.quickbase.com/docs/api-webhooks-copy
   */
  async webhooksCopy(tableId: string, actionId: string): Promise<{ actionId: string }> {
    this.checkWriteAllowed('API_Webhooks_Copy');
    return webhooksCopyImpl(this.caller, this.resolveTable(tableId), actionId);
  }

  // ============================================================================
  // HTML Generation
  // ============================================================================

  /**
   * Generate HTML form for adding a record.
   * @see https://help.quickbase.com/docs/api-genaddrecordform
   */
  async genAddRecordForm(
    tableId: string,
    fields?: Array<{ id: number | string; value: string }>
  ): Promise<string> {
    const resolvedTableId = this.resolveTable(tableId);
    const resolvedFields = fields?.map(f => ({
      id: this.resolveField(resolvedTableId, f.id),
      value: f.value,
    }));
    return genAddRecordFormImpl(this.caller, resolvedTableId, resolvedFields);
  }

  /**
   * Generate HTML/JS/CSV table of query results.
   * @see https://help.quickbase.com/docs/api-genresultstable
   */
  async genResultsTable(
    tableId: string,
    options?: {
      query?: string;
      clist?: (number | string)[];
      slist?: (number | string)[];
      options?: string;
      format?: 'structured' | 'csv';
    }
  ): Promise<string> {
    const resolvedTableId = this.resolveTable(tableId);
    const resolvedOptions = options ? {
      ...options,
      clist: options.clist?.map(f => this.resolveField(resolvedTableId, f)),
      slist: options.slist?.map(f => this.resolveField(resolvedTableId, f)),
    } : undefined;
    return genResultsTableImpl(this.caller, resolvedTableId, resolvedOptions);
  }

  /**
   * Get a record rendered as HTML.
   * @see https://help.quickbase.com/docs/api-getrecordashtml
   */
  async getRecordAsHTML(
    tableId: string,
    options: {
      rid?: number;
      key?: string;
      jht?: boolean;
      dfid?: number | string;
    }
  ): Promise<string> {
    const resolvedTableId = this.resolveTable(tableId);
    const resolvedOptions = {
      ...options,
      dfid: options.dfid !== undefined
        ? this.resolveField(resolvedTableId, options.dfid)
        : undefined,
    };
    return getRecordAsHTMLImpl(this.caller, resolvedTableId, resolvedOptions);
  }

  // ============================================================================
  // Authentication
  // ============================================================================

  /**
   * Clear ticket cookie (browser-focused).
   * @see https://help.quickbase.com/docs/api-signout
   */
  async signOut(): Promise<void> {
    return signOutImpl(this.caller);
  }
}

/**
 * Interface for objects that can execute XML API requests.
 * Used to adapt the main QuickBase client for XML API calls.
 */
export interface XmlExecutor {
  /**
   * Execute an XML API request
   * @param dbid - The database ID
   * @param action - The QUICKBASE-ACTION header value
   * @param body - The XML request body
   * @returns The raw XML response body
   */
  executeXml(dbid: string, action: string, body: string): Promise<string>;

  /**
   * Get the realm name
   */
  realm: string;
}

/**
 * Adapter to create an XmlCaller from a QuickbaseClient.
 * This bridges the main client to the XML API client.
 */
interface QuickbaseClientLike {
  getConfig(): {
    realm: string;
    fetchApi: typeof fetch;
    timeout: number;
    readOnly?: boolean;
    schema?: ResolvedSchema;
    appToken?: string;
  };
  /**
   * Get the auth strategy for XML requests.
   * This is exposed via getAuthStrategy() method added to the client.
   */
  getAuthStrategy?: () => {
    getToken(dbid?: string): Promise<string>;
    getAuthorizationHeader(token: string): string;
  };
}

/**
 * Create an XML API client from a QuickBase client.
 *
 * @param client - The main QuickBase client
 * @param options - Options for the XML client
 * @returns XmlClient instance
 *
 * @example
 * ```typescript
 * const qb = createClient({ realm: 'myrealm', auth: {...} });
 * const xml = createXmlClient(qb);
 *
 * const roles = await xml.getRoleInfo('bqxyz123');
 * ```
 */
export function createXmlClient(
  client: QuickbaseClientLike,
  options?: XmlClientOptions
): XmlClient {
  const config = client.getConfig();

  // Get auth strategy if available
  const getAuth = client.getAuthStrategy;
  if (!getAuth) {
    throw new Error(
      'XML client requires access to auth strategy. ' +
      'Make sure you are using a compatible version of the QuickBase client.'
    );
  }
  const auth = getAuth();

  // Resolve app token: explicit option > config
  const appToken = options?.appToken ?? config.appToken;

  // Create an XmlCaller adapter that makes XML requests
  const caller: XmlCaller = {
    realm: () => config.realm,
    doXml: async (dbid: string, action: string, body: string): Promise<string> => {
      const url = `https://${config.realm}.quickbase.com/db/${encodeURIComponent(dbid)}`;

      // Inject app token if configured
      let finalBody = appToken ? injectAppToken(body, appToken) : body;

      // Get auth token for this dbid
      const token = await auth.getToken(dbid);
      const authHeader = auth.getAuthorizationHeader(token);

      // Build headers - XML API requires tokens in body, not Authorization header
      // Check if using user token auth (QB-USER-TOKEN prefix)
      const headers: Record<string, string> = {
        'Content-Type': 'application/xml',
        'QUICKBASE-ACTION': action,
      };

      if (authHeader.startsWith('QB-USER-TOKEN ')) {
        // User token auth: inject token into XML body instead of header
        // The XML API requires <usertoken> element, not Authorization header
        // See: https://help.quickbase.com/docs/api-getdbpage
        finalBody = injectUserToken(finalBody, token);
      } else {
        // Other auth types (temp token, SSO): fall back to header auth
        // Note: These may not work with XML API endpoints that require body auth
        headers['Authorization'] = authHeader;
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      try {
        const response = await config.fetchApi(url, {
          method: 'POST',
          headers,
          body: finalBody,
          signal: controller.signal,
          credentials: 'omit',
        });

        const text = await response.text();

        // Check for HTTP-level errors (429, 5xx)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new Error(
            `Rate limited (429). Retry after: ${retryAfter ?? 'unknown'} seconds`
          );
        }

        if (response.status >= 500) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }

        return text;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`Request timeout after ${config.timeout}ms`);
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    },
  };

  // Inherit readOnly and schema from main client if not explicitly set in options
  const resolvedOptions: XmlClientOptions = {
    readOnly: options?.readOnly ?? config.readOnly ?? false,
    schema: options?.schema ?? config.schema,
  };

  return new XmlClient(caller, resolvedOptions);
}
