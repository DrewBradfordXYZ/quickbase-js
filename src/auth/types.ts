// src/auth/types.ts
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

export interface Credentials {
  username: string;
  password: string;
  appToken: string;
}

export interface CredentialSource {
  getCredentials(): Promise<Credentials>;
  refreshCredentials?(): Promise<Credentials>;
}

export interface TicketData {
  ticket: string;
  cookies: string;
}
