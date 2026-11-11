import { describe, it, expect } from 'vitest';
import { createClient } from '../../src/index.js';

// Solutions are QBL (YAML), not JSON: createSolution sends it as given with
// its content type, and exportSolution returns it as text. Both used to go
// through JSON.stringify / response.json().
describe('non-JSON request and response bodies', () => {
  const qbl = 'Solution:\n  Name: Example solution\nVersion: 0.2\nResources: {}\n';

  function clientReturning(body: string, contentType: string) {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchApi = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(body, { status: 200, headers: { 'Content-Type': contentType } });
    }) as typeof fetch;
    const client = createClient({
      realm: 'testcompany',
      auth: { type: 'user-token', userToken: 'test-token-123' },
      fetchApi,
    });
    return { client, calls };
  }

  it('sends a YAML body as given, with its content type', async () => {
    const { client, calls } = clientReturning('{"solutionId":"abc"}', 'application/json');
    await client.createSolution(qbl);
    const headers = calls[0].init.headers as Record<string, string>;
    expect(calls[0].init.body).toBe(qbl);
    expect(headers['Content-Type']).toBe('application/x-yaml');
  });

  it('returns a YAML response as text', async () => {
    const { client } = clientReturning(qbl, 'application/x-yaml');
    const result = await client.exportSolution({ solutionId: 'abc' });
    expect(result).toBe(qbl);
  });
});
