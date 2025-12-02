/**
 * SSO Token Authentication Strategy
 *
 * Exchanges a SAML token for a QuickBase temporary token via OAuth token exchange.
 */

import type { AuthStrategy, AuthContext } from './types.js';
import type { Logger } from '../core/logger.js';
import { TokenCache } from './token-cache.js';
import { DEFAULT_CONFIG } from '../core/types.js';
import { AuthenticationError } from '../core/errors.js';

export class SsoTokenStrategy implements AuthStrategy {
  private readonly samlToken: string;
  private readonly realm: string;
  private readonly baseUrl: string;
  private readonly fetchApi: typeof fetch;
  private readonly logger: Logger;
  private readonly cache: TokenCache;

  /**
   * Track pending SSO token exchange to deduplicate concurrent requests
   */
  private pendingExchange: Promise<string> | null = null;

  constructor(
    samlToken: string,
    context: AuthContext,
    options?: { tokenLifespanMs?: number }
  ) {
    this.samlToken = samlToken;
    this.realm = context.realm;
    this.baseUrl = context.baseUrl;
    this.fetchApi = context.fetchApi;
    this.logger = context.logger;
    // SSO tokens are global, not per-dbid, so we use a single cache key
    this.cache = new TokenCache(
      options?.tokenLifespanMs ?? DEFAULT_CONFIG.tempTokenLifespanMs
    );
  }

  private get cacheKey(): string {
    return '__sso__';
  }

  async getToken(_dbid?: string): Promise<string> {
    // Check cache first
    const cachedToken = this.cache.get(this.cacheKey);
    if (cachedToken) {
      this.logger.token('cache-hit');
      return cachedToken;
    }

    this.logger.token('cache-miss');

    // Check if there's already an exchange in progress
    if (this.pendingExchange) {
      this.logger.debug('Waiting for existing SSO token exchange');
      return this.pendingExchange;
    }

    // Exchange SAML token for QuickBase token
    const exchangePromise = this.exchangeToken();
    this.pendingExchange = exchangePromise;

    try {
      return await exchangePromise;
    } finally {
      this.pendingExchange = null;
    }
  }

  private async exchangeToken(): Promise<string> {
    this.logger.token('fetch');

    const url = `${this.baseUrl}/auth/oauth/token`;

    const body = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      requested_token_type: 'urn:quickbase:params:oauth:token-type:temp_token',
      subject_token: this.samlToken,
      subject_token_type: 'urn:ietf:params:oauth:token-type:saml2',
    });

    const response = await this.fetchApi(url, {
      method: 'POST',
      headers: {
        'QB-Realm-Hostname': `${this.realm}.quickbase.com`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AuthenticationError(
        `SSO token exchange failed: ${response.status} ${errorText}`,
        { rayId: response.headers.get('qb-api-ray') || undefined }
      );
    }

    const data = await response.json() as {
      access_token?: string;
      issued_token_type?: string;
      token_type?: string;
    };

    const token = data.access_token;
    if (!token) {
      throw new AuthenticationError('No access_token in SSO exchange response');
    }

    // Cache the token
    this.cache.set(this.cacheKey, token);
    this.logger.debug('Cached new SSO token');

    return token;
  }

  getAuthorizationHeader(token: string): string {
    return `QB-TEMP-TOKEN ${token}`;
  }

  async handleAuthError(_dbid?: string): Promise<boolean> {
    // Invalidate the cached token
    this.invalidate();

    // Try to exchange for a new token
    try {
      this.logger.token('refresh');
      await this.getToken();
      return true;
    } catch (error) {
      this.logger.error('Failed to refresh SSO token', error);
      return false;
    }
  }

  invalidate(_dbid?: string): void {
    this.logger.token('expire');
    this.cache.clear();
  }
}
