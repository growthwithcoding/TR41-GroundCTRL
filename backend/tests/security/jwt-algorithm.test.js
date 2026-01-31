/**
 * Security Test: JWT Algorithm Verification
 * Test Goal: Ensure the token isn't signed with HS256 (alg confusion attack prevention)
 * 
 * JWT algorithm confusion attacks occur when an attacker changes the algorithm 
 * from RS256 (asymmetric) to HS256 (symmetric) and uses the public key as the secret.
 * This test ensures all tokens use RS256.
 */

const request = require('supertest');
const { getTestApp, createTestUser } = require('../helpers/test-utils');

describe('Security: JWT Algorithm Verification', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  test('should use RS256 algorithm, not HS256', async () => {
    // Create test user
    const email = `jwt-alg-test-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    // Register and get token
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'TestPassword123!',
        callSign: `ALG${Date.now()}`,
        displayName: 'JWT Algorithm Test User',
      })
      .expect(201);

    const token = registerResponse.body.payload?.tokens?.accessToken;
    expect(token).toBeDefined();

    // Decode token header (base64)
    const [headerB64] = token.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64').toString('utf8'));

    // Verify algorithm
    expect(header.alg).toBe('RS256');
    expect(header.alg).not.toBe('HS256');
    expect(header.alg).not.toBe('none');
  });

  test('should reject tokens with algorithm "none"', async () => {
    // Create a malicious token with alg: "none"
    const header = { alg: 'none', typ: 'JWT' };
    const payload = { uid: 'malicious-user', exp: Math.floor(Date.now() / 1000) + 3600 };
    
    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const maliciousToken = `${headerB64}.${payloadB64}.`;

    // Attempt to use the malicious token
    const response = await request(app)
      .get('/api/v1/satellites')
      .set('Authorization', `Bearer ${maliciousToken}`)
      .expect(401);

    expect(response.body.error).toBeDefined();
  });

  test('should include required JWT header fields', async () => {
    const email = `jwt-header-test-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'TestPassword123!',
        callSign: `HDR${Date.now()}`,
        displayName: 'JWT Header Test User',
      })
      .expect(201);

    const token = registerResponse.body.payload?.tokens?.accessToken;
    const [headerB64] = token.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64').toString('utf8'));

    // Verify required fields
    expect(header).toHaveProperty('alg');
    expect(header).toHaveProperty('typ');
    expect(header.typ).toBe('JWT');
  });
});
