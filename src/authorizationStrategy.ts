import { TokenCache } from "./tokenCache";
import { parseStringPromise } from "xml2js";
import { TicketCache, TicketCacheEntry } from "./TicketCache";

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

export function extractDbid(params: any): string | undefined {
  return (
    params.dbid ||
    params.tableId ||
    params.appId ||
    params.body?.from ||
    params.body?.to
  );
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
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      Origin: `https://${this.realm}.quickbase.com`,
      Referer: `https://${this.realm}.quickbase.com`,
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
    this.tokenCache.delete(dbid);
    try {
      const newToken = await this.getToken(dbid);
      if (newToken) {
        this.tokenCache.set(dbid, newToken);
        if (debug)
          console.log(
            `[${
              methodName || "method"
            }] Retrying with token: ${newToken.substring(0, 10)}...`
          );
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

export interface Credentials {
  username: string;
  password: string;
  appToken: string;
}

export type CredentialProvider = () => Promise<Credentials> | Credentials;

export interface TicketData {
  ticket: string;
  cookies: string;
}

export class TicketTokenStrategy implements AuthorizationStrategy {
  private credentials: Credentials;
  private credentialProvider?: CredentialProvider;
  private realm: string;
  private fetchApi: typeof fetch;
  private baseUrl: string;
  private tokenCache: TokenCache;
  private ticketCache: TicketCache<TicketData>;
  private pendingTicketFetch: Promise<TicketData> | null = null;
  private ticketLifespan: number; // In milliseconds
  private ticketLifespanHours: number; // In hours
  private debug: boolean;

  constructor(
    credentials: Credentials,
    credentialProvider: CredentialProvider | undefined,
    realm: string,
    fetchApi: typeof fetch,
    tokenCache: TokenCache,
    ticketCache: TicketCache<TicketData>,
    debug = false,
    ticketLifespanHours = 12, // Default to 12 hours
    baseUrl = "https://api.quickbase.com/v1"
  ) {
    this.credentials = credentials;
    this.credentialProvider = credentialProvider;
    this.realm = realm;
    this.fetchApi = fetchApi;
    this.baseUrl = baseUrl;
    this.tokenCache = tokenCache;
    this.ticketCache = ticketCache;
    this.ticketLifespanHours = ticketLifespanHours;
    this.ticketLifespan = ticketLifespanHours * 60 * 60 * 1000; // Convert hours to milliseconds
    this.debug = debug;
  }

  private async getCredentials(): Promise<Credentials> {
    if (this.credentialProvider) {
      const creds = await this.credentialProvider();
      if (this.debug) {
        console.log("[TicketTokenStrategy] Fetched credentials via provider");
      }
      return creds;
    }
    if (this.debug) {
      console.log("[TicketTokenStrategy] Using stored credentials");
    }
    return this.credentials;
  }

  private async fetchTicket(credentials: Credentials): Promise<TicketData> {
    if (this.pendingTicketFetch) {
      if (this.debug) {
        console.log("[TicketTokenStrategy] Waiting for pending ticket fetch");
      }
      return this.pendingTicketFetch;
    }

    this.pendingTicketFetch = (async () => {
      try {
        const response = await this.fetchApi(
          `https://${this.realm}.quickbase.com/db/main`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/xml",
              Accept: "application/xml",
              "QUICKBASE-ACTION": "API_Authenticate",
              "QB-App-Token": credentials.appToken,
              "QB-Realm-Hostname": `${this.realm}.quickbase.com`,
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
              Origin: `https://${this.realm}.quickbase.com`,
              Referer: `https://${this.realm}.quickbase.com`,
            },
            body: `<?xml version="1.0" ?>
              <qdbapi>
                <username>${credentials.username}</username>
                <password>${credentials.password}</password>
                <hours>${this.ticketLifespanHours}</hours>
                <udata>auth_request</udata>
              </qdbapi>`,
          }
        );

        if (!response.ok) {
          throw new Error(`API_Authenticate failed: ${response.status}`);
        }

        const xml = await response.text();
        const parsed = await parseStringPromise(xml);
        const ticket = parsed.qdbapi.ticket?.[0];
        const errcode = parsed.qdbapi.errcode?.[0];

        if (errcode !== "0") {
          throw new Error(
            `API_Authenticate error: ${parsed.qdbapi.errtext?.[0] || "Unknown"}`
          );
        }

        if (!ticket) {
          throw new Error("No ticket returned from API_Authenticate");
        }

        // Parse set-cookie headers
        const setCookies =
          response.headers
            .get("set-cookie")
            ?.split(/,(?=\s*[^\s])/)
            .map((c) => c.trim()) || [];
        const cookies = setCookies
          .filter((c) => c.includes("TICKET") || c.includes("luid"))
          .map((c) => c.split(";")[0])
          .join("; ");

        const ticketData: TicketData = { ticket, cookies };

        await this.ticketCache.set("ticket", ticketData, this.ticketLifespan);
        if (this.debug) {
          console.log(
            `[TicketTokenStrategy] Fetched and cached ticket: ${ticket.substring(
              0,
              10
            )}...`
          );
        }

        return ticketData;
      } finally {
        this.pendingTicketFetch = null;
      }
    })();

    return this.pendingTicketFetch;
  }

  private async getTicket(): Promise<TicketData> {
    const entry = await this.ticketCache.get("ticket");
    const now = Date.now();

    if (entry && entry.expiresAt > now) {
      if (this.debug) {
        console.log("[TicketTokenStrategy] Using cached ticket");
      }
      return entry.value;
    }

    await this.ticketCache.delete("ticket");
    const credentials = await this.getCredentials();
    return this.fetchTicket(credentials);
  }

  private async fetchTempToken(dbid: string): Promise<string> {
    const { ticket, cookies } = await this.getTicket();
    const response = await this.fetchApi(
      `${this.baseUrl}/auth/temporary/${dbid}`,
      {
        headers: {
          "QB-Realm-Hostname": `${this.realm}.quickbase.com`,
          "Content-Type": "application/json",
          Authorization: `QB-TICKET ${ticket}`,
          Cookie: cookies,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Origin: `https://${this.realm}.quickbase.com`,
          Referer: `https://${this.realm}.quickbase.com`,
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error("[fetchTempToken] Error response:", {
        status: response.status,
        errorBody,
        dbid,
        headers: {
          "QB-Realm-Hostname": `${this.realm}.quickbase.com`,
          Authorization: `QB-TICKET ${ticket}`,
          Cookie: cookies,
        },
      });
      throw new Error(
        `getTempTokenDBID failed: ${errorBody.message || response.status}`
      );
    }

    const json = await response.json();
    const token = json.temporaryAuthorization;

    if (!token) {
      throw new Error("No temporary token returned from getTempTokenDBID");
    }

    this.tokenCache.set(dbid, token);
    if (this.debug) {
      console.log(
        `[TicketTokenStrategy] Fetched temp token for dbid ${dbid}: ${token.substring(
          0,
          10
        )}...`
      );
    }
    return token;
  }

  async getToken(dbid: string): Promise<string | undefined> {
    if (!dbid) return undefined;
    const cachedToken = this.tokenCache.get(dbid);
    if (cachedToken) {
      if (this.debug) {
        console.log(
          `[TicketTokenStrategy] Using cached temp token for dbid ${dbid}`
        );
      }
      return cachedToken;
    }
    return this.fetchTempToken(dbid);
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
    if (status !== 401 || attempt >= maxAttempts - 1) {
      return null;
    }

    if (debug) {
      console.log(
        `[TicketTokenStrategy] Authorization error for ${
          methodName || "method"
        }, attempting token refresh`
      );
    }

    const dbid = extractDbid(params);
    if (!dbid) {
      if (debug) {
        console.log(
          `[TicketTokenStrategy] No dbid available for ${
            methodName || "method"
          }, skipping token refresh`
        );
      }
      return null;
    }

    // Clear only the token cache initially
    this.tokenCache.delete(dbid);

    try {
      const newToken = await this.getToken(dbid);
      if (newToken) {
        if (debug) {
          console.log(
            `[TicketTokenStrategy] Retrying ${
              methodName || "method"
            } with token: ${newToken.substring(0, 10)}...`
          );
        }
        return newToken;
      }
      return null;
    } catch (error) {
      if (debug) {
        console.log(
          `[TicketTokenStrategy] Token refresh failed for ${
            methodName || "method"
          }, attempting ticket refresh:`,
          error
        );
      }

      // If token refresh fails, clear ticket cache and try again
      await this.ticketCache.delete("ticket");

      try {
        const newToken = await this.getToken(dbid);
        if (newToken) {
          if (debug) {
            console.log(
              `[TicketTokenStrategy] Retrying ${
                methodName || "method"
              } with token after ticket refresh: ${newToken.substring(
                0,
                10
              )}...`
            );
          }
          return newToken;
        }
        return null;
      } catch (error) {
        if (debug) {
          console.log(
            `[TicketTokenStrategy] Failed to refresh token after ticket refresh for ${
              methodName || "method"
            }:`,
            error
          );
        }
        throw error;
      }
    }
  }
}
