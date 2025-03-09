// src/tokenCache.ts
interface CachedToken {
  token: string;
  expiresAt: number; // Timestamp in milliseconds
}

export class TokenCache {
  private cache: Map<string, CachedToken>;
  private readonly lifespan: number; // Token lifespan in milliseconds

  constructor(lifespan: number = 4 * 60 * 1000 + 50 * 1000) {
    // Default 4:50
    this.cache = new Map<string, CachedToken>();
    this.lifespan = lifespan;
  }

  get(dbid: string): string | undefined {
    const entry = this.cache.get(dbid);
    const now = Date.now();
    if (entry && entry.expiresAt > now) {
      return entry.token;
    }
    return undefined; // Expired or not found
  }

  set(dbid: string, token: string): void {
    const now = Date.now();
    this.cache.set(dbid, {
      token,
      expiresAt: now + this.lifespan,
    });
  }

  dump(): [string, CachedToken][] {
    return Array.from(this.cache.entries());
  }
}
