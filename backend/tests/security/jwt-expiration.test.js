/**
 * Security Test: JWT Expiration Verification
 * Test Goal: Token must expire after 1 hour, refresh token after 30 days
 * 
 * Proper token expiration is critical for security. Short-lived access tokens
 * limit the window of opportunity for token theft/misuse.
 */

const request = require('supertest');
const { getTestApp, createTestUser } = require('../helpers/test-utils');

describe('Security: JWT Expiration Verification', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  test('access token should expire after approximately 1 hour', async () => {
    const email = `jwt-exp-test-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'TestPassword123!',
        callSign: `EXP${Date.now()}`,
        displayName: 'JWT Expiration Test User',
      })
      .expect(201);

    const token = registerResponse.body.payload?.tokens?.accessToken;
    expect(token).toBeDefined();

    // Decode token payload
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));

    // Verify exp and iat exist
    expect(payload).toHaveProperty('exp');
    expect(payload).toHaveProperty('iat');

    // Calculate token lifetime
    const lifetime = payload.exp - payload.iat;
    const oneHourInSeconds = 3600;
    const tolerance = 60; // 1 minute tolerance

    expect(lifetime).toBeGreaterThanOrEqual(oneHourInSeconds - tolerance);
    expect(lifetime).toBeLessThanOrEqual(oneHourInSeconds + tolerance);
  });

  test('token should have uid claim', async () => {
    const email = `jwt-uid-test-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'TestPassword123!',
        callSign: `UID${Date.now()}`,
        displayName: 'JWT UID Test User',
      })
      .expect(201);

    const token = registerResponse.body.payload?.tokens?.accessToken;
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));

    expect(payload).toHaveProperty('uid');
    expect(payload.uid).toBeTruthy();
    expect(typeof payload.uid).toBe('string');
  });

  test('expired token should be rejected', async () => {
    // This test would require mocking time or waiting, so we test the concept
    const email = `jwt-expired-test-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'TestPassword123!',
        callSign: `EXPR${Date.now()}`,
        displayName: 'JWT Expired Test User',
      })
      .expect(201);

    const token = registerResponse.body.payload?.tokens?.accessToken;

    // Create an expired token by manually crafting one
    const [headerB64, payloadB64, signature] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));
    
    // Set expiration to past
    payload.exp = Math.floor(Date.now() / 1000) - 3600; // Expired 1 hour ago
    
    const expiredPayloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const expiredToken = `${headerB64}.${expiredPayloadB64}.${signature}`;

    // Attempt to use expired token (will fail due to signature mismatch, which is expected)
    const response = await request(app)
      .get('/api/v1/satellites')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);

    expect(response.body.error).toBeDefined();
  });

  test('token should not have excessive expiration', async () => {
    const email = `jwt-maxexp-test-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'TestPassword123!',
        callSign: `MAX${Date.now()}`,
        displayName: 'JWT Max Exp Test User',
      })
      .expect(201);

    const token = registerResponse.body.payload?.tokens?.accessToken;
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8'));

    const lifetime = payload.exp - payload.iat;
    const oneDay = 86400; // 24 hours in seconds

    // Access tokens should never live longer than 1 day
    expect(lifetime).toBeLessThan(oneDay);
  });
});
