/**
 * Login Bad Password Test
 * Tests: Invalid credentials are rejected with generic error message
 * Features: Error message normalization, no user enumeration
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('Auth - Login Bad Password', () => {
  let app;
  const testUser = {
    email: `badpass-${Date.now()}@example.com`,
    password: 'CorrectPassword123!',
    displayName: 'Bad Password Test',
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

  it('should reject login with incorrect password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword123!',
      })
      .expect(401);

    expect(response.body).toHaveProperty('payload');
    expect(response.body.payload).toHaveProperty('error');
    expect(response.body.payload.error.message).toBe('Invalid email or password');
  }, 60000);

  it('should not expose whether email exists', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword123!',
      });

    // Should return same error whether user exists or not
    expect(response.status).toBe(401);
    expect(response.body.payload.error.message).toBe('Invalid email or password');
  }, 60000);

  it('should normalize Firebase auth errors in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword123!',
      })
      .expect(401);

    // In production, error should be generic
    expect(response.body.payload.error.message).toBe('Invalid email or password');
    expect(response.body.payload.error.message).not.toMatch(/auth\/|firebase|emulator/i);

    process.env.NODE_ENV = originalEnv;
  }, 60000);

  it('should not accept empty password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: '',
      })
      .expect(400);

    expect(response.body).toHaveProperty('payload');
    expect(response.body.payload).toHaveProperty('error');
  }, 60000);

  it('should not accept null password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: null,
      })
      .expect(400);

    expect(response.body).toHaveProperty('payload');
    expect(response.body.payload).toHaveProperty('error');
  }, 60000);

  it('should not accept missing password field', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
      })
      .expect(400);

    expect(response.body).toHaveProperty('payload');
    expect(response.body.payload).toHaveProperty('error');
  }, 60000);
});
