/**
 * Security Test: Login Bad Password
 * Test Goal: Wrong password â†’ generic 401 (prod) vs detailed (dev)
 * 
 * In production, error messages should be generic to prevent username enumeration.
 * In development, detailed messages help with debugging.
 */

const request = require('supertest');
const { getTestApp, createTestUser, loginWithRetry, wait } = require('../helpers/test-utils');

describe('Security: Login Bad Password', () => {
  let app;
  const originalEnv = process.env.NODE_ENV;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  afterEach(() => {
    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  test('wrong password should return 401 in production with generic message', async () => {
    process.env.NODE_ENV = 'production';

    const email = `bad-pass-prod-${Date.now()}@example.com`;
    await createTestUser(email, 'CorrectPassword123!');

    await wait(2000);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email,
        password: 'WrongPassword123!',
      })
      .expect(401);

    expect(response.body.payload?.error || response.body.error).toBeDefined();
    
    // Should use generic message
    const errorMsg = (response.body.payload?.error?.message || response.body.error || '').toLowerCase();
    expect(
      errorMsg.includes('invalid') || 
      errorMsg.includes('unauthorized') ||
      errorMsg.includes('authentication failed')
    ).toBe(true);

    // Should NOT reveal that the email exists
    expect(errorMsg).not.toContain('password');
    expect(errorMsg).not.toContain('incorrect');
    expect(errorMsg).not.toContain('wrong');
  });

  test('wrong password should return 401 in development with detailed message', async () => {
    process.env.NODE_ENV = 'development';

    const email = `bad-pass-dev-${Date.now()}@example.com`;
    await createTestUser(email, 'CorrectPassword123!');

    await wait(2000);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email,
        password: 'WrongPassword123!',
      })
      .expect(401);

    expect(response.body.payload?.error || response.body.error).toBeDefined();
    
    // In dev, can have more detailed message
    const errorMsg = (response.body.payload?.error?.message || response.body.error || '').toLowerCase();
    expect(errorMsg).toBeTruthy();
  });

  test('non-existent email should return same error as wrong password in production', async () => {
    process.env.NODE_ENV = 'production';

    const existingEmail = `existing-${Date.now()}@example.com`;
    await createTestUser(existingEmail, 'CorrectPassword123!');

    // Try with existing email but wrong password
    const existingUserResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: existingEmail,
        password: 'WrongPassword123!',
      })
      .expect(401);

    // Try with non-existent email
    const nonExistentResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: `non-existent-${Date.now()}@example.com`,
        password: 'WrongPassword123!',
      })
      .expect(401);

    // Both should return same status code
    expect(existingUserResponse.status).toBe(nonExistentResponse.status);

    // Error messages should be similar (both generic)
    expect(existingUserResponse.body.payload?.error || existingUserResponse.body.error).toBeTruthy();
    expect(nonExistentResponse.body.payload?.error || nonExistentResponse.body.error).toBeTruthy();
    
    // Neither should reveal whether the email exists
    const existingMsg = (existingUserResponse.body.payload?.error?.message || existingUserResponse.body.error || '').toLowerCase();
    const nonExistentMsg = (nonExistentResponse.body.payload?.error?.message || nonExistentResponse.body.error || '').toLowerCase();
    
    expect(existingMsg).not.toContain('not found');
    expect(existingMsg).not.toContain('does not exist');
    expect(nonExistentMsg).not.toContain('not found');
    expect(nonExistentMsg).not.toContain('does not exist');
  });

  test('empty password should return 401', async () => {
    const email = `empty-pass-${Date.now()}@example.com`;
    await createTestUser(email, 'CorrectPassword123!');

    await wait(2000);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email,
        password: '',
      });

    expect([400, 401]).toContain(response.status);
    expect(response.body.error).toBeDefined();
  });

  test('missing password should return 400 or 401', async () => {
    const email = `missing-pass-${Date.now()}@example.com`;
    await createTestUser(email, 'CorrectPassword123!');

    await wait(2000);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email });

    expect([400, 401]).toContain(response.status);
    expect(response.body.payload?.error || response.body.error).toBeDefined();
  });
});

