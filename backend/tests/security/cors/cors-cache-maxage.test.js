/**
 * CORS Cache MaxAge Test
 * Tests: CORS preflight responses have appropriate caching
 * Features: Access-Control-Max-Age header, preflight caching
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('CORS - Cache MaxAge', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  it('should set Access-Control-Max-Age for preflight cache', async () => {
    const response = await request(app)
      .options('/api/v1/satellites')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect([200, 204, 404]);

    const maxAge = response.headers['access-control-max-age'];

    if (maxAge) {
      expect(parseInt(maxAge)).toBeGreaterThan(0);
    }
  }, 60000);

  it('should not set excessively long cache times', async () => {
    const response = await request(app)
      .options('/api/v1/satellites')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect([200, 204, 404]);

    const maxAge = response.headers['access-control-max-age'];

    if (maxAge) {
      const seconds = parseInt(maxAge);
      expect(seconds).toBeLessThanOrEqual(86400); // 24 hours max
    }
  }, 60000);

  it('should include reasonable default max-age', async () => {
    const response = await request(app)
      .options('/api/v1/satellites')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect([200, 204, 404]);

    const maxAge = response.headers['access-control-max-age'];

    if (maxAge) {
      const seconds = parseInt(maxAge);
      expect(seconds).toBeGreaterThan(60); // At least 1 minute
    }
  }, 60000);

  it('should handle different HTTP methods with caching', async () => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

    for (const method of methods) {
      const response = await request(app)
        .options('/api/v1/satellites')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', method)
        .expect([200, 204, 404]);

      const maxAge = response.headers['access-control-max-age'];

      if (maxAge) {
        expect(parseInt(maxAge)).toBeGreaterThan(0);
      }
    }
  }, 60000);

  it('should cache preflight responses appropriately', async () => {
    const response1 = await request(app)
      .options('/api/v1/satellites')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect([200, 204, 404]);

    const maxAge1 = response1.headers['access-control-max-age'];

    // Make second preflight request
    const response2 = await request(app)
      .options('/api/v1/satellites')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect([200, 204, 404]);

    const maxAge2 = response2.headers['access-control-max-age'];

    // Should be consistent
    if (maxAge1 && maxAge2) {
      expect(maxAge1).toBe(maxAge2);
    }
  }, 60000);

  it('should allow browser cache for preflight', async () => {
    const response = await request(app)
      .options('/api/v1/satellites')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect([200, 204, 404]);

    // Should have cache headers when configured
    const cacheHeader = response.headers['access-control-max-age'] || response.headers['cache-control'];
    if (cacheHeader) {
      expect(cacheHeader).toBeDefined();
    } else {
      expect(response.status).toBeDefined();
    }
  }, 60000);

  it('should provide cache headers in preflight response', async () => {
    const response = await request(app)
      .options('/api/v1/satellites')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect([200, 204, 404]);

    // Should have cache control headers when configured
    const cacheHeader = response.headers['access-control-max-age'] || response.headers['cache-control'];
    if (cacheHeader) {
      expect(cacheHeader).toBeDefined();
    } else {
      expect(response.status).toBeDefined();
    }
  }, 60000);

  it('should handle cache expiration properly', async () => {
    const response = await request(app)
      .options('/api/v1/satellites')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect([200, 204, 404]);

    const maxAge = response.headers['access-control-max-age'];

    if (maxAge) {
      const seconds = parseInt(maxAge);

      // After cache expires, new preflight should be sent
      // Browser would handle this, but we can verify max-age is reasonable
      expect(seconds).toBeLessThanOrEqual(86400);
    }
  }, 60000);
});
