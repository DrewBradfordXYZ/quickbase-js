/**
 * Typed schemas at runtime: fields as { id, type }, the generator's output,
 * and the aliases typed methods accept (runReport's tableId, upsert's
 * fieldsToReturn and mergeFieldId).
 */

import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createClient, type Schema } from '../../src/index.js';
import { formatAsTypeScript, loadExistingSchema, mergeSchemas } from '../../src/cli/schema.js';

const schema = {
  tables: {
    projects: {
      id: 'bqprojects',
      fields: {
        recordId: { id: 3, type: 'recordid' },
        name: { id: 6, type: 'text' },
        dueDate: { id: 7, type: 'date' },
        link: { id: 13, type: 'url', mode: 'formula' },
      },
    },
  },
} as const satisfies Schema;

function client() {
  const calls: { url: string; body?: unknown }[] = [];
  const fetchApi = (async (url: string, init?: RequestInit) => {
    calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return new Response(
      JSON.stringify({
        fields: [
          { id: 6, label: 'Name', type: 'text' },
          { id: 7, label: 'Due', type: 'date' },
        ],
        data: [{ 6: { value: 'Alpha' }, 7: { value: '2024-01-15' } }],
        metadata: { totalRecords: 1, numRecords: 1, numFields: 2, skip: 0 },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }) as unknown as typeof fetch;
  const qb = createClient({ realm: 'r', auth: { type: 'user-token', userToken: 't' }, fetchApi, schema });
  return { qb, calls };
}

describe('schema fields as { id, type }', () => {
  it('resolves names to IDs and back', async () => {
    const { qb, calls } = client();
    const result = await qb.runQuery({ from: 'projects', select: ['name', 'dueDate'] });

    expect(calls[0]!.body).toMatchObject({ from: 'bqprojects', select: [6, 7] });
    expect(result.data[0]!.name).toBe('Alpha');
    expect((result.data[0]!.dueDate as { toISODate(): string }).toISODate()).toBe('2024-01-15');
  });

  // runReport resolved the alias only to pick a token; the URL sent it as given
  it("sends runReport's table alias as its ID", async () => {
    const { qb, calls } = client();
    await qb.runReport({ reportId: '5', tableId: 'projects' });
    expect(calls[0]!.url).toContain('tableId=bqprojects');
  });

  it("resolves upsert's fieldsToReturn and mergeFieldId", async () => {
    const { qb, calls } = client();
    await qb.upsert({ to: 'projects', data: [{ name: 'Alpha' }], fieldsToReturn: ['name', 7], mergeFieldId: 'name' });
    expect(calls[0]!.body).toMatchObject({ to: 'bqprojects', fieldsToReturn: [6, 7], mergeFieldId: 6 });
  });
});

describe('schema generator output', () => {
  it('writes typed fields as const, and reads them back', async () => {
    const ts = formatAsTypeScript(schema);
    expect(ts).toContain("dueDate: { id: 7, type: 'date' }");
    expect(ts).toContain("link: { id: 13, type: 'url', mode: 'formula' }");
    expect(ts).toContain('} as const satisfies Schema;');

    const dir = mkdtempSync(join(tmpdir(), 'qb-schema-'));
    writeFileSync(join(dir, 'schema.ts'), ts);
    expect(await loadExistingSchema(join(dir, 'schema.ts'), 'ts')).toEqual(schema);
  });

  it('reads the older format (fields as IDs, typed as Schema)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'qb-schema-'));
    const file = join(dir, 'schema.ts');
    writeFileSync(file, "import type { Schema } from 'quickbase-js';\n\nexport const schema: Schema = {\n  tables: { projects: { id: 'bqprojects', fields: { name: 6 } } },\n};\n");
    expect(await loadExistingSchema(file, 'ts')).toEqual({ tables: { projects: { id: 'bqprojects', fields: { name: 6 } } } });
  });

  it('merge keeps renamed aliases and takes types from QuickBase', () => {
    const existing: Schema = { tables: { work: { id: 'bqprojects', fields: { title: 6, due: 7 } } } };
    const { merged, stats } = mergeSchemas(existing, schema);

    expect(merged.tables.work!.fields).toEqual({
      recordId: { id: 3, type: 'recordid' },
      title: { id: 6, type: 'text' },
      due: { id: 7, type: 'date' },
      link: { id: 13, type: 'url', mode: 'formula' },
    });
    expect(stats).toMatchObject({ fieldsPreserved: 2, fieldsAdded: 2 });
  });
});
