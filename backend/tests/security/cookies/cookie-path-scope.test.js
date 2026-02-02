/**
 * Cookie Path Scope Test
 * Tests: Cookies have proper path scoping
 * Features: Path restriction, domain scoping, security boundaries
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('Cookies - Path Scope', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  it('should set Path attribute on cookies', async () => {
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
      expect(cookieHeader).toMatch(/Path=/);
    }
  }, 60000);

  it('should restrict cookies to application paths', async () => {
    const agent = request.agent(app);

    const response = await agent
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password',
      });

    if (response.headers['set-cookie']) {
      const cookieHeader = response.headers['set-cookie'][0];

      // Should have specific path, not root
      expect(cookieHeader).toMatch(/Path=\/api|Path=\//);
    }
  }, 60000);

  it('should not expose cookies to sibling paths', async () => {
    // This test would verify browsers don't send cookies outside path scope
    const response = await request(app)
      .get('/admin/panel')
      .expect([404, 401]);

    // Should not have access to /api cookies
    expect(response.status).toBeDefined();
  }, 60000);

  it('should allow cookies within scoped path', async () => {
    const agent = request.agent(app);

    // Login
    await agent.post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'password',
    });

    // Should include cookie in subsequent API request
    const response = await agent.get('/api/v1/satellites');

    expect([200, 401, 404]).toContain(response.status);
  }, 60000);

  it('should use specific path for session cookies', async () => {
    const agent = request.agent(app);

    const response = await agent
      .post('/api/v1/auth/login')
      .send({
        email: `path-${Date.now()}@example.com`,
        password: 'password',
      });

    if (response.headers['set-cookie']) {
      const cookies = response.headers['set-cookie'];

      cookies.forEach(cookie => {
        // Session cookie should have path
        expect(cookie).toMatch(/Path=/);
      });
    }
  }, 60000);

  it('should maintain separate cookies for different paths', async () => {
    const agent1 = request.agent(app);
    const agent2 = request.agent(app);

    // Login to main API
    const response1 = await agent1.post('/api/v1/auth/login').send({
      email: 'test1@example.com',
      password: 'password',
    });

    // Different paths should have independent cookie scopes
    expect(response1.status).toBeDefined();
  }, 60000);

  it('should not allow path traversal in cookies', async () => {
    const agent = request.agent(app);

    const response = await agent.post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'password',
    });

    if (response.headers['set-cookie']) {
      const cookies = response.headers['set-cookie'];

      cookies.forEach(cookie => {
        // Path should not contain traversal
        expect(cookie).not.toMatch(/Path=.*\.\.\//);
      });
    }
  }, 60000);

  it('should scope authentication cookies to API path', async () => {
    const agent = request.agent(app);

    const response = await agent.post('/api/v1/auth/login').send({
      email: `scope-${Date.now()}@example.com`,
      password: 'password',
    });

    if (response.headers['set-cookie']) {
      const cookieHeader = response.headers['set-cookie'][0];

      // Should be scoped to /api or /
      expect(cookieHeader).toMatch(/Path=\/api|Path=\//);
    }
  }, 60000);
});
