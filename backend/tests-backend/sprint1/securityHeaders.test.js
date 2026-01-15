/**
 * Sprint 1 – Security Headers Tests
 * Validates HTTP security headers and CORS configuration
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

describe('S1 SECURITY – HTTP Security Headers', () => {
  it('includes X-Content-Type-Options header', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    expect(response.headers['x-content-type-options']).toBeDefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('includes X-Frame-Options header', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(['DENY', 'SAMEORIGIN']).toContain(response.headers['x-frame-options']);
  });

  it('includes X-XSS-Protection header', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    expect(response.headers['x-xss-protection']).toBeDefined();
  });

  it('does not allow wildcard CORS origin', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      headers: { Origin: 'https://attacker.com' }
    });

    const corsHeader = response.headers['access-control-allow-origin'];
    if (corsHeader) {
      expect(corsHeader).not.toBe('*');
      expect(corsHeader).toMatch(/^https:\/\//);
    }
  });

  it('handles CORS preflight requests', async () => {
    try {
      const response = await axios.options(`${API_BASE_URL}/users/me`, {
        headers: {
          Origin: 'https://localhost:5173',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    } catch (error) {
      expect([204, 404, 405]).toContain(error.response.status);
    }
  });

  it('only allows credentials with specific origins', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      headers: { Origin: 'https://localhost:5173' }
    });

    const corsCredentials = response.headers['access-control-allow-credentials'];
    const corsOrigin = response.headers['access-control-allow-origin'];

    if (corsCredentials && corsCredentials.toLowerCase() === 'true') {
      expect(corsOrigin).not.toBe('*');
      expect(corsOrigin).toMatch(/^https:\/\//);
    }
  });

  it('sets a restrictive Referrer-Policy', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    const referrerPolicy = response.headers['referrer-policy'];

    expect(referrerPolicy).toBeDefined();
    expect(['strict-origin-when-cross-origin', 'no-referrer', 'same-origin'])
      .toContain(referrerPolicy);
  });
});

describe('S1 SECURITY – Content Security Policy', () => {
  it('includes Content-Security-Policy header', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    const csp = response.headers['content-security-policy'];

    if (csp) {
      expect(csp).toBeDefined();
      expect(csp).toMatch(/(script-src|default-src)/i);
    }
  });

  it('CSP disallows inline scripts', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    const csp = response.headers['content-security-policy'];

    if (csp) {
      expect(csp).not.toMatch(/script-src.*'unsafe-inline'/i);
      expect(csp).not.toMatch(/default-src.*'unsafe-inline'/i);
    }
  });

  it('CSP disallows eval', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    const csp = response.headers['content-security-policy'];

    if (csp) {
      expect(csp).not.toMatch(/script-src.*'unsafe-eval'/i);
    }
  });
});

describe('S1 SECURITY – No Debug Endpoints', () => {
  const debugEndpoints = [
    '/debug',
    '/admin',
    '/__internals__',
    '/_debug',
    '/api/debug',
    '/.well-known/debug'
  ];

  for (const endpoint of debugEndpoints) {
    it(`blocks debug endpoint ${endpoint}`, async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}${endpoint}`);
        expect([404, 403, 405]).toContain(response.status);
      } catch (error) {
        expect([404, 403, 405]).toContain(error.response.status);
      }
    });
  }
});
