// src/authorizationStrategy.ts
import { TokenCache } from "./tokenCache";

export interface AuthorizationStrategy {
  getToken(dbid: string): Promise<string | undefined>;
  applyHeaders(headers: Record<string, string>, token: string): void;
  handleError(
    status: number,
    params: any,
    attempt: number,
    maxAttempts: number,
    debug?: boolean,
    methodName?: string
  ): Promise<string | null>;
}

export class TempTokenStrategy implements AuthorizationStrategy {
  private pendingFetches: Map<string, Promise<string>> = new Map();

  constructor(
    private tokenCache: TokenCache,
    private initialTempToken: string | undefined,
    private fetchApi: typeof fetch,
    private realm: string,
    private baseUrl: string = "https://api.quickbase.com/v1"
  ) {}

  async fetchTempToken(dbid: string): Promise<string> {
    const headers = {
      "QB-Realm-Hostname": `${this.realm}.quickbase.com`,
      "Content-Type": "application/json",
    };
    const response = await this.fetchApi(
      `${this.baseUrl}/auth/temporary/${dbid}`,
      {
        method: "GET",
        headers,
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.message || "Unknown error";
      throw new Error(`API Error: ${message} (Status: ${response.status})`);
    }

    const tokenResult = await response.json();
    const token = tokenResult.temporaryAuthorization;
    if (!token) {
      throw new Error(
        "API Error: No temporary token returned from API (Status: 200)"
      );
    }
    this.tokenCache.set(dbid, token);
    console.log(`Fetched and cached new token for dbid: ${dbid}`, token);
    return token;
  }

  async getToken(dbid: string): Promise<string | undefined> {
    let token = this.tokenCache.get(dbid) || this.initialTempToken;
    if (!token && dbid) {
      if (this.pendingFetches.has(dbid)) {
        console.log(`[getToken] Waiting for existing fetch for dbid: ${dbid}`);
        return this.pendingFetches.get(dbid);
      }
      const fetchPromise = this.fetchTempToken(dbid).finally(() =>
        this.pendingFetches.delete(dbid)
      );
      this.pendingFetches.set(dbid, fetchPromise);
      token = await fetchPromise;
    }
    return token;
  }

  applyHeaders(headers: Record<string, string>, token: string): void {
    headers["Authorization"] = `QB-TEMP-TOKEN ${token}`;
  }

  async handleError(
    status: number,
    params: any,
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
    // Invalidate the cache for this dbid to force a fresh fetch
    this.tokenCache.delete(dbid);
    try {
      const newToken = await this.getToken(dbid);
      if (newToken) {
        this.tokenCache.set(dbid, newToken);
        return newToken;
      }
      return null;
    } catch (error) {
      if (debug)
        console.log(
          `[${methodName || "method"}] Failed to refresh token:`,
          error
        );
      throw error;
    }
  }
}

export class UserTokenStrategy implements AuthorizationStrategy {
  constructor(
    private userToken: string,
    private baseUrl: string = "https://api.quickbase.com/v1"
  ) {}

  async getToken(_dbid: string): Promise<string> {
    return this.userToken;
  }

  applyHeaders(headers: Record<string, string>, token: string): void {
    headers["Authorization"] = `QB-USER-TOKEN ${token}`;
  }

  async handleError(
    status: number,
    _params: any,
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
  private pendingFetches: Map<string, Promise<string>> = new Map();

  constructor(
    private samlToken: string,
    private realm: string,
    private fetchApi: typeof fetch,
    private debug: boolean = false,
    private baseUrl: string = "https://api.quickbase.com/v1"
  ) {}

  async getToken(_dbid: string): Promise<string | undefined> {
    if (!this.currentToken) {
      if (this.pendingFetches.has("sso")) {
        if (this.debug)
          console.log("[getToken] Waiting for existing SSO fetch");
        return this.pendingFetches.get("sso");
      }
      const fetchPromise = this.fetchSsoToken({
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        requested_token_type:
          "urn:quickbase:params:oauth:token-type:temp_token",
        subject_token: this.samlToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:saml2",
      }).finally(() => this.pendingFetches.delete("sso"));
      this.pendingFetches.set("sso", fetchPromise);
      this.currentToken = await fetchPromise;
    }
    return this.currentToken;
  }

  applyHeaders(headers: Record<string, string>, token: string): void {
    headers["Authorization"] = `QB-TEMP-TOKEN ${token}`;
  }

  async handleError(
    status: number,
    _params: any,
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

    const response = await this.fetchApi(`${this.baseUrl}/auth/oauth/token`, {
      method: "POST",
      headers: {
        "QB-Realm-Hostname": `${this.realm}.quickbase.com`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "omit",
    });

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
    const response = await this.fetchApi(`${this.baseUrl}/auth/oauth/token`, {
      method: "POST",
      headers: {
        "QB-Realm-Hostname": `${this.realm}.quickbase.com`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
      credentials: "omit",
    });

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
