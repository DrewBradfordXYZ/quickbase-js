import { parseStringPromise } from "xml2js";
import {
  AuthorizationStrategy,
  Credentials,
  CredentialProvider,
  TicketData,
} from "./types";
import { TokenCache } from "../cache/TokenCache";
import { TicketCache } from "../cache/TicketCache";
import { extractDbid } from "./utils";

export class TicketTokenStrategy implements AuthorizationStrategy {
  private pendingTicketFetch: Promise<TicketData> | null = null;

  constructor(
    private credentials: Credentials,
    private credentialProvider: CredentialProvider | undefined,
    private realm: string,
    private fetchApi: typeof fetch,
    private tokenCache: TokenCache,
    private ticketCache: TicketCache<TicketData>,
    private debug: boolean = false,
    private ticketLifespanHours: number = 12,
    private baseUrl: string = "https://api.quickbase.com/v1"
  ) {
    this.ticketLifespan = ticketLifespanHours * 60 * 60 * 1000;
  }

  private ticketLifespan: number;

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
