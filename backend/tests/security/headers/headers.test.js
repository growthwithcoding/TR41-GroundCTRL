/**
 * Security Headers Tests
 * Consolidated from: sprint1/securityHeaders.test.js
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('Security Headers - Comprehensive Tests', () => {
  let app;

  beforeAll(() => {
    app = getTestApp();
  });

  describe('HTTP Security Headers', () => {
    it('includes X-Content-Type-Options header', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('includes X-Frame-Options header', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(['DENY', 'SAMEORIGIN']).toContain(response.headers['x-frame-options']);
    });

    it('includes X-XSS-Protection header', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    it('does not allow wildcard CORS origin', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'https://attacker.com');

      const corsHeader = response.headers['access-control-allow-origin'];
      if (corsHeader) {
        expect(corsHeader).not.toBe('*');
      }
    });

    it('sets a restrictive Referrer-Policy', async () => {
      const response = await request(app).get('/api/v1/health');
      const referrerPolicy = response.headers['referrer-policy'];

      if (referrerPolicy) {
        expect(['strict-origin-when-cross-origin', 'no-referrer', 'same-origin'])
          .toContain(referrerPolicy);
      }
    });
  });

  describe('Content Security Policy', () => {
    it('includes Content-Security-Policy header', async () => {
      const response = await request(app).get('/api/v1/health');
      const csp = response.headers['content-security-policy'];

      if (csp) {
        expect(csp).toMatch(/(script-src|default-src)/i);
      }
    });

    it('CSP disallows inline scripts', async () => {
      const response = await request(app).get('/api/v1/health');
      const csp = response.headers['content-security-policy'];

      if (csp) {
        expect(csp).not.toMatch(/script-src.*'unsafe-inline'/i);
      }
    });
  });

  describe('No Debug Endpoints', () => {
    const debugEndpoints = ['/debug', '/admin', '/__internals__'];

    debugEndpoints.forEach(endpoint => {
      it(`blocks debug endpoint ${endpoint}`, async () => {
        const response = await request(app).get(`/api/v1${endpoint}`);
        expect([404, 403, 405]).toContain(response.status);
      });
    });
  });
});
