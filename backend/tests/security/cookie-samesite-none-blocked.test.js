/**
 * Security Test: Cookie SameSite None Blocked
 * Test Goal: No SameSite=None unless explicitly allowed
 * 
 * SameSite=None allows cross-site requests and should only be used
 * when absolutely necessary and with Secure flag.
 */

const request = require('supertest');
const { getTestApp, createTestUser } = require('../helpers/test-utils');

describe('Security: Cookie SameSite None Blocked', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  test('cookie should not use SameSite=None', async () => {
    const email = `cookie-samesite-none-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' });

    const setCookie = response.headers['set-cookie'];
    
    if (setCookie) {
      const cookieString = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      const cookieLower = cookieString.toLowerCase();
      
      // Should NOT contain SameSite=None
      expect(cookieLower).not.toContain('samesite=none');
    }
  });

  test('if SameSite=None is used, it must have Secure flag', async () => {
    const email = `cookie-none-secure-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' });

    const setCookie = response.headers['set-cookie'];
    
    if (setCookie) {
      const cookieString = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      const cookieLower = cookieString.toLowerCase();
      
      // If SameSite=None is present (which it shouldn't be)
      if (cookieLower.includes('samesite=none')) {
        // It MUST have Secure flag
        expect(cookieLower).toContain('secure');
      }
    }
  });

  test('should prefer SameSite=Strict or Lax', async () => {
    const email = `cookie-prefer-strict-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' });

    const setCookie = response.headers['set-cookie'];
    
    if (setCookie) {
      const cookieString = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      const cookieLower = cookieString.toLowerCase();
      
      // Should use Strict or Lax for better security
      const hasStrictOrLax = 
        cookieLower.includes('samesite=strict') ||
        cookieLower.includes('samesite=lax');
      
      if (cookieLower.includes('samesite')) {
        expect(hasStrictOrLax).toBe(true);
      }
    }
  });
});
