/**
 * CORS Whitelisting Security Tests
 * Tests: Allowed/blocked origins, credentials, cache
 */

const request = require('supertest');

// Set up test environment for CORS
process.env.ALLOWED_ORIGINS = 'https://allowed-domain.com';
const app = require('../../src/app');

describe('CORS Whitelisting Security Tests', () => {

  describe('Allowed Origins', () => {
    it('should allow requests from whitelisted origin', async () => {
      const response = await request(app)
        .options('/api/v1/health')
        .set('Origin', 'https://allowed-domain.com')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204); // OPTIONS requests return 204 No Content

      expect(response.headers['access-control-allow-origin']).toBe('https://allowed-domain.com');
    });

    it('should block requests from non-whitelisted origin', async () => {
      const response = await request(app)
        .options('/api/v1/health')
        .set('Origin', 'https://malicious-site.com')
        .set('Access-Control-Request-Method', 'GET')
        .expect(200); // CORS blocked origins still return 200 but without CORS headers

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Credentials', () => {
    it('should include credentials for allowed origins', async () => {
      const response = await request(app)
        .options('/api/v1/auth/login')
        .set('Origin', 'https://allowed-domain.com')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type')
        .expect(204); // OPTIONS requests return 204 No Content

      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Cache', () => {
    it('should set appropriate cache headers for preflight', async () => {
      const response = await request(app)
        .options('/api/v1/health')
        .set('Origin', 'https://allowed-domain.com')
        .expect(204); // OPTIONS requests return 204 No Content

      expect(response.headers['access-control-max-age']).toBeDefined();
    });
  });
});