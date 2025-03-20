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
  private currentToken: string | undefined;

  constructor(
    private samlToken: string,
    private realm: string,
    private fetchApi: typeof fetch,
    private debug: boolean = false
  ) {}

  async getToken(_dbid: string): Promise<string | undefined> {
    if (!this.currentToken) {
      this.currentToken = await this.fetchSsoToken({
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        requested_token_type:
          "urn:quickbase:params:oauth:token-type:temp_token",
        subject_token: this.samlToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:saml2",
      });
    }
    return this.currentToken;
  }

  applyHeaders(headers: Record<string, string>, token: string): void {
    headers["Authorization"] = `QB-TEMP-TOKEN ${token}`;
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

    if (debug || this.debug) {
      console.log(
        `Authorization error for ${
          methodName || "method"
        } (SSO), refreshing token`
      );
    }

    const newToken = await this.refreshSsoToken(debug || this.debug);
    if (newToken) {
      this.currentToken = newToken;
      return newToken;
    }
    return null;
  }

  private async refreshSsoToken(debug: boolean = false): Promise<string> {
    const payload = {
      grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      requested_token_type: "urn:quickbase:params:oauth:token-type:temp_token",
      subject_token: this.samlToken,
      subject_token_type: "urn:ietf:params:oauth:token-type:saml2",
    };

    const response = await this.fetchApi(
      `https://api.quickbase.com/v1/auth/oauth/token`,
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
      const errorBody = await response.json().catch(() => ({}));
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

  private async fetchSsoToken(params: {
    grant_type: string;
    requested_token_type: string;
    subject_token: string;
    subject_token_type: string;
  }): Promise<string> {
    const response = await this.fetchApi(
      `https://api.quickbase.com/v1/auth/oauth/token`,
      {
        method: "POST",
        headers: {
          "QB-Realm-Hostname": `${this.realm}.quickbase.com`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
        credentials: "omit",
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      if (this.debug) {
        console.log(`[fetchSsoToken] Failed: ${response.status}`, errorBody);
      }
      throw new Error(
        `SSO token fetch failed: ${errorBody.message || "Unknown error"}`
      );
    }

    const result = await response.json();
    const newToken = result.access_token;
    if (!newToken) {
      throw new Error("No access token returned from SSO token exchange");
    }

    if (this.debug) {
      console.log(
        `[fetchSsoToken] Fetched token: ${newToken.substring(0, 10)}...`
      );
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
