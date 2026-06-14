/**
 * Health check & readiness check integration tests
 */

const request = require('supertest');
const app = require('../../src/index');
const prisma = require('../../src/utils/prisma');

describe('Health Check API Integration Tests', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/health', () => {
    it('should return 200 with status ok', async () => {
      const res = await request(app).get('/api/health');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/ready', () => {
    it('should return 200 with database details if healthy', async () => {
      const res = await request(app).get('/api/ready');

      // Database should be connected locally
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database).toBe('connected');
      expect(res.body).toHaveProperty('redis');
    });
  });
});
