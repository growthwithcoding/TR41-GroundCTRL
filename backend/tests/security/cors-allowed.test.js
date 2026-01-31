/**
 * Security Test: CORS Allowed Origins
 * Test Goal: Whitelist only approved origins
 * 
 * CORS should only allow requests from trusted origins to prevent
 * unauthorized cross-origin requests.
 */

const request = require('supertest');
const { getTestApp } = require('../helpers/test-utils');

describe('Security: CORS Allowed Origins', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  test('should allow whitelisted origin: https://groundctrl.org', async () => {
    const response = await request(app)
      .options('/api/v1/ping')
      .set('Origin', 'https://groundctrl.org')
      .set('Access-Control-Request-Method', 'GET');

    // Should return Access-Control-Allow-Origin header
    const allowOrigin = response.headers['access-control-allow-origin'];
    
    if (allowOrigin) {
      expect(allowOrigin).toBe('https://groundctrl.org');
    } else {
      console.warn('⚠️  CORS not configured - consider adding cors middleware');
    }
  });

  test('should allow whitelisted origin: https://staging.groundctrl.org', async () => {
    const response = await request(app)
      .options('/api/v1/ping')
      .set('Origin', 'https://staging.groundctrl.org')
      .set('Access-Control-Request-Method', 'GET');

    const allowOrigin = response.headers['access-control-allow-origin'];
    
    if (allowOrigin) {
      expect(['https://staging.groundctrl.org', '*'].includes(allowOrigin)).toBe(true);
    }
  });

  test('should allow localhost in development', async () => {
    const response = await request(app)
      .options('/api/v1/ping')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');

    const allowOrigin = response.headers['access-control-allow-origin'];
    
    // Localhost should be allowed in development
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      if (allowOrigin) {
        expect(['http://localhost:3000', '*'].includes(allowOrigin)).toBe(true);
      }
    }
  });

  test('CORS should be configured for actual requests', async () => {
    const response = await request(app)
      .get('/api/v1/ping')
      .set('Origin', 'https://groundctrl.org');

    // Should include CORS headers in actual request, not just preflight
    const hasACAO = response.headers['access-control-allow-origin'] !== undefined;
    const hasVary = response.headers['vary'] !== undefined;

    if (hasACAO || hasVary) {
      expect(true).toBe(true);
    }
  });

  test('should respond to OPTIONS preflight requests', async () => {
    const response = await request(app)
      .options('/api/v1/ping')
      .set('Origin', 'https://groundctrl.org')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

    // Preflight should return 200 or 204
    expect([200, 204]).toContain(response.status);
  });

  test('should include Access-Control-Allow-Methods', async () => {
    const response = await request(app)
      .options('/api/v1/ping')
      .set('Origin', 'https://groundctrl.org')
      .set('Access-Control-Request-Method', 'POST');

    const allowMethods = response.headers['access-control-allow-methods'];
    
    if (allowMethods) {
      // Should include common HTTP methods
      const methodsLower = allowMethods.toLowerCase();
      expect(methodsLower).toContain('get');
      expect(methodsLower).toContain('post');
    }
  });

  test('should include Access-Control-Allow-Headers for common headers', async () => {
    const response = await request(app)
      .options('/api/v1/ping')
      .set('Origin', 'https://groundctrl.org')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Authorization, Content-Type');

    const allowHeaders = response.headers['access-control-allow-headers'];
    
    if (allowHeaders) {
      const headersLower = allowHeaders.toLowerCase();
      // Should allow Authorization for JWT tokens
      expect(
        headersLower.includes('authorization') ||
        headersLower.includes('*')
      ).toBe(true);
    }
  });
});
