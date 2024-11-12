// utils/cache.js
const redis = require('redis');
const client = redis.createClient();

client.connect();

async function setCache(key, value, expirationInSeconds = 3600) {
   await client.setEx(key, expirationInSeconds, JSON.stringify(value));
}

async function getCache(key) {
   const cachedData = await client.get(key);
   return cachedData ? JSON.parse(cachedData) : null;
}

async function deleteCache(key) {
   await client.del(key);
}

module.exports = {
   setCache,
   getCache,
   deleteCache,
};
