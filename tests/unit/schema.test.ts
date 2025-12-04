/**
 * Schema resolution and transformation unit tests
 */

import { describe, it, expect } from 'vitest';
import {
  resolveSchema,
  resolveTableAlias,
  resolveFieldAlias,
  getFieldAlias,
  getTableAlias,
  SchemaError,
} from '../../src/core/schema.js';
import {
  transformRequest,
  transformResponse,
  extractTableIdFromRequest,
} from '../../src/core/transform.js';
import type { Schema } from '../../src/core/types.js';

// =============================================================================
// Test Schema Fixtures
// =============================================================================

const testSchema: Schema = {
  tables: {
    projects: {
      id: 'bqw3ryzab',
      fields: {
        id: 3,
        name: 6,
        status: 7,
        dueDate: 12,
        assignee: 15,
      },
    },
    tasks: {
      id: 'bqw4xyzcd',
      fields: {
        id: 3,
        title: 6,
        projectId: 8,
        completed: 10,
      },
    },
  },
};

// =============================================================================
// Schema Resolution Tests
// =============================================================================

describe('resolveSchema', () => {
  it('should return undefined for undefined schema', () => {
    expect(resolveSchema(undefined)).toBeUndefined();
  });

  it('should build table alias to ID map', () => {
    const resolved = resolveSchema(testSchema)!;
    expect(resolved.tableAliasToId.get('projects')).toBe('bqw3ryzab');
    expect(resolved.tableAliasToId.get('tasks')).toBe('bqw4xyzcd');
  });

  it('should build table ID to alias map', () => {
    const resolved = resolveSchema(testSchema)!;
    expect(resolved.tableIdToAlias.get('bqw3ryzab')).toBe('projects');
    expect(resolved.tableIdToAlias.get('bqw4xyzcd')).toBe('tasks');
  });

  it('should build field alias to ID maps per table', () => {
    const resolved = resolveSchema(testSchema)!;

    const projectFields = resolved.fieldAliasToId.get('bqw3ryzab')!;
    expect(projectFields.get('name')).toBe(6);
    expect(projectFields.get('status')).toBe(7);
    expect(projectFields.get('dueDate')).toBe(12);

    const taskFields = resolved.fieldAliasToId.get('bqw4xyzcd')!;
    expect(taskFields.get('title')).toBe(6);
    expect(taskFields.get('completed')).toBe(10);
  });

  it('should build field ID to alias maps per table', () => {
    const resolved = resolveSchema(testSchema)!;

    const projectFields = resolved.fieldIdToAlias.get('bqw3ryzab')!;
    expect(projectFields.get(6)).toBe('name');
    expect(projectFields.get(7)).toBe('status');

    const taskFields = resolved.fieldIdToAlias.get('bqw4xyzcd')!;
    expect(taskFields.get(6)).toBe('title');
    expect(taskFields.get(10)).toBe('completed');
  });

  it('should preserve original schema', () => {
    const resolved = resolveSchema(testSchema)!;
    expect(resolved.original).toBe(testSchema);
  });
});

// =============================================================================
// Table Alias Resolution Tests
// =============================================================================

describe('resolveTableAlias', () => {
  const resolved = resolveSchema(testSchema);

  it('should resolve table alias to ID', () => {
    expect(resolveTableAlias(resolved, 'projects')).toBe('bqw3ryzab');
    expect(resolveTableAlias(resolved, 'tasks')).toBe('bqw4xyzcd');
  });

  it('should pass through table ID unchanged', () => {
    expect(resolveTableAlias(resolved, 'bqw3ryzab')).toBe('bqw3ryzab');
    expect(resolveTableAlias(resolved, 'bqw4xyzcd')).toBe('bqw4xyzcd');
  });

  it('should pass through when no schema is provided', () => {
    expect(resolveTableAlias(undefined, 'projects')).toBe('projects');
    expect(resolveTableAlias(undefined, 'bqw3ryzab')).toBe('bqw3ryzab');
  });

  it('should throw SchemaError for unknown alias', () => {
    expect(() => resolveTableAlias(resolved, 'unknown')).toThrow(SchemaError);
    expect(() => resolveTableAlias(resolved, 'unknown')).toThrow(
      /Unknown table alias 'unknown'/
    );
  });

  it('should suggest similar table aliases', () => {
    expect(() => resolveTableAlias(resolved, 'projcts')).toThrow(
      /Did you mean 'projects'\?/
    );
    expect(() => resolveTableAlias(resolved, 'task')).toThrow(
      /Did you mean 'tasks'\?/
    );
  });

  it('should list available table aliases', () => {
    expect(() => resolveTableAlias(resolved, 'unknown')).toThrow(
      /Available: projects, tasks/
    );
  });
});

// =============================================================================
// Field Alias Resolution Tests
// =============================================================================

describe('resolveFieldAlias', () => {
  const resolved = resolveSchema(testSchema);

  it('should resolve field alias to ID', () => {
    expect(resolveFieldAlias(resolved, 'bqw3ryzab', 'name')).toBe(6);
    expect(resolveFieldAlias(resolved, 'bqw3ryzab', 'status')).toBe(7);
    expect(resolveFieldAlias(resolved, 'bqw4xyzcd', 'title')).toBe(6);
  });

  it('should pass through numeric field ID', () => {
    expect(resolveFieldAlias(resolved, 'bqw3ryzab', 6)).toBe(6);
    expect(resolveFieldAlias(resolved, 'bqw3ryzab', 99)).toBe(99);
  });

  it('should parse numeric string as field ID', () => {
    expect(resolveFieldAlias(resolved, 'bqw3ryzab', '6')).toBe(6);
    expect(resolveFieldAlias(resolved, 'bqw3ryzab', '99')).toBe(99);
  });

  it('should pass through when no schema is provided', () => {
    expect(resolveFieldAlias(undefined, 'bqw3ryzab', 6)).toBe(6);
    expect(resolveFieldAlias(undefined, 'bqw3ryzab', '6')).toBe(6);
  });

  it('should throw SchemaError for unknown alias', () => {
    expect(() =>
      resolveFieldAlias(resolved, 'bqw3ryzab', 'unknown')
    ).toThrow(SchemaError);
    expect(() =>
      resolveFieldAlias(resolved, 'bqw3ryzab', 'unknown')
    ).toThrow(/Unknown field alias 'unknown' in table 'projects'/);
  });

  it('should suggest similar field aliases', () => {
    expect(() =>
      resolveFieldAlias(resolved, 'bqw3ryzab', 'staus')
    ).toThrow(/Did you mean 'status'\?/);
    expect(() =>
      resolveFieldAlias(resolved, 'bqw3ryzab', 'nam')
    ).toThrow(/Did you mean 'name'\?/);
  });
});

// =============================================================================
// Reverse Lookup Tests
// =============================================================================

describe('getFieldAlias', () => {
  const resolved = resolveSchema(testSchema);

  it('should return alias for known field ID', () => {
    expect(getFieldAlias(resolved, 'bqw3ryzab', 6)).toBe('name');
    expect(getFieldAlias(resolved, 'bqw3ryzab', 7)).toBe('status');
    expect(getFieldAlias(resolved, 'bqw4xyzcd', 6)).toBe('title');
  });

  it('should return undefined for unknown field ID', () => {
    expect(getFieldAlias(resolved, 'bqw3ryzab', 99)).toBeUndefined();
    expect(getFieldAlias(resolved, 'bqw3ryzab', 100)).toBeUndefined();
  });

  it('should return undefined when no schema', () => {
    expect(getFieldAlias(undefined, 'bqw3ryzab', 6)).toBeUndefined();
  });
});

describe('getTableAlias', () => {
  const resolved = resolveSchema(testSchema);

  it('should return alias for known table ID', () => {
    expect(getTableAlias(resolved, 'bqw3ryzab')).toBe('projects');
    expect(getTableAlias(resolved, 'bqw4xyzcd')).toBe('tasks');
  });

  it('should return undefined for unknown table ID', () => {
    expect(getTableAlias(resolved, 'unknown')).toBeUndefined();
  });

  it('should return undefined when no schema', () => {
    expect(getTableAlias(undefined, 'bqw3ryzab')).toBeUndefined();
  });
});

// =============================================================================
// Request Transformation Tests
// =============================================================================

describe('transformRequest', () => {
  const resolved = resolveSchema(testSchema);

  it('should transform "from" field', () => {
    const body = { from: 'projects', select: [3] };
    const result = transformRequest(body, { schema: resolved, tableId: 'bqw3ryzab' });

    expect(result.from).toBe('bqw3ryzab');
  });

  it('should transform "to" field', () => {
    const body = { to: 'tasks', data: [] };
    const result = transformRequest(body, { schema: resolved, tableId: 'bqw4xyzcd' });

    expect(result.to).toBe('bqw4xyzcd');
  });

  it('should transform select array with aliases', () => {
    const body = { from: 'projects', select: ['name', 'status', 12] };
    const result = transformRequest(body, { schema: resolved });

    expect(result.select).toEqual([6, 7, 12]);
  });

  it('should transform sortBy array', () => {
    const body = {
      from: 'projects',
      sortBy: [
        { fieldId: 'dueDate', order: 'ASC' },
        { fieldId: 'name', order: 'DESC' },
      ],
    };
    const result = transformRequest(body, { schema: resolved });

    expect(result.sortBy).toEqual([
      { fieldId: 12, order: 'ASC' },
      { fieldId: 6, order: 'DESC' },
    ]);
  });

  it('should transform groupBy array', () => {
    const body = {
      from: 'projects',
      groupBy: [{ fieldId: 'status', grouping: 'equal-values' }],
    };
    const result = transformRequest(body, { schema: resolved });

    expect(result.groupBy).toEqual([{ fieldId: 7, grouping: 'equal-values' }]);
  });

  it('should transform where clause', () => {
    const body = {
      from: 'projects',
      where: "{'status'.EX.'Active'}AND{'assignee'.EX.'5'}",
    };
    const result = transformRequest(body, { schema: resolved });

    expect(result.where).toBe("{7.EX.'Active'}AND{15.EX.'5'}");
  });

  it('should transform where clause with quoted aliases', () => {
    const body = {
      from: 'projects',
      where: "{\"status\".EX.'Done'}",
    };
    const result = transformRequest(body, { schema: resolved });

    expect(result.where).toBe("{7.EX.'Done'}");
  });

  it('should pass through numeric field IDs in where', () => {
    const body = {
      from: 'projects',
      where: "{7.EX.'Active'}",
    };
    const result = transformRequest(body, { schema: resolved });

    expect(result.where).toBe("{7.EX.'Active'}");
  });

  it('should transform data array for upsert', () => {
    const body = {
      to: 'projects',
      data: [
        { name: { value: 'Project A' }, status: { value: 'Active' } },
        { name: { value: 'Project B' }, status: { value: 'Done' } },
      ],
    };
    const result = transformRequest(body, { schema: resolved });

    expect(result.data).toEqual([
      { '6': { value: 'Project A' }, '7': { value: 'Active' } },
      { '6': { value: 'Project B' }, '7': { value: 'Done' } },
    ]);
  });

  it('should handle mixed aliases and IDs in data', () => {
    const body = {
      to: 'projects',
      data: [{ name: { value: 'X' }, '99': { value: 'Custom' } }],
    };
    const result = transformRequest(body, { schema: resolved });

    expect(result.data).toEqual([
      { '6': { value: 'X' }, '99': { value: 'Custom' } },
    ]);
  });

  it('should pass through unchanged when no schema', () => {
    const body = { from: 'projects', select: ['name'] };
    const result = transformRequest(body, { schema: undefined });

    expect(result).toEqual(body);
  });
});

// =============================================================================
// Response Transformation Tests
// =============================================================================

describe('transformResponse', () => {
  const resolved = resolveSchema(testSchema);

  it('should transform field IDs to aliases', () => {
    const response = {
      data: [
        { '3': { value: 1 }, '6': { value: 'Project A' }, '7': { value: 'Active' } },
      ],
    };
    const result = transformResponse(response, {
      schema: resolved,
      tableId: 'bqw3ryzab',
    });

    expect(result.data[0]).toHaveProperty('id', 1);
    expect(result.data[0]).toHaveProperty('name', 'Project A');
    expect(result.data[0]).toHaveProperty('status', 'Active');
  });

  it('should unwrap { value: X } to just X', () => {
    const response = {
      data: [{ '6': { value: 'Test Name' } }],
    };
    const result = transformResponse(response, {
      schema: resolved,
      tableId: 'bqw3ryzab',
    });

    expect(result.data[0].name).toBe('Test Name');
    expect(result.data[0].name).not.toEqual({ value: 'Test Name' });
  });

  it('should keep numeric key for unknown fields but still unwrap', () => {
    const response = {
      data: [{ '6': { value: 'Name' }, '99': { value: 'Unknown Field' } }],
    };
    const result = transformResponse(response, {
      schema: resolved,
      tableId: 'bqw3ryzab',
    });

    expect(result.data[0].name).toBe('Name');
    expect(result.data[0]['99']).toBe('Unknown Field');
  });

  it('should handle null and undefined values', () => {
    const response = {
      data: [{ '6': { value: null }, '7': { value: undefined } }],
    };
    const result = transformResponse(response, {
      schema: resolved,
      tableId: 'bqw3ryzab',
    });

    expect(result.data[0].name).toBeNull();
    expect(result.data[0].status).toBeUndefined();
  });

  it('should handle arrays of values', () => {
    const response = {
      data: [
        {
          '15': {
            value: [
              { value: 'user1@example.com' },
              { value: 'user2@example.com' },
            ],
          },
        },
      ],
    };
    const result = transformResponse(response, {
      schema: resolved,
      tableId: 'bqw3ryzab',
    });

    expect(result.data[0].assignee).toEqual([
      'user1@example.com',
      'user2@example.com',
    ]);
  });

  it('should pass through non-object responses', () => {
    expect(transformResponse(null, { schema: resolved })).toBeNull();
    expect(transformResponse(undefined, { schema: resolved })).toBeUndefined();
    expect(transformResponse('string', { schema: resolved })).toBe('string');
    expect(transformResponse(123, { schema: resolved })).toBe(123);
  });

  it('should handle response without data array', () => {
    const response = { id: 'bqw3ryzab', name: 'Test Table' };
    const result = transformResponse(response, {
      schema: resolved,
      tableId: 'bqw3ryzab',
    });

    expect(result).toEqual({ id: 'bqw3ryzab', name: 'Test Table' });
  });

  it('should pass through unchanged when no tableId', () => {
    const response = {
      data: [{ '6': { value: 'Name' } }],
    };
    const result = transformResponse(response, {
      schema: resolved,
      tableId: undefined,
    });

    // Without tableId, we can't do field lookups
    expect(result).toEqual(response);
  });

  it('should handle empty data array', () => {
    const response = { data: [] };
    const result = transformResponse(response, {
      schema: resolved,
      tableId: 'bqw3ryzab',
    });

    expect(result.data).toEqual([]);
  });
});

// =============================================================================
// Table ID Extraction Tests
// =============================================================================

describe('extractTableIdFromRequest', () => {
  const resolved = resolveSchema(testSchema);

  it('should extract from "from" field with alias', () => {
    const body = { from: 'projects' };
    expect(extractTableIdFromRequest(body, resolved)).toBe('bqw3ryzab');
  });

  it('should extract from "to" field with alias', () => {
    const body = { to: 'tasks' };
    expect(extractTableIdFromRequest(body, resolved)).toBe('bqw4xyzcd');
  });

  it('should pass through raw table ID', () => {
    const body = { from: 'bqw3ryzab' };
    expect(extractTableIdFromRequest(body, resolved)).toBe('bqw3ryzab');
  });

  it('should return undefined for empty body', () => {
    expect(extractTableIdFromRequest(undefined)).toBeUndefined();
    expect(extractTableIdFromRequest({})).toBeUndefined();
  });

  it('should work without schema', () => {
    const body = { from: 'projects' };
    expect(extractTableIdFromRequest(body)).toBe('projects');
  });
});
