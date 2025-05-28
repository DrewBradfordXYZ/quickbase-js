// src/auth/TempTokenStrategy.ts
import { AuthorizationStrategy } from "./types";
import { TokenCache } from "../cache/TokenCache";
import { extractDbid } from "./utils";

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
    const cachedEntry = this.tokenCache.get(dbid);
    let token = cachedEntry ? cachedEntry.token : this.initialTempToken;
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
