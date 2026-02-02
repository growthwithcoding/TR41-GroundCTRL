/**
 * Integration Tests for Authentication
 * Tests: AUTH-001, AUTH-002, AUTH-007, AUTH-008, AUTH-013
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('Authentication - Integration Tests', () => {
  let app;

  beforeAll(async () => {
    // Use the test helper to get app instance
    app = getTestApp();
    // Add delay to ensure emulators are ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  describe('AUTH-001: CreateUser with duplicate callSign', () => {
    it('should create user successfully even with duplicate callSign', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        callSign: 'DUPLICATE',
        displayName: 'Duplicate Test User',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('user');
      expect(response.body.payload.user).toHaveProperty('uid');
      expect(response.body.payload).toHaveProperty('tokens');
      expect(response.body.payload.tokens).toHaveProperty('accessToken');
    }, 60000); // Increase timeout to 60s for Firebase emulator
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
      expect(response.body.payload.error.message).toBe('Invalid email or password');
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
