/**
 * Which failures retry, cancelling, and line errors.
 *
 * A write that timed out or got a 5xx may have been applied: an upsert sent
 * again could add its records twice. Writes retry only after a 429 (not
 * processed), a refreshed 401, or a connection that never opened.
 */

import { describe, it, expect } from 'vitest';
import { createClient, LineErrorsError, NetworkError, ServerError } from '../../src/index.js';

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const QUERY_OK = { data: [], fields: [], metadata: { totalRecords: 0, numRecords: 0, numFields: 0, skip: 0 } };

function client(respond: (call: number) => Response | Promise<Response>, extra: Record<string, unknown> = {}) {
  let calls = 0;
  const fetchApi = (async () => respond(++calls)) as unknown as typeof fetch;
  const qb = createClient({
    realm: 'testcompany',
    auth: { type: 'user-token', userToken: 'token' },
    fetchApi,
    retry: { maxAttempts: 3, initialDelayMs: 1, maxDelayMs: 1 },
    ...extra,
  });
  return { qb, calls: () => calls };
}

describe('retries', () => {
  it('does not retry an upsert after a 5xx', async () => {
    const { qb, calls } = client(() => json(503, { message: 'busy' }));
    await expect(qb.upsert({ to: 'bqtable', data: [{ 6: 'a' }] })).rejects.toBeInstanceOf(ServerError);
    expect(calls()).toBe(1);
  });

  it('retries an upsert after a 429', async () => {
    const { qb, calls } = client((n) => (n < 3 ? json(429, { message: 'slow down' }) : json(200, { data: [], metadata: {} })));
    await qb.upsert({ to: 'bqtable', data: [{ 6: 'a' }] });
    expect(calls()).toBe(3);
  });

  it('retries a query (a POST that reads) after a 5xx', async () => {
    const { qb, calls } = client((n) => (n < 3 ? json(503, { message: 'busy' }) : json(200, QUERY_OK)));
    await qb.runQuery({ from: 'bqtable' });
    expect(calls()).toBe(3);
  });

  it('retries a read after a network error, and wraps it', async () => {
    const { qb, calls } = client((n) => {
      if (n < 3) throw new TypeError('fetch failed');
      return json(200, QUERY_OK);
    });
    await qb.runQuery({ from: 'bqtable' });
    expect(calls()).toBe(3);

    const { qb: down } = client(() => {
      throw new TypeError('fetch failed');
    });
    await expect(down.runQuery({ from: 'bqtable' })).rejects.toBeInstanceOf(NetworkError);
  });

  it('retries a write only when the connection never opened', async () => {
    const refused = Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } });
    const reset = Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNRESET' } });

    const a = client((n) => {
      if (n < 2) throw refused;
      return json(200, { data: [], metadata: {} });
    });
    await a.qb.upsert({ to: 'bqtable', data: [{ 6: 'a' }] });
    expect(a.calls()).toBe(2);

    const b = client(() => {
      throw reset;
    });
    await expect(b.qb.upsert({ to: 'bqtable', data: [{ 6: 'a' }] })).rejects.toBeInstanceOf(NetworkError);
    expect(b.calls()).toBe(1);
  });
});

describe('withSignal', () => {
  it('cancels a request in flight with the signal\'s reason', async () => {
    let calls = 0;
    const fetchApi = ((_url: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        calls++;
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      })) as unknown as typeof fetch;
    const qb = createClient({ realm: 'testcompany', auth: { type: 'user-token', userToken: 'token' }, fetchApi });

    const controller = new AbortController();
    const pending = qb.withSignal(controller.signal).runQuery({ from: 'bqtable' });
    const reason = new Error('user left the page');
    setTimeout(() => controller.abort(reason), 10);

    await expect(pending).rejects.toBe(reason);
    expect(calls).toBe(1);
  });

  it('cancels a retry wait', async () => {
    const { qb, calls } = client(() => json(503, { message: 'busy' }), {
      retry: { maxAttempts: 3, initialDelayMs: 60_000, maxDelayMs: 60_000 },
    });
    const controller = new AbortController();
    const pending = qb.withSignal(controller.signal).runQuery({ from: 'bqtable' });
    setTimeout(() => controller.abort(), 20);

    const started = Date.now();
    await expect(pending).rejects.toBeDefined();
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(calls()).toBe(1);
  });

  it('does not start a request whose signal already aborted', async () => {
    const { qb, calls } = client(() => json(200, QUERY_OK));
    const controller = new AbortController();
    controller.abort();
    await expect(qb.withSignal(controller.signal).runQuery({ from: 'bqtable' })).rejects.toBeDefined();
    expect(calls()).toBe(0);
  });
});

describe('throwOnLineErrors', () => {
  const partial = {
    data: [],
    metadata: {
      createdRecordIds: [1, 2],
      lineErrors: { 2: ['Incompatible value for field with ID "7".'] },
      totalNumberOfRecordsProcessed: 2,
      unchangedRecordIds: [],
      updatedRecordIds: [],
    },
  };

  it('returns line errors in metadata by default', async () => {
    const { qb } = client(() => json(207, partial));
    const result = await qb.upsert({ to: 'bqtable', data: [{ 6: 'a' }, { 6: 'b' }] });
    expect(result.metadata?.lineErrors).toEqual(partial.metadata.lineErrors);
  });

  it('throws them, with the response, when asked', async () => {
    const { qb, calls } = client(() => json(207, partial), { throwOnLineErrors: true });
    let error: unknown;
    try {
      await qb.upsert({ to: 'bqtable', data: [{ 6: 'a' }, { 6: 'b' }] });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(LineErrorsError);
    expect((error as LineErrorsError).message).toContain('record 2: Incompatible value');
    expect(((error as LineErrorsError).response as typeof partial).metadata.createdRecordIds).toEqual([1, 2]);
    expect(calls()).toBe(1); // not retried
  });
});
