/**
 * XML API Record Information
 *
 * Endpoints for querying and managing record information.
 *
 * XML-API: Remove this file when QuickBase discontinues the XML API.
 * To find all XML API code, search for: XML-API
 */

import type {
  XmlCaller,
  RecordField,
  DoQueryCountResult,
  GetRecordInfoResult,
  ImportFromCSVResult,
  CopyMasterDetailResult,
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
  xmlElementCDATA,
} from './request.js';

/**
 * Parse a field element from GetRecordInfo response
 */
function parseRecordField(fieldXml: string): RecordField {
  const field: RecordField = {
    id: parseXmlNumber(getTagContent(fieldXml, 'fid')),
    name: getTagContent(fieldXml, 'name'),
    type: getTagContent(fieldXml, 'type'),
    value: getTagContent(fieldXml, 'value'),
  };

  const printable = getTagContent(fieldXml, 'printable');
  if (printable) field.printable = printable;

  return field;
}

/**
 * Get count of matching records without fetching data.
 *
 * @see https://help.quickbase.com/docs/api-doquerycount
 *
 * @example
 * ```typescript
 * const result = await doQueryCount(caller, 'bqtable123', "{'7'.XCT.'blue car'}");
 * console.log(`Found ${result.numMatches} matching records`);
 * ```
 */
export async function doQueryCount(
  caller: XmlCaller,
  tableId: string,
  query?: string
): Promise<DoQueryCountResult> {
  let inner = '';
  if (query) {
    inner = `<query>${escapeXml(query)}</query>`;
  }

  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_DoQueryCount', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  return {
    numMatches: parseXmlNumber(getTagContent(xml, 'numMatches')),
  };
}

/**
 * Get a record with field metadata.
 *
 * Returns all fields for the specified record, including field names and types.
 *
 * @see https://help.quickbase.com/docs/api-getrecordinfo
 *
 * @example
 * ```typescript
 * const result = await getRecordInfo(caller, 'bqtable123', 42);
 * console.log(`Record ${result.recordId} has ${result.numFields} fields`);
 * for (const field of result.fields) {
 *   console.log(`  ${field.name}: ${field.value}`);
 * }
 * ```
 */
export async function getRecordInfo(
  caller: XmlCaller,
  tableId: string,
  recordId: number
): Promise<GetRecordInfoResult> {
  const inner = `<rid>${recordId}</rid>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_GetRecordInfo', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  const fieldElements = getAllElements(xml, 'field');
  const fields = fieldElements.map(parseRecordField);

  return {
    recordId: parseXmlNumber(getTagContent(xml, 'rid')),
    numFields: parseXmlNumber(getTagContent(xml, 'num_fields')),
    updateId: getTagContent(xml, 'update_id') || undefined,
    fields,
  };
}

/**
 * Get a record by key field value.
 *
 * @see https://help.quickbase.com/docs/api-getrecordinfo
 *
 * @example
 * ```typescript
 * const result = await getRecordInfoByKey(caller, 'bqtable123', 'ABC-123');
 * ```
 */
export async function getRecordInfoByKey(
  caller: XmlCaller,
  tableId: string,
  keyValue: string
): Promise<GetRecordInfoResult> {
  const inner = `<key>${escapeXml(keyValue)}</key>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_GetRecordInfo', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  const fieldElements = getAllElements(xml, 'field');
  const fields = fieldElements.map(parseRecordField);

  return {
    recordId: parseXmlNumber(getTagContent(xml, 'rid')),
    numFields: parseXmlNumber(getTagContent(xml, 'num_fields')),
    updateId: getTagContent(xml, 'update_id') || undefined,
    fields,
  };
}

/**
 * Bulk import/update records from CSV data.
 *
 * You can add and update records in the same call.
 * Leave Record ID empty to add new records.
 *
 * @see https://help.quickbase.com/docs/api-importfromcsv
 *
 * @example
 * ```typescript
 * const result = await importFromCSV(caller, 'bqtable123', {
 *   recordsCsv: 'Name,Email\nJohn,john@example.com\nJane,jane@example.com',
 *   clist: [7, 8],
 *   skipFirst: true,
 * });
 * console.log(`Added ${result.numRecsAdded}, updated ${result.numRecsUpdated}`);
 * ```
 */
export async function importFromCSV(
  caller: XmlCaller,
  tableId: string,
  options: {
    recordsCsv: string;
    clist?: number[];
    skipFirst?: boolean;
    mergeFieldId?: number;
    decimalPercent?: boolean;
  }
): Promise<ImportFromCSVResult> {
  let inner = xmlElementCDATA('records_csv', options.recordsCsv);

  if (options.clist && options.clist.length > 0) {
    inner += `<clist>${options.clist.join('.')}</clist>`;
  }
  if (options.skipFirst) {
    inner += '<skipfirst>1</skipfirst>';
  }
  if (options.mergeFieldId !== undefined) {
    inner += `<mergeFieldId>${options.mergeFieldId}</mergeFieldId>`;
  }
  if (options.decimalPercent) {
    inner += '<decimalPercent>1</decimalPercent>';
  }

  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_ImportFromCSV', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  // Parse record IDs
  const ridElements = getAllElements(xml, 'rid');
  const recordIds = ridElements.map((ridXml) => {
    const rid = parseXmlNumber(ridXml.replace(/<rid[^>]*>/, '').replace(/<\/rid>/, ''));
    const updateId = getAttribute(ridXml, 'update_id') || undefined;
    return { recordId: rid, updateId };
  });

  return {
    numRecsInput: parseXmlNumber(getTagContent(xml, 'num_recs_input')),
    numRecsAdded: parseXmlNumber(getTagContent(xml, 'num_recs_added')),
    numRecsUpdated: parseXmlNumber(getTagContent(xml, 'num_recs_updated')),
    recordIds,
  };
}

/**
 * Execute a saved import definition.
 *
 * @see https://help.quickbase.com/docs/api-runimport
 *
 * @example
 * ```typescript
 * const result = await runImport(caller, 'bqtable123', 5);
 * ```
 */
export async function runImport(
  caller: XmlCaller,
  tableId: string,
  importId: number
): Promise<ImportFromCSVResult> {
  const inner = `<id>${importId}</id>`;
  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_RunImport', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  // Parse record IDs
  const ridElements = getAllElements(xml, 'rid');
  const recordIds = ridElements.map((ridXml) => {
    const rid = parseXmlNumber(ridXml.replace(/<rid[^>]*>/, '').replace(/<\/rid>/, ''));
    const updateId = getAttribute(ridXml, 'update_id') || undefined;
    return { recordId: rid, updateId };
  });

  return {
    numRecsInput: parseXmlNumber(getTagContent(xml, 'num_recs_input')),
    numRecsAdded: parseXmlNumber(getTagContent(xml, 'num_recs_added')),
    numRecsUpdated: parseXmlNumber(getTagContent(xml, 'num_recs_updated')),
    recordIds,
  };
}

/**
 * Copy a master record with its detail records.
 *
 * @see https://help.quickbase.com/docs/api-copymasterdetail
 *
 * @example
 * ```typescript
 * const result = await copyMasterDetail(caller, 'bqtable123', {
 *   rid: 42,
 *   recurse: true,
 * });
 * console.log(`Copied to record ${result.newRid}`);
 * ```
 */
export async function copyMasterDetail(
  caller: XmlCaller,
  tableId: string,
  options: {
    rid: number;
    copyfid?: number;
    recurse?: boolean;
    relfids?: number[];
  }
): Promise<CopyMasterDetailResult> {
  let inner = `<rid>${options.rid}</rid>`;

  if (options.copyfid !== undefined) {
    inner += `<copyfid>${options.copyfid}</copyfid>`;
  }
  if (options.recurse) {
    inner += '<recurse>1</recurse>';
  }
  if (options.relfids && options.relfids.length > 0) {
    inner += `<relfids>${options.relfids.join('.')}</relfids>`;
  }

  const body = buildRequest(inner);
  const xml = await caller.doXml(tableId, 'API_CopyMasterDetail', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  return {
    newRid: parseXmlNumber(getTagContent(xml, 'newrid')),
    numCreated: parseXmlNumber(getTagContent(xml, 'num_created')),
  };
}
