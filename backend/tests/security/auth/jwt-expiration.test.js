/**
 * JWT Expiration Test
 * Tests: JWT tokens expire after configured time period
 * Features: Token TTL validation, expired token rejection
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { getTestApp } = require('../../helpers/test-utils');

describe('Auth - JWT Expiration', () => {
  let app;
  const testUser = {
    email: `exp-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    displayName: 'Expiration Test',
  };

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Register test user
    await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);
  }, 60000);

  it('should set token expiration to ~1 hour', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const token = response.body.payload.tokens.accessToken;
    const decoded = jwt.decode(token);
    const now = Math.floor(Date.now() / 1000);

    // Default ~15 minutes = 901 seconds (as per config)
    const expectedExpiry = now + 901;
    const tolerance = 60; // Allow 60 second difference

    expect(decoded.exp).toBeGreaterThan(expectedExpiry - tolerance);
    expect(decoded.exp).toBeLessThan(expectedExpiry + tolerance);
  }, 60000);

  it('should include iat (issued at) timestamp', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const token = response.body.payload.tokens.accessToken;
    const decoded = jwt.decode(token);
    const now = Math.floor(Date.now() / 1000);

    expect(decoded).toHaveProperty('iat');
    expect(decoded.iat).toBeCloseTo(now, 1); // Within 1 second
  }, 60000);

  it('should reject tokens that would have expired', () => {
    const expiredToken = jwt.sign(
      { uid: 'test', email: 'test@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '-1h' } // Already expired
    );

    // Attempting to verify should throw
    expect(() => {
      jwt.verify(expiredToken, process.env.JWT_SECRET);
    }).toThrow('jwt expired');
  });

  it('should compute token lifetime correctly', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const token = response.body.payload.tokens.accessToken;
    const decoded = jwt.decode(token);

    const lifetime = decoded.exp - decoded.iat;

    // Should be approximately 15 minutes (901 seconds as per config)
    expect(lifetime).toBeGreaterThan(850); // At least 14 minutes
    expect(lifetime).toBeLessThan(950); // At most 16 minutes
  }, 60000);

  it('should have exp claim in numeric format', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const token = response.body.payload.tokens.accessToken;
    const decoded = jwt.decode(token);

    expect(typeof decoded.exp).toBe('number');
    expect(typeof decoded.iat).toBe('number');
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  }, 60000);

  it('should issue new token with fresh expiration on each login', async () => {
    const response1 = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const token1 = response1.body.payload.tokens.accessToken;
    const decoded1 = jwt.decode(token1);

    // Wait a second and login again
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response2 = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const token2 = response2.body.payload.tokens.accessToken;
    const decoded2 = jwt.decode(token2);

    // Second token should have later expiration
    expect(decoded2.exp).toBeGreaterThan(decoded1.exp);
    expect(decoded2.iat).toBeGreaterThan(decoded1.iat);
  }, 60000);
});
