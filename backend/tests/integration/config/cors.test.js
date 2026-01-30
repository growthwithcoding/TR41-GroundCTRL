/**
 * CORS Whitelisting Integration Tests
 * Tests: CORS-001 to CORS-004
 * Ensures CORS allows only whitelisted origins
 */

const request = require('supertest');

describe('CORS Whitelisting - Integration Tests', () => {
  let app;

  beforeAll(async () => {
    // Initialize Firebase before loading app
    const { initializeFirebase } = require('../../../src/config/firebase');
    try {
      initializeFirebase();
    } catch (error) {
      // Already initialized
    }
    
    app = require('../../../src/app');
  });

  describe('CORS-001: Allowed Origins', () => {
    it('allows https://groundctrl.org', async () => {
      const response = await request(app)
        .options('/api/v1/health')
        .set('Origin', 'https://groundctrl.org')
        .set('Access-Control-Request-Method', 'GET')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://groundctrl.org');
    });

    it('allows https://staging.groundctrl.org', async () => {
      const response = await request(app)
        .options('/api/v1/health')
        .set('Origin', 'https://staging.groundctrl.org')
        .set('Access-Control-Request-Method', 'GET')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://staging.groundctrl.org');
    });
  });

  describe('CORS-002: Blocked Origins', () => {
    it('blocks https://evil.com', async () => {
      const response = await request(app)
        .options('/api/v1/health')
        .set('Origin', 'https://evil.com')
        .set('Access-Control-Request-Method', 'GET')
        .expect(200); // OPTIONS still returns 200, but no allow-origin

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('CORS-003: Credentials Only for Whitelisted', () => {
    it('includes credentials header for allowed origin', async () => {
      const response = await request(app)
        .options('/api/v1/health')
        .set('Origin', 'https://groundctrl.org')
        .set('Access-Control-Request-Method', 'GET')
        .expect(200);

      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('does not include credentials for blocked origin', async () => {
      const response = await request(app)
        .options('/api/v1/health')
        .set('Origin', 'https://evil.com')
        .set('Access-Control-Request-Method', 'GET')
        .expect(200);

      expect(response.headers['access-control-allow-credentials']).toBeUndefined();
    });
  });

  describe('CORS-004: Pre flight Cache Max Age', () => {
    it('sets max age to 5 minutes', async () => {
      const response = await request(app)
        .options('/api/v1/health')
        .set('Origin', 'https://groundctrl.org')
        .set('Access-Control-Request-Method', 'GET')
        .expect(200);

      expect(response.headers['access-control-max-age']).toBe('300');
    });
  });
});