/**
 * XML API Schema and App Discovery
 *
 * Endpoints for discovering apps/tables and getting schema information.
 *
 * XML-API: Remove this file when QuickBase discontinues the XML API.
 * To find all XML API code, search for: XML-API
 */

import type {
  XmlCaller,
  DatabaseInfo,
  DBInfo,
  GetSchemaResult,
  GrantedDBsResult,
  FindDBByNameResult,
  SchemaTable,
  SchemaOriginal,
  SchemaField,
  SchemaQuery,
  SchemaVariable,
  SchemaChildTable,
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
 * List all apps/tables the user can access.
 *
 * Returns apps across all domains by default. Use realmAppsOnly to limit
 * to the current realm.
 *
 * @see https://help.quickbase.com/docs/api-granteddbs
 *
 * @example
 * ```typescript
 * const result = await grantedDBs(caller, { parentsOnly: true });
 * for (const db of result.databases) {
 *   console.log(`${db.name} (${db.dbid})`);
 * }
 * ```
 */
export async function grantedDBs(
  caller: XmlCaller,
  options?: {
    parentsOnly?: boolean;
    excludeParents?: boolean;
    adminOnly?: boolean;
    includeAncestors?: boolean;
    withEmbeddedTables?: boolean;
    realmAppsOnly?: boolean;
  }
): Promise<GrantedDBsResult> {
  let inner = '';
  if (options?.excludeParents) {
    inner += '<excludeparents>1</excludeparents>';
  }
  if (options?.parentsOnly) {
    inner += '<Withembeddedtables>0</Withembeddedtables>';
  }
  if (options?.adminOnly) {
    inner += '<adminOnly>true</adminOnly>';
  }
  if (options?.includeAncestors) {
    inner += '<includeancestors>1</includeancestors>';
  }
  if (options?.withEmbeddedTables !== undefined) {
    inner += `<withembeddedtables>${options.withEmbeddedTables ? '1' : '0'}</withembeddedtables>`;
  }
  if (options?.realmAppsOnly) {
    inner += '<realmAppsOnly>true</realmAppsOnly>';
  }

  const body = buildRequest(inner);
  const xml = await caller.doXml('main', 'API_GrantedDBs', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  // Parse databases
  const dbElements = getAllElements(xml, 'dbinfo');
  const databases: DatabaseInfo[] = dbElements.map((dbXml) => {
    const info: DatabaseInfo = {
      dbid: getTagContent(dbXml, 'dbid'),
      name: getTagContent(dbXml, 'dbname'),
    };

    const ancestorAppId = getTagContent(dbXml, 'ancestorappid');
    if (ancestorAppId) {
      info.ancestorAppId = ancestorAppId;
    }

    const oldestAncestorAppId = getTagContent(dbXml, 'oldestancestorappid');
    if (oldestAncestorAppId) {
      info.oldestAncestorAppId = oldestAncestorAppId;
    }

    return info;
  });

  return { databases };
}

/**
 * Find an app by name.
 *
 * Searches only apps you have access to. May return multiple results
 * if multiple apps share the same name.
 *
 * @see https://help.quickbase.com/docs/api-finddbbyname
 *
 * @example
 * ```typescript
 * const result = await findDBByName(caller, 'My App', true);
 * console.log(`Found app: ${result.dbid}`);
 * ```
 */
export async function findDBByName(
  caller: XmlCaller,
  name: string,
  parentsOnly?: boolean
): Promise<FindDBByNameResult> {
  let inner = `<dbname>${escapeXml(name)}</dbname>`;
  if (parentsOnly) {
    inner += '<ParentsOnly>1</ParentsOnly>';
  }

  const body = buildRequest(inner);
  const xml = await caller.doXml('main', 'API_FindDBByName', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  const dbid = getTagContent(xml, 'dbid');
  if (!dbid) {
    throw new Error('Invalid API_FindDBByName response: no dbid element');
  }

  return { dbid };
}

/**
 * Get app/table metadata.
 *
 * Returns information like last modified time, record count, manager info.
 *
 * @see https://help.quickbase.com/docs/api-getdbinfo
 *
 * @example
 * ```typescript
 * const info = await getDBInfo(caller, 'bqxyz123');
 * console.log(`${info.name}: ${info.numRecords} records`);
 * console.log(`Manager: ${info.managerName}`);
 * ```
 */
export async function getDBInfo(
  caller: XmlCaller,
  dbid: string
): Promise<DBInfo> {
  const body = buildRequest('');
  const xml = await caller.doXml(dbid, 'API_GetDBInfo', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  return {
    name: getTagContent(xml, 'dbname'),
    lastRecModTime: getTagContent(xml, 'lastRecModTime') || undefined,
    lastModifiedTime: getTagContent(xml, 'lastModifiedTime') || undefined,
    createdTime: getTagContent(xml, 'createdTime') || undefined,
    numRecords: parseXmlNumber(getTagContent(xml, 'numRecords')),
    managerId: getTagContent(xml, 'mgrID') || undefined,
    managerName: getTagContent(xml, 'mgrName') || undefined,
    version: getTagContent(xml, 'version') || undefined,
    timeZone: getTagContent(xml, 'time_zone') || undefined,
  };
}

/**
 * Get total record count for a table.
 *
 * @see https://help.quickbase.com/docs/api-getnumrecords
 *
 * @example
 * ```typescript
 * const count = await getNumRecords(caller, 'bqtable123');
 * console.log(`Table has ${count} records`);
 * ```
 */
export async function getNumRecords(
  caller: XmlCaller,
  tableId: string
): Promise<number> {
  const body = buildRequest('');
  const xml = await caller.doXml(tableId, 'API_GetNumRecords', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  return parseXmlNumber(getTagContent(xml, 'num_records'));
}

/**
 * Parse a field element from GetSchema response
 */
function parseSchemaField(fieldXml: string): SchemaField {
  const field: SchemaField = {
    id: parseXmlNumber(getAttribute(fieldXml, 'id')),
    fieldType: getAttribute(fieldXml, 'field_type'),
    baseType: getAttribute(fieldXml, 'base_type'),
    label: getTagContent(fieldXml, 'label'),
  };

  const mode = getAttribute(fieldXml, 'mode');
  if (mode) field.mode = mode;

  const nowrap = getTagContent(fieldXml, 'nowrap');
  if (nowrap) field.nowrap = parseXmlBool(nowrap);

  const bold = getTagContent(fieldXml, 'bold');
  if (bold) field.bold = parseXmlBool(bold);

  const required = getTagContent(fieldXml, 'required');
  if (required) field.required = parseXmlBool(required);

  const unique = getTagContent(fieldXml, 'unique');
  if (unique) field.unique = parseXmlBool(unique);

  const fieldHelp = getTagContent(fieldXml, 'fieldhelp');
  if (fieldHelp) field.fieldHelp = fieldHelp;

  const appearsByDefault = getTagContent(fieldXml, 'appears_by_default');
  if (appearsByDefault) field.appearsByDefault = parseXmlBool(appearsByDefault);

  const findEnabled = getTagContent(fieldXml, 'find_enabled');
  if (findEnabled) field.findEnabled = parseXmlBool(findEnabled);

  const allowNewChoices = getTagContent(fieldXml, 'allow_new_choices');
  if (allowNewChoices) field.allowNewChoices = parseXmlBool(allowNewChoices);

  const sortAsGiven = getTagContent(fieldXml, 'sort_as_given');
  if (sortAsGiven) field.sortAsGiven = parseXmlBool(sortAsGiven);

  const carryChoices = getTagContent(fieldXml, 'carrychoices');
  if (carryChoices) field.carryChoices = parseXmlBool(carryChoices);

  const foreignKey = getTagContent(fieldXml, 'foreignkey');
  if (foreignKey) field.foreignKey = parseXmlBool(foreignKey);

  const doesTotal = getTagContent(fieldXml, 'does_total');
  if (doesTotal) field.doesTotal = parseXmlBool(doesTotal);

  const doesAverage = getTagContent(fieldXml, 'does_average');
  if (doesAverage) field.doesAverage = parseXmlBool(doesAverage);

  const defaultKind = getTagContent(fieldXml, 'default_kind');
  if (defaultKind) field.defaultKind = defaultKind;

  const defaultValue = getTagContent(fieldXml, 'default_value');
  if (defaultValue) field.defaultValue = defaultValue;

  // Parse choices if present
  const choicesMatch = fieldXml.match(/<choices>([\s\S]*?)<\/choices>/);
  if (choicesMatch && choicesMatch[1]) {
    const choiceElements = getAllElements(choicesMatch[1], 'choice');
    field.choices = choiceElements.map((c) => getTagContent(c, 'choice') || c.replace(/<\/?choice>/g, ''));
  }

  // Parse summary fields
  const summaryReferenceFid = getTagContent(fieldXml, 'summaryReferenceFid');
  if (summaryReferenceFid) field.summaryReferenceFid = parseXmlNumber(summaryReferenceFid);

  const summaryTargetFid = getTagContent(fieldXml, 'summaryTargetFid');
  if (summaryTargetFid) field.summaryTargetFid = parseXmlNumber(summaryTargetFid);

  const summaryFunction = getTagContent(fieldXml, 'summaryFunction');
  if (summaryFunction) field.summaryFunction = summaryFunction;

  return field;
}

/**
 * Parse a query element from GetSchema response
 */
function parseSchemaQuery(queryXml: string): SchemaQuery {
  const query: SchemaQuery = {
    id: parseXmlNumber(getAttribute(queryXml, 'id')),
    name: getTagContent(queryXml, 'qyname') || getTagContent(queryXml, 'qname'),
    type: getTagContent(queryXml, 'qytype'),
  };

  const desc = getTagContent(queryXml, 'qydesc');
  if (desc) query.description = desc;

  const crit = getTagContent(queryXml, 'qycrit');
  if (crit) query.criteria = crit;

  const clst = getTagContent(queryXml, 'qyclst');
  if (clst) query.columnList = clst;

  const slst = getTagContent(queryXml, 'qyslst');
  if (slst) query.sortList = slst;

  const opts = getTagContent(queryXml, 'qyopts');
  if (opts) query.options = opts;

  const calst = getTagContent(queryXml, 'qycalst');
  if (calst) query.calcFields = calst;

  return query;
}

/**
 * Get comprehensive app/table schema information.
 *
 * When called on an app dbid: returns DBVars and child table dbids.
 * When called on a table dbid: returns fields, queries, DBVars, and more.
 *
 * @see https://help.quickbase.com/docs/api-getschema
 *
 * @example
 * ```typescript
 * const schema = await getSchema(caller, 'bqtable123');
 * console.log(`Table: ${schema.table.name}`);
 * for (const field of schema.table.fields ?? []) {
 *   console.log(`  Field ${field.id}: ${field.label} (${field.fieldType})`);
 * }
 * ```
 */
export async function getSchema(
  caller: XmlCaller,
  dbid: string
): Promise<GetSchemaResult> {
  const body = buildRequest('');
  const xml = await caller.doXml(dbid, 'API_GetSchema', body);

  const base = parseBaseResponse(xml);
  checkError(base);

  // Parse top-level elements
  const timeZone = getTagContent(xml, 'time_zone') || undefined;
  const dateFormat = getTagContent(xml, 'date_format') || undefined;

  // Parse table element
  const tableMatch = xml.match(/<table>([\s\S]*?)<\/table>/);
  if (!tableMatch) {
    throw new Error('Invalid API_GetSchema response: no table element');
  }
  const tableXml = tableMatch[0];

  const table: SchemaTable = {
    name: getTagContent(tableXml, 'name'),
    description: getTagContent(tableXml, 'desc') || undefined,
  };

  // Parse original metadata
  const originalMatch = tableXml.match(/<original>([\s\S]*?)<\/original>/);
  if (originalMatch) {
    const origXml = originalMatch[0];
    const original: SchemaOriginal = {};

    const appId = getTagContent(origXml, 'app_id');
    if (appId) original.appId = appId;

    const tableId = getTagContent(origXml, 'table_id');
    if (tableId) original.tableId = tableId;

    const creDate = getTagContent(origXml, 'cre_date');
    if (creDate) original.createdTime = creDate;

    const modDate = getTagContent(origXml, 'mod_date');
    if (modDate) original.modifiedTime = modDate;

    const nextRecordId = getTagContent(origXml, 'next_record_id');
    if (nextRecordId) original.nextRecordId = parseXmlNumber(nextRecordId);

    const nextFieldId = getTagContent(origXml, 'next_field_id');
    if (nextFieldId) original.nextFieldId = parseXmlNumber(nextFieldId);

    const nextQueryId = getTagContent(origXml, 'next_query_id');
    if (nextQueryId) original.nextQueryId = parseXmlNumber(nextQueryId);

    const defSortFid = getTagContent(origXml, 'def_sort_fid');
    if (defSortFid) original.defaultSortFid = parseXmlNumber(defSortFid);

    const defSortOrder = getTagContent(origXml, 'def_sort_order');
    if (defSortOrder) original.defaultSortOrder = parseXmlNumber(defSortOrder);

    table.original = original;
  }

  // Parse variables
  const variablesMatch = tableXml.match(/<variables>([\s\S]*?)<\/variables>/);
  if (variablesMatch) {
    const varElements = getAllElements(variablesMatch[0], 'var');
    table.variables = varElements.map((varXml): SchemaVariable => ({
      name: getAttribute(varXml, 'name'),
      value: getTagContent(varXml, 'var') || '',
    }));
  }

  // Parse child tables (chdbids)
  const chdbidsMatch = tableXml.match(/<chdbids>([\s\S]*?)<\/chdbids>/);
  if (chdbidsMatch) {
    const chdbElements = getAllElements(chdbidsMatch[0], 'chdbid');
    table.childTables = chdbElements.map((chXml): SchemaChildTable => ({
      name: getAttribute(chXml, 'name'),
      dbid: getTagContent(chXml, 'chdbid') || '',
    }));
  }

  // Parse queries
  const queriesMatch = tableXml.match(/<queries>([\s\S]*?)<\/queries>/);
  if (queriesMatch) {
    const queryElements = getAllElements(queriesMatch[0], 'query');
    table.queries = queryElements.map(parseSchemaQuery);
  }

  // Parse fields
  const fieldsMatch = tableXml.match(/<fields>([\s\S]*?)<\/fields>/);
  if (fieldsMatch && fieldsMatch[0].length > 20) {
    const fieldElements = getAllElements(fieldsMatch[0], 'field');
    table.fields = fieldElements.map(parseSchemaField);
  }

  return { table, timeZone, dateFormat };
}
