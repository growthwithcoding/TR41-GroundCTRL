/**
 * Security Test: Token Revocation
 * Test Goal: After logout, the same token is rejected
 * 
 * Token revocation ensures that logged-out users cannot continue using
 * their tokens. This is critical for security when a user explicitly logs out.
 */

const request = require('supertest');
const { getTestApp, createTestUser } = require('../helpers/test-utils');

describe('Security: Token Revocation', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  test('token should work before logout', async () => {
    const email = `token-revoke-test-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'TestPassword123!',
        callSign: `REV${Date.now()}`,
        displayName: 'Token Revocation Test User',
      })
      .expect(201);

    const token = registerResponse.body.payload?.tokens?.accessToken;

    // Verify token works
    const response = await request(app)
      .get('/api/v1/satellites')
      .set('Authorization', `Bearer ${token}`);

    // Should succeed (200) or return empty list, not 401
    expect([200, 404]).toContain(response.status);
  });

  test('token should be rejected after logout', async () => {
    const email = `token-logout-test-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    // Register and get token
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'TestPassword123!',
        callSign: `OUT${Date.now()}`,
        displayName: 'Token Logout Test User',
      })
      .expect(201);

    const token = registerResponse.body.payload?.tokens?.accessToken;

    // Verify token works initially
    const beforeLogout = await request(app)
      .get('/api/v1/satellites')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 404]).toContain(beforeLogout.status);

    // Logout
    const logoutResponse = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    
    // Logout should succeed or return appropriate status
    expect([200, 204, 404]).toContain(logoutResponse.status);

    // Try to use token after logout
    const afterLogout = await request(app)
      .get('/api/v1/satellites')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);

    expect(afterLogout.body.error).toBeDefined();
  });

  test('invalid token format should be rejected', async () => {
    const response = await request(app)
      .get('/api/v1/satellites')
      .set('Authorization', 'Bearer invalid.token.here')
      .expect(401);

    expect(response.body.error).toBeDefined();
  });

  test('missing Authorization header should be rejected', async () => {
    const response = await request(app)
      .get('/api/v1/satellites')
      .expect(401);

    expect(response.body.error).toBeDefined();
  });

  test('malformed Authorization header should be rejected', async () => {
    const response = await request(app)
      .get('/api/v1/satellites')
      .set('Authorization', 'NotBearer token')
      .expect(401);

    expect(response.body.error).toBeDefined();
  });
});
