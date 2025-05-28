// src/cache/TokenCache.ts

interface CachedToken {
  token: string;
  expiresAt: number;
}

export class TokenCache {
  private cache: Map<string, CachedToken>;
  private readonly tempTokenLifespan: number;

  constructor(tempTokenLifespan: number = 4 * 60 * 1000 + 50 * 1000) {
    this.cache = new Map<string, CachedToken>();
    this.tempTokenLifespan = tempTokenLifespan;
  }

  get(dbid: string): CachedToken | undefined {
    const entry = this.cache.get(dbid);
    const now = Date.now();
    if (entry && entry.expiresAt > now) return entry;
    if (entry) this.cache.delete(dbid);
    return undefined;
  }

  set(dbid: string, token: string, lifespan?: number): void {
    const now = Date.now();
    this.cache.set(dbid, {
      token,
      expiresAt: now + (lifespan || this.tempTokenLifespan),
    });
  }

  delete(dbid: string): void {
    this.cache.delete(dbid);
  }

  clear(): void {
    this.cache.clear();
  }
}
