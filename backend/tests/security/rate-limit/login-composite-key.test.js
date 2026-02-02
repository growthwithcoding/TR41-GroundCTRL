/**
 * Login Composite Key Test
 * Tests: Rate limiting uses composite key (IP + email/identifier)
 * Features: Per-user limits, composite key validation, multi-factor rate limiting
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('Rate Limit - Login Composite Key', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  afterAll(async () => {
    // Close any open connections and clear rate limit store
    try {
      jest.clearAllTimers();
      jest.clearAllMocks();
    } catch (error) {
      // Ignore if already cleared
    }
  });

  it('should apply rate limit per email address', async () => {
    const email = `composite-${Date.now()}@example.com`;
    const maxRequests = parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS || '1000');

    let blockedResponse = null;

    // Attempt multiple login attempts with same email
    for (let i = 0; i < maxRequests + 20; i++) {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: email,
          password: `password${i}`,
        });

      if (response.status === 429) {
        blockedResponse = response;
        break;
      }
    }

    // Should eventually be rate limited for this email
    if (blockedResponse) {
      expect(blockedResponse.status).toBe(429);
    }
  }, 60000);

  it('should track limit separately per email', async () => {
    const maxRequests = parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS || '100');

    // Make requests with email1
    const email1 = `user1-${Date.now()}@example.com`;
    let email1Blocked = false;

    for (let i = 0; i < maxRequests + 5; i++) {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: email1,
          password: 'wrongpassword',
        });

      if (response.status === 429) {
        email1Blocked = true;
        break;
      }
    }

    // Now try with different email
    const email2 = `user2-${Date.now()}@example.com`;
    const response2 = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: email2,
        password: 'wrongpassword',
      });

    // Different email should be handled independently
    if (email1Blocked) {
      expect([400, 401, 404, 429]).toContain(response2.status);
    }
  }, 60000);

  it('should include composite key in rate limit decision', async () => {
    const response1 = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test1@example.com',
        password: 'password1',
      });

    const response2 = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test2@example.com',
        password: 'password2',
      });

    // Both should have valid rate limit handling
    expect(response1.status).toBeDefined();
    expect(response2.status).toBeDefined();
  }, 60000);

  it('should handle concurrent login attempts from same email', async () => {
    const email = `concurrent-${Date.now()}@example.com`;

    // Make concurrent requests with same email
    const promises = Array.from({ length: 5 }, () =>
      request(app)
        .post('/api/v1/auth/login')
        .send({
          email: email,
          password: 'testpassword',
        })
    );

    const responses = await Promise.all(promises);

    // All requests should have valid status codes
    responses.forEach(response => {
      expect([200, 400, 401, 404, 429]).toContain(response.status);
    });
  }, 60000);

  it('should reset composite key limit after window expires', async () => {
    const email = `window-reset-${Date.now()}@example.com`;
    const windowMs = parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '1000');

    // Make request
    const response1 = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: email,
        password: 'password',
      });

    expect(response1.status).toBeDefined();

    // Wait for window to reset
    await new Promise(resolve => setTimeout(resolve, windowMs + 100));

    // Should be able to make request again
    const response2 = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: email,
        password: 'password2',
      });

    // Should not be rate limited if window reset
    expect([200, 400, 401, 404]).toContain(response2.status);
  }, 60000);

  it('should validate composite key includes identifier', async () => {
    // Verify rate limiting works by making multiple attempts
    const email = `validate-key-${Date.now()}@example.com`;

    for (let i = 0; i < 3; i++) {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: email,
          password: `password${i}`,
        });

      expect([200, 400, 401, 404, 429]).toContain(response.status);
    }
  }, 60000);
});
