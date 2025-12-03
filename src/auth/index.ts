/**
 * Authentication module exports
 */

export type { AuthStrategy, AuthContext, CachedToken } from './types.js';
export { UserTokenStrategy } from './user-token.js';
export { TempTokenStrategy } from './temp-token.js';
export { SsoTokenStrategy } from './sso-token.js';
export { TicketStrategy } from './ticket.js'; // XML-API-TICKET: Remove if XML API discontinued
export { TokenCache } from './token-cache.js';

import type { AuthConfig } from '../core/types.js';
import type { AuthStrategy, AuthContext } from './types.js';
import { UserTokenStrategy } from './user-token.js';
import { TempTokenStrategy } from './temp-token.js';
import { SsoTokenStrategy } from './sso-token.js';
import { TicketStrategy } from './ticket.js'; // XML-API-TICKET: Remove if XML API discontinued

/**
 * Factory function to create the appropriate auth strategy
 */
export function createAuthStrategy(
  authConfig: AuthConfig,
  context: AuthContext
): AuthStrategy {
  switch (authConfig.type) {
    case 'user-token':
      return new UserTokenStrategy(authConfig.userToken, context);

    case 'temp-token':
      return new TempTokenStrategy(authConfig.userToken, context, {
        appToken: authConfig.appToken,
        tokenLifespanMs: authConfig.tokenLifespanMs,
      });

    case 'sso':
      return new SsoTokenStrategy(authConfig.samlToken, context);

    // XML-API-TICKET: Remove this case if XML API is discontinued
    case 'ticket':
      return new TicketStrategy(
        authConfig.username,
        authConfig.password,
        { hours: authConfig.hours },
        context
      );

    default:
      throw new Error(`Unknown auth type: ${(authConfig as { type: string }).type}`);
  }
}
