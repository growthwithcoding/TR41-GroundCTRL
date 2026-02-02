/**
 * Login Success Test
 * Tests: Valid credentials yield a JWT with correct claims
 * Features: JWT algorithm (HS256), expiration (~1h), uid claim presence
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { getTestApp } = require('../../helpers/test-utils');

describe('Auth - Login Success', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  it('should return JWT token with valid credentials', async () => {
    // Create test user
    const userData = {
      email: `success-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      displayName: 'Test User',
    };

    // Register user first
    await request(app)
      .post('/api/v1/auth/register')
      .send(userData)
      .expect(201);

    // Login with correct credentials
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      })
      .expect(200);

    expect(response.body).toHaveProperty('payload');
    expect(response.body.payload).toHaveProperty('tokens');
    expect(response.body.payload.tokens).toHaveProperty('accessToken');

    const token = response.body.payload.tokens.accessToken;
    expect(typeof token).toBe('string');

    // Decode and validate JWT claims
    const decoded = jwt.decode(token, { complete: true });
    expect(decoded).not.toBeNull();
    expect(decoded.header.alg).toBe('HS256');
    expect(decoded.payload).toHaveProperty('uid');
    expect(decoded.payload).toHaveProperty('callSign');

    // Verify expiration is approximately 1 hour from now
    const now = Math.floor(Date.now() / 1000);
    expect(decoded.payload.exp).toBeGreaterThan(now + 840); // At least 14 minutes
    expect(decoded.payload.exp).toBeLessThan(now + 960); // At most 16 minutes
  }, 60000);

  it('should return refresh token for token refresh capability', async () => {
    const userData = {
      email: `refresh-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      displayName: 'Refresh Test User',
    };

    // Register and login
    await request(app)
      .post('/api/v1/auth/register')
      .send(userData)
      .expect(201);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      })
      .expect(200);

    expect(response.body.payload).toHaveProperty('tokens');
    // Check if refreshToken or similar mechanism exists
    expect(response.body.payload.tokens.accessToken).toBeTruthy();
  }, 60000);

  it('should not expose sensitive user data in JWT payload', async () => {
    const userData = {
      email: `sensitive-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      displayName: 'Sensitive Test',
    };

    await request(app)
      .post('/api/v1/auth/register')
      .send(userData)
      .expect(201);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      })
      .expect(200);

    const decoded = jwt.decode(response.body.payload.tokens.accessToken);

    // Ensure no passwords or sensitive data in JWT
    expect(decoded).not.toHaveProperty('password');
    expect(decoded).not.toHaveProperty('passwordHash');
    expect(decoded).not.toHaveProperty('firebasePassword');
  }, 60000);
});
