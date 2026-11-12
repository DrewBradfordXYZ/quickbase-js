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
 * Error thrown when an authentication ticket is invalid or expired.
 * Specifically for ticket-based authentication (XML API).
 */
export class QuickbaseTicketError extends QuickbaseError {
  readonly code: number;

  constructor(message: string, code: number, options?: { description?: string; action?: string; cause?: Error }) {
    super(message, 401, options);
    this.name = 'QuickbaseTicketError';
    this.code = code;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      code: this.code,
    };
  }
}

/**
 * Error thrown when an application token is missing or invalid.
 * Specifically for apps that require app tokens (XML API).
 */
export class QuickbaseAppTokenError extends QuickbaseError {
  readonly code: number;

  constructor(message: string, code: number, options?: { description?: string; action?: string; cause?: Error }) {
    super(message, 403, options);
    this.name = 'QuickbaseAppTokenError';
    this.code = code;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      code: this.code,
    };
  }
}

/**
 * Error thrown by the legacy QuickBase XML API.
 * Wraps XML-specific error codes and messages.
 */
export class QuickbaseXmlError extends QuickbaseError {
  readonly code: number;
  readonly text: string;
  readonly action?: string;

  constructor(code: number, text: string, options?: { description?: string; action?: string; cause?: Error }) {
    const message = options?.description
      ? `XML API error ${code}: ${text} (${options.description})`
      : `XML API error ${code}: ${text}`;
    
    // Most XML errors return HTTP 200, so we use 0 or a mapped status if known
    super(message, 0, { rayId: undefined, description: options?.description, cause: options?.cause });
    this.name = 'QuickbaseXmlError';
    this.code = code;
    this.text = text;
    this.action = options?.action;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      code: this.code,
      text: this.text,
      action: this.action,
    };
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
 * Error thrown when a write operation is attempted in read-only mode.
 * Provides defense-in-depth for both JSON API and XML API requests.
 */
export class ReadOnlyError extends Error {
  readonly method: string;
  readonly path: string;
  readonly action?: string; // For XML API actions

  constructor(method: string, path: string, action?: string) {
    const msg = action
      ? `Read-only mode: write operation blocked (XML action: ${action})`
      : `Read-only mode: write operation blocked (${method} ${path})`;
    super(msg);
    this.name = 'ReadOnlyError';
    this.method = method;
    this.path = path;
    this.action = action;

    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ReadOnlyError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      method: this.method,
      path: this.path,
      action: this.action,
    };
  }
}

/**
 * A request that failed before QuickBase answered: DNS, a refused or reset
 * connection, the network going away. `cause` is the error fetch threw.
 */
export class NetworkError extends Error {
  /**
   * True when the connection never opened (DNS failure, connection refused),
   * so QuickBase can't have received the request.
   */
  readonly neverSent: boolean;

  constructor(cause: unknown) {
    super(`Network error: ${cause instanceof Error ? cause.message : String(cause)}`, { cause });
    this.name = 'NetworkError';
    const code = (cause as { cause?: { code?: string } } | undefined)?.cause?.code;
    this.neverSent = code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'EAI_AGAIN';
  }
}

/**
 * Values QuickBase rejected in an upsert, thrown when the client has
 * `throwOnLineErrors: true`. QuickBase still saved those records with the
 * rejected fields blank: `response.metadata` lists the created and updated
 * records.
 */
export class LineErrorsError extends Error {
  /** Each record's 1-based position in the request, mapped to its errors */
  readonly lineErrors: Record<string, string[]>;
  /** The upsert's response */
  readonly response: unknown;

  constructor(lineErrors: Record<string, string[]>, response: unknown) {
    const lines = Object.keys(lineErrors).sort((a, b) => Number(a) - Number(b));
    const first = lines[0] ?? '';
    super(
      `Upsert: QuickBase rejected values in ${lines.length} record(s), saved with those fields blank; ` +
        `record ${first}: ${(lineErrors[first] ?? []).join('; ')}`
    );
    this.name = 'LineErrorsError';
    this.lineErrors = lineErrors;
    this.response = response;
  }
}
