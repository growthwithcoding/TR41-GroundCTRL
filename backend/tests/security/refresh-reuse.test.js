/**
 * Refresh Token Reuse Prevention Test
 * Tests: SEC-XXX (Refresh Token Replay Attack Prevention)
 * Ensures refresh tokens cannot be reused after successful refresh
 */

const request = require('supertest');
const { createTestApp } = require('../helpers/testHelpers');
const { getAuth, getFirestore } = require('../../src/config/firebase');
const tokenBlacklistRepository = require('../../src/repositories/tokenBlacklistRepository');

describe('Refresh Token Reuse Prevention Tests', () => {
  let app;
  let testUser;
  let refreshToken;

  beforeAll(async () => {
    app = createTestApp();

    // Create a test user
    const auth = getAuth();
    const db = getFirestore();

    const userRecord = await auth.createUser({
      email: 'refresh-test@example.com',
      password: 'TestPass123!'
    });

    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: 'refresh-test@example.com',
      callSign: 'REFRESH_TEST',
      displayName: 'Refresh Test User',
      isActive: true,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    testUser = {
      uid: userRecord.uid,
      email: 'refresh-test@example.com',
      callSign: 'REFRESH_TEST'
    };
  });

  afterAll(async () => {
    // Clean up
    if (testUser) {
      const auth = getAuth();
      const db = getFirestore();

      try {
        await db.collection('users').doc(testUser.uid).delete();
        await auth.deleteUser(testUser.uid);
      } catch (error) {
        console.warn('Cleanup failed:', error.message);
      }
    }
  });

  describe('SEC-XXX: Refresh Token Cannot Be Reused', () => {
    it('should allow first refresh token use', async () => {
      // Login to get initial tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPass123!'
        })
        .expect(200);

      expect(loginResponse.body.payload.data.tokens.accessToken).toBeDefined();
      refreshToken = loginResponse.body.payload.data.tokens.refreshToken;

      // Use refresh token once
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body.payload.data.accessToken).toBeDefined();
      expect(refreshResponse.body.payload.data.refreshToken).toBeDefined();
    });

    it('should reject reuse of the same refresh token', async () => {
      // Try to use the same refresh token again
      const reuseResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(reuseResponse.body.payload.error.message).toContain('revoked');
    });

    it('should have blacklisted the used refresh token', async () => {
      const isBlacklisted = await tokenBlacklistRepository.isTokenBlacklisted(refreshToken);
      expect(isBlacklisted).toBe(true);
    });

    it('should allow use of new refresh token from successful refresh', async () => {
      // Get a new refresh token by logging in again
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'TestPass123!'
        })
        .expect(200);

      const newRefreshToken = loginResponse.body.payload.data.tokens.refreshToken;

      // Use the new refresh token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: newRefreshToken })
        .expect(200);

      expect(refreshResponse.body.payload.data.accessToken).toBeDefined();
      expect(refreshResponse.body.payload.data.refreshToken).toBeDefined();

      // Verify the new token is not blacklisted yet
      const isNewTokenBlacklisted = await tokenBlacklistRepository.isTokenBlacklisted(newRefreshToken);
      expect(isNewTokenBlacklisted).toBe(false);

      // But the old one should still be blacklisted
      const isOldTokenBlacklisted = await tokenBlacklistRepository.isTokenBlacklisted(refreshToken);
      expect(isOldTokenBlacklisted).toBe(true);
    });
  });
});