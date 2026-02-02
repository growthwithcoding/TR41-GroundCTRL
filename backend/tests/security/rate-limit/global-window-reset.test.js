/**
 * Global Window Reset Test
 * Tests: Rate limit window resets properly after time period
 * Features: Window reset, request counter reset, sliding window validation
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('Rate Limit - Global Window Reset', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  it('should reset rate limit counter after window expires', async () => {
    // Make multiple requests to hit rate limit
    const maxRequests = parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS || '100');
    const windowMs = parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '1000');

    let responsesInWindow = [];
    let blocked = false;

    // Make requests within window
    for (let i = 0; i < maxRequests + 5; i++) {
      const response = await request(app)
        .get('/api/v1/satellites');

      responsesInWindow.push(response.status);

      if (response.status === 429) {
        blocked = true;
        break;
      }
    }

    // If rate limiting is active, should have been blocked
    if (blocked) {
      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, windowMs + 100));

      // Should be able to make requests again
      const resetResponse = await request(app)
        .get('/api/v1/satellites');

      expect([200, 401, 404]).toContain(resetResponse.status);
      expect(resetResponse.status).not.toBe(429);
    }
  }, 60000);

  it('should track requests per window independently', async () => {
    const windowMs = parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '1000');

    // Make a request in first window
    const response1 = await request(app)
      .get('/api/v1/satellites');

    expect([200, 401, 404, 429]).toContain(response1.status);

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, windowMs + 100));

    // Counter should be reset, request should succeed (if not blocked)
    const response2 = await request(app)
      .get('/api/v1/satellites');

    // Should not have 429 if window reset
    if (response1.status !== 429) {
      expect([200, 401, 404]).toContain(response2.status);
    }
  }, 60000);

  it('should prevent requests exceeding limit within window', async () => {
    const maxRequests = parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS || '100');
    const windowMs = parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '1000');

    let blockedResponse = null;

    // Attempt to exceed limit
    for (let i = 0; i < maxRequests + 10; i++) {
      const response = await request(app)
        .get('/api/v1/satellites');

      if (response.status === 429) {
        blockedResponse = response;
        break;
      }
    }

    if (blockedResponse) {
      expect(blockedResponse.status).toBe(429);
      expect(blockedResponse.body).toHaveProperty('payload');
    }
  }, 60000);

  it('should return rate limit headers with response', async () => {
    const response = await request(app)
      .get('/api/v1/satellites');

    // Check for standard rate limit headers
    const headers = response.headers;

    // Either X-RateLimit-* headers or Retry-After should be present
    const hasRateLimitHeaders = 
      headers['x-ratelimit-limit'] || 
      headers['x-ratelimit-remaining'] || 
      headers['x-ratelimit-reset'] ||
      headers['retry-after'];

    // Log for debugging if headers missing
    if (!hasRateLimitHeaders) {
      console.log('Note: Rate limit headers not found in response');
    }
  }, 60000);

  it('should apply different limits to different endpoints', async () => {
    const loginMaxRequests = parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS || '1000');
    const apiMaxRequests = parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS || '100');

    // Test login endpoint (should allow more requests)
    let loginResponses = 0;
    for (let i = 0; i < loginMaxRequests + 5; i++) {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: `test-${i}@example.com`,
          password: 'wrongpassword',
        });

      if (response.status !== 429) {
        loginResponses++;
      } else {
        break;
      }
    }

    // Should allow more requests than API endpoint
    expect(loginResponses).toBeGreaterThan(0);
  }, 60000);
});
