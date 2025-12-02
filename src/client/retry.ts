/**
 * Retry logic with exponential backoff
 *
 * Handles:
 * - HTTP 429 (Rate Limited) - uses Retry-After header
 * - HTTP 5xx (Server Errors) - exponential backoff
 * - Timeout errors - exponential backoff
 */

import type { RequestContext, RateLimitInfo, ResolvedConfig } from '../core/types.js';
import type { Logger } from '../core/logger.js';
import {
  RateLimitError,
  ServerError,
  TimeoutError,
  isRetryableError,
} from '../core/errors.js';

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
 * Get delay from Retry-After header or fall back to backoff calculation
 */
export function getRetryDelay(
  response: Response | null,
  attempt: number,
  options: RetryOptions
): number {
  if (response) {
    const retryAfter = response.headers.get('Retry-After');
    if (retryAfter) {
      // Retry-After can be seconds or a date string
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        return seconds * 1000;
      }

      // Try parsing as a date
      const date = Date.parse(retryAfter);
      if (!isNaN(date)) {
        return Math.max(0, date - Date.now());
      }
    }
  }

  return calculateBackoffDelay(attempt, options);
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
 * Sleep for a given duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determine if a response status is retryable
 */
export function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

/**
 * Execute a request with retry logic
 */
export async function executeWithRetry<T>(
  fn: (context: RequestContext) => Promise<T>,
  context: RequestContext,
  config: ResolvedConfig,
  logger: Logger
): Promise<T> {
  const options: RetryOptions = config.retry;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    context.attempt = attempt;

    try {
      return await fn(context);
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= options.maxAttempts) {
        throw error;
      }

      // Calculate retry delay
      let delayMs: number;
      let reason: string;

      if (error instanceof RateLimitError) {
        delayMs = error.retryAfter
          ? error.retryAfter * 1000
          : calculateBackoffDelay(attempt, options);
        reason = `Rate limited (429)`;

        // Notify callback
        if (config.onRateLimit) {
          config.onRateLimit(error.rateLimitInfo);
        }
      } else if (error instanceof ServerError) {
        delayMs = calculateBackoffDelay(attempt, options);
        reason = `Server error (${error.statusCode})`;
      } else if (error instanceof TimeoutError) {
        delayMs = calculateBackoffDelay(attempt, options);
        reason = `Timeout`;
      } else {
        delayMs = calculateBackoffDelay(attempt, options);
        reason = `Unknown retryable error`;
      }

      logger.retry(attempt, options.maxAttempts, delayMs, reason);

      await sleep(delayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry loop exited unexpectedly');
}
