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

export function extractDbid(params: any): string | undefined {
  return (
    params.dbid ||
    params.tableId ||
    params.appId ||
    params.body?.from ||
    params.body?.to
  );
}
