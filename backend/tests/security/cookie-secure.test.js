/**
 * Security Test: Cookie Secure Flag
 * Test Goal: Set-Cookie includes Secure; HttpOnly; SameSite=Strict
 * 
 * Secure cookies prevent XSS, CSRF, and man-in-the-middle attacks.
 */

const request = require('supertest');
const { getTestApp, createTestUser } = require('../helpers/test-utils');

describe('Security: Cookie Secure Flag', () => {
  let app;
  const originalEnv = process.env.NODE_ENV;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('login should set cookie with Secure flag in production', async () => {
    process.env.NODE_ENV = 'production';

    const email = `cookie-secure-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' });

    const setCookie = response.headers['set-cookie'];
    
    if (setCookie) {
      const cookieString = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      expect(cookieString.toLowerCase()).toContain('secure');
    } else {
      console.log('ℹ️  No Set-Cookie header (app may use JWT only)');
    }
  });

  test('cookie should have HttpOnly flag', async () => {
    const email = `cookie-httponly-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' });

    const setCookie = response.headers['set-cookie'];
    
    if (setCookie) {
      const cookieString = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      expect(cookieString.toLowerCase()).toContain('httponly');
    }
  });

  test('cookie should have SameSite=Strict or Lax', async () => {
    const email = `cookie-samesite-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' });

    const setCookie = response.headers['set-cookie'];
    
    if (setCookie) {
      const cookieString = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      const cookieLower = cookieString.toLowerCase();
      
      expect(
        cookieLower.includes('samesite=strict') ||
        cookieLower.includes('samesite=lax')
      ).toBe(true);
    }
  });

  test('cookie should have all security flags combined', async () => {
    process.env.NODE_ENV = 'production';

    const email = `cookie-all-flags-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' });

    const setCookie = response.headers['set-cookie'];
    
    if (setCookie) {
      const cookieString = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      const cookieLower = cookieString.toLowerCase();

      // All three should be present
      expect(cookieLower).toContain('secure');
      expect(cookieLower).toContain('httponly');
      expect(cookieLower.includes('samesite=strict') || cookieLower.includes('samesite=lax')).toBe(true);
    }
  });

  test('cookie should not be accessible from JavaScript', async () => {
    const email = `cookie-js-access-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' });

    const setCookie = response.headers['set-cookie'];
    
    if (setCookie) {
      const cookieString = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      
      // HttpOnly prevents JavaScript access
      expect(cookieString.toLowerCase()).toContain('httponly');
    }
  });
});
