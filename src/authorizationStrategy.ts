// src/authorizationStrategy.ts

import { TokenCache } from "./tokenCache";

export interface AuthorizationStrategy {
  getToken(dbid: string): Promise<string | undefined>;
  applyHeaders(headers: Record<string, string>, token: string): void;
  handleError(
    status: number,
    params: any,
    fetchTempToken: (dbid: string) => Promise<string>,
    attempt: number,
    maxAttempts: number,
    debug?: boolean,
    methodName?: string
  ): Promise<string | null>;
}

export class TempTokenStrategy implements AuthorizationStrategy {
  constructor(
    private tokenCache: TokenCache,
    private initialTempToken?: string
  ) {}

  async getToken(dbid: string): Promise<string | undefined> {
    return this.tokenCache.get(dbid) || this.initialTempToken;
  }

  applyHeaders(headers: Record<string, string>, token: string): void {
    headers["Authorization"] = `QB-TEMP-TOKEN ${token}`;
  }

  async handleError(
    status: number,
    params: any,
    fetchTempToken: (dbid: string) => Promise<string>,
    attempt: number,
    maxAttempts: number,
    debug?: boolean,
    methodName?: string
  ): Promise<string | null> {
    if (status !== 401 || attempt >= maxAttempts - 1) return null;
    if (debug)
      console.log(
        `Authorization error for ${
          methodName || "method"
        } (temp token), refreshing token:`
      );
    const dbid = extractDbid(params);
    if (!dbid) {
      if (debug)
        console.log(
          `No dbid available for ${
            methodName || "method"
          }, skipping token refresh`
        );
      return null;
    }
    if (debug) console.log(`Refreshing temp token for dbid: ${dbid}`);
    const newToken = await fetchTempToken(dbid);
    this.tokenCache.set(dbid, newToken);
    return newToken;
  }
}

export class UserTokenStrategy implements AuthorizationStrategy {
  constructor(private userToken: string) {}

  async getToken(_dbid: string): Promise<string> {
    return this.userToken;
  }

  applyHeaders(headers: Record<string, string>, token: string): void {
    headers["Authorization"] = `QB-USER-TOKEN ${token}`;
  }

  async handleError(
    status: number,
    _params: any,
    _fetchTempToken: (dbid: string) => Promise<string>,
    attempt: number,
    maxAttempts: number,
    debug?: boolean,
    methodName?: string
  ): Promise<string | null> {
    if (status !== 401 || attempt >= maxAttempts - 1) return null;
    if (debug)
      console.log(
        `Retrying ${
          methodName || "method"
        } with existing user token: ${this.userToken.substring(0, 10)}...`
      );
    return this.userToken;
  }
}

export class SsoTokenStrategy implements AuthorizationStrategy {
  private currentToken: string | undefined; // Current temp token from SSO exchange

  constructor(
    private samlToken: string, // Initial SAML2 token provided by the user
    private realm: string, // Needed for the API endpoint
    private fetchApi: typeof fetch // Fetch implementation for token refresh
  ) {}

  async getToken(_dbid: string): Promise<string | undefined> {
    if (!this.currentToken) {
      this.currentToken = await this.refreshSsoToken(); // Initialize token on first use
    }
    return this.currentToken;
  }

  applyHeaders(headers: Record<string, string>, token: string): void {
    headers["Authorization"] = `QB-TEMP-TOKEN ${token}`; // Use temp token format as per API response
  }

  async handleError(
    status: number,
    _params: any,
    _fetchTempToken: (dbid: string) => Promise<string>,
    attempt: number,
    maxAttempts: number,
    debug?: boolean,
    methodName?: string
  ): Promise<string | null> {
    if (status !== 401 || attempt >= maxAttempts - 1) return null; // Respect maxRetries

    if (debug) {
      console.log(
        `Authorization error for ${
          methodName || "method"
        } (SSO), refreshing token`
      );
    }

    // Refresh the SSO token directly
    const newToken = await this.refreshSsoToken(debug);
    if (newToken) {
      this.currentToken = newToken; // Update the current token
      return newToken;
    }
    return null;
  }

  private async refreshSsoToken(debug?: boolean): Promise<string> {
    const payload = {
      grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      requested_token_type: "urn:quickbase:params:oauth:token-type:temp_token", // For RESTful API
      subject_token: this.samlToken, // Base64url-encoded SAML2 assertion
      subject_token_type: "urn:ietf:params:oauth:token-type:saml2",
    };

    const response = await this.fetchApi(
      `https://api.quickbase.com/v1/auth/exchange`,
      {
        method: "POST",
        headers: {
          "QB-Realm-Hostname": `${this.realm}.quickbase.com`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "omit",
      }
    );

    if (!response.ok) {
      const errorBody = await response.json();
      if (debug) {
        console.log(`[SSO Refresh] Failed: ${response.status}`, errorBody);
      }
      throw new Error(
        `SSO token refresh failed: ${errorBody.message || "Unknown error"}`
      );
    }

    const result = await response.json();
    const newToken = result.access_token;
    if (!newToken) {
      throw new Error("No access token returned from SSO token exchange");
    }

    if (debug) {
      console.log(`[SSO Refresh] New token: ${newToken.substring(0, 10)}...`);
    }
    return newToken;
  }
}

export function extractDbid(params: any): string | undefined {
  return (
    params.dbid ||
    params.tableId ||
    params.appId ||
    params.body?.from ||
    params.body?.to
  );
}
