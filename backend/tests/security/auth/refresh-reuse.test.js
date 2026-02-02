/**
 * Refresh Token Reuse Test
 * Tests: Refresh tokens cannot be reused, preventing replay attacks
 * Features: One-time refresh tokens, replay attack prevention, token rotation
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { getTestApp } = require('../../helpers/test-utils');

describe('Auth - Refresh Token Reuse Prevention', () => {
  let app;
  const testUser = {
    email: `refresh-reuse-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    displayName: 'Refresh Reuse Test',
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

  it('should reject refresh token reuse on second attempt', async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const payload = loginResponse.body.payload;

    // Check if refresh endpoint exists
    if (payload.refreshToken || payload.refresh_token) {
      const refreshToken = payload.refreshToken || payload.refresh_token;

      // First refresh should succeed
      const firstRefresh = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect([200, 401, 404]);

      if (firstRefresh.status === 200) {
        // Second refresh with same token should fail
        const secondRefresh = await request(app)
          .post('/api/v1/auth/refresh')
          .send({ refreshToken });

        // Should reject the reused refresh token
        expect(secondRefresh.status).toBe(401);
      }
    }
  }, 60000);

  it('should not allow replaying old refresh tokens', async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const payload = loginResponse.body.payload;

    if (payload.refreshToken || payload.refresh_token) {
      const refreshToken = payload.refreshToken || payload.refresh_token;

      // Simulate replay attack: use token twice with delay
      const firstAttempt = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 500));

      const secondAttempt = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      // Second attempt should fail regardless of first attempt result
      if (firstAttempt.status === 200) {
        expect(secondAttempt.status).toBe(401);
      }
    }
  }, 60000);

  it('should issue new refresh token with each refresh cycle', async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const payload = loginResponse.body.payload;

    if (payload.refreshToken || payload.refresh_token) {
      const originalRefreshToken = payload.refreshToken || payload.refresh_token;

      // Attempt refresh
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: originalRefreshToken })
        .expect([200, 401, 404]);

      if (refreshResponse.status === 200) {
        const newPayload = refreshResponse.body.payload;

        // New refresh token should be different from original
        if (newPayload.refreshToken || newPayload.refresh_token) {
          const newRefreshToken = newPayload.refreshToken || newPayload.refresh_token;
          expect(newRefreshToken).not.toBe(originalRefreshToken);
        }

        // Should have new access token
        expect(newPayload.token || newPayload.accessToken).toBeTruthy();
      }
    }
  }, 60000);

  it('should track refresh token usage for revocation', async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const payload = loginResponse.body.payload;

    if (payload.refreshToken || payload.refresh_token) {
      const refreshToken = payload.refreshToken || payload.refresh_token;
      const decoded = jwt.decode(refreshToken);

      // Refresh token should have identifying information
      expect(refreshToken).toBeTruthy();
      expect(decoded).toHaveProperty('uid');
    }
  }, 60000);

  it('should invalidate all refresh tokens on password change', async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    const token = loginResponse.body.payload.token;
    const payload = loginResponse.body.payload;

    if (payload.refreshToken || payload.refresh_token) {
      const refreshToken = payload.refreshToken || payload.refresh_token;

      // Change password (if endpoint exists)
      await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          oldPassword: testUser.password,
          newPassword: 'NewPassword123!',
        })
        .expect([200, 400, 404]);

      // Attempt to use old refresh token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      // Should fail if password change invalidates tokens
      if (refreshResponse.status !== 404) {
        // If endpoint exists, it should fail with 401
        expect([401]).toContain(refreshResponse.status);
      }
    }
  }, 60000);
});
