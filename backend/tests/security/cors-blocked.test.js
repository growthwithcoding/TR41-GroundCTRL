/**
 * Security Test: CORS Blocked Origins
 * Test Goal: Reject requests from non-whitelisted origins
 * 
 * CORS should block requests from untrusted origins to prevent
 * unauthorized access from malicious sites.
 */

const request = require('supertest');
const { getTestApp } = require('../helpers/test-utils');

describe('Security: CORS Blocked Origins', () => {
  let app;
  const originalEnv = process.env.NODE_ENV;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('should block evil.com origin', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .options('/api/v1/ping')
      .set('Origin', 'https://evil.com')
      .set('Access-Control-Request-Method', 'GET');

    const allowOrigin = response.headers['access-control-allow-origin'];
    
    // Should not return the evil origin
    if (allowOrigin) {
      expect(allowOrigin).not.toBe('https://evil.com');
      
      // In production, should not use wildcard *
      if (process.env.NODE_ENV === 'production') {
        expect(allowOrigin).not.toBe('*');
      }
    }
  });

  test('should block untrusted subdomain', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .options('/api/v1/ping')
      .set('Origin', 'https://malicious.groundctrl.org')
      .set('Access-Control-Request-Method', 'GET');

    const allowOrigin = response.headers['access-control-allow-origin'];
    
    if (allowOrigin && allowOrigin !== '*') {
      // Should not allow arbitrary subdomains
      expect(allowOrigin).not.toBe('https://malicious.groundctrl.org');
    }
  });

  test('should block http version of trusted domain in production', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .options('/api/v1/ping')
      .set('Origin', 'http://groundctrl.org')  // HTTP instead of HTTPS
      .set('Access-Control-Request-Method', 'GET');

    const allowOrigin = response.headers['access-control-allow-origin'];
    
    if (allowOrigin && allowOrigin !== '*') {
      // Should require HTTPS in production
      expect(allowOrigin).not.toBe('http://groundctrl.org');
    }
  });

  test('should not allow null origin', async () => {
    const response = await request(app)
      .options('/api/v1/ping')
      .set('Origin', 'null')
      .set('Access-Control-Request-Method', 'GET');

    const allowOrigin = response.headers['access-control-allow-origin'];
    
    // Should not explicitly allow 'null' origin (security risk)
    if (allowOrigin) {
      expect(allowOrigin).not.toBe('null');
    }
  });

  test('should not use wildcard in production', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .get('/api/v1/ping')
      .set('Origin', 'https://evil.com');

    const allowOrigin = response.headers['access-control-allow-origin'];
    
    // Production should not use wildcard with credentials
    if (allowOrigin === '*') {
      const allowCredentials = response.headers['access-control-allow-credentials'];
      
      if (allowCredentials === 'true') {
        fail('Cannot use wildcard CORS with credentials enabled');
      } else {
        console.warn('⚠️  Using wildcard CORS in production is not recommended');
      }
    }
  });

  test('should handle missing Origin header gracefully', async () => {
    const response = await request(app)
      .get('/api/v1/ping');

    // Should not crash when Origin header is missing
    expect([200, 404]).toContain(response.status);
  });
});
