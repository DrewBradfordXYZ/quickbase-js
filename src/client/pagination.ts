/**
 * Pagination support with fluent API
 *
 * Provides automatic pagination for QuickBase API endpoints that return
 * paginated results. Supports both skip-based and token-based pagination.
 *
 * @example
 * ```typescript
 * // Fetch single page (default)
 * const page = await client.runQuery({ ... });
 *
 * // Fetch all pages automatically
 * const all = await client.runQuery({ ... }).all();
 *
 * // Fetch with record limit
 * const limited = await client.runQuery({ ... }).paginate({ limit: 500 });
 *
 * // Explicitly single page (if autoPaginate is enabled globally)
 * const single = await client.runQuery({ ... }).noPaginate();
 * ```
 */

/**
 * Pagination options for controlling automatic pagination behavior
 */
export interface PaginationOptions {
  /** Maximum number of records to fetch across all pages */
  limit?: number;
  /** Starting offset for skip-based pagination */
  skip?: number;
}

/**
 * Metadata returned with paginated responses
 */
export interface PaginationMetadata {
  totalRecords?: number;
  numRecords?: number;
  numFields?: number;
  skip?: number;
  top?: number;
  nextPageToken?: string;
  nextToken?: string;
}

/**
 * A paginated response from the QuickBase API
 */
export interface PaginatedResponse<T = unknown> {
  data?: T[];
  fields?: Array<{ id: number; label: string; type: string }>;
  metadata: PaginationMetadata;
  [key: string]: unknown;
}

/**
 * Determines the type of pagination from a response
 */
export type PaginationType = 'skip' | 'token' | 'none';

/**
 * Detect pagination type from response metadata
 */
export function detectPaginationType(metadata: PaginationMetadata): PaginationType {
  if (metadata.totalRecords !== undefined && metadata.skip !== undefined) {
    return 'skip';
  }
  if (metadata.nextPageToken !== undefined || metadata.nextToken !== undefined) {
    return 'token';
  }
  return 'none';
}

/**
 * Check if a response has more pages available
 */
export function hasMorePages(
  response: PaginatedResponse,
  paginationType: PaginationType,
  currentCount: number
): boolean {
  const { metadata } = response;

  if (paginationType === 'skip') {
    return (
      metadata.totalRecords !== undefined &&
      currentCount < metadata.totalRecords
    );
  }

  if (paginationType === 'token') {
    const nextToken = metadata.nextPageToken ?? metadata.nextToken;
    return nextToken !== undefined && nextToken !== '';
  }

  return false;
}

/**
 * Find the data array key in a response object
 */
export function findDataKey(response: PaginatedResponse): string {
  for (const key of Object.keys(response)) {
    if (Array.isArray(response[key])) {
      return key;
    }
  }
  return 'data';
}

/**
 * Check if a response looks like a paginated response
 */
export function isPaginatedResponse(response: unknown): response is PaginatedResponse {
  if (!response || typeof response !== 'object') {
    return false;
  }

  const obj = response as Record<string, unknown>;

  // Must have metadata object
  if (!obj.metadata || typeof obj.metadata !== 'object') {
    return false;
  }

  // Must have an array field
  const hasArrayField = Object.values(obj).some(Array.isArray);
  if (!hasArrayField) {
    return false;
  }

  const metadata = obj.metadata as PaginationMetadata;

  // Check for pagination indicators
  return (
    metadata.totalRecords !== undefined ||
    metadata.numRecords !== undefined ||
    metadata.nextPageToken !== undefined ||
    metadata.nextToken !== undefined
  );
}

/**
 * Request executor function type
 */
export type RequestExecutor<T> = () => Promise<T>;

/**
 * Request executor with pagination parameters
 */
export type PaginatedRequestExecutor<T> = (params: {
  skip?: number;
  nextPageToken?: string;
  nextToken?: string;
}) => Promise<T>;

/**
 * A thenable request that supports fluent pagination methods
 *
 * This class wraps an API request and allows chaining pagination methods
 * while still being directly awaitable.
 */
export class PaginatedRequest<T> implements PromiseLike<T> {
  private readonly executor: RequestExecutor<T>;
  private readonly paginatedExecutor?: PaginatedRequestExecutor<T>;
  private readonly defaultAutoPaginate: boolean;

  constructor(
    executor: RequestExecutor<T>,
    options?: {
      paginatedExecutor?: PaginatedRequestExecutor<T>;
      autoPaginate?: boolean;
    }
  ) {
    this.executor = executor;
    this.paginatedExecutor = options?.paginatedExecutor;
    this.defaultAutoPaginate = options?.autoPaginate ?? false;
  }

  /**
   * Implement PromiseLike to allow direct awaiting
   * Default behavior respects the global autoPaginate setting
   */
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    const promise = this.defaultAutoPaginate ? this.all() : this.executor();
    return promise.then(onfulfilled, onrejected);
  }

  /**
   * Fetch all pages and combine results
   */
  async all(): Promise<T> {
    return this.paginate({});
  }

  /**
   * Fetch pages with optional limit
   */
  async paginate(options: PaginationOptions = {}): Promise<T> {
    if (!this.paginatedExecutor) {
      // Not a paginated endpoint, just execute normally
      return this.executor();
    }

    const { limit, skip: initialSkip = 0 } = options;
    let allRecords: unknown[] = [];
    let lastResponse: PaginatedResponse | null = null;
    let paginationType: PaginationType = 'none';
    let currentSkip = initialSkip;
    let nextToken: string | undefined;

    // Fetch first page
    const firstResponse = await this.paginatedExecutor({ skip: initialSkip }) as PaginatedResponse;

    if (!isPaginatedResponse(firstResponse)) {
      // Not a paginated response, return as-is
      return firstResponse as T;
    }

    lastResponse = firstResponse;
    paginationType = detectPaginationType(firstResponse.metadata);

    const dataKey = findDataKey(firstResponse);
    const firstPageData = (firstResponse[dataKey] as unknown[]) || [];

    // Apply limit to first page if needed
    if (limit !== undefined && firstPageData.length > limit) {
      allRecords = firstPageData.slice(0, limit);
    } else {
      allRecords = [...firstPageData];
    }

    // Initialize continuation state
    if (paginationType === 'skip') {
      currentSkip = initialSkip + firstPageData.length;
    } else if (paginationType === 'token') {
      nextToken = firstResponse.metadata.nextPageToken ?? firstResponse.metadata.nextToken;
    }

    // Fetch remaining pages
    while (hasMorePages(lastResponse, paginationType, allRecords.length)) {
      // Check limit
      if (limit !== undefined && allRecords.length >= limit) {
        break;
      }

      // Fetch next page
      let nextResponse: PaginatedResponse;

      if (paginationType === 'skip') {
        nextResponse = await this.paginatedExecutor({ skip: currentSkip }) as PaginatedResponse;
      } else if (paginationType === 'token' && nextToken) {
        const tokenKey = lastResponse.metadata.nextPageToken !== undefined
          ? 'nextPageToken'
          : 'nextToken';
        nextResponse = await this.paginatedExecutor({ [tokenKey]: nextToken }) as PaginatedResponse;
      } else {
        break;
      }

      lastResponse = nextResponse;
      const pageData = (nextResponse[dataKey] as unknown[]) || [];

      // Check for empty response
      if (pageData.length === 0) {
        break;
      }

      // Apply limit if needed
      if (limit !== undefined) {
        const remainingCapacity = limit - allRecords.length;
        allRecords = allRecords.concat(pageData.slice(0, remainingCapacity));
      } else {
        allRecords = allRecords.concat(pageData);
      }

      // Update continuation state
      if (paginationType === 'skip') {
        currentSkip += pageData.length;
      } else if (paginationType === 'token') {
        nextToken = nextResponse.metadata.nextPageToken ?? nextResponse.metadata.nextToken;
        if (!nextToken) {
          break;
        }
      }
    }

    // Build final response
    const finalResponse: PaginatedResponse = {
      ...lastResponse,
      [dataKey]: allRecords,
      metadata: {
        ...lastResponse.metadata,
        numRecords: allRecords.length,
        skip: initialSkip,
      },
    };

    // Clear pagination tokens in final response
    if (paginationType === 'token') {
      delete finalResponse.metadata.nextPageToken;
      delete finalResponse.metadata.nextToken;
    }

    return finalResponse as T;
  }

  /**
   * Explicitly fetch only a single page (no pagination)
   */
  async noPaginate(): Promise<T> {
    return this.executor();
  }

  /**
   * Get the underlying promise (for compatibility)
   */
  toPromise(): Promise<T> {
    return this.then();
  }
}

/**
 * Create a paginated request wrapper
 */
export function createPaginatedRequest<T>(
  executor: RequestExecutor<T>,
  options?: {
    paginatedExecutor?: PaginatedRequestExecutor<T>;
    autoPaginate?: boolean;
  }
): PaginatedRequest<T> {
  return new PaginatedRequest(executor, options);
}
