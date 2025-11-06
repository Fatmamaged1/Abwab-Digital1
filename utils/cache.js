// utils/cache.js - Using in-memory cache instead of Redis
const cache = new Map();

async function setCache(key, value, expirationInSeconds = 3600) {
    const expiresAt = Date.now() + (expirationInSeconds * 1000);
    cache.set(key, {
        data: value,
        expiresAt
    });
}

async function getCache(key) {
    const cached = cache.get(key);
    if (!cached) return null;
    
    // Check if the cache has expired
    if (Date.now() > cached.expiresAt) {
        cache.delete(key);
        return null;
    }
    
    return cached.data;
}

async function deleteCache(key) {
    cache.delete(key);
}

// Clean up expired cache entries every hour
setInterval(() => {
    const now = Date.now();
    for (const [key, { expiresAt }] of cache.entries()) {
        if (now > expiresAt) {
            cache.delete(key);
        }
    }
}, 3600000); // Run every hour

module.exports = {
   setCache,
   getCache,
   deleteCache,
};
