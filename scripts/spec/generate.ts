/**
 * Generate TypeScript types from OpenAPI spec
 *
 * This generates:
 * - Request/Response types for each operation
 * - Shared types for common schemas
 * - Method signatures for the client
 */

import { readJson, writeJson, PATHS, log, runTask } from './common.js';
import { join } from 'path';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

interface OpenAPISpec {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, Schema>;
  };
}

interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  delete?: Operation;
  patch?: Operation;
}

interface Operation {
  operationId: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses?: Record<string, Response>;
}

interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header';
  description?: string;
  required?: boolean;
  schema?: Schema;
}

interface RequestBody {
  description?: string;
  required?: boolean;
  content?: Record<string, { schema: Schema }>;
}

interface Response {
  description: string;
  content?: Record<string, { schema: Schema }>;
}

interface Schema {
  type?: string;
  $ref?: string;
  items?: Schema;
  properties?: Record<string, Schema>;
  additionalProperties?: boolean | Schema;
  required?: string[];
  description?: string;
  enum?: string[];
  allOf?: Schema[];
  oneOf?: Schema[];
  anyOf?: Schema[];
  format?: string;
}

/**
 * Convert OpenAPI type to TypeScript type
 */
function schemaToTypeScript(schema: Schema, indent = 0): string {
  const spaces = '  '.repeat(indent);

  if (schema.$ref) {
    // Extract type name from $ref
    const refName = schema.$ref.replace('#/components/schemas/', '');
    return refName;
  }

  if (schema.allOf) {
    const types = schema.allOf.map((s) => schemaToTypeScript(s, indent));
    return types.join(' & ');
  }

  if (schema.oneOf || schema.anyOf) {
    const schemas = schema.oneOf || schema.anyOf || [];
    const types = schemas.map((s) => schemaToTypeScript(s, indent));
    return types.join(' | ');
  }

  if (schema.enum) {
    return schema.enum.map((v) => {
      if (typeof v === 'string') return `'${v}'`;
      return String(v); // boolean or number
    }).join(' | ');
  }

  switch (schema.type) {
    case 'string':
      if (schema.format === 'date-time') return 'string'; // ISO date string
      if (schema.format === 'binary') return 'Blob | ArrayBuffer';
      return 'string';

    case 'number':
    case 'integer':
    case 'int': // QuickBase API uses 'int' instead of 'integer' in some places
      return 'number';

    case 'boolean':
      return 'boolean';

    case 'array':
      if (schema.items) {
        const itemType = schemaToTypeScript(schema.items, indent);
        // Wrap union types in parentheses for correct array syntax
        const needsParens = itemType.includes(' | ') || itemType.includes(' & ');
        return needsParens ? `(${itemType})[]` : `${itemType}[]`;
      }
      return 'unknown[]';

    case 'object':
      if (schema.properties) {
        const props = Object.entries(schema.properties)
          .map(([name, propSchema]) => {
            const optional = !schema.required?.includes(name) ? '?' : '';
            const propType = schemaToTypeScript(propSchema, indent + 1);
            const description = propSchema.description
              ? `${spaces}  /** ${propSchema.description} */\n`
              : '';
            return `${description}${spaces}  ${name}${optional}: ${propType};`;
          })
          .join('\n');

        if (schema.additionalProperties === true) {
          return `{\n${props}\n${spaces}  [key: string]: unknown;\n${spaces}}`;
        }

        return `{\n${props}\n${spaces}}`;
      }

      if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        const valueType = schemaToTypeScript(schema.additionalProperties, indent);
        return `Record<string, ${valueType}>`;
      }

      if (schema.additionalProperties === true) {
        return 'Record<string, unknown>';
      }

      return 'Record<string, unknown>';

    default:
      return 'unknown';
  }
}

/**
 * Generate parameter type from operation parameters
 */
function generateParamsType(operation: Operation): string | null {
  const params = operation.parameters?.filter((p) => p.in === 'path' || p.in === 'query') || [];

  if (params.length === 0) {
    return null;
  }

  const props = params
    .map((p) => {
      const optional = !p.required ? '?' : '';
      const type = p.schema ? schemaToTypeScript(p.schema) : 'string';
      const description = p.description ? `  /** ${p.description} */\n` : '';
      return `${description}  ${p.name}${optional}: ${type};`;
    })
    .join('\n');

  return `{\n${props}\n}`;
}

/**
 * Generate request body type
 */
function generateRequestBodyType(operation: Operation): string | null {
  const content = operation.requestBody?.content?.['application/json'];
  if (!content?.schema) {
    return null;
  }

  return schemaToTypeScript(content.schema);
}

/**
 * Generate response type for success responses
 */
function generateResponseType(operation: Operation): string {
  const response = operation.responses?.['200'] || operation.responses?.['201'];
  const content = response?.content?.['application/json'];

  if (!content?.schema) {
    return 'void';
  }

  return schemaToTypeScript(content.schema);
}

/**
 * Convert operationId to method name
 */
function toMethodName(operationId: string): string {
  // Already camelCase typically
  return operationId;
}

/**
 * Convert operationId to type name
 */
function toTypeName(operationId: string): string {
  return operationId.charAt(0).toUpperCase() + operationId.slice(1);
}

/**
 * Generate types for an operation
 */
function generateOperationTypes(
  operation: Operation,
  path: string,
  method: string
): {
  paramsType: string | null;
  requestType: string | null;
  responseType: string;
  typeDefs: string;
  methodSignature: string;
  jsDoc: string;
} {
  const typeName = toTypeName(operation.operationId);
  const methodName = toMethodName(operation.operationId);

  const paramsType = generateParamsType(operation);
  const requestType = generateRequestBodyType(operation);
  const responseType = generateResponseType(operation);

  // Generate type definitions
  const typeDefs: string[] = [];

  if (paramsType) {
    typeDefs.push(`export interface ${typeName}Params ${paramsType}`);
  }

  if (requestType && !requestType.startsWith('{')) {
    // It's a reference or simple type, create an alias
    typeDefs.push(`export type ${typeName}Request = ${requestType};`);
  } else if (requestType) {
    typeDefs.push(`export interface ${typeName}Request ${requestType}`);
  }

  if (responseType && !responseType.startsWith('{') && responseType !== 'void') {
    typeDefs.push(`export type ${typeName}Response = ${responseType};`);
  } else if (responseType.startsWith('{')) {
    typeDefs.push(`export interface ${typeName}Response ${responseType}`);
  }

  // Generate method signature
  const params: string[] = [];
  if (paramsType) {
    params.push(`params: ${typeName}Params`);
  }
  if (requestType) {
    const optional = !operation.requestBody?.required ? '?' : '';
    params.push(`body${optional}: ${typeName}Request`);
  }

  const returnType = responseType === 'void' ? 'void' : `${typeName}Response`;
  const isPaginated = isPaginatedOperation(operation.operationId);
  const returnWrapper = isPaginated ? 'PaginatedRequest' : 'Promise';
  const methodSignature = `${methodName}(${params.join(', ')}): ${returnWrapper}<${returnType}>;`;

  // Generate comprehensive JSDoc
  const jsDoc = generateJsDoc(operation);

  return {
    paramsType,
    requestType,
    responseType,
    typeDefs: typeDefs.join('\n\n'),
    methodSignature,
    jsDoc,
  };
}

/**
 * Shared schema names that should be generated as standalone types
 */
const SHARED_SCHEMAS = ['FieldValue', 'QuickbaseRecord', 'SortField', 'SortByUnion', 'OwnerId'];

/**
 * Add shared schema types to the types file
 * These are types added by patch.ts that are referenced by multiple operations
 */
function addSharedSchemaTypes(spec: OpenAPISpec, typeDefs: string[]): void {
  const schemas = spec.components?.schemas;
  if (!schemas) return;

  for (const schemaName of SHARED_SCHEMAS) {
    const schema = schemas[schemaName];
    if (!schema) continue;

    // Generate the type definition based on schema structure
    if (schemaName === 'FieldValue') {
      typeDefs.push('/**');
      typeDefs.push(' * A field value in a QuickBase record.');
      typeDefs.push(' * The value type depends on the field type:');
      typeDefs.push(' * - string: text, email, URL, date/time (ISO format)');
      typeDefs.push(' * - number: numeric fields, record IDs');
      typeDefs.push(' * - boolean: checkbox fields');
      typeDefs.push(' * - string[]: multi-select text lists');
      typeDefs.push(' * - { id: string }[]: file attachments');
      typeDefs.push(' */');
      typeDefs.push('export interface FieldValue {');
      typeDefs.push('  value: string | number | boolean | string[] | { id: string }[];');
      typeDefs.push('}');
      typeDefs.push('');
    } else if (schemaName === 'QuickbaseRecord') {
      typeDefs.push('/**');
      typeDefs.push(' * A QuickBase record where keys are field IDs (as strings) and values are FieldValue objects.');
      typeDefs.push(' */');
      typeDefs.push('export interface QuickbaseRecord {');
      typeDefs.push('  [fieldId: string]: FieldValue;');
      typeDefs.push('}');
      typeDefs.push('');
    } else if (schemaName === 'SortField') {
      typeDefs.push('/**');
      typeDefs.push(' * A field to sort by in a query.');
      typeDefs.push(' */');
      typeDefs.push('export interface SortField {');
      typeDefs.push('  /** The unique identifier of a field in a table. */');
      typeDefs.push('  fieldId: number;');
      typeDefs.push("  /** Sort direction: 'ASC' (ascending), 'DESC' (descending), or 'equal-values'. */");
      typeDefs.push("  order: 'ASC' | 'DESC' | 'equal-values';");
      typeDefs.push('}');
      typeDefs.push('');
    } else if (schemaName === 'SortByUnion') {
      typeDefs.push('/**');
      typeDefs.push(' * Sort configuration for queries.');
      typeDefs.push(' * Can be an array of sort fields, or false to disable sorting for better performance.');
      typeDefs.push(' */');
      typeDefs.push('export type SortByUnion = SortField[] | false;');
      typeDefs.push('');
    } else if (schemaName === 'OwnerId') {
      typeDefs.push('/**');
      typeDefs.push(' * The user ID of the owner.');
      typeDefs.push(' * May be returned as integer or string depending on context.');
      typeDefs.push(' */');
      typeDefs.push('export type OwnerId = string | number;');
      typeDefs.push('');
    }
  }
}

/**
 * Operations that support pagination (have metadata in response)
 */
const PAGINATED_OPERATIONS = new Set([
  'getRelationships',
  'runReport',
  'upsert',
  'runQuery',
  'getUsers',
  'platformAnalyticEventSummaries',
]);

/**
 * Check if an operation supports pagination
 */
function isPaginatedOperation(operationId: string): boolean {
  return PAGINATED_OPERATIONS.has(operationId);
}

/**
 * Generate comprehensive JSDoc for an operation
 */
function generateJsDoc(operation: Operation): string {
  const lines: string[] = ['/**'];

  // Summary
  const summary = operation.summary || operation.operationId;
  lines.push(` * ${summary}`);

  // Add description if different from summary
  if (operation.description && operation.description !== operation.summary) {
    lines.push(' *');
    lines.push(` * ${operation.description}`);
  }

  // Parameters (path and query)
  const params = operation.parameters?.filter((p) => p.in === 'path' || p.in === 'query') || [];
  if (params.length > 0) {
    lines.push(' *');
    for (const param of params) {
      const optional = !param.required ? ' (optional)' : '';
      const desc = param.description || `The ${param.name}`;
      lines.push(` * @param params.${param.name} - ${desc}${optional}`);
    }
  }

  // Request body
  if (operation.requestBody) {
    const bodySchema = operation.requestBody.content?.['application/json']?.schema;
    const optional = !operation.requestBody.required ? ' (optional)' : '';
    const desc = operation.requestBody.description || 'Request body';
    lines.push(' *');
    lines.push(` * @param body - ${desc}${optional}`);

    // Add top-level body properties if it's an object
    if (bodySchema?.properties) {
      for (const [propName, propSchema] of Object.entries(bodySchema.properties)) {
        const propRequired = bodySchema.required?.includes(propName);
        const propOptional = !propRequired ? ' (optional)' : '';
        const propDesc = propSchema.description || `The ${propName}`;
        lines.push(` * @param body.${propName} - ${propDesc}${propOptional}`);
      }
    }
  }

  // Return type
  const response = operation.responses?.['200'] || operation.responses?.['201'];
  const responseDesc = response?.description || 'The response';
  lines.push(' *');
  lines.push(` * @returns ${responseDesc}`);

  // Link to official docs
  lines.push(' *');
  lines.push(` * @see https://developer.quickbase.com/operation/${operation.operationId}`);

  lines.push(' */');
  return lines.join('\n');
}

/**
 * Generate method implementation for an operation
 */
function generateMethodImplementation(
  operation: Operation,
  path: string,
  method: string
): string {
  const typeName = toTypeName(operation.operationId);
  const methodName = toMethodName(operation.operationId);
  const isPaginated = isPaginatedOperation(operation.operationId);

  const pathParams = operation.parameters?.filter((p) => p.in === 'path') || [];
  const queryParams = operation.parameters?.filter((p) => p.in === 'query') || [];
  const hasPathParams = pathParams.length > 0;
  const hasQueryParams = queryParams.length > 0;
  const hasParams = hasPathParams || hasQueryParams;
  const hasBody = !!operation.requestBody;
  const bodyRequired = operation.requestBody?.required ?? false;

  // Build the function parameters
  const funcParams: string[] = [];
  if (hasParams) {
    funcParams.push(`params: ${typeName}Params`);
  }
  if (hasBody) {
    const optional = !bodyRequired ? '?' : '';
    funcParams.push(`body${optional}: ${typeName}Request`);
  }

  // Build the path with interpolation
  // Replace {paramName} with ${params.paramName}
  const interpolatedPath = path.replace(/\{(\w+)\}/g, '${params.$1}');

  // Determine if we need template literal or regular string
  const pathString = hasPathParams ? `\`${interpolatedPath}\`` : `'${path}'`;

  // Build the request options
  const requestOptions: string[] = [
    `method: '${method.toUpperCase()}'`,
    `path: ${pathString}`,
  ];

  // Add query params if any
  if (hasQueryParams) {
    const queryFields = queryParams.map((p) => `${p.name}: params.${p.name}`).join(', ');
    requestOptions.push(`query: { ${queryFields} }`);
  }

  if (hasBody) {
    requestOptions.push('body');
  }

  // Determine return type
  const responseType = generateResponseType(operation);
  const returnType = responseType === 'void' ? 'void' : `${typeName}Response`;

  // Generate JSDoc for this method
  const jsDoc = generateJsDoc(operation);
  const indentedJsDoc = jsDoc.split('\n').map(line => `  ${line}`).join('\n');

  // Generate paginated or regular method
  if (isPaginated) {
    return indentedJsDoc + '\n' + generatePaginatedMethod(
      methodName,
      typeName,
      funcParams,
      requestOptions,
      returnType,
      hasParams,
      hasBody,
      method.toUpperCase(),
      pathString
    );
  }

  // Generate regular method
  const lines = [
    indentedJsDoc,
    `  ${methodName}(${funcParams.join(', ')}): Promise<${returnType}> {`,
    `    return request<${returnType}>({`,
    ...requestOptions.map((opt) => `      ${opt},`),
    `    });`,
    `  },`,
  ];

  return lines.join('\n');
}

/**
 * Generate a paginated method that returns PaginatedRequest
 */
function generatePaginatedMethod(
  methodName: string,
  typeName: string,
  funcParams: string[],
  requestOptions: string[],
  returnType: string,
  hasParams: boolean,
  hasBody: boolean,
  httpMethod: string,
  pathString: string
): string {
  // Build the executor function
  const executorLines = [
    `      return request<${returnType}>({`,
    ...requestOptions.map((opt) => `        ${opt},`),
    `      });`,
  ];

  // Build the paginated executor that accepts pagination params
  // For paginated requests, we need to merge pagination params into the request
  const paginatedExecutorLines: string[] = [];

  if (hasBody) {
    // For POST/body-based pagination (like runQuery), merge into body.options
    // Extract query content if present
    const queryOption = requestOptions.find(o => o.startsWith('query:'));
    let queryLine: string | null = null;
    if (queryOption) {
      const match = queryOption.match(/query:\s*\{(.+)\}/);
      if (match) {
        queryLine = `        query: { ${match[1].trim()} },`;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Safe cast needed for body spreading
    const bodyLines = [
      `      const bodyRecord = body as unknown as Record<string, unknown> | undefined;`,
      `      const paginatedBody = paginationParams.skip !== undefined || paginationParams.nextPageToken || paginationParams.nextToken`,
      `        ? {`,
      `            ...(bodyRecord || {}),`,
      `            options: {`,
      `              ...(bodyRecord?.options as Record<string, unknown> || {}),`,
      `              ...(paginationParams.skip !== undefined ? { skip: paginationParams.skip } : {}),`,
      `            },`,
      `            ...(paginationParams.nextPageToken ? { nextPageToken: paginationParams.nextPageToken } : {}),`,
      `            ...(paginationParams.nextToken ? { nextToken: paginationParams.nextToken } : {}),`,
      `          }`,
      `        : body;`,
      `      return request<${returnType}>({`,
      `        method: '${httpMethod}',`,
      `        path: ${pathString},`,
      queryLine,
      `        body: paginatedBody,`,
      `      });`,
    ].filter(Boolean) as string[];
    paginatedExecutorLines.push(...bodyLines);
  } else {
    // For GET/query-based pagination, merge into query params
    // requestOptions contains items like 'query: { skip: params.skip }'
    // We need to extract just the inner object content (e.g., 'skip: params.skip')
    const queryOption = requestOptions.find(o => o.startsWith('query:'));
    let queryContent = '';
    if (queryOption) {
      // Extract content between { and }
      const match = queryOption.match(/query:\s*\{(.+)\}/);
      if (match) {
        queryContent = match[1].trim();
      }
    }

    paginatedExecutorLines.push(
      `      return request<${returnType}>({`,
      `        method: '${httpMethod}',`,
      `        path: ${pathString},`,
      queryContent
        ? `        query: { ${queryContent}, ...paginationParams },`
        : `        query: paginationParams,`,
      `      });`,
    );
  }

  const lines = [
    `  ${methodName}(${funcParams.join(', ')}): PaginatedRequest<${returnType}> {`,
    `    const executor = () => {`,
    ...executorLines,
    `    };`,
    `    const paginatedExecutor = (paginationParams: { skip?: number; nextPageToken?: string; nextToken?: string }) => {`,
    ...paginatedExecutorLines,
    `    };`,
    `    return createPaginatedRequest(executor, { paginatedExecutor, autoPaginate });`,
    `  },`,
  ];

  return lines.join('\n');
}

/**
 * Generate the client implementation file
 */
function generateClientFile(
  allOperations: Array<{ operation: Operation; path: string; method: string }>,
  outputDir: string
): void {
  // Check if we have any paginated operations
  const hasPaginatedOps = allOperations.some(({ operation }) =>
    isPaginatedOperation(operation.operationId)
  );

  const lines: string[] = [
    '/**',
    ' * Auto-generated QuickBase API client implementation',
    ' * DO NOT EDIT - Regenerate with: npm run spec:generate',
    ' */',
    '',
  ];

  // Add pagination imports if needed
  if (hasPaginatedOps) {
    lines.push("import { PaginatedRequest, createPaginatedRequest } from '../client/pagination.js';");
    lines.push('');
  }

  lines.push('import type {');
  lines.push('  QuickbaseAPI,');

  // Add all type imports
  const typeImports: string[] = [];
  for (const { operation } of allOperations) {
    const typeName = toTypeName(operation.operationId);
    const hasParams = (operation.parameters?.filter((p) => p.in === 'path' || p.in === 'query')?.length || 0) > 0;
    const hasBody = !!operation.requestBody;
    const responseType = generateResponseType(operation);

    if (hasParams) {
      typeImports.push(`${typeName}Params`);
    }
    if (hasBody) {
      typeImports.push(`${typeName}Request`);
    }
    if (responseType !== 'void') {
      typeImports.push(`${typeName}Response`);
    }
  }

  lines.push(...typeImports.map((t) => `  ${t},`));
  lines.push("} from './types.js';");
  lines.push('');
  lines.push('export type RequestFn = <T>(options: {');
  lines.push("  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';");
  lines.push('  path: string;');
  lines.push('  body?: unknown;');
  lines.push('  query?: Record<string, string | number | boolean | undefined>;');
  lines.push('}) => Promise<T>;');
  lines.push('');
  lines.push('/**');
  lines.push(' * Create typed API methods from a request function');
  lines.push(' * @param request - The request executor function');
  lines.push(' * @param autoPaginate - Default auto-pagination behavior (default: false)');
  lines.push(' */');
  lines.push('export function createApiMethods(request: RequestFn, autoPaginate: boolean = false): QuickbaseAPI {');
  lines.push('  return {');

  // Generate all method implementations
  for (const { operation, path, method } of allOperations) {
    lines.push(generateMethodImplementation(operation, path, method));
    lines.push('');
  }

  // Remove last empty line
  lines.pop();

  lines.push('  };');
  lines.push('}');
  lines.push('');

  const clientPath = join(outputDir, 'client.ts');
  writeFileSync(clientPath, lines.join('\n'));
  log('info', `Generated: ${clientPath}`);
}

/**
 * Main generate function
 */
export async function generate(inputPath?: string): Promise<void> {
  await runTask('Generate TypeScript types', async () => {
    // Find input file
    const input = inputPath || join(PATHS.output, 'quickbase-patched.json');

    if (!existsSync(input)) {
      throw new Error(`Input file not found: ${input}`);
    }

    // Read spec
    const spec = readJson<OpenAPISpec>(input);

    // Output directory
    const outputDir = PATHS.generated;
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Collect operations by tag
    const operationsByTag = new Map<string, Array<{ operation: Operation; path: string; method: string }>>();
    const allOperations: Array<{ operation: Operation; path: string; method: string }> = [];

    for (const [path, pathItem] of Object.entries(spec.paths)) {
      for (const method of ['get', 'post', 'put', 'delete', 'patch'] as const) {
        const operation = pathItem[method];
        if (!operation) continue;

        const tag = operation.tags?.[0] || 'default';
        if (!operationsByTag.has(tag)) {
          operationsByTag.set(tag, []);
        }
        operationsByTag.get(tag)!.push({ operation, path, method });
        allOperations.push({ operation, path, method });
      }
    }

    // Check if any operations use pagination
    const hasPaginatedOps = allOperations.some(({ operation }) =>
      isPaginatedOperation(operation.operationId)
    );

    // Generate main types file
    const allTypeDefs: string[] = [
      '/**',
      ' * Auto-generated TypeScript types from OpenAPI spec',
      ' * DO NOT EDIT - Regenerate with: npm run spec:generate',
      ' */',
      '',
      '/* eslint-disable @typescript-eslint/no-empty-interface */',
      '',
    ];

    // Add PaginatedRequest import if needed
    if (hasPaginatedOps) {
      allTypeDefs.push("import type { PaginatedRequest } from '../client/pagination.js';");
      allTypeDefs.push('');
    }

    // Add shared schema types (FieldValue, QuickbaseRecord)
    addSharedSchemaTypes(spec, allTypeDefs);

    const methodSignatures: string[] = [];

    for (const { operation, path, method } of allOperations) {
      const { typeDefs, methodSignature, jsDoc } = generateOperationTypes(operation, path, method);

      if (typeDefs) {
        allTypeDefs.push(`// ${operation.operationId}`);
        if (operation.summary) {
          allTypeDefs.push(`/** ${operation.summary} */`);
        }
        allTypeDefs.push(typeDefs);
        allTypeDefs.push('');
      }

      // Add comprehensive JSDoc before method signature
      const indentedJsDoc = jsDoc.split('\n').map(line => `  ${line}`).join('\n');
      methodSignatures.push(indentedJsDoc);
      methodSignatures.push(`  ${methodSignature}`);
    }

    // Add client interface
    allTypeDefs.push('/**');
    allTypeDefs.push(' * QuickBase API client interface');
    allTypeDefs.push(' */');
    allTypeDefs.push('export interface QuickbaseAPI {');
    allTypeDefs.push(methodSignatures.join('\n'));
    allTypeDefs.push('}');
    allTypeDefs.push('');

    // Write types file
    const typesPath = join(outputDir, 'types.ts');
    writeFileSync(typesPath, allTypeDefs.join('\n'));
    log('info', `Generated: ${typesPath}`);

    // Generate operations metadata file (for request execution)
    const operationsMeta = allOperations.map(({ operation, path, method }) => ({
      operationId: operation.operationId,
      method: method.toUpperCase(),
      path,
      hasParams: (operation.parameters?.filter((p) => p.in !== 'header')?.length || 0) > 0,
      hasBody: !!operation.requestBody,
      tags: operation.tags,
    }));

    const metaPath = join(outputDir, 'operations.json');
    writeJson(metaPath, operationsMeta);
    log('info', `Generated: ${metaPath}`);

    // Generate client implementation
    generateClientFile(allOperations, outputDir);

    // Summary
    log('info', `Generated ${allOperations.length} operation types`);
    log('info', `Tags: ${Array.from(operationsByTag.keys()).join(', ')}`);
  });
}

// Run if called directly
generate().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
