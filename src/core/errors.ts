/**
 * Custom error types for the QuickBase SDK
 */

import type { RateLimitInfo } from './types.js';

/**
 * Base error class for all QuickBase SDK errors
 */
export class QuickbaseError extends Error {
  readonly statusCode: number;
  readonly description?: string;
  readonly rayId?: string;

  constructor(
    message: string,
    statusCode: number,
    options?: {
      description?: string;
      rayId?: string;
      cause?: Error;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = 'QuickbaseError';
    this.statusCode = statusCode;
    this.description = options?.description;
    this.rayId = options?.rayId;

    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QuickbaseError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      description: this.description,
      rayId: this.rayId,
    };
  }
}

/**
 * Error thrown when rate limited (HTTP 429)
 */
export class RateLimitError extends QuickbaseError {
  readonly retryAfter?: number;
  readonly rateLimitInfo: RateLimitInfo;

  constructor(rateLimitInfo: RateLimitInfo, message?: string) {
    super(
      message || `Rate limited. Retry after ${rateLimitInfo.retryAfter ?? 'unknown'} seconds`,
      429,
      { rayId: rateLimitInfo.qbApiRay || rateLimitInfo.cfRay }
    );
    this.name = 'RateLimitError';
    this.retryAfter = rateLimitInfo.retryAfter;
    this.rateLimitInfo = rateLimitInfo;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
      rateLimitInfo: this.rateLimitInfo,
    };
  }
}

/**
 * Error thrown when authentication fails (HTTP 401)
 */
export class AuthenticationError extends QuickbaseError {
  constructor(message: string, options?: { rayId?: string; cause?: Error }) {
    super(message, 401, options);
    this.name = 'AuthenticationError';
  }
}

/**
 * Error thrown when authorization fails (HTTP 403)
 */
export class AuthorizationError extends QuickbaseError {
  constructor(message: string, options?: { rayId?: string; cause?: Error }) {
    super(message, 403, options);
    this.name = 'AuthorizationError';
  }
}

/**
 * Error thrown when a resource is not found (HTTP 404)
 */
export class NotFoundError extends QuickbaseError {
  constructor(message: string, options?: { rayId?: string; cause?: Error }) {
    super(message, 404, options);
    this.name = 'NotFoundError';
  }
}

/**
 * Error thrown for bad requests (HTTP 400)
 */
export class ValidationError extends QuickbaseError {
  readonly errors?: Array<{ field?: string; message: string }>;

  constructor(
    message: string,
    options?: {
      description?: string;
      rayId?: string;
      errors?: Array<{ field?: string; message: string }>;
      cause?: Error;
    }
  ) {
    super(message, 400, options);
    this.name = 'ValidationError';
    this.errors = options?.errors;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors,
    };
  }
}

/**
 * Error thrown when request times out
 */
export class TimeoutError extends QuickbaseError {
  readonly timeoutMs: number;

  constructor(timeoutMs: number, options?: { rayId?: string; cause?: Error }) {
    super(`Request timed out after ${timeoutMs}ms`, 0, options);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      timeoutMs: this.timeoutMs,
    };
  }
}

/**
 * Error thrown for server errors (HTTP 5xx)
 */
export class ServerError extends QuickbaseError {
  constructor(
    statusCode: number,
    message: string,
    options?: { description?: string; rayId?: string; cause?: Error }
  ) {
    super(message, statusCode, options);
    this.name = 'ServerError';
  }
}

/**
 * Parse an error response from the QuickBase API
 */
export async function parseErrorResponse(
  response: Response,
  requestUrl: string
): Promise<QuickbaseError> {
  const rayId = response.headers.get('qb-api-ray') || response.headers.get('cf-ray') || undefined;

  let body: { message?: string; description?: string; errors?: unknown[] } | null = null;
  try {
    body = await response.json() as { message?: string; description?: string; errors?: unknown[] };
  } catch {
    // Response body is not JSON
  }

  const message = body?.message || response.statusText || 'Unknown error';
  const description = body?.description;

  switch (response.status) {
    case 400:
      return new ValidationError(message, {
        description,
        rayId,
        errors: body?.errors as Array<{ field?: string; message: string }>,
      });

    case 401:
      return new AuthenticationError(message, { rayId });

    case 403:
      return new AuthorizationError(message, { rayId });

    case 404:
      return new NotFoundError(message, { rayId });

    case 429: {
      const retryAfter = response.headers.get('Retry-After');
      const rateLimitInfo: RateLimitInfo = {
        timestamp: new Date(),
        requestUrl,
        httpStatus: 429,
        retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
        cfRay: response.headers.get('cf-ray') || undefined,
        tid: response.headers.get('tid') || undefined,
        qbApiRay: response.headers.get('qb-api-ray') || undefined,
        attempt: 1, // Will be updated by caller
      };
      return new RateLimitError(rateLimitInfo, message);
    }

    default:
      if (response.status >= 500) {
        return new ServerError(response.status, message, { description, rayId });
      }
      return new QuickbaseError(message, response.status, { description, rayId });
  }
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof RateLimitError) {
    return true;
  }
  if (error instanceof ServerError) {
    return true;
  }
  if (error instanceof TimeoutError) {
    return true;
  }
  return false;
}
