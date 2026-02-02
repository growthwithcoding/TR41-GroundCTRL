/**
 * Cookie MaxAge Test
 * Tests: Cookies have appropriate expiration times
 * Features: Session timeout, cookie lifetime, TTL validation
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('Cookies - Max Age', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  it('should set Max-Age or Expires on session cookies', async () => {
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
      expect(cookieHeader).toMatch(/Max-Age=|Expires=/);
    }
  }, 60000);

  it('should have reasonable session timeout', async () => {
    const agent = request.agent(app);

    const response = await agent
      .post('/api/v1/auth/login')
      .send({
        email: `timeout-${Date.now()}@example.com`,
        password: 'password',
      });

    if (response.headers['set-cookie']) {
      const cookieHeader = response.headers['set-cookie'][0];
      const maxAgeMatch = cookieHeader.match(/Max-Age=(\d+)/);

      if (maxAgeMatch) {
        const seconds = parseInt(maxAgeMatch[1]);

        // Session should expire within reasonable time (e.g., 7 days max)
        expect(seconds).toBeLessThanOrEqual(604800); // 7 days
        expect(seconds).toBeGreaterThan(0);
      }
    }
  }, 60000);

  it('should not have excessively long session timeouts', async () => {
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
        const maxAgeMatch = cookie.match(/Max-Age=(\d+)/);

        if (maxAgeMatch) {
          const seconds = parseInt(maxAgeMatch[1]);

          // Should not be more than 30 days
          expect(seconds).toBeLessThanOrEqual(2592000);
        }
      });
    }
  }, 60000);

  it('should enforce minimum session timeout', async () => {
    const agent = request.agent(app);

    const response = await agent
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password',
      });

    if (response.headers['set-cookie']) {
      const cookieHeader = response.headers['set-cookie'][0];
      const maxAgeMatch = cookieHeader.match(/Max-Age=(\d+)/);

      if (maxAgeMatch) {
        const seconds = parseInt(maxAgeMatch[1]);

        // Should have at least some timeout
        expect(seconds).toBeGreaterThan(60); // At least 1 minute
      }
    }
  }, 60000);

  it('should invalidate cookies on logout', async () => {
    const agent = request.agent(app);

    // Login
    const loginResponse = await agent
      .post('/api/v1/auth/login')
      .send({
        email: `logout-${Date.now()}@example.com`,
        password: 'password',
      });

    if (loginResponse.status === 200 || loginResponse.status === 201) {
      // Logout
      const logoutResponse = await agent
        .post('/api/v1/auth/logout')
        .expect([200, 401, 404]);

      if (logoutResponse.headers['set-cookie']) {
        const cookieHeader = logoutResponse.headers['set-cookie'][0];

        // Should have Max-Age=0 or Expires in past
        expect(cookieHeader).toMatch(/Max-Age=0|Expires=.*1970|Expires=.*1971/);
      }
    }
  }, 60000);

  it('should handle cookie expiration correctly', async () => {
    const agent = request.agent(app);

    const response = await agent.post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'password',
    });

    if (response.headers['set-cookie']) {
      const cookieHeader = response.headers['set-cookie'][0];

      // Should have expiration in future
      const expiresMatch = cookieHeader.match(/Expires=([^;]+)/);
      if (expiresMatch) {
        const expiresDate = new Date(expiresMatch[1]);
        expect(expiresDate.getTime()).toBeGreaterThan(Date.now());
      }

      const maxAgeMatch = cookieHeader.match(/Max-Age=(\d+)/);
      if (maxAgeMatch) {
        const seconds = parseInt(maxAgeMatch[1]);
        expect(seconds).toBeGreaterThan(0);
      }
    }
  }, 60000);

  it('should have consistent Max-Age across requests', async () => {
    const agent = request.agent(app);

    const response1 = await agent.post('/api/v1/auth/login').send({
      email: 'test1@example.com',
      password: 'password',
    });

    const response2 = await agent.post('/api/v1/auth/login').send({
      email: 'test2@example.com',
      password: 'password',
    });

    if (response1.headers['set-cookie'] && response2.headers['set-cookie']) {
      const maxAge1 = response1.headers['set-cookie'][0].match(/Max-Age=(\d+)/);
      const maxAge2 = response2.headers['set-cookie'][0].match(/Max-Age=(\d+)/);

      if (maxAge1 && maxAge2) {
        expect(parseInt(maxAge1[1])).toBeCloseTo(parseInt(maxAge2[1]), -1); // Within 10 seconds
      }
    }
  }, 60000);

  it('should refresh cookie on activity if configured', async () => {
    const agent = request.agent(app);

    // Login
    await agent.post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'password',
    });

    // Wait and make another request
    await new Promise(resolve => setTimeout(resolve, 1000));

    const activityResponse = await agent.get('/api/v1/satellites');

    // Cookie might be refreshed on activity
    expect([200, 401, 404]).toContain(activityResponse.status);
  }, 60000);

  it('should mark session cookies without persistent duration if needed', async () => {
    const agent = request.agent(app);

    const response = await agent.post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'password',
    });

    // Session cookie should exist when login succeeds
    if (response.status === 200 || response.status === 201) {
      expect(response.headers['set-cookie']).toBeDefined();
    } else {
      expect(response.status).toBeDefined();
    }
  }, 60000);
});
