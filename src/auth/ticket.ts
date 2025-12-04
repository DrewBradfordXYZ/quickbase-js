/**
 * Ticket Authentication Strategy (XML API)
 *
 * Authenticates using username/password via the XML API_Authenticate endpoint.
 * Unlike user tokens, tickets properly attribute record changes (createdBy/modifiedBy)
 * to the authenticated user.
 *
 * NOTE: This uses the legacy QuickBase XML API (API_Authenticate).
 * If QuickBase discontinues the XML API in the future, this file and related code
 * can be safely removed.
 *
 * To find all related code, search for the marker: XML-API-TICKET
 *
 * Files to remove/update:
 *   - src/auth/ticket.ts (this file)
 *   - src/auth/index.ts (TicketStrategy export, createAuthStrategy case)
 *   - src/core/types.ts (TicketAuthConfig)
 *   - src/index.ts (exports)
 *   - tests/auth/ticket.test.ts
 *   - README.md: "Ticket Auth" section
 */

import type { AuthStrategy, AuthContext } from './types.js';
import type { Logger } from '../core/logger.js';

interface AuthenticateResponse {
  ticket: string;
  userid: string;
  errcode: number;
  errtext: string;
  errdetail?: string;
}

/**
 * Options for ticket authentication
 */
export interface TicketAuthOptions {
  /** Ticket validity in hours (default: 12, max: 4380 ~6 months) */
  hours?: number;
  /** Callback invoked when ticket expires - use to show login UI */
  onExpired?: () => void;
}

/**
 * Ticket authentication strategy using XML API_Authenticate.
 *
 * @example
 * ```typescript
 * const client = createClient({
 *   realm: 'mycompany',
 *   auth: {
 *     type: 'ticket',
 *     username: 'user@example.com',
 *     password: 'password',
 *   },
 * });
 * ```
 *
 * XML-API-TICKET: Remove this class if XML API is discontinued.
 */
export class TicketStrategy implements AuthStrategy {
  private readonly username: string;
  private password: string | null; // Cleared after first auth
  private readonly hours: number;
  private readonly realm: string;
  private readonly fetchApi: typeof fetch;
  private readonly logger: Logger;
  private readonly onExpired?: () => void;

  private ticket: string | null = null;
  private userId: string | null = null;
  private authenticated = false;
  private pendingAuth: Promise<string> | null = null;

  constructor(
    username: string,
    password: string,
    options: TicketAuthOptions | undefined,
    context: AuthContext
  ) {
    this.username = username;
    this.password = password;
    this.hours = Math.min(Math.max(options?.hours ?? 12, 1), 4380);
    this.onExpired = options?.onExpired;
    this.realm = context.realm;
    this.fetchApi = context.fetchApi;
    this.logger = context.logger;
  }

  async getToken(_dbid?: string): Promise<string> {
    // Return cached ticket if available
    if (this.ticket) {
      return this.ticket;
    }

    // If already authenticated but no ticket, it expired
    if (this.authenticated) {
      this.onExpired?.();
      throw new Error('Ticket expired; create a new client with fresh credentials');
    }

    // Dedupe concurrent auth requests
    if (this.pendingAuth) {
      return this.pendingAuth;
    }

    this.pendingAuth = this.authenticate();
    try {
      const ticket = await this.pendingAuth;
      return ticket;
    } finally {
      this.pendingAuth = null;
    }
  }

  getAuthorizationHeader(token: string): string {
    return `QB-TICKET ${token}`;
  }

  async handleAuthError(_dbid?: string): Promise<boolean> {
    // Clear expired ticket
    this.ticket = null;

    // Can't refresh - password was cleared after initial auth
    this.logger.debug('Ticket auth error - cannot refresh (password was cleared)');
    this.onExpired?.();
    return false;
  }

  invalidate(_dbid?: string): void {
    this.ticket = null;
  }

  /**
   * Get the authenticated user's ID (available after first API call)
   */
  getUserId(): string | null {
    return this.userId;
  }

  private async authenticate(): Promise<string> {
    if (!this.password) {
      this.onExpired?.();
      throw new Error('Ticket expired; create a new client with fresh credentials');
    }

    const url = `https://${this.realm}.quickbase.com/db/main`;

    // Build XML request body
    const xmlBody = `<qdbapi>
    <username>${this.escapeXml(this.username)}</username>
    <password>${this.escapeXml(this.password)}</password>
    <hours>${this.hours}</hours>
</qdbapi>`;

    this.logger.debug(`Authenticating via API_Authenticate for ${this.username}`);

    const response = await this.fetchApi(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'QUICKBASE-ACTION': 'API_Authenticate',
      },
      body: xmlBody,
    });

    const xmlText = await response.text();
    const result = this.parseXmlResponse(xmlText);

    if (result.errcode !== 0) {
      const errMsg = result.errdetail || result.errtext || 'Unknown error';
      throw new Error(`Authentication failed: ${errMsg} (code: ${result.errcode})`);
    }

    if (!result.ticket) {
      throw new Error('No ticket returned from API_Authenticate');
    }

    // Store ticket and user ID
    this.ticket = result.ticket;
    this.userId = result.userid;
    this.authenticated = true;

    // Clear password from memory
    this.password = null;

    this.logger.debug(`Authenticated successfully, userId: ${this.userId}`);

    return this.ticket;
  }

  private parseXmlResponse(xml: string): AuthenticateResponse {
    // Simple XML parsing for the specific response format
    const getTagContent = (tag: string): string => {
      const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return match?.[1] ?? '';
    };

    return {
      ticket: getTagContent('ticket'),
      userid: getTagContent('userid'),
      errcode: parseInt(getTagContent('errcode'), 10) || 0,
      errtext: getTagContent('errtext'),
      errdetail: getTagContent('errdetail') || undefined,
    };
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
