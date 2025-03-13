export class TokenCache {
    cache;
    lifespan; // Token lifespan in milliseconds
    constructor(lifespan = 4 * 60 * 1000 + 50 * 1000) {
        // Default 4:50
        this.cache = new Map();
        this.lifespan = lifespan;
    }
    get(dbid) {
        const entry = this.cache.get(dbid);
        const now = Date.now();
        if (entry && entry.expiresAt > now) {
            return entry.token;
        }
        return undefined; // Expired or not found
    }
    // New method to get full entry
    getEntry(dbid) {
        const entry = this.cache.get(dbid);
        const now = Date.now();
        if (entry && entry.expiresAt > now) {
            return entry;
        }
        return undefined; // Expired or not found
    }
    set(dbid, token) {
        const now = Date.now();
        this.cache.set(dbid, {
            token,
            expiresAt: now + this.lifespan,
        });
    }
    dump() {
        return Array.from(this.cache.entries());
    }
    // New method to clear the cache
    clear() {
        this.cache.clear();
    }
}
//# sourceMappingURL=tokenCache.js.map