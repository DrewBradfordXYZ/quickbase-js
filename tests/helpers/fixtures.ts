/**
 * Test fixture loading utilities
 *
 * Provides helpers for loading test fixtures and creating mock responses.
 *
 * Fixture locations:
 * - Generated fixtures: spec/fixtures/{domain}/{operation}/
 * - Manual fixtures: spec/fixtures/_manual/{domain}/{operation}/
 * - Common errors: spec/fixtures/_manual/errors/
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, '..', '..', 'spec', 'fixtures');
const MANUAL_DIR = join(FIXTURES_DIR, '_manual');

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
 * Find a fixture file, checking multiple possible locations
 */
function findFixturePath(path: string): string | null {
  // Try exact path first
  const exactPath = join(FIXTURES_DIR, path);
  if (existsSync(exactPath)) {
    return exactPath;
  }

  // Try in _manual directory
  const manualPath = join(MANUAL_DIR, path);
  if (existsSync(manualPath)) {
    return manualPath;
  }

  return null;
}

/**
 * Find a response fixture, handling variants and _manual locations
 */
function findResponsePath(
  domain: string,
  operation: string,
  status: number,
  variant?: string
): string | null {
  const baseName = `response.${status}`;

  // If variant specified, look for exact match
  if (variant) {
    const variantFile = `${baseName}.${variant}.json`;
    const found = findFixturePath(`${domain}/${operation}/${variantFile}`);
    if (found) return found;
  }

  // Try exact path (response.{status}.json)
  const exactFile = `${baseName}.json`;
  const exactPath = findFixturePath(`${domain}/${operation}/${exactFile}`);
  if (exactPath) return exactPath;

  // For error statuses, check _manual/errors/
  if (status >= 400) {
    const errorPath = join(MANUAL_DIR, 'errors', exactFile);
    if (existsSync(errorPath)) return errorPath;
  }

  // Look for any variant file in the directory
  const dir = join(FIXTURES_DIR, domain, operation);
  if (existsSync(dir)) {
    const files = readdirSync(dir);
    const match = files.find(f => f.startsWith(baseName) && f.endsWith('.json'));
    if (match) return join(dir, match);
  }

  // Check _manual directory for variants
  const manualDir = join(MANUAL_DIR, domain, operation);
  if (existsSync(manualDir)) {
    const files = readdirSync(manualDir);
    const match = files.find(f => f.startsWith(baseName) && f.endsWith('.json'));
    if (match) return join(manualDir, match);
  }

  return null;
}

/**
 * Load a fixture file
 */
export function loadFixture<T = unknown>(path: string): Fixture<T> {
  const fullPath = findFixturePath(path);

  if (!fullPath) {
    throw new Error(`Fixture not found: ${path} (looked in ${FIXTURES_DIR} and ${MANUAL_DIR})`);
  }

  const content = readFileSync(fullPath, 'utf-8');
  return JSON.parse(content) as Fixture<T>;
}

/**
 * Load a response fixture
 *
 * Searches in order:
 * 1. Exact path: {domain}/{operation}/response.{status}.json
 * 2. With variant: {domain}/{operation}/response.{status}.{variant}.json
 * 3. Manual path: _manual/{domain}/{operation}/response.{status}.json
 * 4. Common errors: _manual/errors/response.{status}.json
 */
export function loadResponse<T = unknown>(
  domain: string,
  operation: string,
  status: number,
  variant?: string
): Fixture<T> {
  const fullPath = findResponsePath(domain, operation, status, variant);

  if (!fullPath) {
    throw new Error(
      `Response fixture not found: ${domain}/${operation}/response.${status}${variant ? '.' + variant : ''}.json`
    );
  }

  const content = readFileSync(fullPath, 'utf-8');
  return JSON.parse(content) as Fixture<T>;
}

/**
 * Load a request fixture
 */
export function loadRequest<T = unknown>(domain: string, operation: string): T {
  const fixture = loadFixture<T>(`${domain}/${operation}/request.json`);
  return fixture.body;
}

/**
 * Load a common error fixture from _manual/errors/
 */
export function loadError<T = unknown>(status: number): Fixture<T> {
  const path = join(MANUAL_DIR, 'errors', `response.${status}.json`);

  if (!existsSync(path)) {
    throw new Error(`Error fixture not found: _manual/errors/response.${status}.json`);
  }

  const content = readFileSync(path, 'utf-8');
  return JSON.parse(content) as Fixture<T>;
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
 *
 * Looks in _manual/{domain}/{operation}/ for pagination fixtures
 */
export function loadPagedResponse<T = unknown>(
  domain: string,
  operation: string,
  status: number,
  page: string
): Fixture<T> {
  const fileName = `response.${status}.${page}.json`;

  // Check _manual first (pagination fixtures are manual)
  const manualPath = join(MANUAL_DIR, domain, operation, fileName);
  if (existsSync(manualPath)) {
    const content = readFileSync(manualPath, 'utf-8');
    return JSON.parse(content) as Fixture<T>;
  }

  // Fall back to regular fixtures dir
  const regularPath = join(FIXTURES_DIR, domain, operation, fileName);
  if (existsSync(regularPath)) {
    const content = readFileSync(regularPath, 'utf-8');
    return JSON.parse(content) as Fixture<T>;
  }

  throw new Error(
    `Paged fixture not found: ${domain}/${operation}/${fileName} (checked _manual/ and regular fixtures)`
  );
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
