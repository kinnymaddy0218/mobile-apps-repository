/**
 * Simple in-memory cache with TTL support.
 * Used by API routes to cache external API responses.
 */
const cache = new Map();
const MAX_CACHE_SIZE = 500; // Prevent unbounded memory growth

export function getCached(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

export function setCache(key, data, ttlMs) {
    if (cache.size >= MAX_CACHE_SIZE) {
        // Simple eviction: remove the first (oldest) entry
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
    }
    
    cache.set(key, {
        data,
        expiresAt: Date.now() + ttlMs,
    });
}

export function clearCache(key) {
    if (key) {
        cache.delete(key);
    } else {
        cache.clear();
    }
}
