/**
 * Redis Client configuration with graceful fallback.
 * Prevents app crashing if Redis is offline (e.g., during tests or local development).
 */

const Redis = require('redis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient = null;
let isRedisReady = false;

if (process.env.NODE_ENV !== 'test') {
  try {
    redisClient = Redis.createClient({
      url: REDIS_URL,
    });

    redisClient.on('connect', () => {
      console.log('🔌 Connecting to Redis...');
    });

    redisClient.on('ready', () => {
      isRedisReady = true;
      console.log('✅ Redis client is ready and connected!');
    });

    redisClient.on('error', (err) => {
      isRedisReady = false;
      console.warn('⚠️ Redis error/offline:', err.message);
    });

    redisClient.on('end', () => {
      isRedisReady = false;
      console.warn('⚠️ Redis connection closed.');
    });

    // Bắt đầu kết nối bất đồng bộ
    redisClient.connect().catch((err) => {
      isRedisReady = false;
      console.warn('⚠️ Failed to initialize Redis connection, caching disabled:', err.message);
    });
  } catch (err) {
    isRedisReady = false;
    console.error('❌ Failed to construct Redis client:', err.message);
  }
} else {
  console.log('🧪 Testing environment: Redis client connection skipped.');
}

/**
 * Lấy dữ liệu từ cache
 * @param {string} key
 */
async function get(key) {
  if (!isRedisReady || !redisClient) return null;
  try {
    return await redisClient.get(key);
  } catch (err) {
    console.warn(`[Redis Cache GET Error] for key "${key}":`, err.message);
    return null;
  }
}

/**
 * Set dữ liệu vào cache kèm thời hạn (TTL)
 * @param {string} key
 * @param {string} value
 * @param {number} ttlSeconds
 */
async function set(key, value, ttlSeconds = 300) {
  if (!isRedisReady || !redisClient) return false;
  try {
    await redisClient.set(key, value, {
      EX: ttlSeconds,
    });
    return true;
  } catch (err) {
    console.warn(`[Redis Cache SET Error] for key "${key}":`, err.message);
    return false;
  }
}

/**
 * Xóa cache theo key hoặc pattern
 * @param {string} keyPattern
 */
async function del(keyPattern) {
  if (!isRedisReady || !redisClient) return false;
  try {
    if (keyPattern.includes('*')) {
      // Tìm và xóa theo pattern (chỉ dùng cho môi trường vừa và nhỏ)
      const keys = await redisClient.keys(keyPattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } else {
      await redisClient.del(keyPattern);
    }
    return true;
  } catch (err) {
    console.warn(`[Redis Cache DEL Error] for key "${keyPattern}":`, err.message);
    return false;
  }
}

module.exports = {
  client: redisClient,
  getIsReady: () => isRedisReady,
  get,
  set,
  del,
};
