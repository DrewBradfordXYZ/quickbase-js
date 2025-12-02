/**
 * Token cache with TTL support
 *
 * Manages cached temporary tokens with expiration handling.
 * Tokens are stored per-dbid since QuickBase temp tokens are database-specific.
 */

import type { CachedToken } from './types.js';

export class TokenCache {
  private readonly cache = new Map<string, CachedToken>();
  private readonly defaultLifespanMs: number;

  constructor(defaultLifespanMs: number) {
    this.defaultLifespanMs = defaultLifespanMs;
  }

  /**
   * Get a cached token if it exists and is not expired
   */
  get(dbid: string): string | null {
    const entry = this.cache.get(dbid);
    if (!entry) {
      return null;
    }

    // Check if token is expired (with 10 second buffer)
    if (Date.now() >= entry.expiresAt - 10000) {
      this.cache.delete(dbid);
      return null;
    }

    return entry.token;
  }

  /**
   * Store a token with optional custom lifespan
   */
  set(dbid: string, token: string, lifespanMs?: number): void {
    const expiresAt = Date.now() + (lifespanMs ?? this.defaultLifespanMs);
    this.cache.set(dbid, { token, expiresAt });
  }

  /**
   * Remove a specific token from cache
   */
  delete(dbid: string): boolean {
    return this.cache.delete(dbid);
  }

  /**
   * Clear all cached tokens
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Check if a token exists and is valid
   */
  has(dbid: string): boolean {
    return this.get(dbid) !== null;
  }

  /**
   * Get time until token expires (in ms), or null if not cached
   */
  getTimeToExpiry(dbid: string): number | null {
    const entry = this.cache.get(dbid);
    if (!entry) {
      return null;
    }
    const ttl = entry.expiresAt - Date.now();
    return ttl > 0 ? ttl : null;
  }

  /**
   * Get the number of cached tokens
   */
  get size(): number {
    // Clean up expired entries first
    this.cleanup();
    return this.cache.size;
  }

  /**
   * Remove expired entries from cache
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [dbid, entry] of this.cache) {
      if (now >= entry.expiresAt) {
        this.cache.delete(dbid);
      }
    }
  }
}
