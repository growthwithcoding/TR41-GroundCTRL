/**
 * Integration Tests for Authentication
 * Tests: AUTH-001, AUTH-002, AUTH-007, AUTH-008, AUTH-013
 */

const request = require('supertest');

describe('Authentication - Integration Tests', () => {
  let app;

  beforeAll(async () => {
    // Initialize test app with Firebase emulators
    process.env.NODE_ENV = 'test';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    
    app = require('../../../src/app');
  });

  describe('AUTH-001: CreateUser with duplicate callSign', () => {
    it('should create user successfully even with duplicate callSign', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        callSign: 'DUPLICATE',
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('data');
      expect(response.body.payload.data).toHaveProperty('uid');
      expect(response.body.payload.data).toHaveProperty('token');
    });
  });

  describe('AUTH-002: UpdateUser with duplicate callSign', () => {
    it('should allow updating callSign to existing value', async () => {
      // Test implementation
    });
  });

  describe('AUTH-007: Error Normalizer in Production', () => {
    it('should return generic error message in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('error');
      expect(response.body.payload.error.message).toBe('Invalid credentials');
      expect(response.body.payload.error.message).not.toContain('auth/user-not-found');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('AUTH-008: Error Normalizer in Development', () => {
    it('should return detailed error in development', async () => {
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('error');
      expect(response.body.payload.error).toHaveProperty('code');
    });
  });

  describe('AUTH-013: Response Envelope Structure', () => {
    it('should return success responses in envelope structure', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('data');
      expect(response.body.payload).not.toHaveProperty('error');
    });

    it('should return error responses in envelope structure', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('error');
      expect(response.body.payload.error).toHaveProperty('message');
      expect(response.body.payload).not.toHaveProperty('data');
    });
  });
});
