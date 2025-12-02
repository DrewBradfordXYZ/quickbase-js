/**
 * Temporary Token Authentication Strategy
 *
 * Fetches database-specific temporary tokens from the QuickBase API.
 * Tokens are cached and automatically refreshed when expired.
 */

import type { AuthStrategy, AuthContext } from './types.js';
import type { Logger } from '../core/logger.js';
import { TokenCache } from './token-cache.js';
import { DEFAULT_CONFIG } from '../core/types.js';
import { AuthenticationError } from '../core/errors.js';

export class TempTokenStrategy implements AuthStrategy {
  private readonly userToken?: string;
  private readonly appToken?: string;
  private readonly realm: string;
  private readonly baseUrl: string;
  private readonly fetchApi: typeof fetch;
  private readonly logger: Logger;
  private readonly cache: TokenCache;

  /**
   * Track pending token fetches to deduplicate concurrent requests
   * This prevents multiple simultaneous API calls for the same dbid
   */
  private readonly pendingFetches = new Map<string, Promise<string>>();

  constructor(
    userToken: string | undefined,
    context: AuthContext,
    options?: { appToken?: string; tokenLifespanMs?: number }
  ) {
    this.userToken = userToken;
    this.appToken = options?.appToken;
    this.realm = context.realm;
    this.baseUrl = context.baseUrl;
    this.fetchApi = context.fetchApi;
    this.logger = context.logger;
    this.cache = new TokenCache(
      options?.tokenLifespanMs ?? DEFAULT_CONFIG.tempTokenLifespanMs
    );
  }

  async getToken(dbid?: string): Promise<string> {
    if (!dbid) {
      throw new Error('Database ID (dbid) is required for temporary token authentication');
    }

    // Check cache first
    const cachedToken = this.cache.get(dbid);
    if (cachedToken) {
      this.logger.token('cache-hit', dbid);
      return cachedToken;
    }

    this.logger.token('cache-miss', dbid);

    // Check if there's already a fetch in progress for this dbid
    const pendingFetch = this.pendingFetches.get(dbid);
    if (pendingFetch) {
      this.logger.debug(`Waiting for existing token fetch for dbid: ${dbid}`);
      return pendingFetch;
    }

    // Fetch new token
    const fetchPromise = this.fetchToken(dbid);
    this.pendingFetches.set(dbid, fetchPromise);

    try {
      const token = await fetchPromise;
      return token;
    } finally {
      this.pendingFetches.delete(dbid);
    }
  }

  private async fetchToken(dbid: string): Promise<string> {
    this.logger.token('fetch', dbid);

    const url = `${this.baseUrl}/auth/temporary/${dbid}`;
    const headers: Record<string, string> = {
      'QB-Realm-Hostname': `${this.realm}.quickbase.com`,
      'Content-Type': 'application/json',
    };

    // Only include Authorization header if we have a userToken
    // For Code Pages, browser session cookies handle auth instead
    if (this.userToken) {
      headers['Authorization'] = `QB-USER-TOKEN ${this.userToken}`;
    }

    if (this.appToken) {
      headers['QB-App-Token'] = this.appToken;
    }

    const response = await this.fetchApi(url, {
      method: 'GET',
      headers,
      credentials: 'include', // Include cookies for Code Page auth
    } as RequestInit);

    if (!response.ok) {
      const errorText = await response.text();
      throw new AuthenticationError(
        `Failed to fetch temporary token for ${dbid}: ${response.status} ${errorText}`,
        { rayId: response.headers.get('qb-api-ray') || undefined }
      );
    }

    const data = await response.json() as { temporaryAuthorization?: string };
    const token = data.temporaryAuthorization;

    if (!token) {
      throw new AuthenticationError(
        `No temporary token in response for ${dbid}`
      );
    }

    // Cache the token
    this.cache.set(dbid, token);
    this.logger.debug(`Cached new token for dbid: ${dbid}`);

    return token;
  }

  getAuthorizationHeader(token: string): string {
    return `QB-TEMP-TOKEN ${token}`;
  }

  async handleAuthError(dbid?: string): Promise<boolean> {
    if (!dbid) {
      this.logger.debug('Auth error without dbid - cannot refresh temp token');
      return false;
    }

    // Invalidate the cached token
    this.invalidate(dbid);

    // Try to fetch a new token
    try {
      this.logger.token('refresh', dbid);
      await this.getToken(dbid);
      return true;
    } catch (error) {
      this.logger.error(`Failed to refresh temp token for ${dbid}`, error);
      return false;
    }
  }

  invalidate(dbid?: string): void {
    if (dbid) {
      this.logger.token('expire', dbid);
      this.cache.delete(dbid);
    } else {
      // Invalidate all tokens
      this.cache.clear();
    }
  }
}
