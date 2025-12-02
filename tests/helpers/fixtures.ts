/**
 * Test fixture loading utilities
 *
 * Provides helpers for loading test fixtures and creating mock responses.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, '..', '..', 'spec', 'fixtures');

export interface FixtureMeta {
  description?: string;
  status: number;
  headers?: Record<string, string>;
}

export interface Fixture<T = unknown> {
  _meta: FixtureMeta;
  body: T;
}

/**
 * Load a fixture file
 */
export function loadFixture<T = unknown>(path: string): Fixture<T> {
  const fullPath = join(FIXTURES_DIR, path);

  if (!existsSync(fullPath)) {
    throw new Error(`Fixture not found: ${path} (looked in ${fullPath})`);
  }

  const content = readFileSync(fullPath, 'utf-8');
  return JSON.parse(content) as Fixture<T>;
}

/**
 * Load a response fixture
 */
export function loadResponse<T = unknown>(
  domain: string,
  operation: string,
  status: number
): Fixture<T> {
  return loadFixture<T>(`${domain}/${operation}/response.${status}.json`);
}

/**
 * Load a request fixture
 */
export function loadRequest<T = unknown>(domain: string, operation: string): T {
  const fixture = loadFixture<T>(`${domain}/${operation}/request.json`);
  return fixture.body;
}

/**
 * Create a mock Response object from a fixture
 */
export function createMockResponse<T = unknown>(fixture: Fixture<T>): Response {
  const { _meta, body } = fixture;

  const headers = new Headers(_meta.headers || {});
  headers.set('Content-Type', 'application/json');

  return new Response(JSON.stringify(body), {
    status: _meta.status,
    statusText: getStatusText(_meta.status),
    headers,
  });
}

/**
 * Create a mock fetch function that returns fixtures
 */
export function createMockFetch(
  responses: Array<{
    matcher?: (url: string, init?: RequestInit) => boolean;
    fixture: Fixture<unknown>;
  }>
): typeof fetch {
  let callIndex = 0;

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();

    // Find matching response
    for (const { matcher, fixture } of responses) {
      if (!matcher || matcher(url, init)) {
        callIndex++;
        return createMockResponse(fixture);
      }
    }

    // Default: return the next response in sequence
    if (callIndex < responses.length) {
      const response = createMockResponse(responses[callIndex].fixture);
      callIndex++;
      return response;
    }

    throw new Error(`No mock response for request ${callIndex + 1}: ${url}`);
  };
}

/**
 * Create a mock fetch that returns responses in sequence
 */
export function createSequentialMockFetch(fixtures: Fixture<unknown>[]): typeof fetch {
  let callIndex = 0;

  return async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> => {
    if (callIndex >= fixtures.length) {
      throw new Error(`Mock fetch called ${callIndex + 1} times but only ${fixtures.length} responses provided`);
    }

    const fixture = fixtures[callIndex];
    callIndex++;
    return createMockResponse(fixture);
  };
}

/**
 * Get call count from a mock fetch
 */
export function createTrackedMockFetch(fixtures: Fixture<unknown>[]): {
  fetch: typeof fetch;
  getCalls: () => Array<{ url: string; init?: RequestInit }>;
  getCallCount: () => number;
} {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  let callIndex = 0;

  const fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    calls.push({ url, init });

    if (callIndex >= fixtures.length) {
      throw new Error(`Mock fetch called ${callIndex + 1} times but only ${fixtures.length} responses provided`);
    }

    const fixture = fixtures[callIndex];
    callIndex++;
    return createMockResponse(fixture);
  };

  return {
    fetch,
    getCalls: () => calls,
    getCallCount: () => calls.length,
  };
}

/**
 * Create a modified fixture with custom headers (for test-specific overrides)
 */
export function withHeaders<T>(
  fixture: Fixture<T>,
  headers: Record<string, string | undefined>
): Fixture<T> {
  const newHeaders = { ...fixture._meta.headers };

  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) {
      delete newHeaders[key];
    } else {
      newHeaders[key] = value;
    }
  }

  return {
    ...fixture,
    _meta: {
      ...fixture._meta,
      headers: newHeaders,
    },
  };
}

/**
 * Load a paginated response fixture (for specific page)
 */
export function loadPagedResponse<T = unknown>(
  domain: string,
  operation: string,
  status: number,
  page: string
): Fixture<T> {
  return loadFixture<T>(`${domain}/${operation}/response.${status}.${page}.json`);
}

/**
 * Get HTTP status text
 */
function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };
  return statusTexts[status] || 'Unknown';
}
