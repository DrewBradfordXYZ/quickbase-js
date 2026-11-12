/**
 * Retry logic with exponential backoff
 *
 * The retry loop itself, and which failures it retries, is withRetries in
 * request.ts.
 */

import type { RateLimitInfo } from '../core/types.js';

export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  multiplier: number;
}

/**
 * Calculate delay for exponential backoff
 */
export function calculateBackoffDelay(
  attempt: number,
  options: RetryOptions
): number {
  // Exponential backoff: initialDelay * multiplier^(attempt-1)
  const delay = options.initialDelayMs * Math.pow(options.multiplier, attempt - 1);

  // Add jitter (±10%) to prevent thundering herd
  const jitter = delay * 0.1 * (Math.random() * 2 - 1);

  return Math.min(delay + jitter, options.maxDelayMs);
}

/**
 * Extract rate limit info from response headers
 */
export function extractRateLimitInfo(
  response: Response,
  requestUrl: string,
  attempt: number
): RateLimitInfo {
  const retryAfter = response.headers.get('Retry-After');

  return {
    timestamp: new Date(),
    requestUrl,
    httpStatus: response.status,
    retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
    cfRay: response.headers.get('cf-ray') || undefined,
    tid: response.headers.get('tid') || undefined,
    qbApiRay: response.headers.get('qb-api-ray') || undefined,
    attempt,
  };
}

/**
 * Sleep for a given duration, or until the signal aborts (rejecting with its
 * reason), so cancelling a request also cancels a retry's wait.
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal!.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
