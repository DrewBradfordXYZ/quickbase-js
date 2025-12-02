/**
 * Authentication strategy types
 */

import type { Logger } from '../core/logger.js';

/**
 * Interface that all auth strategies must implement
 */
export interface AuthStrategy {
  /**
   * Get a valid token for the given database ID
   * @param dbid - The database ID (required for temp tokens)
   */
  getToken(dbid?: string): Promise<string>;

  /**
   * Get the authorization header value
   */
  getAuthorizationHeader(token: string): string;

  /**
   * Handle authentication errors (e.g., refresh token on 401)
   * @returns true if token was refreshed and request should be retried
   */
  handleAuthError(dbid?: string): Promise<boolean>;

  /**
   * Invalidate cached tokens (if applicable)
   */
  invalidate(dbid?: string): void;
}

/**
 * Context passed to auth strategy constructors
 */
export interface AuthContext {
  realm: string;
  baseUrl: string;
  fetchApi: typeof fetch;
  logger: Logger;
}

/**
 * Token cache entry
 */
export interface CachedToken {
  token: string;
  expiresAt: number;
}
