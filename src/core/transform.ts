/**
 * Request and response transformation utilities for schema aliases
 */

import type { ResolvedSchema } from './types.js';
import {
  resolveTableAlias,
  resolveFieldAlias,
  getFieldAlias,
} from './schema.js';

// =============================================================================
// Request Transformation
// =============================================================================

/**
 * Context for request transformation
 */
export interface RequestTransformContext {
  schema?: ResolvedSchema;
  /** The resolved table ID (after alias resolution) */
  tableId?: string;
}

/**
 * Transform a request body, resolving table and field aliases to IDs.
 * Handles: from, to, select, sortBy, groupBy, where, data
 */
export function transformRequest<T extends Record<string, unknown>>(
  body: T,
  ctx: RequestTransformContext
): T {
  if (!ctx.schema) return body;

  // Work with a plain object to avoid TypeScript index signature issues
  const result: Record<string, unknown> = { ...body };
  let tableId = ctx.tableId;

  // Resolve table references (from, to)
  if ('from' in result && typeof result.from === 'string') {
    tableId = resolveTableAlias(ctx.schema, result.from);
    result.from = tableId;
  }
  if ('to' in result && typeof result.to === 'string') {
    tableId = resolveTableAlias(ctx.schema, result.to);
    result.to = tableId;
  }

  // Need tableId to resolve field aliases
  if (!tableId) return result as T;

  // Resolve select array
  if ('select' in result && Array.isArray(result.select)) {
    result.select = (result.select as (string | number)[]).map((field) =>
      resolveFieldAlias(ctx.schema, tableId!, field)
    );
  }

  // Resolve sortBy array
  if ('sortBy' in result && Array.isArray(result.sortBy)) {
    result.sortBy = (result.sortBy as Record<string, unknown>[]).map((sort) => ({
      ...sort,
      fieldId: resolveFieldAlias(ctx.schema, tableId!, sort.fieldId as string | number),
    }));
  }

  // Resolve groupBy array
  if ('groupBy' in result && Array.isArray(result.groupBy)) {
    result.groupBy = (result.groupBy as Record<string, unknown>[]).map((group) => ({
      ...group,
      fieldId: resolveFieldAlias(ctx.schema, tableId!, group.fieldId as string | number),
    }));
  }

  // Resolve where clause (string replacement)
  if ('where' in result && typeof result.where === 'string') {
    result.where = transformWhereClause(result.where, ctx.schema, tableId);
  }

  // Resolve data array (for upsert)
  if ('data' in result && Array.isArray(result.data)) {
    result.data = (result.data as Record<string, unknown>[]).map((record) =>
      transformRecordForRequest(record, ctx.schema!, tableId!)
    );
  }

  return result as T;
}

/**
 * Transform a where clause, replacing field aliases with IDs.
 * QuickBase where syntax: {fieldId.operator.value}
 * Example: {'status'.EX.'Active'} -> {7.EX.'Active'}
 */
function transformWhereClause(
  where: string,
  schema: ResolvedSchema,
  tableId: string
): string {
  // Match patterns like {'fieldAlias' or {fieldAlias. at the start of conditions
  // The pattern captures the field reference between { and .
  return where.replace(/\{['"]?([^.'"\}]+)['"]?\./g, (match, fieldRef: string) => {
    try {
      const fieldId = resolveFieldAlias(schema, tableId, fieldRef);
      return `{${fieldId}.`;
    } catch {
      // If alias not found, keep original (might be a raw ID)
      return match;
    }
  });
}

/**
 * Transform a record object for upsert, converting field alias keys to IDs.
 * Input: { name: { value: 'X' } }
 * Output: { 6: { value: 'X' } }
 */
function transformRecordForRequest(
  record: Record<string, unknown>,
  schema: ResolvedSchema,
  tableId: string
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    // Try to resolve the key as a field alias
    try {
      const fieldId = resolveFieldAlias(schema, tableId, key);
      result[fieldId] = value;
    } catch {
      // If not an alias, keep the original key (might already be an ID)
      result[key] = value;
    }
  }

  return result;
}

// =============================================================================
// Response Transformation
// =============================================================================

/**
 * Context for response transformation
 */
export interface ResponseTransformContext {
  schema?: ResolvedSchema;
  /** The table ID for field alias lookups */
  tableId?: string;
}

/**
 * Transform a response, converting field IDs to aliases and unwrapping values.
 * Handles nested data arrays (for runQuery, upsert responses).
 */
export function transformResponse<T>(
  response: T,
  ctx: ResponseTransformContext
): T {
  if (!response || typeof response !== 'object') return response;

  const result = { ...response } as Record<string, unknown>;

  // Handle data array (runQuery, upsert responses)
  if ('data' in result && Array.isArray(result.data) && ctx.tableId) {
    result.data = result.data.map((record) =>
      transformRecordForResponse(
        record as Record<string, unknown>,
        ctx.schema,
        ctx.tableId!
      )
    );
  }

  return result as T;
}

/**
 * Transform a single record from the response.
 * - Converts field ID keys to aliases (if schema defined)
 * - Unwraps { value: X } to just X
 * - Unknown fields keep their numeric key but still get unwrapped
 */
function transformRecordForResponse(
  record: Record<string, unknown>,
  schema: ResolvedSchema | undefined,
  tableId: string
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    // Determine the output key (alias or original)
    let outputKey = key;
    const fieldId = parseInt(key, 10);

    if (!isNaN(fieldId) && schema) {
      const alias = getFieldAlias(schema, tableId, fieldId);
      if (alias) {
        outputKey = alias;
      }
    }

    // Unwrap { value: X } -> X
    const unwrappedValue = unwrapFieldValue(value);
    result[outputKey] = unwrappedValue;
  }

  return result;
}

/**
 * Unwrap a field value from QuickBase's { value: X } format.
 * Also handles arrays of values.
 */
function unwrapFieldValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    // Check if it's a { value: X } wrapper
    if ('value' in obj && Object.keys(obj).length === 1) {
      // Recursively unwrap in case value is an array of wrapped values
      return unwrapFieldValue(obj.value);
    }
    // Check if it's a { value: X, ...metadata } wrapper (preserve just value)
    if ('value' in obj) {
      return unwrapFieldValue(obj.value);
    }
  }

  // Handle array of { value: X } objects
  if (Array.isArray(value)) {
    return value.map(unwrapFieldValue);
  }

  return value;
}

// =============================================================================
// Table ID Extraction
// =============================================================================

/**
 * Extract the table ID from a request body.
 * Looks for 'from' or 'to' fields and resolves any aliases.
 */
export function extractTableIdFromRequest(
  body: Record<string, unknown> | undefined,
  schema?: ResolvedSchema
): string | undefined {
  if (!body) return undefined;

  // Check 'from' (runQuery, deleteRecords)
  if ('from' in body && typeof body.from === 'string') {
    return schema ? resolveTableAlias(schema, body.from) : body.from;
  }

  // Check 'to' (upsert)
  if ('to' in body && typeof body.to === 'string') {
    return schema ? resolveTableAlias(schema, body.to) : body.to;
  }

  return undefined;
}
