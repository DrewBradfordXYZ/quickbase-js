/**
 * XML API Group Management
 *
 * Endpoints for managing groups and group memberships.
 *
 * XML-API: Remove this file when QuickBase discontinues the XML API.
 * To find all XML API code, search for: XML-API
 */

import type {
  XmlCaller,
  Group,
  GroupUser,
  GroupManager,
  Subgroup,
  CreateGroupResult,
  GetUsersInGroupResult,
  GetGroupRoleResult,
  GrantedGroupsResult,
  GrantedDBsForGroupResult,
} from './types.js';
import { checkError } from './errors.js';
import {
  buildRequest,
  escapeXml,
  parseBaseResponse,
  getTagContent,
  getAttribute,
  getAllElements,
  parseXmlNumber,
  parseXmlBool,
} from './request.js';

/**
 * Parse a group element from XML
 */
function parseGroup(groupXml: string): Group {
  const id = getAttribute(groupXml, 'id');
  const name = getTagContent(groupXml, 'name');
  const description = getTagContent(groupXml, 'description') || undefined;
  const managedByUserStr = getTagContent(groupXml, 'managedByUser');
  const managedByUser = managedByUserStr ? parseXmlBool(managedByUserStr) : undefined;

  return { id, name, description, managedByUser };
}

/**
 * Parse a user element from GetUsersInGroup response
 */
function parseGroupUser(userXml: string): GroupUser {
  return {
    id: getAttribute(userXml, 'id'),
    firstName: getTagContent(userXml, 'firstName'),
    lastName: getTagContent(userXml, 'lastName'),
    email: getTagContent(userXml, 'email'),
    screenName: getTagContent(userXml, 'screenName') || undefined,
    isAdmin: parseXmlBool(getTagContent(userXml, 'isAdmin')),
  };
}

/**
 * Parse a manager element from GetUsersInGroup response
 */
function parseGroupManager(managerXml: string): GroupManager {
  return {
    id: getAttribute(managerXml, 'id'),
    firstName: getTagContent(managerXml, 'firstName'),
    lastName: getTagContent(managerXml, 'lastName'),
    email: getTagContent(managerXml, 'email'),
    screenName: getTagContent(managerXml, 'screenName') || undefined,
    isMember: parseXmlBool(getTagContent(managerXml, 'isMember')),
  };
}

/**
 * Parse a subgroup element
 */
function parseSubgroup(subgroupXml: string): Subgroup {
  return { id: getAttribute(subgroupXml, 'id') };
}

/**
 * Create a new group.
 *
 * The group will be created with the caller as owner and first member.
 * Caller must be the manager of the account where the group is created.
 *
 * @see https://help.quickbase.com/docs/api-creategroup
 *
 * @example
 * ```typescript
 * const result = await createGroup(caller, 'MarketingSupport', 'Support staff', '456789');
 * console.log(`Created group: ${result.group.id}`);
 * ```
 */
export async function createGroup(
  caller: XmlCaller,
  name: string,
  description?: string,
  accountId?: string
): Promise<CreateGroupResult> {
  let inner = `<name>${escapeXml(name)}</name>`;
  if (description) {
    inner += `<description>${escapeXml(description)}</description>`;
  }
  if (accountId) {
    inner += `<accountID>${escapeXml(accountId)}</accountID>`;
  }
  const body = buildRequest(inner);
  const xml = await caller.doXml('main', 'API_CreateGroup', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  // Parse group element
  const groupMatch = xml.match(/<group[^>]*>([\s\S]*?)<\/group>/);
  if (!groupMatch) {
    throw new Error('Invalid API_CreateGroup response: no group element');
  }

  const group = parseGroup(groupMatch[0]);
  return { group };
}

/**
 * Delete a group.
 *
 * **Warning:** Once deleted, a group cannot be restored.
 *
 * @see https://help.quickbase.com/docs/api-deletegroup
 *
 * @example
 * ```typescript
 * await deleteGroup(caller, '1217.dgpt');
 * ```
 */
export async function deleteGroup(
  caller: XmlCaller,
  groupId: string
): Promise<void> {
  const inner = `<gid>${escapeXml(groupId)}</gid>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml('main', 'API_DeleteGroup', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}

/**
 * Copy a group.
 *
 * @see https://help.quickbase.com/docs/api-copygroup
 *
 * @example
 * ```typescript
 * const result = await copyGroup(caller, '1217.dgpt', 'NewGroupName', 'New description');
 * ```
 */
export async function copyGroup(
  caller: XmlCaller,
  groupId: string,
  name?: string,
  description?: string,
  accountId?: string
): Promise<CreateGroupResult> {
  let inner = `<gid>${escapeXml(groupId)}</gid>`;
  if (name) {
    inner += `<name>${escapeXml(name)}</name>`;
  }
  if (description) {
    inner += `<description>${escapeXml(description)}</description>`;
  }
  if (accountId) {
    inner += `<accountID>${escapeXml(accountId)}</accountID>`;
  }
  const body = buildRequest(inner);
  const xml = await caller.doXml('main', 'API_CopyGroup', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  const groupMatch = xml.match(/<group[^>]*>([\s\S]*?)<\/group>/);
  if (!groupMatch) {
    throw new Error('Invalid API_CopyGroup response: no group element');
  }

  const group = parseGroup(groupMatch[0]);
  return { group };
}

/**
 * Change group information (name, description).
 *
 * @see https://help.quickbase.com/docs/api-changegroupinfo
 *
 * @example
 * ```typescript
 * await changeGroupInfo(caller, '1217.dgpt', 'NewName', 'New description');
 * ```
 */
export async function changeGroupInfo(
  caller: XmlCaller,
  groupId: string,
  name?: string,
  description?: string,
  accountId?: string
): Promise<void> {
  let inner = `<gid>${escapeXml(groupId)}</gid>`;
  if (name) {
    inner += `<name>${escapeXml(name)}</name>`;
  }
  if (description) {
    inner += `<description>${escapeXml(description)}</description>`;
  }
  if (accountId) {
    inner += `<accountID>${escapeXml(accountId)}</accountID>`;
  }
  const body = buildRequest(inner);
  const xml = await caller.doXml('main', 'API_ChangeGroupInfo', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}

/**
 * Get users and managers in a group.
 *
 * @see https://help.quickbase.com/docs/api-getusersingroup
 *
 * @example
 * ```typescript
 * const result = await getUsersInGroup(caller, '2345.skdj', true);
 * console.log(`Group: ${result.name}`);
 * console.log(`Users: ${result.users.length}`);
 * console.log(`Managers: ${result.managers.length}`);
 * ```
 */
export async function getUsersInGroup(
  caller: XmlCaller,
  groupId: string,
  includeManagers?: boolean
): Promise<GetUsersInGroupResult> {
  let inner = `<gid>${escapeXml(groupId)}</gid>`;
  if (includeManagers) {
    inner += '<includeAllMgrs>true</includeAllMgrs>';
  }
  const body = buildRequest(inner);
  const xml = await caller.doXml('main', 'API_GetUsersInGroup', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  // Parse group element
  const groupMatch = xml.match(/<group[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/group>/);
  if (!groupMatch || !groupMatch[1]) {
    throw new Error('Invalid API_GetUsersInGroup response: no group element');
  }

  const groupXml = groupMatch[0];
  const id = groupMatch[1];
  const name = getTagContent(groupXml, 'name');
  const description = getTagContent(groupXml, 'description') || undefined;

  // Parse users
  const userElements = getAllElements(groupXml, 'user');
  const users = userElements.map(parseGroupUser);

  // Parse managers
  const managerElements = getAllElements(groupXml, 'manager');
  const managers = managerElements.map(parseGroupManager);

  // Parse subgroups
  const subgroupElements = getAllElements(groupXml, 'subgroup');
  const subgroups = subgroupElements.map(parseSubgroup);

  return { id, name, description, users, managers, subgroups };
}

/**
 * Add a user to a group.
 *
 * The user can be added as member, manager, or both.
 *
 * @see https://help.quickbase.com/docs/api-addusertogroup
 *
 * @example
 * ```typescript
 * // Add as regular member
 * await addUserToGroup(caller, '1217.dgpt', '112149.bhsv');
 *
 * // Add as manager
 * await addUserToGroup(caller, '1217.dgpt', '112149.bhsv', true);
 * ```
 */
export async function addUserToGroup(
  caller: XmlCaller,
  groupId: string,
  userId: string,
  allowAdminAccess?: boolean
): Promise<void> {
  let inner = `<gid>${escapeXml(groupId)}</gid>`;
  inner += `<uid>${escapeXml(userId)}</uid>`;
  if (allowAdminAccess) {
    inner += '<allowAdminAccess>true</allowAdminAccess>';
  }
  const body = buildRequest(inner);
  const xml = await caller.doXml('main', 'API_AddUserToGroup', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}

/**
 * Remove a user from a group.
 *
 * @see https://help.quickbase.com/docs/api-removeuserfromgroup
 *
 * @example
 * ```typescript
 * await removeUserFromGroup(caller, '1217.dgpt', '112149.bhsv');
 * ```
 */
export async function removeUserFromGroup(
  caller: XmlCaller,
  groupId: string,
  userId: string
): Promise<void> {
  const inner =
    `<gid>${escapeXml(groupId)}</gid>` +
    `<uid>${escapeXml(userId)}</uid>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml('main', 'API_RemoveUserFromGroup', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}

/**
 * Get roles assigned to a group in an app.
 *
 * @see https://help.quickbase.com/docs/api-getgrouprole
 *
 * @example
 * ```typescript
 * const result = await getGroupRole(caller, 'bqxyz123', '1217.dgpt');
 * for (const role of result.roles) {
 *   console.log(`Role ${role.id}: ${role.name}`);
 * }
 * ```
 */
export async function getGroupRole(
  caller: XmlCaller,
  appId: string,
  groupId: string
): Promise<GetGroupRoleResult> {
  const inner = `<gid>${escapeXml(groupId)}</gid>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(appId, 'API_GetGroupRole', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  // Parse roles
  const roleElements = getAllElements(xml, 'role');
  const roles = roleElements.map((roleXml) => ({
    id: parseXmlNumber(getAttribute(roleXml, 'id')),
    name: getTagContent(roleXml, 'name'),
  }));

  return { roles };
}

/**
 * Assign a group to a role in an app.
 *
 * @see https://help.quickbase.com/docs/api-addgrouptorole
 *
 * @example
 * ```typescript
 * await addGroupToRole(caller, 'bqxyz123', '1217.dgpt', 11);
 * ```
 */
export async function addGroupToRole(
  caller: XmlCaller,
  appId: string,
  groupId: string,
  roleId: number
): Promise<void> {
  const inner =
    `<gid>${escapeXml(groupId)}</gid>` +
    `<roleid>${roleId}</roleid>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(appId, 'API_AddGroupToRole', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}

/**
 * Remove a group from a role in an app.
 *
 * @see https://help.quickbase.com/docs/api-removegroupfromrole
 *
 * @param allRoles - If true, remove from all roles (ignores roleId)
 *
 * @example
 * ```typescript
 * // Remove from specific role
 * await removeGroupFromRole(caller, 'bqxyz123', '1217.dgpt', 11);
 *
 * // Remove from all roles
 * await removeGroupFromRole(caller, 'bqxyz123', '1217.dgpt', 0, true);
 * ```
 */
export async function removeGroupFromRole(
  caller: XmlCaller,
  appId: string,
  groupId: string,
  roleId: number,
  allRoles?: boolean
): Promise<void> {
  let inner = `<gid>${escapeXml(groupId)}</gid>`;
  if (allRoles) {
    inner += '<allRoles>true</allRoles>';
  } else {
    inner += `<roleid>${roleId}</roleid>`;
  }
  const body = buildRequest(inner);
  const xml = await caller.doXml(appId, 'API_RemoveGroupFromRole', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}

/**
 * Get groups a user belongs to.
 *
 * If userId is omitted, returns groups for the current user.
 *
 * @see https://help.quickbase.com/docs/api-grantedgroups
 *
 * @example
 * ```typescript
 * const result = await grantedGroups(caller, '112149.bhsv');
 * for (const group of result.groups) {
 *   console.log(`${group.name} (${group.id})`);
 * }
 * ```
 */
export async function grantedGroups(
  caller: XmlCaller,
  userId?: string,
  adminOnly?: boolean
): Promise<GrantedGroupsResult> {
  let inner = '';
  if (userId) {
    inner += `<userid>${escapeXml(userId)}</userid>`;
  }
  if (adminOnly) {
    inner += '<adminOnly>true</adminOnly>';
  }
  const body = buildRequest(inner);
  const xml = await caller.doXml('main', 'API_GrantedGroups', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  // Parse groups
  const groupElements = getAllElements(xml, 'group');
  const groups = groupElements.map((groupXml) => ({
    id: getAttribute(groupXml, 'id'),
    name: getTagContent(groupXml, 'name'),
  }));

  return { groups };
}

/**
 * Get apps a group can access.
 *
 * @see https://help.quickbase.com/docs/api-granteddbsforgroup
 *
 * @example
 * ```typescript
 * const result = await grantedDBsForGroup(caller, '1217.dgpt');
 * for (const db of result.databases) {
 *   console.log(`${db.name} (${db.dbid})`);
 * }
 * ```
 */
export async function grantedDBsForGroup(
  caller: XmlCaller,
  groupId: string
): Promise<GrantedDBsForGroupResult> {
  const inner = `<gid>${escapeXml(groupId)}</gid>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml('main', 'API_GrantedDBsForGroup', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  // Parse databases
  const dbElements = getAllElements(xml, 'dbinfo');
  const databases = dbElements.map((dbXml) => ({
    dbid: getTagContent(dbXml, 'dbid'),
    name: getTagContent(dbXml, 'dbname'),
  }));

  return { databases };
}

/**
 * Add a subgroup to a group.
 *
 * @see https://help.quickbase.com/docs/api-addsubgroup
 *
 * @example
 * ```typescript
 * await addSubgroup(caller, '1217.dgpt', '3450.aefs');
 * ```
 */
export async function addSubgroup(
  caller: XmlCaller,
  groupId: string,
  subgroupId: string
): Promise<void> {
  const inner =
    `<gid>${escapeXml(groupId)}</gid>` +
    `<subgroupid>${escapeXml(subgroupId)}</subgroupid>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml('main', 'API_AddSubgroup', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}

/**
 * Remove a subgroup from a group.
 *
 * @see https://help.quickbase.com/docs/api-removesubgroup
 *
 * @example
 * ```typescript
 * await removeSubgroup(caller, '1217.dgpt', '3450.aefs');
 * ```
 */
export async function removeSubgroup(
  caller: XmlCaller,
  groupId: string,
  subgroupId: string
): Promise<void> {
  const inner =
    `<gid>${escapeXml(groupId)}</gid>` +
    `<subgroupid>${escapeXml(subgroupId)}</subgroupid>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml('main', 'API_RemoveSubgroup', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}
