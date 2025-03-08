// src/tokenCache.ts
interface TokenEntry {
  token: string;
  dbid: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

export class TokenCache {
  private tokens: Map<string, TokenEntry>;

  constructor() {
    this.tokens = new Map();
  }

  // Add or update a token for a dbid
  set(dbid: string, token: string, lifespanSeconds: number = 300): void {
    const expiresAt = Date.now() + (lifespanSeconds - 10) * 1000; // 10-second buffer
    this.tokens.set(dbid, { token, dbid, expiresAt });
  }

  // Get a valid token for a dbid, or undefined if expired/missing
  get(dbid: string): string | undefined {
    const entry = this.tokens.get(dbid);
    if (entry && Date.now() < entry.expiresAt) {
      return entry.token;
    }
    this.tokens.delete(dbid); // Clean up expired token
    return undefined;
  }

  // Check if a valid token exists for a dbid
  hasValidToken(dbid: string): boolean {
    return !!this.get(dbid);
  }

  // Clear the cache (for testing or reset)
  clear(): void {
    this.tokens.clear();
  }
}

// Singleton instance (optional, adjust based on your needs)
export const tokenCache = new TokenCache();
