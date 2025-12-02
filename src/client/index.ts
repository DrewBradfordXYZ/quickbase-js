/**
 * Client module exports
 */

export type { RequestOptions, RequestExecutorOptions } from './request.js';
export { executeRequest, createRequestExecutor } from './request.js';

export type { Throttle } from './throttle.js';
export { SlidingWindowThrottle, NoOpThrottle, createThrottle } from './throttle.js';

export type { RetryOptions } from './retry.js';
export {
  calculateBackoffDelay,
  getRetryDelay,
  extractRateLimitInfo,
  sleep,
  isRetryableStatus,
  executeWithRetry,
} from './retry.js';

export type {
  PaginationOptions,
  PaginationMetadata,
  PaginatedResponse,
  PaginationType,
  RequestExecutor,
  PaginatedRequestExecutor,
} from './pagination.js';
export {
  PaginatedRequest,
  createPaginatedRequest,
  detectPaginationType,
  hasMorePages,
  findDataKey,
  isPaginatedResponse,
} from './pagination.js';
