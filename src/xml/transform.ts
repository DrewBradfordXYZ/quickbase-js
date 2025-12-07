/**
 * XML API Response Transformation
 *
 * Transforms XML API responses to use field and table aliases as keys
 * when a schema is configured, similar to the JSON API transformation.
 *
 * Without schema: record.fields is an array accessed by index or id
 * With schema: record.fields is keyed by alias (e.g., record.fields.name)
 *
 * XML-API: Remove this file when QuickBase discontinues the XML API.
 * To find all XML API code, search for: XML-API
 */

import type { ResolvedSchema } from '../core/types.js';
import { getFieldAlias, getTableAlias } from '../core/schema.js';
import type {
  RecordField,
  SchemaField,
  GetRecordInfoResult,
  GetSchemaResult,
  FieldAddChoicesResult,
  FieldRemoveChoicesResult,
  DatabaseInfo,
  GrantedDBsResult,
  GrantedDBsForGroupResult,
  GetAppDTMInfoResult,
  FindDBByNameResult,
  SchemaChildTable,
} from './types.js';

// =============================================================================
// Extended Types with Aliases
// =============================================================================

/**
 * RecordField as returned in the keyed object (alias is the key)
 */
export interface RecordFieldWithAlias extends RecordField {
  /** Field alias (duplicated from key for convenience) */
  alias?: string;
}

/**
 * SchemaField as returned in the keyed object (alias is the key)
 */
export interface SchemaFieldWithAlias extends SchemaField {
  /** Field alias (duplicated from key for convenience) */
  alias?: string;
  /** Summary reference field alias */
  summaryReferenceFidAlias?: string;
  /** Summary target field alias */
  summaryTargetFidAlias?: string;
}

/**
 * DatabaseInfo keyed by alias
 */
export interface DatabaseInfoWithAlias extends DatabaseInfo {
  /** Table alias (duplicated from key for convenience) */
  alias?: string;
}

/**
 * SchemaChildTable keyed by alias
 */
export interface SchemaChildTableWithAlias extends SchemaChildTable {
  /** Table alias (duplicated from key for convenience) */
  alias?: string;
}

/**
 * GetRecordInfoResult with fields keyed by alias.
 * Access: result.fields.name.value
 */
export interface GetRecordInfoResultWithAlias extends Omit<GetRecordInfoResult, 'fields'> {
  fields: Record<string, RecordFieldWithAlias>;
}

/**
 * GetSchemaResult with fields keyed by alias.
 * Access: result.table.fields.name, result.table.childTables.tasks
 */
export interface GetSchemaResultWithAlias extends Omit<GetSchemaResult, 'table'> {
  table: Omit<GetSchemaResult['table'], 'fields' | 'childTables'> & {
    fields?: Record<string, SchemaFieldWithAlias>;
    childTables?: Record<string, SchemaChildTableWithAlias>;
  };
}

/**
 * FieldAddChoicesResult with alias
 */
export interface FieldAddChoicesResultWithAlias extends FieldAddChoicesResult {
  /** Field alias from schema (if available) */
  fieldAlias?: string;
}

/**
 * FieldRemoveChoicesResult with alias
 */
export interface FieldRemoveChoicesResultWithAlias extends FieldRemoveChoicesResult {
  /** Field alias from schema (if available) */
  fieldAlias?: string;
}

/**
 * GrantedDBsResult with databases keyed by alias.
 * Access: result.databases.projects.dbname
 */
export interface GrantedDBsResultWithAlias extends Omit<GrantedDBsResult, 'databases'> {
  databases: Record<string, DatabaseInfoWithAlias>;
}

/**
 * GrantedDBsForGroupResult with databases keyed by alias.
 */
export interface GrantedDBsForGroupResultWithAlias extends Omit<GrantedDBsForGroupResult, 'databases'> {
  databases: Record<string, { dbid: string; name: string; alias?: string }>;
}

/**
 * GetAppDTMInfoResult with tables keyed by alias.
 * Access: result.tables.projects.lastModifiedTime
 */
export interface GetAppDTMInfoResultWithAlias extends Omit<GetAppDTMInfoResult, 'tables'> {
  appId: string;
  appAlias?: string;
  lastModifiedTime?: string;
  lastRecModTime?: string;
  tables: Record<
    string,
    {
      id: string;
      alias?: string;
      lastModifiedTime?: string;
      lastRecModTime?: string;
    }
  >;
}

/**
 * FindDBByNameResult with alias
 */
export interface FindDBByNameResultWithAlias extends FindDBByNameResult {
  /** Table alias from schema (if available) */
  alias?: string;
}

// =============================================================================
// Transformation Functions
// =============================================================================

/**
 * Convert a fields array to a keyed object.
 * Keys are field aliases (if in schema) or field IDs (as strings).
 */
function fieldsArrayToMap<T extends RecordField>(
  fields: T[],
  schema: ResolvedSchema | undefined,
  tableId: string
): Record<string, T & { alias?: string }> {
  const result: Record<string, T & { alias?: string }> = {};

  for (const field of fields) {
    const alias = schema ? getFieldAlias(schema, tableId, field.id) : undefined;
    const key = alias ?? String(field.id);
    result[key] = alias ? { ...field, alias } : field;
  }

  return result;
}

/**
 * Convert a databases array to a keyed object.
 * Keys are table aliases (if in schema) or dbids.
 */
function databasesArrayToMap<T extends { dbid: string }>(
  databases: T[],
  schema: ResolvedSchema | undefined
): Record<string, T & { alias?: string }> {
  const result: Record<string, T & { alias?: string }> = {};

  for (const db of databases) {
    const alias = schema ? getTableAlias(schema, db.dbid) : undefined;
    const key = alias ?? db.dbid;
    result[key] = alias ? { ...db, alias } : db;
  }

  return result;
}

/**
 * Convert a tables array to a keyed object.
 * Keys are table aliases (if in schema) or table IDs.
 */
function tablesArrayToMap<T extends { id: string }>(
  tables: T[],
  schema: ResolvedSchema | undefined
): Record<string, T & { alias?: string }> {
  const result: Record<string, T & { alias?: string }> = {};

  for (const table of tables) {
    const alias = schema ? getTableAlias(schema, table.id) : undefined;
    const key = alias ?? table.id;
    result[key] = alias ? { ...table, alias } : table;
  }

  return result;
}

/**
 * Transform a SchemaField to include extra alias properties
 */
function transformSchemaFieldAliases(
  field: SchemaField,
  schema: ResolvedSchema,
  tableId: string
): SchemaFieldWithAlias {
  const result: SchemaFieldWithAlias = { ...field };

  const alias = getFieldAlias(schema, tableId, field.id);
  if (alias) result.alias = alias;

  if (field.summaryReferenceFid !== undefined) {
    const refAlias = getFieldAlias(schema, tableId, field.summaryReferenceFid);
    if (refAlias) result.summaryReferenceFidAlias = refAlias;
  }

  if (field.summaryTargetFid !== undefined) {
    const targetAlias = getFieldAlias(schema, tableId, field.summaryTargetFid);
    if (targetAlias) result.summaryTargetFidAlias = targetAlias;
  }

  return result;
}

/**
 * Transform GetRecordInfoResult to key fields by alias.
 * Access: result.fields.name.value (instead of result.fields[0].value)
 */
export function transformGetRecordInfoResult(
  result: GetRecordInfoResult,
  schema: ResolvedSchema | undefined,
  tableId: string
): GetRecordInfoResultWithAlias {
  return {
    ...result,
    fields: fieldsArrayToMap(result.fields, schema, tableId),
  };
}

/**
 * Transform GetSchemaResult to key fields and child tables by alias.
 * Access: result.table.fields.name, result.table.childTables.tasks
 */
export function transformGetSchemaResult(
  result: GetSchemaResult,
  schema: ResolvedSchema | undefined,
  tableId: string
): GetSchemaResultWithAlias {
  const transformedTable: GetSchemaResultWithAlias['table'] = {
    ...result.table,
    fields: undefined,
    childTables: undefined,
  };

  // Transform fields to keyed object with extra alias properties
  if (result.table.fields) {
    const fieldsMap: Record<string, SchemaFieldWithAlias> = {};
    for (const field of result.table.fields) {
      const transformed = schema
        ? transformSchemaFieldAliases(field, schema, tableId)
        : field;
      const alias = schema ? getFieldAlias(schema, tableId, field.id) : undefined;
      const key = alias ?? String(field.id);
      fieldsMap[key] = alias ? { ...transformed, alias } : transformed;
    }
    transformedTable.fields = fieldsMap;
  }

  // Transform child tables to keyed object
  if (result.table.childTables) {
    const childTablesMap: Record<string, SchemaChildTableWithAlias> = {};
    for (const ct of result.table.childTables) {
      const alias = schema ? getTableAlias(schema, ct.dbid) : undefined;
      const key = alias ?? ct.dbid;
      childTablesMap[key] = alias ? { ...ct, alias } : ct;
    }
    transformedTable.childTables = childTablesMap;
  }

  return {
    ...result,
    table: transformedTable,
  };
}

/**
 * Transform FieldAddChoicesResult to include field alias
 */
export function transformFieldAddChoicesResult(
  result: FieldAddChoicesResult,
  schema: ResolvedSchema | undefined,
  tableId: string
): FieldAddChoicesResultWithAlias {
  if (!schema) return result;

  const alias = getFieldAlias(schema, tableId, result.fieldId);
  return alias ? { ...result, fieldAlias: alias } : result;
}

/**
 * Transform FieldRemoveChoicesResult to include field alias
 */
export function transformFieldRemoveChoicesResult(
  result: FieldRemoveChoicesResult,
  schema: ResolvedSchema | undefined,
  tableId: string
): FieldRemoveChoicesResultWithAlias {
  if (!schema) return result;

  const alias = getFieldAlias(schema, tableId, result.fieldId);
  return alias ? { ...result, fieldAlias: alias } : result;
}

/**
 * Transform GrantedDBsResult to key databases by alias.
 * Access: result.databases.projects.dbname
 */
export function transformGrantedDBsResult(
  result: GrantedDBsResult,
  schema: ResolvedSchema | undefined
): GrantedDBsResultWithAlias {
  return {
    ...result,
    databases: databasesArrayToMap(result.databases, schema),
  };
}

/**
 * Transform GrantedDBsForGroupResult to key databases by alias.
 */
export function transformGrantedDBsForGroupResult(
  result: GrantedDBsForGroupResult,
  schema: ResolvedSchema | undefined
): GrantedDBsForGroupResultWithAlias {
  return {
    ...result,
    databases: databasesArrayToMap(result.databases, schema),
  };
}

/**
 * Transform GetAppDTMInfoResult to key tables by alias.
 * Access: result.tables.projects.lastModifiedTime
 */
export function transformGetAppDTMInfoResult(
  result: GetAppDTMInfoResult,
  schema: ResolvedSchema | undefined
): GetAppDTMInfoResultWithAlias {
  const appAlias = schema ? getTableAlias(schema, result.appId) : undefined;

  return {
    ...result,
    appAlias,
    tables: tablesArrayToMap(result.tables, schema),
  };
}

/**
 * Transform FindDBByNameResult to include table alias
 */
export function transformFindDBByNameResult(
  result: FindDBByNameResult,
  schema: ResolvedSchema | undefined
): FindDBByNameResultWithAlias {
  if (!schema) return result;

  const alias = getTableAlias(schema, result.dbid);
  return alias ? { ...result, alias } : result;
}
