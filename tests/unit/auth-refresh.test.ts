/**
 * A 401 retries with a new token when the auth strategy can get one.
 *
 * The retry loop threw any error that wasn't retryable before it reached the
 * refresh, and a 401 never is, so an expired temp token failed the request
 * instead of being fetched again.
 */

import { describe, it, expect } from 'vitest';
import { createClient } from '../../src/index.js';

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('401 token refresh', () => {
  it('fetches a new temp token and retries', async () => {
    let tokensIssued = 0;
    const apiAuth: string[] = [];

    const fetchApi = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/auth/temporary/')) {
        tokensIssued++;
        return json(200, { temporaryAuthorization: `temp-${tokensIssued}` });
      }
      const auth = (init?.headers as Record<string, string>)['Authorization'];
      apiAuth.push(auth);
      if (auth === 'QB-TEMP-TOKEN temp-1') {
        return json(401, { message: 'Invalid token' });
      }
      return json(200, { id: 'bqapp123', name: 'App' });
    }) as typeof fetch;

    const client = createClient({
      realm: 'testcompany',
      auth: { type: 'temp-token', userToken: 'user-token' },
      fetchApi,
    });

    const app = await client.getApp({ appId: 'bqapp123' });

    expect(app.name).toBe('App');
    expect(tokensIssued).toBe(2);
    expect(apiAuth).toEqual(['QB-TEMP-TOKEN temp-1', 'QB-TEMP-TOKEN temp-2']);
  });

  it('does not retry a 401 the strategy cannot refresh', async () => {
    let calls = 0;
    const fetchApi = (async () => {
      calls++;
      return json(401, { message: 'Invalid token' });
    }) as typeof fetch;

    const client = createClient({
      realm: 'testcompany',
      auth: { type: 'user-token', userToken: 'bad' },
      fetchApi,
    });

    await expect(client.getApp({ appId: 'bqapp123' })).rejects.toMatchObject({ statusCode: 401 });
    expect(calls).toBe(1);
  });
});
