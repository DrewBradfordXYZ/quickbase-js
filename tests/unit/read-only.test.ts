/**
 * Read-Only Mode Unit Tests
 *
 * Tests the defense-in-depth read-only mode for both JSON and XML APIs.
 */

import { describe, it, expect } from 'vitest';
import { createClient, ReadOnlyError } from '../../src/index.js';
import { createTrackedMockFetch, loadResponse } from '../helpers/fixtures.js';

describe('JSON API Read-Only Mode', () => {
  /**
   * Helper to create a read-only client with mocked fetch
   */
  function createReadOnlyClient() {
    // Use a real fixture for the mock response
    const fixture = loadResponse('apps', 'get-app', 200);
    const { fetch: mockFetch, getCalls } = createTrackedMockFetch([fixture]);

    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'user-token',
        userToken: 'test-token-123',
      },
      fetchApi: mockFetch,
      readOnly: true,
    });

    return { client, getCalls };
  }

  describe('Blocked endpoints (Layer 1: Explicit blocklist)', () => {
    it('should block POST /records (upsert)', async () => {
      const { client } = createReadOnlyClient();

      try {
        await client.upsert({
          to: 'bqxyz123',
          data: [{ '6': { value: 'test' } }],
        });
        expect.fail('Should have thrown ReadOnlyError');
      } catch (err) {
        expect(err).toBeInstanceOf(ReadOnlyError);
        const roErr = err as ReadOnlyError;
        expect(roErr.method).toBe('POST');
        expect(roErr.path).toBe('/records');
        expect(roErr.action).toBeUndefined();
      }
    });

    it('should block DELETE /records (deleteRecords)', async () => {
      const { client } = createReadOnlyClient();

      try {
        await client.deleteRecords({
          from: 'bqxyz123',
          where: '{3.GT.0}',
        });
        expect.fail('Should have thrown ReadOnlyError');
      } catch (err) {
        expect(err).toBeInstanceOf(ReadOnlyError);
        const roErr = err as ReadOnlyError;
        expect(roErr.method).toBe('DELETE');
        expect(roErr.path).toBe('/records');
      }
    });

    it('should block POST /apps (createApp)', async () => {
      const { client } = createReadOnlyClient();

      try {
        await client.createApp({
          name: 'Test App',
        });
        expect.fail('Should have thrown ReadOnlyError');
      } catch (err) {
        expect(err).toBeInstanceOf(ReadOnlyError);
        const roErr = err as ReadOnlyError;
        expect(roErr.method).toBe('POST');
        expect(roErr.path).toBe('/apps');
      }
    });

    it('should block DELETE /apps/{appId} (deleteApp)', async () => {
      const { client } = createReadOnlyClient();

      try {
        await client.deleteApp({ appId: 'bqxyz123' });
        expect.fail('Should have thrown ReadOnlyError');
      } catch (err) {
        expect(err).toBeInstanceOf(ReadOnlyError);
        const roErr = err as ReadOnlyError;
        expect(roErr.method).toBe('DELETE');
        expect(roErr.path).toContain('/apps/');
      }
    });

    it('should block POST /tables (createTable)', async () => {
      const { client } = createReadOnlyClient();

      try {
        await client.createTable({
          appId: 'bqxyz123',
          name: 'Test Table',
        });
        expect.fail('Should have thrown ReadOnlyError');
      } catch (err) {
        expect(err).toBeInstanceOf(ReadOnlyError);
        const roErr = err as ReadOnlyError;
        expect(roErr.method).toBe('POST');
      }
    });

    it('should block POST /fields (createField)', async () => {
      const { client } = createReadOnlyClient();

      try {
        await client.createField({
          tableId: 'bqxyz123',
          label: 'Test Field',
          fieldType: 'text',
        });
        expect.fail('Should have thrown ReadOnlyError');
      } catch (err) {
        expect(err).toBeInstanceOf(ReadOnlyError);
        const roErr = err as ReadOnlyError;
        expect(roErr.method).toBe('POST');
        expect(roErr.path).toBe('/fields');
      }
    });
  });

  describe('Allowed endpoints (Layer 2: Read-only POST exceptions)', () => {
    it('should allow POST /records/query (runQuery)', async () => {
      const { client, getCalls } = createReadOnlyClient();

      // The mock will return the response, no ReadOnlyError should be thrown
      try {
        await client.runQuery({ from: 'bqxyz123' });
        // If we get here, the call was allowed (good!)
        const calls = getCalls();
        expect(calls.length).toBe(1);
        expect(calls[0].url).toContain('/records/query');
      } catch (err) {
        // Should not be a ReadOnlyError
        expect(err).not.toBeInstanceOf(ReadOnlyError);
      }
    });

    it('should allow GET /apps/{appId} (getApp)', async () => {
      const { client, getCalls } = createReadOnlyClient();

      try {
        await client.getApp({ appId: 'bqxyz123' });
        const calls = getCalls();
        expect(calls.length).toBe(1);
        expect(calls[0].method).toBe('GET');
      } catch (err) {
        expect(err).not.toBeInstanceOf(ReadOnlyError);
      }
    });

    it('should allow GET /tables (getTables)', async () => {
      const { client, getCalls } = createReadOnlyClient();

      try {
        await client.getTables({ appId: 'bqxyz123' });
        const calls = getCalls();
        expect(calls.length).toBe(1);
        expect(calls[0].method).toBe('GET');
      } catch (err) {
        expect(err).not.toBeInstanceOf(ReadOnlyError);
      }
    });

    it('should allow GET /fields (getFields)', async () => {
      const { client, getCalls } = createReadOnlyClient();

      try {
        await client.getFields({ tableId: 'bqxyz123' });
        const calls = getCalls();
        expect(calls.length).toBe(1);
        expect(calls[0].method).toBe('GET');
      } catch (err) {
        expect(err).not.toBeInstanceOf(ReadOnlyError);
      }
    });
  });

  describe('Special cases (GET endpoints that write)', () => {
    it('should block GET /solutions/fromrecord', async () => {
      const { client } = createReadOnlyClient();

      try {
        await client.request({
          method: 'GET',
          path: '/solutions/fromrecord',
          query: { tableId: 'bqxyz123', recordId: 1 },
        });
        expect.fail('Should have thrown ReadOnlyError');
      } catch (err) {
        expect(err).toBeInstanceOf(ReadOnlyError);
        const roErr = err as ReadOnlyError;
        expect(roErr.method).toBe('GET');
        expect(roErr.path).toContain('/solutions/fromrecord');
      }
    });

    it('should block GET /docTemplates/{id}/generate', async () => {
      const { client } = createReadOnlyClient();

      try {
        await client.request({
          method: 'GET',
          path: '/docTemplates/abc123/generate',
          query: { tableId: 'bqxyz123', recordId: 1 },
        });
        expect.fail('Should have thrown ReadOnlyError');
      } catch (err) {
        expect(err).toBeInstanceOf(ReadOnlyError);
        const roErr = err as ReadOnlyError;
        expect(roErr.method).toBe('GET');
        expect(roErr.path).toContain('/docTemplates/');
      }
    });
  });

  describe('Layer 2: HTTP method check (catch-all)', () => {
    it('should block unknown PUT endpoints', async () => {
      const { client } = createReadOnlyClient();

      try {
        await client.request({
          method: 'PUT',
          path: '/unknown/endpoint',
          body: { data: 'test' },
        });
        expect.fail('Should have thrown ReadOnlyError');
      } catch (err) {
        expect(err).toBeInstanceOf(ReadOnlyError);
        const roErr = err as ReadOnlyError;
        expect(roErr.method).toBe('PUT');
      }
    });

    it('should block unknown DELETE endpoints', async () => {
      const { client } = createReadOnlyClient();

      try {
        await client.request({
          method: 'DELETE',
          path: '/unknown/resource/123',
        });
        expect.fail('Should have thrown ReadOnlyError');
      } catch (err) {
        expect(err).toBeInstanceOf(ReadOnlyError);
        const roErr = err as ReadOnlyError;
        expect(roErr.method).toBe('DELETE');
      }
    });

    it('should block unknown PATCH endpoints', async () => {
      const { client } = createReadOnlyClient();

      try {
        await client.request({
          method: 'PATCH',
          path: '/unknown/resource/123',
          body: { data: 'test' },
        });
        expect.fail('Should have thrown ReadOnlyError');
      } catch (err) {
        expect(err).toBeInstanceOf(ReadOnlyError);
        const roErr = err as ReadOnlyError;
        expect(roErr.method).toBe('PATCH');
      }
    });
  });

  describe('Client configuration', () => {
    it('should not block when readOnly is false', async () => {
      const fixture = loadResponse('records', 'upsert', 200);
      const { fetch: mockFetch, getCalls } = createTrackedMockFetch([fixture]);

      const client = createClient({
        realm: 'testcompany',
        auth: {
          type: 'user-token',
          userToken: 'test-token-123',
        },
        fetchApi: mockFetch,
        readOnly: false,
      });

      // Should not throw
      await client.upsert({
        to: 'bqxyz123',
        data: [{ '6': { value: 'test' } }],
      });

      const calls = getCalls();
      expect(calls.length).toBe(1);
    });

    it('should default to readOnly: false', async () => {
      const fixture = loadResponse('records', 'upsert', 200);
      const { fetch: mockFetch, getCalls } = createTrackedMockFetch([fixture]);

      const client = createClient({
        realm: 'testcompany',
        auth: {
          type: 'user-token',
          userToken: 'test-token-123',
        },
        fetchApi: mockFetch,
        // readOnly not specified
      });

      // Should not throw
      await client.upsert({
        to: 'bqxyz123',
        data: [{ '6': { value: 'test' } }],
      });

      const calls = getCalls();
      expect(calls.length).toBe(1);
    });

    it('should expose readOnly in getConfig()', () => {
      const { client } = createReadOnlyClient();
      const config = client.getConfig();
      expect(config.readOnly).toBe(true);
    });
  });
});

describe('ReadOnlyError', () => {
  it('should create error with method and path', () => {
    const err = new ReadOnlyError('POST', '/v1/records');
    expect(err.method).toBe('POST');
    expect(err.path).toBe('/v1/records');
    expect(err.action).toBeUndefined();
    expect(err.message).toBe('Read-only mode: write operation blocked (POST /v1/records)');
  });

  it('should create error with action for XML API', () => {
    const err = new ReadOnlyError('POST', '/db/realm', 'API_SetDBVar');
    expect(err.method).toBe('POST');
    expect(err.path).toBe('/db/realm');
    expect(err.action).toBe('API_SetDBVar');
    expect(err.message).toBe('Read-only mode: write operation blocked (XML action: API_SetDBVar)');
  });

  it('should serialize to JSON', () => {
    const err = new ReadOnlyError('DELETE', '/v1/apps/abc123');
    const json = err.toJSON();
    expect(json.name).toBe('ReadOnlyError');
    expect(json.method).toBe('DELETE');
    expect(json.path).toBe('/v1/apps/abc123');
    expect(json.action).toBeUndefined();
    expect(json.message).toBeDefined();
  });
});
