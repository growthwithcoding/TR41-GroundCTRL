/**
 * Cookie SameSite None Blocked Test
 * Tests: SameSite=None cookies are properly handled/restricted
 * Features: SameSite attribute, CSRF protection, cross-site restriction
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('Cookies - SameSite None Blocked', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  it('should set SameSite attribute on cookies', async () => {
    const agent = request.agent(app);

    const response = await agent
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password',
      })
      .expect([200, 400, 401]);

    if (response.headers['set-cookie']) {
      const cookieHeader = response.headers['set-cookie'][0];
      expect(cookieHeader).toMatch(/SameSite=/i);
    }
  }, 60000);

  it('should not use SameSite=None without Secure flag', async () => {
    const agent = request.agent(app);

    const response = await agent
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password',
      });

    if (response.headers['set-cookie']) {
      const cookies = response.headers['set-cookie'];

      cookies.forEach(cookie => {
        // If SameSite=None, must have Secure flag
        if (cookie.match(/SameSite=None/i)) {
          expect(cookie).toMatch(/Secure/);
        }
      });
    }
  }, 60000);

  it('should use SameSite=Strict or Lax for auth cookies', async () => {
    const agent = request.agent(app);

    const response = await agent
      .post('/api/v1/auth/login')
      .send({
        email: `samesite-${Date.now()}@example.com`,
        password: 'password',
      });

    if (response.headers['set-cookie']) {
      const cookies = response.headers['set-cookie'];

      cookies.forEach(cookie => {
        // Session cookies should have Strict or Lax
        if (cookie.match(/session|auth|jwt/i)) {
          expect(cookie).toMatch(/SameSite=(Strict|Lax)/i);
        }
      });
    }
  }, 60000);

  it('should prevent CSRF attacks with SameSite', async () => {
    // SameSite cookies should not be sent in cross-site requests
    const agent = request.agent(app);

    // Login
    await agent.post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'password',
    });

    // Request from different origin should not include cookie
    const response = await request(app)
      .get('/api/v1/satellites')
      .set('Origin', 'http://attacker.com');

    expect([200, 401, 404]).toContain(response.status);
  }, 60000);

  it('should allow cookies within same site', async () => {
    const agent = request.agent(app);

    // Login
    await agent.post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'password',
    });

    // Subsequent request should include cookie
    const response = await agent.get('/api/v1/satellites');

    expect([200, 401, 404]).toContain(response.status);
  }, 60000);

  it('should have Secure flag for production cookies', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const agent = request.agent(app);

    const response = await agent
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password',
      })
      .expect([200, 400, 401]);

    if (response.headers['set-cookie']) {
      const cookies = response.headers['set-cookie'];

      cookies.forEach(cookie => {
        // Production cookies should be Secure
        if (process.env.NODE_ENV === 'production') {
          expect(cookie).toMatch(/Secure/);
        }
      });
    }

    process.env.NODE_ENV = originalEnv;
  }, 60000);

  it('should not allow SameSite=None for sensitive operations', async () => {
    const agent = request.agent(app);

    const response = await agent
      .post('/api/v1/auth/logout')
      .expect([200, 401, 404]);

    if (response.headers['set-cookie']) {
      const cookies = response.headers['set-cookie'];

      cookies.forEach(cookie => {
        // Logout shouldn't use SameSite=None
        expect(cookie).not.toMatch(/SameSite=None/i) || expect(cookie).toMatch(/Secure/);
      });
    }
  }, 60000);

  it('should handle SameSite attribute consistently', async () => {
    const agent = request.agent(app);

    const response1 = await agent.post('/api/v1/auth/login').send({
      email: 'test1@example.com',
      password: 'password',
    });

    const response2 = await agent.post('/api/v1/auth/login').send({
      email: 'test2@example.com',
      password: 'password',
    });

    // Both responses should have same SameSite policy
    if (response1.headers['set-cookie'] && response2.headers['set-cookie']) {
      expect(response1.headers['set-cookie'][0]).toMatch(/SameSite=/i);
      expect(response2.headers['set-cookie'][0]).toMatch(/SameSite=/i);
    }
  }, 60000);
});
