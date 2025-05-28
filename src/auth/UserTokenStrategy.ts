import { AuthorizationStrategy } from "./types";

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
