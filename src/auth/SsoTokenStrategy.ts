import { AuthorizationStrategy } from "./types";

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
      if (debug || this.debug)
        console.log(
          `[${
            methodName || "method"
          }] Retrying with token: ${newToken.substring(0, 10)}...`
        );
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
