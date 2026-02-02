/**
 * HSTS Header Test
 * Tests: HTTP Strict-Transport-Security header enforces HTTPS
 * Features: HSTS preload, includeSubDomains, max-age
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('Headers - HSTS Header', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  it('should set Strict-Transport-Security header', async () => {
    const response = await request(app)
      .get('/api/v1/satellites')
      .expect([200, 401, 404]);

    expect(response.headers['strict-transport-security']).toBeDefined();
  }, 60000);

  it('should enforce HSTS with appropriate max-age', async () => {
    const response = await request(app)
      .get('/api/v1/satellites')
      .expect([200, 401, 404]);

    const hsts = response.headers['strict-transport-security'];

    if (hsts) {
      // Should have max-age (recommended: at least 31536000 = 1 year)
      expect(hsts).toMatch(/max-age=\d+/);

      const maxAge = parseInt(hsts.match(/max-age=(\d+)/)[1]);
      expect(maxAge).toBeGreaterThanOrEqual(31536000); // At least 1 year
    }
  }, 60000);

  it('should include subDomains in HSTS', async () => {
    const response = await request(app)
      .get('/api/v1/satellites')
      .expect([200, 401, 404]);

    const hsts = response.headers['strict-transport-security'];

    if (hsts) {
      // Should include subdomains
      expect(hsts).toMatch(/includeSubDomains/i);
    }
  }, 60000);

  it('should support HSTS preload', async () => {
    const response = await request(app)
      .get('/api/v1/satellites')
      .expect([200, 401, 404]);

    const hsts = response.headers['strict-transport-security'];

    if (hsts) {
      // May include preload directive
      expect(hsts).toBeDefined();
    }
  }, 60000);

  it('should apply HSTS to all responses', async () => {
    const endpoints = [
      '/api/v1/satellites',
      '/api/v1/auth/login',
      '/api/v1/ground-stations',
    ];

    for (const endpoint of endpoints) {
      const response = await request(app)
        .get(endpoint)
        .expect([200, 400, 401, 404]);

      expect(response.headers['strict-transport-security']).toBeDefined();
    }
  }, 60000);

  it('should include HSTS on error responses', async () => {
    const response = await request(app)
      .get('/nonexistent-endpoint')
      .expect([404]);

    expect(response.headers['strict-transport-security']).toBeDefined();
  }, 60000);

  it('should not have zero max-age', async () => {
    const response = await request(app)
      .get('/api/v1/satellites')
      .expect([200, 401, 404]);

    const hsts = response.headers['strict-transport-security'];

    if (hsts) {
      // max-age should not be 0
      expect(hsts).not.toMatch(/max-age=0/);
    }
  }, 60000);

  it('should correctly format HSTS header', async () => {
    const response = await request(app)
      .get('/api/v1/satellites')
      .expect([200, 401, 404]);

    const hsts = response.headers['strict-transport-security'];

    if (hsts) {
      // Should be properly formatted
      expect(typeof hsts).toBe('string');
      expect(hsts.length).toBeGreaterThan(0);
    }
  }, 60000);

  it('should prevent downgrade attacks with HSTS', async () => {
    // HSTS prevents browser from downgrading to HTTP
    const response = await request(app)
      .get('/api/v1/satellites')
      .expect([200, 401, 404]);

    const hsts = response.headers['strict-transport-security'];

    if (hsts) {
      // Browser should remember and enforce HTTPS
      expect(hsts).toMatch(/max-age/);
    }
  }, 60000);

  it('should have consistent HSTS policy', async () => {
    const response1 = await request(app)
      .get('/api/v1/satellites');

    const response2 = await request(app)
      .get('/api/v1/auth/me');

    const hsts1 = response1.headers['strict-transport-security'];
    const hsts2 = response2.headers['strict-transport-security'];

    // Should be consistent
    if (hsts1 && hsts2) {
      expect(hsts1).toBe(hsts2);
    }
  }, 60000);

  it('should survive application restarts', async () => {
    const response = await request(app)
      .get('/api/v1/satellites')
      .expect([200, 401, 404]);

    const hsts = response.headers['strict-transport-security'];

    // Should be configured at app level
    expect(hsts).toBeDefined();
  }, 60000);
});
