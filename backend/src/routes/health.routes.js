/**
 * Health & Readiness Check Routes
 * Useful for Docker healthchecks, Kubernetes probes, and deployment monitoring.
 */

const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const redisCache = require('../utils/redis');

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Liveness check endpoint
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Server is alive
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * @openapi
 * /ready:
 *   get:
 *     summary: Readiness check endpoint (verifies database and cache connectivity)
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Server is ready to receive traffic
 *       503:
 *         description: Server or dependencies are unhealthy
 */
router.get('/ready', async (req, res) => {
  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';
  let isHealthy = true;

  // 1. Kiểm tra kết nối database
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error';
    isHealthy = false;
    console.error('[Healthcheck DB Error]:', err.message);
  }

  // 2. Kiểm tra kết nối Redis
  if (redisCache.getIsReady()) {
    redisStatus = 'connected';
  } else {
    // Chỉ là cảnh báo, không làm unhealthy tổng thể nếu cache là optional
    redisStatus = 'disconnected';
  }

  const response = {
    status: isHealthy ? 'ok' : 'unhealthy',
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  };

  if (isHealthy) {
    res.status(200).json(response);
  } else {
    res.status(503).json(response);
  }
});

module.exports = router;
