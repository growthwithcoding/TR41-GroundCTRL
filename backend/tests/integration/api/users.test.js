/**
 * Integration Tests for User API Endpoints
 * Uses SuperTest for HTTP assertions
 */

const request = require('supertest');
const { v4: uuidv4 } = require('uuid');

describe('User API - Integration Tests', () => {
  let app;
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // Initialize test app with Firebase emulators
    process.env.NODE_ENV = 'test';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    
    app = require('../../../src/app');
  });

  afterAll(async () => {
    // Cleanup test data if needed
  });

  describe('POST /api/v1/users - User Registration', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: `test-${uuidv4()}@example.com`,
        password: 'TestPassword123!',
        callSign: `TEST-${Date.now()}`,
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject({
        payload: {
          data: expect.objectContaining({
            uid: expect.any(String),
            token: expect.any(String),
          }),
        },
      });

      testUserId = response.body.payload.data.uid;
      authToken = response.body.payload.data.token;
    });

    it('should reject user creation with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPassword123!',
        callSign: 'TEST-USER',
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('payload.error');
    });

    it('should reject user creation with weak password', async () => {
      const userData = {
        email: `test-${uuidv4()}@example.com`,
        password: 'weak',
        callSign: 'TEST-USER',
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('payload.error');
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        email: `duplicate-${uuidv4()}@example.com`,
        password: 'TestPassword123!',
        callSign: 'TEST-DUP',
      };

      // First registration should succeed
      await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(201);

      // Second registration with same email should fail
      await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(400);
    });
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
          .post('/api/v1/users')
          .send(userData)
          .expect(201);

        testUserId = createResponse.body.payload.data.uid;
        authToken = createResponse.body.payload.data.token;
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
    });

    it('should reject request without auth token', async () => {
      const response = await request(app)
        .get('/api/v1/users/some-user-id')
        .expect(401);

      expect(response.body).toHaveProperty('payload.error');
    });

    it('should return 404 for non-existent user', async () => {
      if (!authToken) {
        const userData = {
          email: `test-${uuidv4()}@example.com`,
          password: 'TestPassword123!',
          callSign: `TEST-${Date.now()}`,
        };

        const createResponse = await request(app)
          .post('/api/v1/users')
          .send(userData)
          .expect(201);

        authToken = createResponse.body.payload.data.token;
      }

      await request(app)
        .get('/api/v1/users/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/users/:id - Update User', () => {
    it('should update user callSign successfully', async () => {
      if (!testUserId || !authToken) {
        const userData = {
          email: `test-${uuidv4()}@example.com`,
          password: 'TestPassword123!',
          callSign: `TEST-${Date.now()}`,
        };

        const createResponse = await request(app)
          .post('/api/v1/users')
          .send(userData)
          .expect(201);

        testUserId = createResponse.body.payload.data.uid;
        authToken = createResponse.body.payload.data.token;
      }

      const updatedData = {
        callSign: `UPDATED-${Date.now()}`,
      };

      const response = await request(app)
        .put(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.payload.data).toMatchObject({
        callSign: updatedData.callSign,
      });
    });

    it('should reject update without authorization', async () => {
      await request(app)
        .put('/api/v1/users/some-user-id')
        .send({ callSign: 'NEW-CALLSIGN' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/users/:id - Delete User', () => {
    it('should delete user successfully', async () => {
      // Create a user to delete
      const userData = {
        email: `test-delete-${uuidv4()}@example.com`,
        password: 'TestPassword123!',
        callSign: `DELETE-${Date.now()}`,
      };

      const createResponse = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.payload.data.uid;
      const token = createResponse.body.payload.data.token;

      const response = await request(app)
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.payload).toHaveProperty('data');
    });

    it('should reject delete without authorization', async () => {
      await request(app)
        .delete('/api/v1/users/some-user-id')
        .expect(401);
    });
  });
});
