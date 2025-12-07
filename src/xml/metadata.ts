/**
 * XML API App Metadata
 *
 * Endpoints for getting app metadata and ancestry info.
 *
 * XML-API: Remove this file when QuickBase discontinues the XML API.
 * To find all XML API code, search for: XML-API
 */

import type {
  XmlCaller,
  GetAppDTMInfoResult,
  GetAncestorInfoResult,
} from './types.js';
import { checkError } from './errors.js';
import {
  buildRequest,
  escapeXml,
  parseBaseResponse,
  getTagContent,
  getAllElements,
  getAttribute,
} from './request.js';

/**
 * Get modification timestamps (fast, no auth required for some info).
 *
 * This is a lightweight call to check if data has changed.
 *
 * @see https://help.quickbase.com/docs/api-getappdtminfo
 *
 * @example
 * ```typescript
 * const info = await getAppDTMInfo(caller, 'bqapp123');
 * console.log(`Last modified: ${info.lastModifiedTime}`);
 * ```
 */
export async function getAppDTMInfo(
  caller: XmlCaller,
  appId: string
): Promise<GetAppDTMInfoResult> {
  // GetAppDTMInfo is invoked on db/main with appId in the body
  const inner = `<dbid>${escapeXml(appId)}</dbid>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml('main', 'API_GetAppDTMInfo', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  // Parse tables
  const tableElements = getAllElements(xml, 'table');
  const tables = tableElements.map((tableXml) => ({
    id: getAttribute(tableXml, 'id'),
    lastModifiedTime: getTagContent(tableXml, 'lastModifiedTime') || undefined,
    lastRecModTime: getTagContent(tableXml, 'lastRecModTime') || undefined,
  }));

  return {
    appId: getTagContent(xml, 'app_id') || appId,
    lastModifiedTime: getTagContent(xml, 'lastModifiedTime') || undefined,
    lastRecModTime: getTagContent(xml, 'lastRecModTime') || undefined,
    tables,
  };
}

/**
 * Get app copy/template lineage info.
 *
 * @see https://help.quickbase.com/docs/api-getancestorinfo
 *
 * @example
 * ```typescript
 * const info = await getAncestorInfo(caller, 'bqapp123');
 * if (info.ancestorAppId) {
 *   console.log(`This app was copied from: ${info.ancestorAppId}`);
 * }
 * ```
 */
export async function getAncestorInfo(
  caller: XmlCaller,
  appId: string
): Promise<GetAncestorInfoResult> {
  const body = buildRequest('');
  const xml = await caller.doXml(appId, 'API_GetAncestorInfo', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  return {
    ancestorAppId: getTagContent(xml, 'ancestorappid') || undefined,
    oldestAncestorAppId: getTagContent(xml, 'oldestancestorappid') || undefined,
  };
}

/**
 * Clear ticket cookie (browser-focused).
 *
 * @see https://help.quickbase.com/docs/api-signout
 *
 * @example
 * ```typescript
 * await signOut(caller);
 * ```
 */
export async function signOut(caller: XmlCaller): Promise<void> {
  const body = buildRequest('');
  const xml = await caller.doXml('main', 'API_SignOut', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}
