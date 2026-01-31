/**
 * Security Test: Login Success
 * Test Goal: Valid credentials yield a JWT with correct claims
 *
 * Ensures that successful logins return properly formatted JWTs
 * with all required security claims.
 */

const request = require('supertest');
const { getTestApp, createTestUser, loginWithRetry, wait } = require('../helpers/test-utils');

describe('Security: Login Success', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await wait(2000);
  }, 60000);

  test('valid credentials should return JWT with correct claims', async () => {
    const email = `login-success-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    // Create user
    const user = await createTestUser(email, password);
    console.log('Created test user:', user.uid, email);

    // Wait for user to be fully created in emulator
    await wait(2000);

    // Login with retry logic
    const loginResponse = await loginWithRetry(app, email, password, 3);

    if (loginResponse.status !== 200) {
      console.error('Login failed after retries:', loginResponse.status, loginResponse.body);
    }
    expect(loginResponse.status).toBe(200);

    // Verify response structure
    expect(loginResponse.body).toHaveProperty('payload');
    expect(loginResponse.body.payload).toHaveProperty('tokens');
    expect(loginResponse.body.payload.tokens).toHaveProperty('accessToken');

    const token = loginResponse.body.payload.tokens.accessToken;
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts

    // Decode and verify claims
    const [headerB64, payloadB64] = token.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64').toString('utf8'));
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));

    // Verify algorithm
    expect(header.alg).toBe('HS256');

    // Verify required claims
    expect(payload).toHaveProperty('uid');
    expect(payload).toHaveProperty('exp');
    expect(payload).toHaveProperty('iat');

    // Verify expiration is in the future
    const now = Math.floor(Date.now() / 1000);
    expect(payload.exp).toBeGreaterThan(now);

    // Verify expiration is approximately 1 hour from now
    const expectedExp = now + 3600;
    const tolerance = 120; // 2 minutes tolerance
    expect(payload.exp).toBeGreaterThanOrEqual(expectedExp - tolerance);
    expect(payload.exp).toBeLessThanOrEqual(expectedExp + tolerance);
  });

  test('successful login should return user information', async () => {
    const email = `login-user-info-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    await createTestUser(email, password);
    await wait(2000);

    const loginResponse = await loginWithRetry(app, email, password, 3);
    expect(loginResponse.status).toBe(200);

    expect(loginResponse.body.payload).toHaveProperty('user');
    expect(loginResponse.body.payload.user).toHaveProperty('uid');
    expect(loginResponse.body.payload.user).toHaveProperty('email');
    expect(loginResponse.body.payload.user.email).toBe(email);
  });

  test('login should not leak sensitive data', async () => {
    const email = `login-no-leak-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    await createTestUser(email, password);
    await wait(2000);

    const loginResponse = await loginWithRetry(app, email, password, 3);
    expect(loginResponse.status).toBe(200);

    // Ensure password is not in response
    const responseStr = JSON.stringify(loginResponse.body);
    expect(responseStr).not.toContain(password);
    expect(loginResponse.body.payload.user).not.toHaveProperty('password');
    expect(loginResponse.body.payload.user).not.toHaveProperty('passwordHash');
  });

  test('login token should be usable for authenticated requests', async () => {
    const email = `login-usable-token-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    await createTestUser(email, password);
    await wait(2000);

    const loginResponse = await loginWithRetry(app, email, password, 3);
    expect(loginResponse.status).toBe(200);

    const token = loginResponse.body.payload.tokens.accessToken;

    // Use token to make authenticated request
    const authenticatedResponse = await request(app)
      .get('/api/v1/satellites')
      .set('Authorization', `Bearer ${token}`);

    // Should not return 401
    expect(authenticatedResponse.status).not.toBe(401);
    expect([200, 404]).toContain(authenticatedResponse.status);
  });
});
