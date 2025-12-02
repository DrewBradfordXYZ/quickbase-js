/**
 * Client unit tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '../../src/index.js';
import {
  loadResponse,
  createMockResponse,
  createTrackedMockFetch,
  withHeaders,
} from '../helpers/fixtures.js';
import { RateLimitError, AuthenticationError } from '../../src/core/errors.js';

describe('createClient', () => {
  it('should create a client with user token auth', () => {
    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'user-token',
        userToken: 'test-token-123',
      },
    });

    expect(client).toBeDefined();
    expect(client.request).toBeInstanceOf(Function);
    expect(client.getConfig).toBeInstanceOf(Function);
  });

  it('should validate realm format', () => {
    expect(() =>
      createClient({
        realm: 'testcompany.quickbase.com', // Invalid - should not include domain
        auth: {
          type: 'user-token',
          userToken: 'test-token-123',
        },
      })
    ).toThrow('Realm should be just the subdomain');
  });

  it('should require auth configuration', () => {
    expect(() =>
      createClient({
        realm: 'testcompany',
        auth: undefined as unknown as { type: 'user-token'; userToken: string },
      })
    ).toThrow('Authentication configuration is required');
  });

  it('should require user token for user-token auth', () => {
    expect(() =>
      createClient({
        realm: 'testcompany',
        auth: {
          type: 'user-token',
          userToken: '', // Empty token
        },
      })
    ).toThrow('User token is required');
  });
});

describe('client.request', () => {
  it('should make successful GET request', async () => {
    const fixture = loadResponse('apps', 'get-app', 200);
    const { fetch: mockFetch, getCalls } = createTrackedMockFetch([fixture]);

    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'user-token',
        userToken: 'test-token-123',
      },
      fetchApi: mockFetch,
      convertDates: false, // Disable date conversion for exact comparison
    });

    const result = await client.request({
      method: 'GET',
      path: '/apps/bpqe82s1',
    });

    expect(result).toEqual(fixture.body);
    expect(getCalls().length).toBe(1);

    const call = getCalls()[0];
    expect(call.url).toContain('/apps/bpqe82s1');
    expect(call.init?.headers).toMatchObject({
      'Authorization': 'QB-USER-TOKEN test-token-123',
      'QB-Realm-Hostname': 'testcompany.quickbase.com',
    });
  });

  it('should handle 401 authentication error', async () => {
    const fixture = loadResponse('apps', 'get-app', 401);
    const { fetch: mockFetch } = createTrackedMockFetch([fixture]);

    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'user-token',
        userToken: 'invalid-token',
      },
      fetchApi: mockFetch,
    });

    await expect(
      client.request({
        method: 'GET',
        path: '/apps/bpqe82s1',
      })
    ).rejects.toThrow(AuthenticationError);
  });

  it('should handle rate limiting with retry', async () => {
    const rateLimitFixture = loadResponse('apps', 'get-app', 429);
    const successFixture = loadResponse('apps', 'get-app', 200);

    const { fetch: mockFetch, getCalls } = createTrackedMockFetch([
      rateLimitFixture,
      successFixture,
    ]);

    const onRateLimit = vi.fn();

    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'user-token',
        userToken: 'test-token',
      },
      fetchApi: mockFetch,
      convertDates: false, // Disable date conversion for exact comparison
      rateLimit: {
        onRateLimit,
        retry: {
          maxAttempts: 3,
          initialDelayMs: 10, // Fast for testing
          maxDelayMs: 100,
        },
      },
    });

    const result = await client.request({
      method: 'GET',
      path: '/apps/bpqe82s1',
    });

    expect(result).toEqual(successFixture.body);
    expect(getCalls().length).toBe(2);
    expect(onRateLimit).toHaveBeenCalledTimes(1);
    expect(onRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        httpStatus: 429,
        retryAfter: 5,
      })
    );
  });

  it('should throw after max retries exhausted', async () => {
    // Use withHeaders to remove Retry-After so test uses fast backoff
    const rateLimitFixture = withHeaders(
      loadResponse('apps', 'get-app', 429),
      { 'Retry-After': undefined }
    );

    const { fetch: mockFetch } = createTrackedMockFetch([
      rateLimitFixture,
      rateLimitFixture,
      rateLimitFixture,
    ]);

    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'user-token',
        userToken: 'test-token',
      },
      fetchApi: mockFetch,
      rateLimit: {
        retry: {
          maxAttempts: 3,
          initialDelayMs: 10,
          maxDelayMs: 100,
        },
      },
    });

    await expect(
      client.request({
        method: 'GET',
        path: '/apps/bpqe82s1',
      })
    ).rejects.toThrow(RateLimitError);
  });

  it('should include query parameters in request', async () => {
    const fixture = loadResponse('apps', 'get-app', 200);
    const { fetch: mockFetch, getCalls } = createTrackedMockFetch([fixture]);

    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'user-token',
        userToken: 'test-token',
      },
      fetchApi: mockFetch,
    });

    await client.request({
      method: 'GET',
      path: '/tables',
      query: {
        appId: 'bpqe82s1',
        includeDeleted: true,
      },
    });

    const call = getCalls()[0];
    expect(call.url).toContain('appId=bpqe82s1');
    expect(call.url).toContain('includeDeleted=true');
  });

  it('should send request body for POST requests', async () => {
    const fixture = loadResponse('apps', 'get-app', 200); // Reusing fixture for simplicity
    const { fetch: mockFetch, getCalls } = createTrackedMockFetch([fixture]);

    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'user-token',
        userToken: 'test-token',
      },
      fetchApi: mockFetch,
    });

    await client.request({
      method: 'POST',
      path: '/apps',
      body: {
        name: 'New App',
        description: 'Test app',
      },
    });

    const call = getCalls()[0];
    expect(call.init?.method).toBe('POST');
    expect(call.init?.body).toBe(JSON.stringify({
      name: 'New App',
      description: 'Test app',
    }));
  });
});

describe('typed API methods', () => {
  it('should have typed getApp method', async () => {
    const fixture = loadResponse('apps', 'get-app', 200);
    const { fetch: mockFetch, getCalls } = createTrackedMockFetch([fixture]);

    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'user-token',
        userToken: 'test-token',
      },
      fetchApi: mockFetch,
      convertDates: false,
    });

    // Use the typed method
    const result = await client.getApp({ appId: 'bpqe82s1' });

    // Verify the call was made correctly
    const call = getCalls()[0];
    expect(call.url).toContain('/apps/bpqe82s1');
    expect(call.init?.method).toBe('GET');

    // Verify typed response
    expect(result.name).toBe('Test Application');
    expect(result.id).toBe('bpqe82s1');
  });

  it('should convert date strings to Date objects by default', async () => {
    const fixture = loadResponse('apps', 'get-app', 200);
    const { fetch: mockFetch } = createTrackedMockFetch([fixture]);

    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'user-token',
        userToken: 'test-token',
      },
      fetchApi: mockFetch,
      // convertDates defaults to true
    });

    const result = await client.getApp({ appId: 'bpqe82s1' });

    // Date fields should be converted to Date objects
    expect(result.created).toBeInstanceOf(Date);
    expect(result.updated).toBeInstanceOf(Date);
    expect((result.created as unknown as Date).toISOString()).toBe('2024-01-15T10:30:00.000Z');
    expect((result.updated as unknown as Date).toISOString()).toBe('2024-03-20T14:45:00.000Z');

    // Non-date fields should remain as-is
    expect(result.name).toBe('Test Application');
    expect(result.id).toBe('bpqe82s1');
  });

  it('should have typed createApp method with body', async () => {
    const fixture = loadResponse('apps', 'get-app', 200); // Reusing fixture
    const { fetch: mockFetch, getCalls } = createTrackedMockFetch([fixture]);

    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'user-token',
        userToken: 'test-token',
      },
      fetchApi: mockFetch,
    });

    // Use the typed method with typed body
    await client.createApp({
      name: 'My New App',
      description: 'A test app',
    });

    const call = getCalls()[0];
    expect(call.url).toContain('/apps');
    expect(call.init?.method).toBe('POST');
    expect(JSON.parse(call.init?.body as string)).toEqual({
      name: 'My New App',
      description: 'A test app',
    });
  });
});
