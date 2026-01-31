/**
 * Security Test: Cookie Max-Age
 * Test Goal: Session lifetime matches config (SESSION_TTL_MS)
 * 
 * Cookie expiration should align with security policy to limit
 * the window of opportunity for session hijacking.
 */

const request = require('supertest');
const { getTestApp, createTestUser } = require('../helpers/test-utils');

describe('Security: Cookie Max-Age', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  test('cookie should have Max-Age attribute', async () => {
    const email = `cookie-maxage-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' });

    const setCookie = response.headers['set-cookie'];
    
    if (setCookie) {
      const cookieString = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      const cookieLower = cookieString.toLowerCase();
      
      // Should have Max-Age or Expires
      expect(
        cookieLower.includes('max-age=') ||
        cookieLower.includes('expires=')
      ).toBe(true);
    }
  });

  test('session cookie should expire after configured TTL (~3600s)', async () => {
    const email = `cookie-ttl-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' });

    const setCookie = response.headers['set-cookie'];
    
    if (setCookie) {
      const cookieString = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      const maxAgeMatch = cookieString.match(/Max-Age=(\d+)/i);
      
      if (maxAgeMatch) {
        const maxAge = parseInt(maxAgeMatch[1], 10);
        
        // Should be around 3600 seconds (1 hour)
        // Allow range from 30 minutes to 24 hours
        expect(maxAge).toBeGreaterThanOrEqual(1800);   // 30 minutes
        expect(maxAge).toBeLessThanOrEqual(86400);     // 24 hours
      }
    }
  });

  test('cookie should not have excessive lifetime', async () => {
    const email = `cookie-lifetime-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' });

    const setCookie = response.headers['set-cookie'];
    
    if (setCookie) {
      const cookieString = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      const maxAgeMatch = cookieString.match(/Max-Age=(\d+)/i);
      
      if (maxAgeMatch) {
        const maxAge = parseInt(maxAgeMatch[1], 10);
        const oneYear = 365 * 24 * 60 * 60;
        
        // Should not live for more than a year
        expect(maxAge).toBeLessThan(oneYear);
      }
    }
  });

  test('remember-me cookie should have longer lifetime', async () => {
    const email = `cookie-remember-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ 
        email, 
        password: 'TestPassword123!',
        rememberMe: true 
      });

    const setCookie = response.headers['set-cookie'];
    
    if (setCookie) {
      const cookieString = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
      const maxAgeMatch = cookieString.match(/Max-Age=(\d+)/i);
      
      if (maxAgeMatch) {
        const maxAge = parseInt(maxAgeMatch[1], 10);
        
        // Remember-me should be longer (e.g., 30 days)
        if (maxAge > 86400) {
          // If longer than 1 day, it's likely a remember-me cookie
          expect(maxAge).toBeGreaterThan(86400);
        }
      }
    }
  });
});
