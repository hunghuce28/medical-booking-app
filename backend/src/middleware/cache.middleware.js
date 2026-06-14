/**
 * Cache Middleware using Redis
 * Intercepts read responses and caches them. Invalidates cache on mutations.
 */

const redisCache = require('../utils/redis');

/**
 * Cache GET responses
 * @param {string} keyPrefix - Prefix for the redis key (e.g., 'doctors:list')
 * @param {number} ttlSeconds - Time-To-Live in seconds (default: 300)
 */
function cacheResponse(keyPrefix, ttlSeconds = 300) {
  return async (req, res, next) => {
    // Chỉ cache các request GET
    if (req.method !== 'GET') {
      return next();
    }

    // Tạo key cache dựa trên keyPrefix + query params để phân biệt phân trang / tìm kiếm
    const queryPart = JSON.stringify(req.query);
    const cacheKey = `${keyPrefix}:${queryPart}`;

    // Thử lấy dữ liệu từ cache
    const cachedData = await redisCache.get(cacheKey);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        // Trả về dữ liệu từ cache ngay lập tức
        return res.status(200).json(parsed);
      } catch (err) {
        // Nếu parse lỗi, bỏ qua cache và tiếp tục truy vấn DB
        await redisCache.del(cacheKey);
      }
    }

    // Intercept res.json
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Chỉ cache khi response thành công (status code < 400)
      if (res.statusCode < 400 && body && body.success) {
        redisCache.set(cacheKey, JSON.stringify(body), ttlSeconds).catch(console.error);
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Xóa cache (Invalidate) khi có thay đổi dữ liệu
 * @param {string} keyPattern - Key hoặc Pattern xóa cache (e.g. 'doctors:*')
 */
function invalidateCache(keyPattern) {
  return async (req, res, next) => {
    // Xóa cache sau khi request thành công
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode < 400) {
        redisCache.del(keyPattern).catch(console.error);
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = {
  cacheResponse,
  invalidateCache,
};
