/**
 * XML API Role Management
 *
 * Endpoints for managing roles and user role assignments.
 *
 * XML-API: Remove this file when QuickBase discontinues the XML API.
 * To find all XML API code, search for: XML-API
 */

import type {
  XmlCaller,
  Role,
  RoleAccess,
  UserRole,
  RoleMember,
  UserWithRoles,
  GetRoleInfoResult,
  UserRolesResult,
  GetUserRoleResult,
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
} from './request.js';

/**
 * Parse a single role element from XML
 */
function parseRole(roleXml: string): Role {
  const id = parseXmlNumber(getAttribute(roleXml, 'id'));
  const name = getTagContent(roleXml, 'name');

  // Parse access element
  const accessMatch = roleXml.match(/<access[^>]*id="(\d+)"[^>]*>([^<]*)<\/access>/);
  const access: RoleAccess = {
    id: accessMatch ? parseXmlNumber(accessMatch[1] ?? '0') : 0,
    description: accessMatch?.[2] ?? '',
  };

  return { id, name, access };
}

/**
 * Parse a role with member info (from GetUserRole with inclgrps)
 */
function parseUserRole(roleXml: string): UserRole {
  const role = parseRole(roleXml);

  // Parse member element if present
  const memberMatch = roleXml.match(/<member[^>]*type="([^"]*)"[^>]*>([^<]*)<\/member>/);
  const member: RoleMember | undefined = memberMatch && memberMatch[1] && memberMatch[2]
    ? { type: memberMatch[1], name: memberMatch[2] }
    : undefined;

  return { ...role, member };
}

/**
 * Parse a user with roles from UserRoles response
 */
function parseUserWithRoles(userXml: string): UserWithRoles {
  const id = getAttribute(userXml, 'id');
  const type = getAttribute(userXml, 'type') || 'user';
  const name = getTagContent(userXml, 'name');
  const firstName = getTagContent(userXml, 'firstName') || undefined;
  const lastName = getTagContent(userXml, 'lastName') || undefined;
  const lastAccess = getTagContent(userXml, 'lastAccess') || undefined;
  const lastAccessAppLocal = getTagContent(userXml, 'lastAccessAppLocal') || undefined;

  // Parse roles
  const roleElements = getAllElements(userXml, 'role');
  const roles = roleElements.map(parseRole);

  return {
    id,
    type,
    name,
    firstName,
    lastName,
    lastAccess,
    lastAccessAppLocal,
    roles,
  };
}

/**
 * Get all roles defined in an application.
 *
 * @see https://help.quickbase.com/docs/api-getroleinfo
 *
 * @example
 * ```typescript
 * const result = await getRoleInfo(caller, 'bqxyz123');
 * for (const role of result.roles) {
 *   console.log(`Role ${role.id}: ${role.name} (${role.access.description})`);
 * }
 * ```
 */
export async function getRoleInfo(
  caller: XmlCaller,
  appId: string
): Promise<GetRoleInfoResult> {
  const body = buildRequest('');
  const xml = await caller.doXml(appId, 'API_GetRoleInfo', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  // Parse roles
  const roleElements = getAllElements(xml, 'role');
  const roles = roleElements.map(parseRole);

  return { roles };
}

/**
 * Get all users in an application and their role assignments.
 *
 * Requires Basic Access with Sharing or Full Administration access.
 *
 * @see https://help.quickbase.com/docs/api-userroles
 *
 * @example
 * ```typescript
 * const result = await userRoles(caller, 'bqxyz123');
 * for (const user of result.users) {
 *   console.log(`${user.name}: ${user.roles.map(r => r.name).join(', ')}`);
 * }
 * ```
 */
export async function userRoles(
  caller: XmlCaller,
  appId: string
): Promise<UserRolesResult> {
  const body = buildRequest('');
  const xml = await caller.doXml(appId, 'API_UserRoles', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  // Parse users
  const userElements = getAllElements(xml, 'user');
  const users = userElements.map(parseUserWithRoles);

  return { users };
}

/**
 * Get roles for a specific user.
 *
 * If userId is omitted, returns your own roles.
 * Set includeGroups to true to include roles assigned via groups.
 *
 * @see https://help.quickbase.com/docs/api-getuserrole
 *
 * @example
 * ```typescript
 * const result = await getUserRole(caller, 'bqxyz123', '112149.bhsv', true);
 * console.log(`User: ${result.userName}`);
 * for (const role of result.roles) {
 *   if (role.member) {
 *     console.log(`  ${role.name} (via ${role.member.type}: ${role.member.name})`);
 *   } else {
 *     console.log(`  ${role.name}`);
 *   }
 * }
 * ```
 */
export async function getUserRole(
  caller: XmlCaller,
  appId: string,
  userId?: string,
  includeGroups?: boolean
): Promise<GetUserRoleResult> {
  let inner = '';
  if (userId) {
    inner += `<userid>${escapeXml(userId)}</userid>`;
  }
  if (includeGroups) {
    inner += '<inclgrps>1</inclgrps>';
  }
  const body = buildRequest(inner);
  const xml = await caller.doXml(appId, 'API_GetUserRole', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  // Parse user element
  const userMatch = xml.match(/<user[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/user>/);
  if (!userMatch || !userMatch[1]) {
    throw new Error('Invalid API_GetUserRole response: no user element');
  }

  const userIdResult = userMatch[1];
  const userXml = userMatch[0];
  const userName = getTagContent(userXml, 'name');

  // Parse roles (with member info if inclgrps was used)
  const roleElements = getAllElements(userXml, 'role');
  const roles = roleElements.map(parseUserRole);

  return {
    userId: userIdResult,
    userName,
    roles,
  };
}

/**
 * Assign a user to a role.
 *
 * You can call this multiple times to give a user multiple roles.
 * After assigning, use sendInvitation to invite the user.
 *
 * Requires Basic Access with Sharing or Full Administration access.
 * Users with Basic Access cannot add users to admin roles.
 *
 * @see https://help.quickbase.com/docs/api-addusertorole
 *
 * @example
 * ```typescript
 * await addUserToRole(caller, 'bqxyz123', '112149.bhsv', 10);
 * ```
 */
export async function addUserToRole(
  caller: XmlCaller,
  appId: string,
  userId: string,
  roleId: number
): Promise<void> {
  const inner =
    `<userid>${escapeXml(userId)}</userid>` +
    `<roleid>${roleId}</roleid>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(appId, 'API_AddUserToRole', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}

/**
 * Remove a user from a specific role.
 *
 * If this is the user's only role, they lose all access to the app
 * and are removed from the app's user list.
 *
 * To temporarily disable access while keeping the user in the app,
 * use changeUserRole with newRoleId=0 instead.
 *
 * @see https://help.quickbase.com/docs/api-removeuserfromrole
 *
 * @example
 * ```typescript
 * await removeUserFromRole(caller, 'bqxyz123', '112149.bhsv', 10);
 * ```
 */
export async function removeUserFromRole(
  caller: XmlCaller,
  appId: string,
  userId: string,
  roleId: number
): Promise<void> {
  const inner =
    `<userid>${escapeXml(userId)}</userid>` +
    `<roleid>${roleId}</roleid>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(appId, 'API_RemoveUserFromRole', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}

/**
 * Change a user's role or disable their access.
 *
 * This is preferred over removeUserFromRole when you want to keep the
 * user in the app's user list but change/disable their access.
 *
 * Pass newRoleId=0 (or omit it) to set the role to "None" (role ID 9),
 * which disables access while keeping the user on the app's user list.
 *
 * @see https://help.quickbase.com/docs/api-changeuserrole
 *
 * @example
 * ```typescript
 * // Change from role 10 to role 11
 * await changeUserRole(caller, 'bqxyz123', '112149.bhsv', 10, 11);
 *
 * // Disable access (set to None role)
 * await changeUserRole(caller, 'bqxyz123', '112149.bhsv', 10, 0);
 * ```
 */
export async function changeUserRole(
  caller: XmlCaller,
  appId: string,
  userId: string,
  currentRoleId: number,
  newRoleId?: number
): Promise<void> {
  let inner =
    `<userid>${escapeXml(userId)}</userid>` +
    `<roleid>${currentRoleId}</roleid>`;

  // If newRoleId is provided and > 0, include it
  // If omitted or 0, QuickBase sets role to None (9)
  if (newRoleId !== undefined && newRoleId > 0) {
    inner += `<newRoleid>${newRoleId}</newRoleid>`;
  }

  const body = buildRequest(inner);
  const xml = await caller.doXml(appId, 'API_ChangeUserRole', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}
