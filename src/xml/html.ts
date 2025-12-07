/**
 * XML API HTML Generation
 *
 * Endpoints for generating HTML forms and tables.
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
} from './request.js';

/**
 * Generate HTML form for adding a record.
 *
 * @see https://help.quickbase.com/docs/api-genaddrecordform
 *
 * @example
 * ```typescript
 * const html = await genAddRecordForm(caller, 'bqtable123');
 * // Use the HTML form in your UI
 * ```
 */
export async function genAddRecordForm(
  caller: XmlCaller,
  tableId: string,
  fields?: Array<{ id: number; value: string }>
): Promise<string> {
  let inner = '';
  if (fields) {
    for (const field of fields) {
      inner += `<field fid="${field.id}">${escapeXml(field.value)}</field>`;
    }
  }

  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_GenAddRecordForm', body);

  // Check for errors - the response may or may not be XML
  if (xml.includes('<errcode>') && !xml.includes('<errcode>0</errcode>')) {
    const base = parseBaseResponse(xml);
    checkError(base);
  }

  return xml;
}

/**
 * Generate HTML/JS/CSV table of query results.
 *
 * @see https://help.quickbase.com/docs/api-genresultstable
 *
 * @example
 * ```typescript
 * const html = await genResultsTable(caller, 'bqtable123', {
 *   query: "{'7'.CT.'test'}",
 *   clist: [6, 7, 8],
 * });
 * ```
 */
export async function genResultsTable(
  caller: XmlCaller,
  tableId: string,
  options?: {
    query?: string;
    clist?: number[];
    slist?: number[];
    options?: string;
    format?: 'structured' | 'csv';
  }
): Promise<string> {
  let inner = '';

  if (options?.query) {
    inner += `<query>${escapeXml(options.query)}</query>`;
  }
  if (options?.clist && options.clist.length > 0) {
    inner += `<clist>${options.clist.join('.')}</clist>`;
  }
  if (options?.slist && options.slist.length > 0) {
    inner += `<slist>${options.slist.join('.')}</slist>`;
  }
  if (options?.options) {
    inner += `<options>${escapeXml(options.options)}</options>`;
  }
  if (options?.format) {
    inner += `<fmt>${options.format}</fmt>`;
  }

  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_GenResultsTable', body);

  // Check for errors
  if (xml.includes('<errcode>') && !xml.includes('<errcode>0</errcode>')) {
    const base = parseBaseResponse(xml);
    checkError(base);
  }

  return xml;
}

/**
 * Get a record rendered as HTML.
 *
 * @see https://help.quickbase.com/docs/api-getrecordashtml
 *
 * @example
 * ```typescript
 * const html = await getRecordAsHTML(caller, 'bqtable123', { rid: 42 });
 * ```
 */
export async function getRecordAsHTML(
  caller: XmlCaller,
  tableId: string,
  options: {
    rid?: number;
    key?: string;
    jht?: boolean;
    dfid?: number;
  }
): Promise<string> {
  let inner = '';

  if (options.rid !== undefined) {
    inner += `<rid>${options.rid}</rid>`;
  }
  if (options.key) {
    inner += `<key>${escapeXml(options.key)}</key>`;
  }
  if (options.jht) {
    inner += '<jht>1</jht>';
  }
  if (options.dfid !== undefined) {
    inner += `<dfid>${options.dfid}</dfid>`;
  }

  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_GetRecordAsHTML', body);

  // Check for errors
  if (xml.includes('<errcode>') && !xml.includes('<errcode>0</errcode>')) {
    const base = parseBaseResponse(xml);
    checkError(base);
  }

  return xml;
}
