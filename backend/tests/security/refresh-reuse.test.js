/**
 * Refresh Token Reuse Prevention Test
 * Tests: SEC-XXX (Refresh Token Replay Attack Prevention)
 * Ensures refresh tokens cannot be reused after successful refresh
 */

const request = require('supertest');
const { getTestApp } = require('../helpers/test-utils');

describe('Refresh Token Reuse Prevention Tests', () => {
  let app;
  let refreshToken;

  beforeAll(async () => {
    app = getTestApp();
    // Add delay to ensure emulators are ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

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
    // Cleanup will be handled by test framework
  });

  describe('SEC-XXX: Refresh Token Cannot Be Reused', () => {
    it('should allow first refresh token use', async () => {
      // Register a new user
      const timestamp = Date.now();
      const userData = {
        email: `refresh-test-${timestamp}@example.com`,
        password: 'TestPass123!',
        callSign: 'REFRESH_TEST',
        displayName: 'Refresh Test User'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Login to get initial tokens
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password
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
    }, 60000);

    it('should reject reuse of the same refresh token', async () => {
      // Try to use the same refresh token again
      const reuseResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(reuseResponse.body.payload.error.message).toContain('revoked');
    });

    it('should allow use of new refresh token from successful refresh', async () => {
      // Get a new refresh token by logging in again
      const timestamp = Date.now();
      const userData = {
        email: `refresh-test-2-${timestamp}@example.com`,
        password: 'TestPass123!',
        callSign: 'REFRESH_TEST_2',
        displayName: 'Refresh Test User 2'
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password
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

      // The new token should work, and the old one should be rejected
      const oldTokenResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(oldTokenResponse.body.payload.error.message).toContain('revoked');
    }, 60000);
  });
});