// src/auth/TicketTokenStrategy.ts
import { parseStringPromise } from "xml2js";
import {
  AuthorizationStrategy,
  CredentialSource,
  Credentials,
  TicketData,
} from "./types";
import { TokenCache } from "../cache/TokenCache";
import { TicketCache } from "../cache/TicketCache";
import { extractDbid } from "./utils";

interface ApiError extends Error {
  status?: number;
  details?: any;
}

export class TicketTokenStrategy implements AuthorizationStrategy {
  private pendingTicketFetch: Promise<TicketData> | null = null;
  private pendingTokenFetches: Map<string, Promise<string>> = new Map();

  constructor(
    private credentialSource: CredentialSource,
    private realm: string,
    private fetchApi: typeof fetch,
    private tokenCache: TokenCache,
    private ticketCache: TicketCache<TicketData>,
    private debug: boolean = false,
    private ticketLifespanHours: number = 12,
    private ticketRefreshThreshold: number = 0.1,
    private baseUrl: string = "https://api.quickbase.com/v1",
    private tempTokenLifespan: number = 3600 * 1000 // Added for type safety
  ) {
    this.ticketLifespan = ticketLifespanHours * 60 * 60 * 1000;
  }

  private ticketLifespan: number;

  private async getCredentials(refresh: boolean = false): Promise<Credentials> {
    try {
      const creds =
        refresh && this.credentialSource.refreshCredentials
          ? await this.credentialSource.refreshCredentials()
          : await this.credentialSource.getCredentials();
      if (!creds.username || !creds.password || !creds.appToken) {
        throw new Error("CredentialSource returned incomplete credentials");
      }
      if (this.debug) {
        console.log(
          `[TicketTokenStrategy] Fetched credentials${
            refresh ? " (refreshed)" : ""
          }`
        );
      }
      return creds;
    } catch (error: unknown) {
      if (this.debug) {
        console.error(
          "[TicketTokenStrategy] Failed to fetch credentials:",
          error
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`CredentialSource error: ${errorMessage}`);
    }
  }

  private async fetchTicket(): Promise<TicketData> {
    if (this.pendingTicketFetch) {
      if (this.debug) {
        console.log("[TicketTokenStrategy] Waiting for pending ticket fetch");
      }
      return this.pendingTicketFetch;
    }

    this.pendingTicketFetch = (async () => {
      try {
        const credentials = await this.getCredentials();
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
          const error: ApiError = new Error(
            `API_Authenticate failed: ${response.status}`
          );
          error.status = response.status;
          throw error;
        }

        const xml = await response.text();
        const parsed = await parseStringPromise(xml);
        const ticket = parsed.qdbapi.ticket?.[0];
        const errcode = parsed.qdbapi.errcode?.[0];

        if (errcode !== "0") {
          const error: ApiError = new Error(
            `API_Authenticate error: ${parsed.qdbapi.errtext?.[0] || "Unknown"}`
          );
          error.status = parseInt(errcode, 10);
          throw error;
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
            )}...`,
            `Expires in: ${(this.ticketLifespan / 3600000).toFixed(2)} hours`
          );
        }

        return ticketData;
      } catch (error) {
        if (this.debug) {
          console.error("[TicketTokenStrategy] Ticket fetch failed:", error);
        }
        throw error;
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
      const timeLeft = entry.expiresAt - now;
      const threshold = this.ticketLifespan * this.ticketRefreshThreshold;
      if (timeLeft < threshold) {
        if (this.debug) {
          console.log(
            `[TicketTokenStrategy] Ticket nearing expiration (${(
              timeLeft / 60000
            ).toFixed(2)} min left), refreshing`
          );
        }
        await this.ticketCache.delete("ticket");
        return this.fetchTicket();
      }
      if (this.debug) {
        console.log("[TicketTokenStrategy] Using cached ticket");
      }
      return entry.value;
    }

    await this.ticketCache.delete("ticket");
    return this.fetchTicket();
  }

  private async fetchTempToken(dbid: string): Promise<string> {
    if (this.pendingTokenFetches.has(dbid)) {
      if (this.debug) {
        console.log(
          `[TicketTokenStrategy] Waiting for pending token fetch for dbid: ${dbid}`
        );
      }
      return this.pendingTokenFetches.get(dbid)!;
    }

    const fetchPromise = (async () => {
      try {
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
          const error: ApiError = new Error(
            `getTempTokenDBID failed: ${errorBody.message || response.status}`
          );
          error.status = response.status;
          error.details = errorBody;
          if (this.debug) {
            console.error("[fetchTempToken] Error:", {
              status: response.status,
              errorBody,
              dbid,
              headers: {
                "QB-Realm-Hostname": `${this.realm}.quickbase.com`,
                Authorization: `QB-TICKET ${ticket.substring(0, 10)}...`,
                Cookie: cookies.substring(0, 20) + "...",
              },
            });
          }
          throw error;
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
      } finally {
        this.pendingTokenFetches.delete(dbid);
      }
    })();

    this.pendingTokenFetches.set(dbid, fetchPromise);
    return fetchPromise;
  }

  async getToken(dbid: string): Promise<string | undefined> {
    if (!dbid) return undefined;
    const cachedEntry = this.tokenCache.get(dbid);
    if (cachedEntry) {
      const now = Date.now();
      const timeLeft = cachedEntry.expiresAt - now;
      const threshold = this.tempTokenLifespan * this.ticketRefreshThreshold;
      if (timeLeft < threshold) {
        if (this.debug) {
          console.log(
            `[TicketTokenStrategy] Token for dbid ${dbid} nearing expiration (${(
              timeLeft / 60000
            ).toFixed(2)} min left), refreshing`
          );
        }
        this.tokenCache.delete(dbid);
        return this.fetchTempToken(dbid);
      }
      if (this.debug) {
        console.log(
          `[TicketTokenStrategy] Using cached temp token for dbid ${dbid}`
        );
      }
      return cachedEntry.token;
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
    if (![401, 429].includes(status)) {
      if (debug || this.debug) {
        console.error(
          `[TicketTokenStrategy] Non-retryable error for ${
            methodName || "method"
          }: Status ${status}`
        );
      }
      return null;
    }

    if (attempt >= maxAttempts) {
      if (debug || this.debug) {
        console.error(
          `[TicketTokenStrategy] Exhausted retries (${maxAttempts}) for ${
            methodName || "method"
          }`
        );
      }
      return null;
    }

    const dbid = extractDbid(params);
    if (!dbid) {
      if (debug || this.debug) {
        console.log(
          `[TicketTokenStrategy] No dbid available for ${
            methodName || "method"
          }, skipping token refresh`
        );
      }
      return null;
    }

    if (debug || this.debug) {
      console.log(
        `[TicketTokenStrategy] Handling error ${status} for ${
          methodName || "method"
        }, attempt ${attempt + 1}/${maxAttempts}, dbid: ${dbid}`
      );
    }

    // First attempt: Refresh temp token
    this.tokenCache.delete(dbid);
    try {
      const newToken = await this.getToken(dbid);
      if (newToken) {
        if (debug || this.debug) {
          console.log(
            `[TicketTokenStrategy] Retrying ${
              methodName || "method"
            } with new token: ${newToken.substring(0, 8)}...`
          );
        }
        return newToken;
      }
    } catch (error: unknown) {
      if (debug || this.debug) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `[TicketTokenStrategy] Token refresh failed for ${
            methodName || "method"
          }:`,
          errorMessage
        );
      }
      // Check if error is ApiError with status
      if (
        error instanceof Error &&
        "status" in error &&
        typeof (error as ApiError).status === "number" &&
        (error as ApiError).status !== 401
      ) {
        throw error; // Rethrow non-401 errors
      }
      // 401 error or non-ApiError: Proceed to ticket refresh
    }

    // Second attempt: Refresh ticket and retry
    if (debug || this.debug) {
      console.log(
        `[TicketTokenStrategy] Attempting ticket refresh for ${
          methodName || "method"
        }`
      );
    }
    await this.ticketCache.delete("ticket");
    try {
      const credentials = await this.getCredentials(true); // Request refreshed credentials
      const newToken = await this.getToken(dbid);
      if (newToken) {
        if (debug || this.debug) {
          console.log(
            `[TicketTokenStrategy] Retrying ${
              methodName || "method"
            } with token after ticket refresh: ${newToken.substring(0, 8)}...`
          );
        }
        return newToken;
      }
    } catch (error: unknown) {
      if (debug || this.debug) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `[TicketTokenStrategy] Failed to obtain new token after ticket refresh for ${
            methodName || "method"
          }:`,
          errorMessage
        );
      }
      throw error; // Rethrow to allow invokeMethod to handle retries
    }

    if (debug || this.debug) {
      console.error(
        `[TicketTokenStrategy] Failed to obtain new token after ticket refresh for ${
          methodName || "method"
        }`
      );
    }
    return null;
  }
}
