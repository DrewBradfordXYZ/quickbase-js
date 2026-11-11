import { describe, it, expect } from 'vitest';
import { createClient } from '../../src/index.js';

// Plain upsert values were wrapped in { value } only when the client had a
// schema; without one they went to QuickBase as given, which it rejects.
describe('upsert values', () => {
  function clientCapturing(options: Record<string, unknown> = {}) {
    const bodies: unknown[] = [];
    const fetchApi = (async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ data: [], metadata: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;
    const qb = createClient({
      realm: 'testcompany',
      auth: { type: 'user-token', userToken: 'token' },
      fetchApi,
      ...options,
    });
    return { qb, bodies };
  }

  it('wraps plain values without a schema', async () => {
    const { qb, bodies } = clientCapturing();
    await qb.upsert({ to: 'bqtable1', data: [{ '6': 'Alpha', '7': 42, '8': { value: 'kept' } }] });
    expect(bodies[0]).toMatchObject({
      to: 'bqtable1',
      data: [{ '6': { value: 'Alpha' }, '7': { value: 42 }, '8': { value: 'kept' } }],
    });
  });

  it('resolves aliases and wraps values with a schema', async () => {
    const { qb, bodies } = clientCapturing({
      schema: { tables: { projects: { id: 'bqtable1', fields: { name: 6, status: 7 } } } },
    });
    await qb.upsert({ to: 'projects', data: [{ name: 'Alpha', status: 'Active' }] });
    await qb.runQuery({ from: 'projects', select: ['name'], sortBy: [{ fieldId: 'status', order: 'ASC' }] });
    expect(bodies[0]).toMatchObject({ to: 'bqtable1', data: [{ '6': { value: 'Alpha' }, '7': { value: 'Active' } }] });
    expect(bodies[1]).toMatchObject({ from: 'bqtable1', select: [6], sortBy: [{ fieldId: 7, order: 'ASC' }] });
  });
});
