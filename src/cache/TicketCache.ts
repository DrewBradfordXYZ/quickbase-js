// src/TicketCache.ts

interface TicketCacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface TicketCache<T> {
  get(
    key: string
  ): Promise<TicketCacheEntry<T> | undefined> | TicketCacheEntry<T> | undefined;
  set(key: string, value: T, lifespan: number): Promise<void> | void;
  delete(key: string): Promise<void> | void;
  clear(): Promise<void> | void;
}

class LocalStorageTicketCache<T> implements TicketCache<T> {
  private prefix: string;

  constructor(prefix = "quickbase-ticket") {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  get(key: string): TicketCacheEntry<T> | undefined {
    if (typeof window === "undefined" || !window.localStorage) {
      throw new Error("localStorage is not available");
    }
    const raw = window.localStorage.getItem(this.getKey(key));
    if (!raw) return undefined;
    try {
      const entry: TicketCacheEntry<T> = JSON.parse(raw);
      if (entry.expiresAt > Date.now()) {
        return entry;
      }
      this.delete(key);
      return undefined;
    } catch {
      return undefined;
    }
  }

  set(key: string, value: T, lifespan: number): void {
    if (typeof window === "undefined" || !window.localStorage) {
      throw new Error("localStorage is not available");
    }
    const entry: TicketCacheEntry<T> = {
      value,
      expiresAt: Date.now() + lifespan,
    };
    window.localStorage.setItem(this.getKey(key), JSON.stringify(entry));
  }

  delete(key: string): void {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    window.localStorage.removeItem(this.getKey(key));
  }

  clear(): void {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    const keys = Object.keys(window.localStorage).filter((k) =>
      k.startsWith(this.prefix)
    );
    keys.forEach((k) => window.localStorage.removeItem(k));
  }
}

class InMemoryCache<T> implements TicketCache<T> {
  private cache: Map<string, TicketCacheEntry<T>> = new Map();

  get(key: string): TicketCacheEntry<T> | undefined {
    const entry = this.cache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry;
    }
    this.cache.delete(key);
    return undefined;
  }

  set(key: string, value: T, lifespan: number): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + lifespan,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export {
  TicketCache,
  TicketCacheEntry,
  LocalStorageTicketCache,
  InMemoryCache,
};
