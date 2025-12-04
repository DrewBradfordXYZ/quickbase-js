/**
 * Schema resolution and lookup utilities
 */

import type { Schema, ResolvedSchema } from './types.js';

/**
 * Error thrown when an unknown table or field alias is used
 */
export class SchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaError';
  }
}

/**
 * Resolve a schema definition into lookup maps for efficient alias resolution
 */
export function resolveSchema(schema?: Schema): ResolvedSchema | undefined {
  if (!schema) return undefined;

  const tableAliasToId = new Map<string, string>();
  const tableIdToAlias = new Map<string, string>();
  const fieldAliasToId = new Map<string, Map<string, number>>();
  const fieldIdToAlias = new Map<string, Map<number, string>>();

  for (const [tableAlias, tableSchema] of Object.entries(schema.tables)) {
    const tableId = tableSchema.id;

    // Table mappings
    tableAliasToId.set(tableAlias, tableId);
    tableIdToAlias.set(tableId, tableAlias);

    // Field mappings for this table
    const aliasToId = new Map<string, number>();
    const idToAlias = new Map<number, string>();

    for (const [fieldAlias, fieldId] of Object.entries(tableSchema.fields)) {
      aliasToId.set(fieldAlias, fieldId);
      idToAlias.set(fieldId, fieldAlias);
    }

    fieldAliasToId.set(tableId, aliasToId);
    fieldIdToAlias.set(tableId, idToAlias);
  }

  return {
    original: schema,
    tableAliasToId,
    tableIdToAlias,
    fieldAliasToId,
    fieldIdToAlias,
  };
}

/**
 * Resolve a table alias to its ID.
 * If the input is already a table ID, returns it unchanged.
 * Throws SchemaError if alias is not found.
 */
export function resolveTableAlias(
  schema: ResolvedSchema | undefined,
  tableRef: string
): string {
  if (!schema) return tableRef;

  // Check if it's an alias
  const tableId = schema.tableAliasToId.get(tableRef);
  if (tableId) return tableId;

  // Check if it's already a table ID
  if (schema.tableIdToAlias.has(tableRef)) return tableRef;

  // Unknown alias - throw helpful error
  const availableAliases = Array.from(schema.tableAliasToId.keys());
  const suggestion = findSimilar(tableRef, availableAliases);
  const suggestionText = suggestion ? ` Did you mean '${suggestion}'?` : '';
  const availableText =
    availableAliases.length > 0
      ? ` Available: ${availableAliases.join(', ')}`
      : '';

  throw new SchemaError(
    `Unknown table alias '${tableRef}'.${suggestionText}${availableText}`
  );
}

/**
 * Resolve a field alias to its ID for a given table.
 * If the input is already a field ID (number), returns it unchanged.
 * Throws SchemaError if alias is not found.
 */
export function resolveFieldAlias(
  schema: ResolvedSchema | undefined,
  tableId: string,
  fieldRef: string | number
): number {
  // If it's already a number, return as-is
  if (typeof fieldRef === 'number') return fieldRef;

  // If no schema, try to parse as number or return as-is
  if (!schema) {
    const num = parseInt(fieldRef, 10);
    if (!isNaN(num)) return num;
    // Can't resolve without schema - pass through and let API handle it
    return fieldRef as unknown as number;
  }

  // Look up the alias
  const fieldMap = schema.fieldAliasToId.get(tableId);
  if (fieldMap) {
    const fieldId = fieldMap.get(fieldRef);
    if (fieldId !== undefined) return fieldId;
  }

  // Check if it's a numeric string (raw field ID)
  const num = parseInt(fieldRef, 10);
  if (!isNaN(num)) return num;

  // Unknown alias - throw helpful error
  const availableAliases = fieldMap ? Array.from(fieldMap.keys()) : [];
  const suggestion = findSimilar(fieldRef, availableAliases);
  const suggestionText = suggestion ? ` Did you mean '${suggestion}'?` : '';

  // Get table alias for better error message
  const tableAlias = schema.tableIdToAlias.get(tableId) || tableId;

  throw new SchemaError(
    `Unknown field alias '${fieldRef}' in table '${tableAlias}'.${suggestionText}`
  );
}

/**
 * Get the alias for a field ID, if defined in schema.
 * Returns undefined if no alias is defined.
 */
export function getFieldAlias(
  schema: ResolvedSchema | undefined,
  tableId: string,
  fieldId: number
): string | undefined {
  if (!schema) return undefined;

  const fieldMap = schema.fieldIdToAlias.get(tableId);
  return fieldMap?.get(fieldId);
}

/**
 * Get the alias for a table ID, if defined in schema.
 * Returns undefined if no alias is defined.
 */
export function getTableAlias(
  schema: ResolvedSchema | undefined,
  tableId: string
): string | undefined {
  if (!schema) return undefined;
  return schema.tableIdToAlias.get(tableId);
}

/**
 * Find a similar string from a list (for "did you mean" suggestions)
 * Uses simple Levenshtein distance
 */
function findSimilar(
  input: string,
  candidates: string[],
  maxDistance = 3
): string | undefined {
  const inputLower = input.toLowerCase();
  let bestMatch: string | undefined;
  let bestDistance = maxDistance + 1;

  for (const candidate of candidates) {
    const distance = levenshteinDistance(inputLower, candidate.toLowerCase());
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = candidate;
    }
  }

  return bestDistance <= maxDistance ? bestMatch : undefined;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Create matrix with proper initialization
  const matrix: number[][] = Array.from({ length: b.length + 1 }, (_, i) =>
    Array.from({ length: a.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  // Fill in the rest
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1, // substitution
          matrix[i]![j - 1]! + 1, // insertion
          matrix[i - 1]![j]! + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length]![a.length]!;
}
