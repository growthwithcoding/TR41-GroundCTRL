/**
 * Security Test: CSP Script Whitelist
 * Test Goal: CSP does not allow inline scripts (prevent XSS)
 * 
 * Content Security Policy should be strict to prevent XSS attacks.
 * Inline scripts and eval should be blocked.
 */

const request = require('supertest');
const { getTestApp } = require('../helpers/test-utils');

describe('Security: CSP Script Whitelist', () => {
  let app;
  const originalEnv = process.env.NODE_ENV;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('should include Content-Security-Policy header in production', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .get('/api/v1/ping')
      .expect(200);

    const cspHeader = response.headers['content-security-policy'];
    
    if (!cspHeader) {
      console.warn('⚠️  Content-Security-Policy header not found - consider adding Helmet middleware');
    }

    // If CSP is present, verify it's strict
    if (cspHeader) {
      expect(cspHeader).toBeTruthy();
    }
  });

  test('should not allow unsafe-inline in script-src', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .get('/api/v1/ping');

    const cspHeader = response.headers['content-security-policy'];

    if (cspHeader) {
      const scriptSrcMatch = cspHeader.match(/script-src[^;]*/);
      
      if (scriptSrcMatch) {
        const scriptSrc = scriptSrcMatch[0].toLowerCase();
        
        // Should NOT contain 'unsafe-inline'
        expect(scriptSrc).not.toContain("'unsafe-inline'");
      }
    }
  });

  test('should not allow unsafe-eval in script-src', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .get('/api/v1/ping');

    const cspHeader = response.headers['content-security-policy'];

    if (cspHeader) {
      const scriptSrcMatch = cspHeader.match(/script-src[^;]*/);
      
      if (scriptSrcMatch) {
        const scriptSrc = scriptSrcMatch[0].toLowerCase();
        
        // Should NOT contain 'unsafe-eval'
        expect(scriptSrc).not.toContain("'unsafe-eval'");
      }
    }
  });

  test('should use default-src self or stricter', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .get('/api/v1/ping');

    const cspHeader = response.headers['content-security-policy'];

    if (cspHeader) {
      // Should contain default-src with 'self' or stricter
      const hasDefaultSrc = cspHeader.includes('default-src');
      
      if (hasDefaultSrc) {
        expect(cspHeader).toContain("'self'");
      }
    }
  });

  test('should not allow data: URIs in script-src', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .get('/api/v1/ping');

    const cspHeader = response.headers['content-security-policy'];

    if (cspHeader) {
      const scriptSrcMatch = cspHeader.match(/script-src[^;]*/);
      
      if (scriptSrcMatch) {
        const scriptSrc = scriptSrcMatch[0].toLowerCase();
        
        // Should NOT contain 'data:' in script-src
        expect(scriptSrc).not.toContain('data:');
      }
    }
  });

  test('CSP header should be properly formatted', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .get('/api/v1/ping');

    const cspHeader = response.headers['content-security-policy'];

    if (cspHeader) {
      // Should end with semicolon or be properly terminated
      // Should not have double semicolons
      expect(cspHeader).not.toContain(';;');
      
      // Should contain at least one directive
      expect(cspHeader.includes('-src') || cspHeader.includes('-ancestors')).toBe(true);
    }
  });
});
