// utils/cache.js
const redis = require('redis');
const client = redis.createClient();

let isRedisConnected = false;

client.connect().then(() => {
   isRedisConnected = true;
   console.log('✅ Redis connected');
}).catch((err) => {
   console.warn('⚠️  Redis not available, caching disabled:', err.message);
   isRedisConnected = false;
});

async function setCache(key, value, expirationInSeconds = 3600) {
   if (!isRedisConnected) return;
   try {
      await client.setEx(key, expirationInSeconds, JSON.stringify(value));
   } catch (err) {
      console.warn('Redis setCache error:', err.message);
   }
}

async function getCache(key) {
   if (!isRedisConnected) return null;
   try {
      const cachedData = await client.get(key);
      return cachedData ? JSON.parse(cachedData) : null;
   } catch (err) {
      console.warn('Redis getCache error:', err.message);
      return null;
   }
}

async function deleteCache(key) {
   if (!isRedisConnected) return;
   try {
      await client.del(key);
   } catch (err) {
      console.warn('Redis deleteCache error:', err.message);
   }
}

module.exports = {
   setCache,
   getCache,
   deleteCache,
};
