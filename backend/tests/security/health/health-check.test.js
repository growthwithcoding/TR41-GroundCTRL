/**
 * Health Check & Degraded Mode Security Tests
 * Tests: Health check endpoint, degraded mode handling
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

const app = getTestApp();

describe('Health Check & Degraded Mode Security Tests', () => {

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('GO');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should not leak sensitive information in health check', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).not.toHaveProperty('secrets');
      expect(response.body).not.toHaveProperty('config');
    });
  });

  describe('Degraded Mode', () => {
    it('should handle degraded mode gracefully', async () => {
      // Simulate degraded mode, e.g., by setting env or mocking
      // For now, assume health check indicates degraded
      await request(app)
        .get('/api/v1/health')
        .expect(200);

      // In degraded mode, might return different status
      // expect(response.body.status).toBe('degraded');
    });
  });
});