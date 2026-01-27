/**
 * Integration Tests for User API Endpoints
 * Uses SuperTest for HTTP assertions
 */

const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const { getTestApp } = require('../../helpers/test-utils');

describe('User API - Integration Tests', () => {
  let app;
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // Use the test helper to get app instance
    app = getTestApp();
    // Add delay to ensure emulators are ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000); // Increase timeout to 60s for Firebase initialization

  afterAll(async () => {
    // Cleanup test data if needed
  });

  describe('POST /api/v1/auth/register - User Registration', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: `test-${uuidv4()}@example.com`,
        password: 'TestPassword123!',
        callSign: `TEST-${Date.now()}`,
        displayName: 'Test User',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject({
        payload: {
          user: expect.objectContaining({
            uid: expect.any(String),
          }),
          tokens: expect.objectContaining({
            accessToken: expect.any(String),
          }),
        },
      });

      testUserId = response.body.payload.user.uid;
      authToken = response.body.payload.tokens.accessToken;
    }, 60000);

    it('should reject user creation with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPassword123!',
        callSign: 'TEST-USER',
        displayName: 'Test User',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('payload.error');
    });

    it('should reject user creation with weak password', async () => {
      const userData = {
        email: `test-${uuidv4()}@example.com`,
        password: 'weak',
        callSign: 'TEST-USER',
        displayName: 'Test User',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('payload.error');
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: `duplicate-${uuidv4()}@example.com`,
        password: 'TestPassword123!',
        callSign: 'TEST-DUP',
        displayName: 'Test User',
      };

      // First registration should succeed
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Second registration should fail
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('payload.error');
    }, 60000);
  });

  describe('GET /api/v1/users/:id - Get User', () => {
    it('should retrieve user details with valid auth', async () => {
      if (!testUserId || !authToken) {
        // Create a test user first
        const userData = {
          email: `test-${uuidv4()}@example.com`,
          password: 'TestPassword123!',
          callSign: `TEST-${Date.now()}`,
        };

        const createResponse = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(201);

        testUserId = createResponse.body.payload.user.uid;
        authToken = createResponse.body.payload.tokens.accessToken;
      }

      const response = await request(app)
        .get(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        payload: {
          data: expect.objectContaining({
            uid: testUserId,
            email: expect.any(String),
          }),
        },
      });
    }, 60000);

    it('should reject request without auth token', async () => {
      const response = await request(app)
        .get('/api/v1/users/some-user-id')
        .expect(401);

      expect(response.body).toHaveProperty('payload.error');
    });

    it('should return 403 for non-existent user (authorization check first)', async () => {
      if (!authToken) {
        const userData = {
          email: `test-${uuidv4()}@example.com`,
          password: 'TestPassword123!',
          callSign: `TEST-${Date.now()}`,
          displayName: 'Test User',
        };

        const createResponse = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(201);

        authToken = createResponse.body.payload.tokens.accessToken;
      }

      const response = await request(app)
        .get('/api/v1/users/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
      
      expect(response.body).toHaveProperty('payload.error');
      expect(response.body.payload.error.message).toBe('You can only view your own profile');
    }, 60000);
  });

  describe('PUT /api/v1/users/:id - Update User', () => {
    it('should update user callSign successfully', async () => {
      if (!testUserId || !authToken) {
        const userData = {
          email: `test-${uuidv4()}@example.com`,
          password: 'TestPassword123!',
          callSign: `TEST-${Date.now()}`,
          displayName: 'Test User',
        };

        const createResponse = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(201);

        testUserId = createResponse.body.payload.user.uid;
        authToken = createResponse.body.payload.tokens.accessToken;
      }

      const updatedData = {
        callSign: `UPDATED-${Date.now()}`,
      };

      const response = await request(app)
        .patch(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.payload.data).toMatchObject({
        callSign: updatedData.callSign,
      });
    }, 60000);

    it('should reject update without authorization', async () => {
      await request(app)
        .put('/api/v1/users/some-user-id')
        .send({ callSign: 'NEW-CALLSIGN' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/users/:id - Delete User', () => {
    it('should reject delete for non-admin user (requires admin)', async () => {
      // Create a user to attempt delete
      const userData = {
        email: `test-delete-${uuidv4()}@example.com`,
        password: 'TestPassword123!',
        callSign: `DELETE-${Date.now()}`,
        displayName: 'Delete Test User',
      };

      const createResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.payload.user.uid;
      const token = createResponse.body.payload.tokens.accessToken;

      // Regular users cannot delete accounts - requires admin
      const response = await request(app)
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.payload.error).toHaveProperty('message');
      expect(response.body.payload.error.message).toContain('Admin');
    }, 60000);

    it('should reject delete without authorization', async () => {
      await request(app)
        .delete('/api/v1/users/some-user-id')
        .expect(401);
    });
  });
});
