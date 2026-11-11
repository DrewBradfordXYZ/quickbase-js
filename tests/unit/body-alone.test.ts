import { describe, it, expect } from 'vitest';
import { createApiMethods } from '../../src/generated/client.js';

// An operation whose parameters are all optional query parameters, with a
// required body, accepts the body alone as well as (params, body). QuickBase
// can add an optional parameter to an operation that had none (createSolution
// gained alias), which would otherwise turn method(body) into
// method(params, body) and break callers.
describe('methods that accept the body alone', () => {
  const calls: Array<{ method: string; path: string; query?: unknown; body?: unknown }> = [];
  const api = createApiMethods(async <T>(options: { method: string; path: string; query?: unknown; body?: unknown }) => {
    calls.push(options);
    return {} as T;
  });

  it('sends the body when called with the body alone', async () => {
    calls.length = 0;
    await api.denyUsers(['5678.abcd']);
    expect(calls[0]).toMatchObject({ method: 'PUT', path: '/users/deny', body: ['5678.abcd'] });
    expect(calls[0].query).toEqual({ accountId: undefined });
  });

  it('sends params and body when called with both', async () => {
    calls.length = 0;
    await api.denyUsers({ accountId: 42 }, ['5678.abcd']);
    expect(calls[0]).toMatchObject({ method: 'PUT', path: '/users/deny', body: ['5678.abcd'], query: { accountId: 42 } });
  });
});
