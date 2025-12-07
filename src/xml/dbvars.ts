/**
 * XML API Application Variables (DBVars)
 *
 * Endpoints for managing application variables.
 *
 * XML-API: Remove this file when QuickBase discontinues the XML API.
 * To find all XML API code, search for: XML-API
 */

import type { XmlCaller } from './types.js';
import { checkError } from './errors.js';
import {
  buildRequest,
  escapeXml,
  parseBaseResponse,
  getTagContent,
} from './request.js';

/**
 * Get an application variable value.
 *
 * DBVars are application-level variables that can be used in formulas
 * and code pages.
 *
 * @see https://help.quickbase.com/docs/api-getdbvar
 *
 * @example
 * ```typescript
 * const value = await getDBVar(caller, 'bqapp123', 'myVariable');
 * console.log(`Variable value: ${value}`);
 * ```
 */
export async function getDBVar(
  caller: XmlCaller,
  appId: string,
  varName: string
): Promise<string> {
  const inner = `<varname>${escapeXml(varName)}</varname>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(appId, 'API_GetDBVar', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  return getTagContent(xml, 'value');
}

/**
 * Set an application variable value.
 *
 * Creates the variable if it doesn't exist, or overwrites if it does.
 * Requires Full Administration rights on the application.
 *
 * @see https://help.quickbase.com/docs/api-setdbvar
 *
 * @example
 * ```typescript
 * await setDBVar(caller, 'bqapp123', 'myVariable', '42');
 * ```
 */
export async function setDBVar(
  caller: XmlCaller,
  appId: string,
  varName: string,
  value: string
): Promise<void> {
  const inner =
    `<varname>${escapeXml(varName)}</varname>` +
    `<value>${escapeXml(value)}</value>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(appId, 'API_SetDBVar', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}
