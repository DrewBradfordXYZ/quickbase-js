/**
 * Pagination unit tests
 */

import { describe, it, expect } from 'vitest';
import { createClient } from '../../src/index.js';
import {
  loadPagedResponse,
  createTrackedMockFetch,
} from '../helpers/fixtures.js';
import type { RunQueryResponse } from '../../src/generated/types.js';

describe('Pagination - fluent API', () => {
  it('should return single page when directly awaited (default behavior)', async () => {
    const fixture = loadPagedResponse<RunQueryResponse>('records', 'run-query', 200, 'page1');
    const { fetch: mockFetch, getCalls } = createTrackedMockFetch([fixture]);

    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'user-token',
        userToken: 'test-token',
      },
      fetchApi: mockFetch,
    });

    // Direct await should return single page
    const result = await client.runQuery({
      from: 'bpqe82s1',
    });

    expect(getCalls().length).toBe(1);
    expect(result.data).toHaveLength(3);
    expect(result.metadata.totalRecords).toBe(7);
    expect(result.metadata.skip).toBe(0);
  });

  it('should fetch all pages when .all() is called', async () => {
    const page1 = loadPagedResponse<RunQueryResponse>('records', 'run-query', 200, 'page1');
    const page2 = loadPagedResponse<RunQueryResponse>('records', 'run-query', 200, 'page2');
    const page3 = loadPagedResponse<RunQueryResponse>('records', 'run-query', 200, 'page3');

    const { fetch: mockFetch, getCalls } = createTrackedMockFetch([page1, page2, page3]);

    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'user-token',
        userToken: 'test-token',
      },
      fetchApi: mockFetch,
    });

    // Use .all() to fetch all pages
    const result = await client.runQuery({
      from: 'bpqe82s1',
    }).all();

    // Should have made 3 API calls
    expect(getCalls().length).toBe(3);

    // Should have combined all records
    expect(result.data).toHaveLength(7);
    expect(result.metadata.numRecords).toBe(7);

    // Verify records are in correct order
    expect((result.data![0] as Record<string, { value: unknown }>)['3'].value).toBe(1);
    expect((result.data![6] as Record<string, { value: unknown }>)['3'].value).toBe(7);
  });

  it('should respect limit in .paginate()', async () => {
    const page1 = loadPagedResponse<RunQueryResponse>('records', 'run-query', 200, 'page1');
    const page2 = loadPagedResponse<RunQueryResponse>('records', 'run-query', 200, 'page2');

    const { fetch: mockFetch, getCalls } = createTrackedMockFetch([page1, page2]);

    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'user-token',
        userToken: 'test-token',
      },
      fetchApi: mockFetch,
    });

    // Limit to 5 records (will need 2 pages)
    const result = await client.runQuery({
      from: 'bpqe82s1',
    }).paginate({ limit: 5 });

    // Should have made 2 API calls
    expect(getCalls().length).toBe(2);

    // Should have exactly 5 records
    expect(result.data).toHaveLength(5);
    expect(result.metadata.numRecords).toBe(5);
  });

  it('should return single page when .noPaginate() is called', async () => {
    const page1 = loadPagedResponse<RunQueryResponse>('records', 'run-query', 200, 'page1');

    const { fetch: mockFetch, getCalls } = createTrackedMockFetch([page1]);

    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'user-token',
        userToken: 'test-token',
      },
      fetchApi: mockFetch,
    });

    // Use .noPaginate() to explicitly get single page
    const result = await client.runQuery({
      from: 'bpqe82s1',
    }).noPaginate();

    expect(getCalls().length).toBe(1);
    expect(result.data).toHaveLength(3);
  });

  it('should not paginate when response fits in single page', async () => {
    const singlePage = loadPagedResponse<RunQueryResponse>('records', 'run-query', 200, 'single');

    const { fetch: mockFetch, getCalls } = createTrackedMockFetch([singlePage]);

    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'user-token',
        userToken: 'test-token',
      },
      fetchApi: mockFetch,
    });

    // Call .all() but response fits in single page
    const result = await client.runQuery({
      from: 'bpqe82s1',
    }).all();

    // Should only make 1 API call
    expect(getCalls().length).toBe(1);
    expect(result.data).toHaveLength(2);
  });
});

describe('Pagination - autoPaginate config', () => {
  it('should auto-paginate when autoPaginate is enabled globally', async () => {
    const page1 = loadPagedResponse<RunQueryResponse>('records', 'run-query', 200, 'page1');
    const page2 = loadPagedResponse<RunQueryResponse>('records', 'run-query', 200, 'page2');
    const page3 = loadPagedResponse<RunQueryResponse>('records', 'run-query', 200, 'page3');

    const { fetch: mockFetch, getCalls } = createTrackedMockFetch([page1, page2, page3]);

    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'user-token',
        userToken: 'test-token',
      },
      fetchApi: mockFetch,
      autoPaginate: true,
    });

    // Direct await with autoPaginate should fetch all pages
    const result = await client.runQuery({
      from: 'bpqe82s1',
    });

    expect(getCalls().length).toBe(3);
    expect(result.data).toHaveLength(7);
  });

  it('should allow noPaginate to override global autoPaginate', async () => {
    const page1 = loadPagedResponse<RunQueryResponse>('records', 'run-query', 200, 'page1');

    const { fetch: mockFetch, getCalls } = createTrackedMockFetch([page1]);

    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'user-token',
        userToken: 'test-token',
      },
      fetchApi: mockFetch,
      autoPaginate: true,
    });

    // Use .noPaginate() to override global setting
    const result = await client.runQuery({
      from: 'bpqe82s1',
    }).noPaginate();

    expect(getCalls().length).toBe(1);
    expect(result.data).toHaveLength(3);
  });
});

describe('Pagination - request parameters', () => {
  it('should pass skip parameter correctly in paginated requests', async () => {
    const page1 = loadPagedResponse<RunQueryResponse>('records', 'run-query', 200, 'page1');
    const page2 = loadPagedResponse<RunQueryResponse>('records', 'run-query', 200, 'page2');
    const page3 = loadPagedResponse<RunQueryResponse>('records', 'run-query', 200, 'page3');

    const { fetch: mockFetch, getCalls } = createTrackedMockFetch([page1, page2, page3]);

    const client = createClient({
      realm: 'testcompany',
      auth: {
        type: 'user-token',
        userToken: 'test-token',
      },
      fetchApi: mockFetch,
    });

    await client.runQuery({
      from: 'bpqe82s1',
    }).all();

    // Check that skip values were sent correctly
    const bodies = getCalls().map(call => JSON.parse(call.init?.body as string));

    // First request: skip = 0 (explicit from initial call)
    expect(bodies[0].options?.skip).toBe(0);

    // Second request: skip = 3
    expect(bodies[1].options?.skip).toBe(3);

    // Third request: skip = 6
    expect(bodies[2].options?.skip).toBe(6);
  });
});
