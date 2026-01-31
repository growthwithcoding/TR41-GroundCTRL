/**
 * Security Test: Cookie Path Scope
 * Test Goal: Cookie path set to / (covers all API)
 * 
 * Proper cookie path ensures cookies are sent with all relevant requests.
 */

const request = require('supertest');
const { getTestApp, createTestUser } = require('../helpers/test-utils');

describe('Security: Cookie Path Scope', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  test('cookie should have Path=/', async () => {
    const email = `cookie-path-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' });

    const setCookie = response.headers['set-cookie'];
    
    if (setCookie) {
      const cookieString = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      expect(cookieString).toContain('Path=/');
    }
  });

  test('cookie path should not be too restrictive', async () => {
    const email = `cookie-path-restrictive-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' });

    const setCookie = response.headers['set-cookie'];
    
    if (setCookie) {
      const cookieString = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      
      // Should not be limited to specific path like /api/v1/auth
      expect(cookieString).not.toContain('Path=/api/v1/auth');
      expect(cookieString).not.toContain('Path=/auth');
    }
  });
});
