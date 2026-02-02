/**
 * JWT Algorithm Test
 * Tests: JWT uses HS256 algorithm, not weak algorithms
 * Features: Algorithm validation, secure cryptography
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { getTestApp } = require('../../helpers/test-utils');

describe('Auth - JWT Algorithm', () => {
  let app;
  const testUser = {
    email: `algo-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    displayName: 'Algorithm Test',
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

  it('should use HS256 algorithm for JWT signing', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const token = response.body.payload.tokens.accessToken;
    const decoded = jwt.decode(token, { complete: true });

    expect(decoded).toBeTruthy();
    expect(decoded.header.alg).toBe('HS256');
    expect(decoded.header.typ).toBe('JWT');
  }, 60000);

  it('should not use weak algorithms like HS256 with short keys', async () => {
    // Verify JWT_SECRET is sufficiently long
    const secret = process.env.JWT_SECRET;
    expect(secret).toBeDefined();
    expect(secret.length).toBeGreaterThanOrEqual(32); // At least 32 characters
  }, 60000);

  it('should include standard JWT claims', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const token = response.body.payload.tokens.accessToken;
    const decoded = jwt.decode(token);

    // Standard claims
    expect(decoded).toHaveProperty('iat'); // issued at
    expect(decoded).toHaveProperty('exp'); // expiration
    expect(decoded).toHaveProperty('uid');

    // Verify iat is in the past and exp is in the future
    const now = Math.floor(Date.now() / 1000);
    expect(decoded.iat).toBeLessThanOrEqual(now);
    expect(decoded.exp).toBeGreaterThan(now);
  }, 60000);

  it('should verify JWT signature with correct secret', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const token = response.body.payload.tokens.accessToken;
    const secret = process.env.JWT_SECRET;

    // Should verify successfully with correct secret
    expect(() => {
      jwt.verify(token, secret, { algorithms: ['HS256'] });
    }).not.toThrow();
  }, 60000);

  it('should reject JWT with invalid signature', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const token = response.body.payload.tokens.accessToken;
    const wrongSecret = 'completely-different-secret-key-for-testing';

    // Should fail verification with wrong secret
    expect(() => {
      jwt.verify(token, wrongSecret, { algorithms: ['HS256'] });
    }).toThrow();
  }, 60000);

  it('should reject tokens with altered algorithm', async () => {
    // Create a token with a different algorithm
    const alteredToken = jwt.sign(
      { uid: 'test', email: testUser.email },
      'some-secret',
      { algorithm: 'none' }
    );

    // Verify that tokens with 'none' algorithm are not accepted
    expect(() => {
      jwt.verify(alteredToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    }).toThrow();
  }, 60000);
});
