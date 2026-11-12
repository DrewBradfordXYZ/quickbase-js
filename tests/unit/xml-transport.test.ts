/**
 * XML API requests go through the client's auth, retries and errors.
 *
 * createXmlClient called fetch itself: no retry, no proactive throttle, and a
 * 429 or 5xx became a plain Error.
 */

import { describe, it, expect } from 'vitest';
import { createClient, createXmlClient, RateLimitError, ServerError } from '../../src/index.js';

const OK = '<?xml version="1.0" ?><qdbapi><action>API_GetDBVar</action><errcode>0</errcode><errtext>No error</errtext><value>42</value></qdbapi>';
const SET_OK = '<?xml version="1.0" ?><qdbapi><action>API_SetDBVar</action><errcode>0</errcode><errtext>No error</errtext></qdbapi>';

function setup(respond: (call: number) => Response) {
  const bodies: string[] = [];
  let calls = 0;
  const fetchApi = (async (_url: string, init?: RequestInit) => {
    calls++;
    bodies.push(String(init?.body));
    return respond(calls);
  }) as unknown as typeof fetch;
  const qb = createClient({
    realm: 'testcompany',
    auth: { type: 'user-token', userToken: 'secret-token' },
    fetchApi,
    appToken: 'app-token',
    retry: { maxAttempts: 3, initialDelayMs: 1, maxDelayMs: 1 },
  });
  return { xml: createXmlClient(qb), calls: () => calls, bodies };
}

describe('XML requests', () => {
  it('retries a read after a 5xx and sends tokens in the body', async () => {
    const { xml, calls, bodies } = setup((n) => (n < 2 ? new Response('busy', { status: 503 }) : new Response(OK)));

    expect(await xml.getDBVar('bqapp', 'answer')).toBe('42');
    expect(calls()).toBe(2);
    expect(bodies[1]).toContain('<usertoken>secret-token</usertoken>');
    expect(bodies[1]).toContain('<apptoken>app-token</apptoken>');
  });

  it('does not retry a write action after a 5xx', async () => {
    const { xml, calls } = setup(() => new Response('busy', { status: 503 }));

    await expect(xml.setDBVar('bqapp', 'answer', '43')).rejects.toBeInstanceOf(ServerError);
    expect(calls()).toBe(1);
  });

  it('retries a write after a 429 and throws RateLimitError when it runs out', async () => {
    const limited = () => new Response('slow down', { status: 429, headers: { 'Retry-After': '0' } });
    const ok = setup((n) => (n < 2 ? limited() : new Response(SET_OK)));
    await ok.xml.setDBVar('bqapp', 'answer', '43');
    expect(ok.calls()).toBe(2);

    const never = setup(() => limited());
    await expect(never.xml.getDBVar('bqapp', 'answer')).rejects.toBeInstanceOf(RateLimitError);
    expect(never.calls()).toBe(3);
  });
});
