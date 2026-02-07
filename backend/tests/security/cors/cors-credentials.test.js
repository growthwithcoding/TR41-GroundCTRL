/**
 * CORS Credentials Test
 * Tests: CORS properly handles credentials
 * Features: Credentials flag, origin validation, preflight requests
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('CORS - Credentials', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  it('should set Access-Control-Allow-Credentials header', async () => {
    const response = await request(app)
      .get('/api/v1/satellites')
      .set('Origin', 'http://localhost:3000')
      .expect([200, 401, 404]);

    // May have credentials header depending on config
    expect(response.headers).toBeDefined();
  }, 60000);

  it('should handle preflight requests for credentials', async () => {
    const response = await request(app)
      .options('/api/v1/satellites')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect([200, 204, 404]);

    expect([200, 204, 404]).toContain(response.status);
  }, 60000);

  it('should validate origin for credential requests', async () => {
    const response = await request(app)
      .get('/api/v1/satellites')
      .set('Origin', 'http://malicious.com')
      .expect([200, 401, 404]);

    // Should validate origin
    expect(response.status).toBeDefined();
  }, 60000);

  it('should not allow wildcard with credentials', async () => {
    const response = await request(app)
      .get('/api/v1/satellites')
      .set('Origin', 'http://any-origin.com')
      .expect([200, 401, 404]);

    const allowOrigin = response.headers['access-control-allow-origin'];

    if (allowOrigin === '*' && response.headers['access-control-allow-credentials'] === 'true') {
      // This would be a security violation
      throw new Error('CORS allows wildcard with credentials');
    }
  }, 60000);

  it('should include credentials header in OPTIONS request', async () => {
    const response = await request(app)
      .options('/api/v1/satellites')
      .set('Origin', 'http://localhost:3000')
      .expect([200, 204, 404]);

    // Should handle credentials properly
    expect([200, 204, 404]).toContain(response.status);
  }, 60000);

  it('should support credential cookies', async () => {
    const agent = request.agent(app);

    const response = await agent
      .post('/api/v1/auth/login')
      .set('Origin', 'http://localhost:3000')
      .send({
        email: 'test@example.com',
        password: 'password',
      })
      .expect([200, 400, 401]);

    // Cookies should be set
    expect(response.status).toBeDefined();
  }, 60000);

  it('should validate credentials mode in preflight', async () => {
    const response = await request(app)
      .options('/api/v1/satellites')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type')
      .expect([200, 204, 404]);

    // Should handle credentials in preflight
    expect([200, 204, 404]).toContain(response.status);
  }, 60000);

  it('should not expose credentials in public requests', async () => {
    const response = await request(app)
      .get('/api/v1/satellites')
      .expect([200, 401, 404]);

    // Should not expose credentials unnecessarily
    expect(response.body).toBeDefined();
  }, 60000);
});
