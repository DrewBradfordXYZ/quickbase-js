/**
 * XML API User Management
 *
 * Endpoints for managing users and user-related operations.
 *
 * XML-API: Remove this file when QuickBase discontinues the XML API.
 * To find all XML API code, search for: XML-API
 */

import type {
  XmlCaller,
  UserInfo,
  ProvisionUserResult,
} from './types.js';
import { checkError } from './errors.js';
import {
  buildRequest,
  escapeXml,
  parseBaseResponse,
  getTagContent,
  parseXmlBool,
} from './request.js';

/**
 * Get user information by email.
 *
 * Returns user ID, name, and other details for a registered QuickBase user.
 * If no email is provided, returns info for the current user.
 *
 * @see https://help.quickbase.com/docs/api-getuserinfo
 *
 * @example
 * ```typescript
 * // Get info for specific user
 * const user = await getUserInfo(caller, 'user@example.com');
 * console.log(`User ID: ${user.id}, Name: ${user.firstName} ${user.lastName}`);
 *
 * // Get info for current user
 * const me = await getUserInfo(caller);
 * ```
 */
export async function getUserInfo(
  caller: XmlCaller,
  email?: string
): Promise<UserInfo> {
  let inner = '';
  if (email) {
    inner = `<email>${escapeXml(email)}</email>`;
  }
  const body = buildRequest(inner);
  const xml = await caller.doXml('main', 'API_GetUserInfo', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  // Parse user element
  const userMatch = xml.match(/<user[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/user>/);
  if (!userMatch || !userMatch[1]) {
    throw new Error('Invalid API_GetUserInfo response: no user element');
  }

  const userXml = userMatch[0];
  const id = userMatch[1];
  const firstName = getTagContent(userXml, 'firstName');
  const lastName = getTagContent(userXml, 'lastName');
  const login = getTagContent(userXml, 'login') || undefined;
  const userEmail = getTagContent(userXml, 'email') || undefined;
  const screenName = getTagContent(userXml, 'screenName') || undefined;
  const isVerifiedStr = getTagContent(userXml, 'isVerified');
  const isVerified = isVerifiedStr ? parseXmlBool(isVerifiedStr) : undefined;
  const externalAuthStr = getTagContent(userXml, 'externalAuth');
  const externalAuth = externalAuthStr ? parseXmlBool(externalAuthStr) : undefined;

  return {
    id,
    firstName,
    lastName,
    login,
    email: userEmail,
    screenName,
    isVerified,
    externalAuth,
  };
}

/**
 * Create a new unregistered user and add them to an application.
 *
 * This is for users who are NOT yet registered with QuickBase.
 * For existing users, use getUserInfo + addUserToRole + sendInvitation.
 *
 * After provisioning, call sendInvitation to email the user.
 *
 * @see https://help.quickbase.com/docs/api-provisionuser
 *
 * @example
 * ```typescript
 * const result = await provisionUser(caller, 'bqxyz123', 'new@example.com', 'John', 'Doe', 11);
 * console.log(`Created user: ${result.userId}`);
 *
 * // Now send invitation
 * await sendInvitation(caller, 'bqxyz123', result.userId, 'Welcome to our app!');
 * ```
 */
export async function provisionUser(
  caller: XmlCaller,
  appId: string,
  email: string,
  firstName: string,
  lastName: string,
  roleId?: number
): Promise<ProvisionUserResult> {
  let inner =
    `<email>${escapeXml(email)}</email>` +
    `<fname>${escapeXml(firstName)}</fname>` +
    `<lname>${escapeXml(lastName)}</lname>`;

  if (roleId !== undefined) {
    inner += `<roleid>${roleId}</roleid>`;
  }

  const body = buildRequest(inner);
  const xml = await caller.doXml(appId, 'API_ProvisionUser', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  const userId = getTagContent(xml, 'userid');
  if (!userId) {
    throw new Error('Invalid API_ProvisionUser response: no userid element');
  }

  return { userId };
}

/**
 * Send an invitation email to a user.
 *
 * Use after adding a user to a role (via addUserToRole or provisionUser).
 *
 * @see https://help.quickbase.com/docs/api-sendinvitation
 *
 * @example
 * ```typescript
 * await sendInvitation(caller, 'bqxyz123', '112149.bhsv', 'Welcome to our team app!');
 * ```
 */
export async function sendInvitation(
  caller: XmlCaller,
  appId: string,
  userId: string,
  userText?: string
): Promise<void> {
  let inner = `<userid>${escapeXml(userId)}</userid>`;
  if (userText) {
    inner += `<usertext>${escapeXml(userText)}</usertext>`;
  }

  const body = buildRequest(inner);
  const xml = await caller.doXml(appId, 'API_SendInvitation', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}

/**
 * Change the application manager.
 *
 * Requires account admin or realm admin permissions.
 *
 * @see https://help.quickbase.com/docs/api-changemanager
 *
 * @example
 * ```typescript
 * await changeManager(caller, 'bqxyz123', 'newmanager@example.com');
 * ```
 */
export async function changeManager(
  caller: XmlCaller,
  appId: string,
  newManagerEmail: string
): Promise<void> {
  const inner = `<newmgr>${escapeXml(newManagerEmail)}</newmgr>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(appId, 'API_ChangeManager', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}

/**
 * Change the owner of a record.
 *
 * Transfers ownership from the current record owner to another user.
 * Requires Full Administration rights on the application.
 *
 * @see https://help.quickbase.com/docs/api-changerecordowner
 *
 * @param newOwner - The new owner's QuickBase username or email address
 *
 * @example
 * ```typescript
 * // By record ID
 * await changeRecordOwner(caller, 'bqtable123', 42, 'newowner@example.com');
 * ```
 */
export async function changeRecordOwner(
  caller: XmlCaller,
  tableId: string,
  recordId: number,
  newOwner: string
): Promise<void> {
  const inner =
    `<rid>${recordId}</rid>` +
    `<newowner>${escapeXml(newOwner)}</newowner>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_ChangeRecordOwner', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}
