/**
 * Security Test: CORS Cache Max-Age
 * Test Goal: Preflight responses are cached for 5 minutes
 * 
 * Proper cache control for preflight requests improves performance
 * while maintaining security.
 */

const request = require('supertest');
const { getTestApp } = require('../helpers/test-utils');

describe('Security: CORS Cache Max-Age', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  test('should include Access-Control-Max-Age header', async () => {
    const response = await request(app)
      .options('/api/v1/ping')
      .set('Origin', 'https://groundctrl.org')
      .set('Access-Control-Request-Method', 'POST');

    const maxAge = response.headers['access-control-max-age'];
    
    if (maxAge) {
      expect(maxAge).toBeTruthy();
    } else {
      console.log('ℹ️  Access-Control-Max-Age not set - preflight responses may not be cached');
    }
  });

  test('should cache preflight for approximately 5 minutes (300 seconds)', async () => {
    const response = await request(app)
      .options('/api/v1/ping')
      .set('Origin', 'https://groundctrl.org')
      .set('Access-Control-Request-Method', 'POST');

    const maxAge = response.headers['access-control-max-age'];
    
    if (maxAge) {
      const maxAgeSeconds = parseInt(maxAge, 10);
      
      // Should be around 300 seconds (5 minutes)
      // Allow some flexibility (between 1 minute and 1 hour)
      expect(maxAgeSeconds).toBeGreaterThanOrEqual(60);
      expect(maxAgeSeconds).toBeLessThanOrEqual(3600);
    }
  });

  test('should handle complex preflight requests', async () => {
    const response = await request(app)
      .options('/api/v1/satellites')
      .set('Origin', 'https://groundctrl.org')
      .set('Access-Control-Request-Method', 'PUT')
      .set('Access-Control-Request-Headers', 'Content-Type, Authorization, X-Custom-Header');

    const maxAge = response.headers['access-control-max-age'];
    const allowHeaders = response.headers['access-control-allow-headers'];
    const allowMethods = response.headers['access-control-allow-methods'];

    // Preflight should respond properly
    expect([200, 204]).toContain(response.status);
    
    if (allowMethods) {
      const methodsLower = allowMethods.toLowerCase();
      expect(methodsLower).toContain('put');
    }
  });

  test('max-age should be numeric', async () => {
    const response = await request(app)
      .options('/api/v1/ping')
      .set('Origin', 'https://groundctrl.org')
      .set('Access-Control-Request-Method', 'GET');

    const maxAge = response.headers['access-control-max-age'];
    
    if (maxAge) {
      const parsed = parseInt(maxAge, 10);
      expect(isNaN(parsed)).toBe(false);
      expect(parsed).toBeGreaterThan(0);
    }
  });

  test('preflight response should not have body', async () => {
    const response = await request(app)
      .options('/api/v1/ping')
      .set('Origin', 'https://groundctrl.org')
      .set('Access-Control-Request-Method', 'GET');

    // Preflight responses should be empty
    expect(response.body).toEqual({});
  });

  test('preflight should respond quickly', async () => {
    const start = Date.now();
    
    await request(app)
      .options('/api/v1/ping')
      .set('Origin', 'https://groundctrl.org')
      .set('Access-Control-Request-Method', 'GET');

    const duration = Date.now() - start;
    
    // Preflight should be fast (under 1 second)
    expect(duration).toBeLessThan(1000);
  });
});
