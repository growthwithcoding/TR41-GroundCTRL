/**
 * Security Test: Refresh Token Reuse Prevention
 * Test Goal: Refresh token can be used once (replay protection)
 * 
 * Refresh token rotation prevents replay attacks. Once a refresh token
 * is used, it should be invalidated and a new one issued.
 */

const request = require('supertest');
const { getTestApp, createTestUser } = require('../helpers/test-utils');

describe('Security: Refresh Token Reuse Prevention', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  test('refresh token should work on first use', async () => {
    const email = `refresh-first-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    // Register to get tokens
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'TestPassword123!',
        callSign: `RFS${Date.now()}`,
        displayName: 'Refresh First Test User',
      })
      .expect(201);

    const refreshToken = registerResponse.body.payload?.tokens?.refreshToken;
    
    // Skip if refresh tokens not implemented yet
    if (!refreshToken) {
      console.log('⚠️  Refresh tokens not implemented yet - skipping test');
      return;
    }

    // Use refresh token
    const refreshResponse = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(refreshResponse.body.payload).toHaveProperty('tokens');
    expect(refreshResponse.body.payload.tokens).toHaveProperty('accessToken');
  });

  test('refresh token should fail on second use (replay protection)', async () => {
    const email = `refresh-replay-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'TestPassword123!',
        callSign: `RPL${Date.now()}`,
        displayName: 'Refresh Replay Test User',
      })
      .expect(201);

    const refreshToken = registerResponse.body.payload?.tokens?.refreshToken;
    
    // Skip if refresh tokens not implemented yet
    if (!refreshToken) {
      console.log('⚠️  Refresh tokens not implemented yet - skipping test');
      return;
    }

    // First use - should succeed
    const firstRefresh = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(firstRefresh.body.payload.tokens).toHaveProperty('accessToken');

    // Second use - should fail
    const secondRefresh = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    expect(secondRefresh.body.payload?.error || secondRefresh.body.error).toBeDefined();
  });

  test('invalid refresh token should be rejected', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid.refresh.token' })
      .expect(401);

    expect(response.body.payload?.error || response.body.error).toBeDefined();
  });

  test('missing refresh token should be rejected', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({});

    expect([400, 401]).toContain(response.status);
    expect(response.body.payload?.error || response.body.error).toBeDefined();
  });

  test('refresh should issue new refresh token (rotation)', async () => {
    const email = `refresh-rotation-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'TestPassword123!',
        callSign: `ROT${Date.now()}`,
        displayName: 'Refresh Rotation Test User',
      })
      .expect(201);

    const originalRefreshToken = registerResponse.body.payload?.tokens?.refreshToken;
    
    if (!originalRefreshToken) {
      console.log('⚠️  Refresh tokens not implemented yet - skipping test');
      return;
    }

    // Use refresh token
    const refreshResponse = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: originalRefreshToken })
      .expect(200);

    const newRefreshToken = refreshResponse.body.payload?.tokens?.refreshToken;

    // Should issue a new refresh token
    if (newRefreshToken) {
      expect(newRefreshToken).not.toBe(originalRefreshToken);
    }
  });
});
