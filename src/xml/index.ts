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

// Import types for XmlClient
import type { XmlCaller } from './types.js';
import type {
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
  UserInfo,
  DBInfo,
  AddReplaceDBPageResult,
  PageType,
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
  WebhookOptions,
  WebhookResult,
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
  'API_AddUserToRole',
  'API_RemoveUserFromRole',
  'API_ChangeUserRole',
  'API_ProvisionUser',
  'API_SendInvitation',
  'API_SetDBVar',
  'API_AddReplaceDBPage',
  'API_FieldAddChoices',
  'API_FieldRemoveChoices',
  'API_SetKeyField',
  'API_CreateGroup',
  'API_DeleteGroup',
  'API_CopyGroup',
  'API_ChangeGroupInfo',
  'API_AddUserToGroup',
  'API_RemoveUserFromGroup',
  'API_AddSubgroup',
  'API_RemoveSubgroup',
  'API_AddGroupToRole',
  'API_RemoveGroupFromRole',
  'API_ChangeManager',
  'API_ChangeRecordOwner',
  'API_ImportFromCSV',
  'API_RunImport',
  'API_CopyMasterDetail',
  'API_Webhooks_Create',
  'API_Webhooks_Edit',
  'API_Webhooks_Delete',
  'API_Webhooks_Activate',
  'API_Webhooks_Deactivate',
  'API_Webhooks_Copy',
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

  constructor(caller: XmlCaller, options?: XmlClientOptions) {
    this.caller = caller;
    this.readOnly = options?.readOnly ?? false;
  }

  /**
   * Check if an action is allowed (not blocked by read-only mode).
   * Throws if the action is blocked.
   */
  private checkWriteAllowed(action: string): void {
    if (this.readOnly && isXmlWriteAction(action)) {
      throw new Error(`Read-only mode: ${action} is blocked`);
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
    return getRoleInfoImpl(this.caller, appId);
  }

  /**
   * Get all users in an application and their role assignments.
   * @see https://help.quickbase.com/docs/api-userroles
   */
  async userRoles(appId: string): Promise<UserRolesResult> {
    return userRolesImpl(this.caller, appId);
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
    return getUserRoleImpl(this.caller, appId, userId, includeGroups);
  }

  /**
   * Assign a user to a role.
   * @see https://help.quickbase.com/docs/api-addusertorole
   */
  async addUserToRole(appId: string, userId: string, roleId: number): Promise<void> {
    this.checkWriteAllowed('API_AddUserToRole');
    return addUserToRoleImpl(this.caller, appId, userId, roleId);
  }

  /**
   * Remove a user from a role.
   * @see https://help.quickbase.com/docs/api-removeuserfromrole
   */
  async removeUserFromRole(appId: string, userId: string, roleId: number): Promise<void> {
    this.checkWriteAllowed('API_RemoveUserFromRole');
    return removeUserFromRoleImpl(this.caller, appId, userId, roleId);
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
    return changeUserRoleImpl(this.caller, appId, userId, currentRoleId, newRoleId);
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
    return getGroupRoleImpl(this.caller, appId, groupId);
  }

  /**
   * Assign a group to a role.
   * @see https://help.quickbase.com/docs/api-addgrouptorole
   */
  async addGroupToRole(appId: string, groupId: string, roleId: number): Promise<void> {
    this.checkWriteAllowed('API_AddGroupToRole');
    return addGroupToRoleImpl(this.caller, appId, groupId, roleId);
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
    return removeGroupFromRoleImpl(this.caller, appId, groupId, roleId, allRoles);
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
  async grantedDBsForGroup(groupId: string): Promise<GrantedDBsForGroupResult> {
    return grantedDBsForGroupImpl(this.caller, groupId);
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
    return provisionUserImpl(this.caller, appId, email, firstName, lastName, roleId);
  }

  /**
   * Send invitation email to a user.
   * @see https://help.quickbase.com/docs/api-sendinvitation
   */
  async sendInvitation(appId: string, userId: string, userText?: string): Promise<void> {
    this.checkWriteAllowed('API_SendInvitation');
    return sendInvitationImpl(this.caller, appId, userId, userText);
  }

  /**
   * Change the application manager.
   * @see https://help.quickbase.com/docs/api-changemanager
   */
  async changeManager(appId: string, newManagerEmail: string): Promise<void> {
    this.checkWriteAllowed('API_ChangeManager');
    return changeManagerImpl(this.caller, appId, newManagerEmail);
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
    return changeRecordOwnerImpl(this.caller, tableId, recordId, newOwner);
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
  }): Promise<GrantedDBsResult> {
    return grantedDBsImpl(this.caller, options);
  }

  /**
   * Find an app by name.
   * @see https://help.quickbase.com/docs/api-finddbbyname
   */
  async findDBByName(name: string, parentsOnly?: boolean): Promise<FindDBByNameResult> {
    return findDBByNameImpl(this.caller, name, parentsOnly);
  }

  /**
   * Get app/table metadata.
   * @see https://help.quickbase.com/docs/api-getdbinfo
   */
  async getDBInfo(dbid: string): Promise<DBInfo> {
    return getDBInfoImpl(this.caller, dbid);
  }

  /**
   * Get total record count for a table.
   * @see https://help.quickbase.com/docs/api-getnumrecords
   */
  async getNumRecords(tableId: string): Promise<number> {
    return getNumRecordsImpl(this.caller, tableId);
  }

  // ============================================================================
  // Schema Information
  // ============================================================================

  /**
   * Get comprehensive app/table metadata.
   * @see https://help.quickbase.com/docs/api-getschema
   */
  async getSchema(dbid: string): Promise<GetSchemaResult> {
    return getSchemaImpl(this.caller, dbid);
  }

  // ============================================================================
  // Application Variables (DBVars)
  // ============================================================================

  /**
   * Get an application variable value.
   * @see https://help.quickbase.com/docs/api-getdbvar
   */
  async getDBVar(appId: string, varName: string): Promise<string> {
    return getDBVarImpl(this.caller, appId, varName);
  }

  /**
   * Set an application variable value.
   * @see https://help.quickbase.com/docs/api-setdbvar
   */
  async setDBVar(appId: string, varName: string, value: string): Promise<void> {
    this.checkWriteAllowed('API_SetDBVar');
    return setDBVarImpl(this.caller, appId, varName, value);
  }

  // ============================================================================
  // Code Pages
  // ============================================================================

  /**
   * Get stored code page content.
   * @see https://help.quickbase.com/docs/api-getdbpage
   */
  async getDBPage(appId: string, pageIdOrName: string | number): Promise<string> {
    return getDBPageImpl(this.caller, appId, pageIdOrName);
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
    return addReplaceDBPageImpl(this.caller, appId, pageName, pageId, pageType, pageBody);
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
    fieldId: number,
    choices: string[]
  ): Promise<FieldAddChoicesResult> {
    this.checkWriteAllowed('API_FieldAddChoices');
    return fieldAddChoicesImpl(this.caller, tableId, fieldId, choices);
  }

  /**
   * Remove choices from a multiple-choice field.
   * @see https://help.quickbase.com/docs/api-fieldremovechoices
   */
  async fieldRemoveChoices(
    tableId: string,
    fieldId: number,
    choices: string[]
  ): Promise<FieldRemoveChoicesResult> {
    this.checkWriteAllowed('API_FieldRemoveChoices');
    return fieldRemoveChoicesImpl(this.caller, tableId, fieldId, choices);
  }

  /**
   * Set the key field for a table.
   * @see https://help.quickbase.com/docs/api-setkeyfield
   */
  async setKeyField(tableId: string, fieldId: number): Promise<void> {
    this.checkWriteAllowed('API_SetKeyField');
    return setKeyFieldImpl(this.caller, tableId, fieldId);
  }

  // ============================================================================
  // Record Information
  // ============================================================================

  /**
   * Get count of matching records without fetching data.
   * @see https://help.quickbase.com/docs/api-doquerycount
   */
  async doQueryCount(tableId: string, query?: string): Promise<DoQueryCountResult> {
    return doQueryCountImpl(this.caller, tableId, query);
  }

  /**
   * Get a record with field metadata.
   * @see https://help.quickbase.com/docs/api-getrecordinfo
   */
  async getRecordInfo(tableId: string, recordId: number): Promise<GetRecordInfoResult> {
    return getRecordInfoImpl(this.caller, tableId, recordId);
  }

  /**
   * Get a record by key field value.
   * @see https://help.quickbase.com/docs/api-getrecordinfo
   */
  async getRecordInfoByKey(tableId: string, keyValue: string): Promise<GetRecordInfoResult> {
    return getRecordInfoByKeyImpl(this.caller, tableId, keyValue);
  }

  /**
   * Bulk import/update records from CSV data.
   * @see https://help.quickbase.com/docs/api-importfromcsv
   */
  async importFromCSV(
    tableId: string,
    options: {
      recordsCsv: string;
      clist?: number[];
      skipFirst?: boolean;
      mergeFieldId?: number;
      decimalPercent?: boolean;
    }
  ): Promise<ImportFromCSVResult> {
    this.checkWriteAllowed('API_ImportFromCSV');
    return importFromCSVImpl(this.caller, tableId, options);
  }

  /**
   * Execute a saved import definition.
   * @see https://help.quickbase.com/docs/api-runimport
   */
  async runImport(tableId: string, importId: number): Promise<ImportFromCSVResult> {
    this.checkWriteAllowed('API_RunImport');
    return runImportImpl(this.caller, tableId, importId);
  }

  /**
   * Copy a master record with its detail records.
   * @see https://help.quickbase.com/docs/api-copymasterdetail
   */
  async copyMasterDetail(
    tableId: string,
    options: {
      rid: number;
      copyfid?: number;
      recurse?: boolean;
      relfids?: number[];
    }
  ): Promise<CopyMasterDetailResult> {
    this.checkWriteAllowed('API_CopyMasterDetail');
    return copyMasterDetailImpl(this.caller, tableId, options);
  }

  // ============================================================================
  // App Metadata
  // ============================================================================

  /**
   * Get modification timestamps (fast, no auth required).
   * @see https://help.quickbase.com/docs/api-getappdtminfo
   */
  async getAppDTMInfo(appId: string): Promise<GetAppDTMInfoResult> {
    return getAppDTMInfoImpl(this.caller, appId);
  }

  /**
   * Get app copy/template lineage info.
   * @see https://help.quickbase.com/docs/api-getancestorinfo
   */
  async getAncestorInfo(appId: string): Promise<GetAncestorInfoResult> {
    return getAncestorInfoImpl(this.caller, appId);
  }

  // ============================================================================
  // Webhooks
  // ============================================================================

  /**
   * Create a webhook.
   * @see https://help.quickbase.com/docs/api-webhooks-create
   */
  async webhooksCreate(tableId: string, options: WebhookOptions): Promise<WebhookResult> {
    this.checkWriteAllowed('API_Webhooks_Create');
    return webhooksCreateImpl(this.caller, tableId, options);
  }

  /**
   * Edit a webhook.
   * @see https://help.quickbase.com/docs/api-webhooks-edit
   */
  async webhooksEdit(
    tableId: string,
    webhookId: number,
    options: WebhookOptions
  ): Promise<void> {
    this.checkWriteAllowed('API_Webhooks_Edit');
    return webhooksEditImpl(this.caller, tableId, webhookId, options);
  }

  /**
   * Delete a webhook.
   * @see https://help.quickbase.com/docs/api-webhooks-delete
   */
  async webhooksDelete(tableId: string, webhookId: number): Promise<void> {
    this.checkWriteAllowed('API_Webhooks_Delete');
    return webhooksDeleteImpl(this.caller, tableId, webhookId);
  }

  /**
   * Activate a webhook.
   * @see https://help.quickbase.com/docs/api-webhooks-activate
   */
  async webhooksActivate(tableId: string, webhookId: number): Promise<void> {
    this.checkWriteAllowed('API_Webhooks_Activate');
    return webhooksActivateImpl(this.caller, tableId, webhookId);
  }

  /**
   * Deactivate a webhook.
   * @see https://help.quickbase.com/docs/api-webhooks-deactivate
   */
  async webhooksDeactivate(tableId: string, webhookId: number): Promise<void> {
    this.checkWriteAllowed('API_Webhooks_Deactivate');
    return webhooksDeactivateImpl(this.caller, tableId, webhookId);
  }

  /**
   * Copy a webhook.
   * @see https://help.quickbase.com/docs/api-webhooks-copy
   */
  async webhooksCopy(tableId: string, webhookId: number, name?: string): Promise<WebhookResult> {
    this.checkWriteAllowed('API_Webhooks_Copy');
    return webhooksCopyImpl(this.caller, tableId, webhookId, name);
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
    fields?: Array<{ id: number; value: string }>
  ): Promise<string> {
    return genAddRecordFormImpl(this.caller, tableId, fields);
  }

  /**
   * Generate HTML/JS/CSV table of query results.
   * @see https://help.quickbase.com/docs/api-genresultstable
   */
  async genResultsTable(
    tableId: string,
    options?: {
      query?: string;
      clist?: number[];
      slist?: number[];
      options?: string;
      format?: 'structured' | 'csv';
    }
  ): Promise<string> {
    return genResultsTableImpl(this.caller, tableId, options);
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
      dfid?: number;
    }
  ): Promise<string> {
    return getRecordAsHTMLImpl(this.caller, tableId, options);
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
  getConfig(): { realm: string; fetchApi: typeof fetch; timeout: number };
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

  // Create an XmlCaller adapter that makes XML requests
  const caller: XmlCaller = {
    realm: () => config.realm,
    doXml: async (dbid: string, action: string, body: string): Promise<string> => {
      const url = `https://${config.realm}.quickbase.com/db/${dbid}`;

      // Get auth token for this dbid
      const token = await auth.getToken(dbid);
      const authHeader = auth.getAuthorizationHeader(token);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      try {
        const response = await config.fetchApi(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/xml',
            'QUICKBASE-ACTION': action,
            'Authorization': authHeader,
          },
          body,
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

  return new XmlClient(caller, options);
}
