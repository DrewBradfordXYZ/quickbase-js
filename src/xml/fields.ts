/**
 * XML API Field Management
 *
 * Endpoints for managing field properties.
 *
 * XML-API: Remove this file when QuickBase discontinues the XML API.
 * To find all XML API code, search for: XML-API
 */

import type {
  XmlCaller,
  FieldAddChoicesResult,
  FieldRemoveChoicesResult,
} from './types.js';
import { checkError } from './errors.js';
import {
  buildRequest,
  escapeXml,
  parseBaseResponse,
  getTagContent,
  parseXmlNumber,
} from './request.js';

/**
 * Add choices to a multiple-choice field.
 *
 * @see https://help.quickbase.com/docs/api-fieldaddchoices
 *
 * @example
 * ```typescript
 * const result = await fieldAddChoices(caller, 'bqtable123', 6, ['Option A', 'Option B']);
 * console.log(`Added ${result.numAdded} choices`);
 * ```
 */
export async function fieldAddChoices(
  caller: XmlCaller,
  tableId: string,
  fieldId: number,
  choices: string[]
): Promise<FieldAddChoicesResult> {
  let inner = `<fid>${fieldId}</fid>`;
  for (const choice of choices) {
    inner += `<choice>${escapeXml(choice)}</choice>`;
  }

  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_FieldAddChoices', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  return {
    fieldId,
    fieldName: getTagContent(xml, 'fname') || '',
    numAdded: parseXmlNumber(getTagContent(xml, 'numadded')),
  };
}

/**
 * Remove choices from a multiple-choice field.
 *
 * @see https://help.quickbase.com/docs/api-fieldremovechoices
 *
 * @example
 * ```typescript
 * const result = await fieldRemoveChoices(caller, 'bqtable123', 6, ['Option A']);
 * console.log(`Removed ${result.numRemoved} choices`);
 * ```
 */
export async function fieldRemoveChoices(
  caller: XmlCaller,
  tableId: string,
  fieldId: number,
  choices: string[]
): Promise<FieldRemoveChoicesResult> {
  let inner = `<fid>${fieldId}</fid>`;
  for (const choice of choices) {
    inner += `<choice>${escapeXml(choice)}</choice>`;
  }

  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_FieldRemoveChoices', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  return {
    fieldId,
    fieldName: getTagContent(xml, 'fname') || '',
    numRemoved: parseXmlNumber(getTagContent(xml, 'numremoved')),
  };
}

/**
 * Set the key field for a table.
 *
 * @see https://help.quickbase.com/docs/api-setkeyfield
 *
 * @example
 * ```typescript
 * await setKeyField(caller, 'bqtable123', 6);
 * ```
 */
export async function setKeyField(
  caller: XmlCaller,
  tableId: string,
  fieldId: number
): Promise<void> {
  const inner = `<fid>${fieldId}</fid>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_SetKeyField', body);

  const base = parseBaseResponse(xml);
  checkError(base);
}
