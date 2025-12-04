#!/usr/bin/env node
/**
 * CLI Schema Generator
 *
 * Generates a schema definition from a QuickBase application.
 *
 * Usage:
 *   npx quickbase-js schema --realm <realm> --app <appId> --token <token>
 *
 * Options:
 *   --realm    QuickBase realm (e.g., "mycompany")
 *   --app      Application ID (e.g., "bqw123abc")
 *   --token    User token for authentication (or set QB_USER_TOKEN env var)
 *   --output   Output file path (default: stdout)
 *   --format   Output format: "ts" or "json" (default: "ts")
 *   --merge    Merge with existing schema file, preserving custom aliases
 *   --help     Show help
 */

import { createClient } from '../index.js';
import type { Schema, TableSchema } from '../core/types.js';

interface CliOptions {
  realm?: string;
  app?: string;
  token?: string;
  output?: string;
  format?: 'ts' | 'json';
  merge?: boolean;
  help?: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--realm':
      case '-r':
        options.realm = next;
        i++;
        break;
      case '--app':
      case '-a':
        options.app = next;
        i++;
        break;
      case '--token':
      case '-t':
        options.token = next;
        i++;
        break;
      case '--output':
      case '-o':
        options.output = next;
        i++;
        break;
      case '--format':
      case '-f':
        options.format = next as 'ts' | 'json';
        i++;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--merge':
      case '-m':
        options.merge = true;
        break;
    }
  }

  return options;
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
quickbase-js schema - Generate schema from QuickBase application

Usage:
  npx quickbase-js schema [options]

Options:
  -r, --realm <realm>   QuickBase realm (required, e.g., "mycompany")
  -a, --app <appId>     Application ID (required, e.g., "bqw123abc")
  -t, --token <token>   User token (or set QB_USER_TOKEN env var)
  -o, --output <file>   Output file path (default: stdout)
  -f, --format <type>   Output format: "ts" or "json" (default: "ts")
  -m, --merge           Merge with existing schema, preserving custom aliases
  -h, --help            Show this help message

Examples:
  # Generate TypeScript schema to stdout
  npx quickbase-js schema -r mycompany -a bqw123abc -t your-token

  # Generate and save to file
  npx quickbase-js schema -r mycompany -a bqw123abc --output schema.ts

  # Generate JSON format
  npx quickbase-js schema -r mycompany -a bqw123abc -f json -o schema.json

  # Update existing schema with new fields (preserves custom aliases)
  npx quickbase-js schema -r mycompany -a bqw123abc -o schema.ts --merge

  # Using environment variable for token
  QB_USER_TOKEN=your-token npx quickbase-js schema -r mycompany -a bqw123abc
`);
}

/**
 * Convert a label to a camelCase alias
 */
function labelToAlias(label: string): string {
  // Remove non-alphanumeric chars except spaces
  const cleaned = label
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim();

  // Handle empty string
  if (!cleaned) return 'field';

  // Split by spaces and convert to camelCase
  const words = cleaned.split(/\s+/);
  return words
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

/**
 * Make alias unique by appending number if needed
 */
function makeUnique(alias: string, existing: Set<string>): string {
  if (!existing.has(alias)) {
    existing.add(alias);
    return alias;
  }

  let counter = 2;
  while (existing.has(`${alias}${counter}`)) {
    counter++;
  }
  const unique = `${alias}${counter}`;
  existing.add(unique);
  return unique;
}

/**
 * Fetch schema from QuickBase application
 */
async function fetchSchema(
  realm: string,
  appId: string,
  token: string
): Promise<Schema> {
  const client = createClient({
    realm,
    auth: { type: 'user-token', userToken: token },
  });

  // Fetch all tables
  const tables = await client.getAppTables({ appId });

  const schema: Schema = { tables: {} };

  for (const table of tables) {
    if (!table.id || !table.name) continue;

    // Generate table alias from name
    const tableAlias = labelToAlias(table.name);

    // Fetch fields for this table
    const fields = await client.getFields({ tableId: table.id });

    const fieldAliases = new Set<string>();
    const fieldMap: Record<string, number> = {};

    for (const field of fields) {
      if (!field.label) continue;

      // Generate field alias from label
      let alias = labelToAlias(field.label);
      alias = makeUnique(alias, fieldAliases);

      fieldMap[alias] = field.id;
    }

    schema.tables[tableAlias] = {
      id: table.id,
      fields: fieldMap,
    };
  }

  return schema;
}

/**
 * Format schema as TypeScript
 */
function formatAsTypeScript(schema: Schema): string {
  const lines: string[] = [
    '/**',
    ' * QuickBase Schema Definition',
    ' * Generated by: npx quickbase-js schema',
    ` * Generated at: ${new Date().toISOString()}`,
    ' */',
    '',
    "import type { Schema } from 'quickbase-js';",
    '',
    'export const schema: Schema = {',
    '  tables: {',
  ];

  const tableAliases = Object.keys(schema.tables);
  for (let t = 0; t < tableAliases.length; t++) {
    const tableAlias = tableAliases[t]!;
    const table = schema.tables[tableAlias]!;
    const isLastTable = t === tableAliases.length - 1;

    lines.push(`    ${tableAlias}: {`);
    lines.push(`      id: '${table.id}',`);
    lines.push('      fields: {');

    const fieldAliases = Object.keys(table.fields);
    for (let f = 0; f < fieldAliases.length; f++) {
      const fieldAlias = fieldAliases[f]!;
      const fieldId = table.fields[fieldAlias]!;
      const isLastField = f === fieldAliases.length - 1;
      const comma = isLastField ? '' : ',';
      lines.push(`        ${fieldAlias}: ${fieldId}${comma}`);
    }

    lines.push('      },');
    lines.push(`    }${isLastTable ? '' : ','}`);
  }

  lines.push('  },');
  lines.push('};');
  lines.push('');

  return lines.join('\n');
}

/**
 * Format schema as JSON
 */
function formatAsJson(schema: Schema): string {
  return JSON.stringify(schema, null, 2) + '\n';
}

/**
 * Load existing schema from a file
 */
async function loadExistingSchema(filePath: string, format: 'ts' | 'json'): Promise<Schema | null> {
  const fs = await import('fs');

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  if (format === 'json') {
    try {
      return JSON.parse(content) as Schema;
    } catch {
      console.error(`Warning: Could not parse existing JSON schema at ${filePath}`);
      return null;
    }
  }

  // Parse TypeScript format - extract the schema object
  // Look for pattern: export const schema: Schema = { ... }
  const schemaMatch = content.match(/export\s+const\s+schema[^=]*=\s*(\{[\s\S]*\});?\s*$/m);
  if (!schemaMatch) {
    console.error(`Warning: Could not parse existing TypeScript schema at ${filePath}`);
    return null;
  }

  try {
    // Use Function constructor to safely evaluate the object literal
    // This handles the JS object syntax in the TS file
    const schemaStr = schemaMatch[1]!;
    const fn = new Function(`return ${schemaStr}`);
    return fn() as Schema;
  } catch (e) {
    console.error(`Warning: Could not evaluate existing schema: ${e}`);
    return null;
  }
}

/**
 * Build reverse lookup: field ID -> alias for a table
 */
function buildFieldIdToAlias(table: TableSchema): Map<number, string> {
  const map = new Map<number, string>();
  for (const [alias, id] of Object.entries(table.fields)) {
    map.set(id, alias);
  }
  return map;
}

/**
 * Build reverse lookup: table ID -> alias
 */
function buildTableIdToAlias(schema: Schema): Map<string, string> {
  const map = new Map<string, string>();
  for (const [alias, table] of Object.entries(schema.tables)) {
    map.set(table.id, alias);
  }
  return map;
}

/**
 * Merge new schema with existing schema, preserving custom aliases
 */
function mergeSchemas(existing: Schema, fresh: Schema): { merged: Schema; stats: MergeStats } {
  const stats: MergeStats = {
    tablesAdded: 0,
    tablesRemoved: 0,
    tablesPreserved: 0,
    fieldsAdded: 0,
    fieldsRemoved: 0,
    fieldsPreserved: 0,
  };

  const merged: Schema = { tables: {} };

  // Build reverse lookup for existing schema (ID -> alias)
  const existingTableIdToAlias = buildTableIdToAlias(existing);
  const existingFieldIdToAlias = new Map<string, Map<number, string>>();
  for (const [, table] of Object.entries(existing.tables)) {
    existingFieldIdToAlias.set(table.id, buildFieldIdToAlias(table));
  }

  // Track which existing tables we've seen (by ID)
  const seenTableIds = new Set<string>();

  // Process each table from fresh schema
  for (const [freshTableAlias, freshTable] of Object.entries(fresh.tables)) {
    const tableId = freshTable.id;
    seenTableIds.add(tableId);

    // Use existing alias if available, otherwise use fresh alias
    const tableAlias = existingTableIdToAlias.get(tableId) ?? freshTableAlias;
    const existingFieldMap = existingFieldIdToAlias.get(tableId);

    // Track which existing fields we've seen (by ID)
    const seenFieldIds = new Set<number>();
    const mergedFields: Record<string, number> = {};

    // Process each field from fresh schema
    for (const [freshFieldAlias, fieldId] of Object.entries(freshTable.fields)) {
      seenFieldIds.add(fieldId);

      // Use existing alias if available, otherwise use fresh alias
      const fieldAlias = existingFieldMap?.get(fieldId) ?? freshFieldAlias;
      mergedFields[fieldAlias] = fieldId;

      if (existingFieldMap?.has(fieldId)) {
        stats.fieldsPreserved++;
      } else {
        stats.fieldsAdded++;
      }
    }

    // Check for removed fields (in existing but not in fresh)
    if (existingFieldMap) {
      for (const [fieldId] of existingFieldMap) {
        if (!seenFieldIds.has(fieldId)) {
          stats.fieldsRemoved++;
        }
      }
    }

    merged.tables[tableAlias] = {
      id: tableId,
      fields: mergedFields,
    };

    if (existingTableIdToAlias.has(tableId)) {
      stats.tablesPreserved++;
    } else {
      stats.tablesAdded++;
    }
  }

  // Check for removed tables (in existing but not in fresh)
  for (const [, table] of Object.entries(existing.tables)) {
    if (!seenTableIds.has(table.id)) {
      stats.tablesRemoved++;
    }
  }

  return { merged, stats };
}

interface MergeStats {
  tablesAdded: number;
  tablesRemoved: number;
  tablesPreserved: number;
  fieldsAdded: number;
  fieldsRemoved: number;
  fieldsPreserved: number;
}

/**
 * Main CLI entry point
 */
export async function main(args: string[]): Promise<void> {
  const options = parseArgs(args);

  if (options.help) {
    showHelp();
    return;
  }

  // Validate required options
  const realm = options.realm;
  const app = options.app;
  const token = options.token || process.env.QB_USER_TOKEN;

  if (!realm) {
    console.error('Error: --realm is required');
    process.exit(1);
  }

  if (!app) {
    console.error('Error: --app is required');
    process.exit(1);
  }

  if (!token) {
    console.error('Error: --token is required (or set QB_USER_TOKEN env var)');
    process.exit(1);
  }

  const format = options.format || 'ts';

  // Merge requires an output file
  if (options.merge && !options.output) {
    console.error('Error: --merge requires --output to specify the file to merge with');
    process.exit(1);
  }

  try {
    console.error(`Fetching schema from ${realm}/${app}...`);

    let schema = await fetchSchema(realm, app, token);
    const tableCount = Object.keys(schema.tables).length;
    const fieldCount = Object.values(schema.tables).reduce(
      (sum, t) => sum + Object.keys(t.fields).length,
      0
    );

    console.error(`Found ${tableCount} tables with ${fieldCount} fields`);

    // Merge with existing schema if requested
    if (options.merge && options.output) {
      const existing = await loadExistingSchema(options.output, format);
      if (existing) {
        const { merged, stats } = mergeSchemas(existing, schema);
        schema = merged;

        console.error(`Merge complete:`);
        console.error(`  Tables: ${stats.tablesPreserved} preserved, ${stats.tablesAdded} added, ${stats.tablesRemoved} removed`);
        console.error(`  Fields: ${stats.fieldsPreserved} preserved, ${stats.fieldsAdded} added, ${stats.fieldsRemoved} removed`);
      } else {
        console.error(`No existing schema found at ${options.output}, creating new file`);
      }
    }

    // Format output
    const output = format === 'json'
      ? formatAsJson(schema)
      : formatAsTypeScript(schema);

    // Write output
    if (options.output) {
      const fs = await import('fs');
      fs.writeFileSync(options.output, output, 'utf-8');
      console.error(`Schema written to ${options.output}`);
    } else {
      console.log(output);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if executed directly
const isDirectExecution =
  typeof process !== 'undefined' &&
  process.argv[1]?.endsWith('schema.js');

if (isDirectExecution) {
  main(process.argv.slice(2));
}
