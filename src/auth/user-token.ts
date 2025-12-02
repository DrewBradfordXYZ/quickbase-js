/**
 * User Token Authentication Strategy
 *
 * Simplest auth method - uses a persistent user token directly.
 * Token is passed in the Authorization header as "QB-USER-TOKEN {token}"
 */

import type { AuthStrategy, AuthContext } from './types.js';
import type { Logger } from '../core/logger.js';

export class UserTokenStrategy implements AuthStrategy {
  private readonly userToken: string;
  private readonly logger: Logger;

  constructor(userToken: string, context: AuthContext) {
    this.userToken = userToken;
    this.logger = context.logger;
  }

  async getToken(_dbid?: string): Promise<string> {
    // User tokens don't change, just return the configured token
    return this.userToken;
  }

  getAuthorizationHeader(token: string): string {
    return `QB-USER-TOKEN ${token}`;
  }

  async handleAuthError(_dbid?: string): Promise<boolean> {
    // User tokens can't be refreshed - if auth fails, it's a permanent failure
    this.logger.debug('Auth error with user token - cannot refresh');
    return false;
  }

  invalidate(_dbid?: string): void {
    // No-op for user tokens - they don't have cached state
  }
}
