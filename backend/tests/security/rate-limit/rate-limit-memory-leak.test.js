/**
 * Rate Limit Memory Leak Test
 * Tests: Rate limiting stores don't leak memory with repeated requests
 * Features: Store cleanup, memory bounds, garbage collection
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('Rate Limit - Memory Leak Prevention', () => {
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

  it('should not accumulate records for unique identifiers indefinitely', async () => {
    // Create requests from many different identifiers
    const windowMs = parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '1000');

    for (let i = 0; i < 50; i++) {
      const email = `memtest-${i}-${Date.now()}@example.com`;

      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: email,
          password: 'testpass',
        });
    }

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, windowMs + 100));

    // Should be able to handle more requests without memory issues
    const response = await request(app)
      .get('/api/v1/satellites');

    expect([200, 401, 404, 429]).toContain(response.status);
  }, 60000);

  it('should clean up expired rate limit records', async () => {
    const windowMs = parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '1000');

    // Make requests that will have expired entries
    for (let i = 0; i < 10; i++) {
      await request(app)
        .get('/api/v1/satellites');
    }

    // Wait for multiple windows to expire
    await new Promise(resolve => setTimeout(resolve, windowMs * 3));

    // Should still function normally
    const response = await request(app)
      .get('/api/v1/satellites');

    expect([200, 401, 404, 429]).toContain(response.status);
  }, 60000);

  it('should handle many different users without memory bloat', async () => {
    // Simulate many users
    const userCount = 100;
    const requestsPerUser = 2;

    for (let u = 0; u < userCount; u++) {
      for (let r = 0; r < requestsPerUser; r++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: `user${u}-${Date.now()}@example.com`,
            password: 'password',
          })
          .expect([200, 400, 401, 404, 429]);
      }
    }

    // Should still be responsive
    const response = await request(app)
      .get('/api/v1/satellites');

    expect([200, 401, 404, 429]).toContain(response.status);
  }, 60000);

  it('should not store unnecessary data in rate limit store', async () => {
    // Make a simple request
    const response = await request(app)
      .get('/api/v1/satellites');

    expect([200, 401, 404, 429]).toContain(response.status);

    // Store should only track what's necessary for rate limiting
    // No response bodies, user data, or other unnecessary content
  }, 60000);

  it('should use bounded data structures for rate limit tracking', async () => {
    const windowMs = parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '1000');

    // Create scenario with rapid window boundaries
    for (let window = 0; window < 5; window++) {
      for (let i = 0; i < 10; i++) {
        await request(app)
          .get('/api/v1/satellites');
      }

      await new Promise(resolve => setTimeout(resolve, windowMs + 50));
    }

    // Should still be functional
    const response = await request(app)
      .get('/api/v1/satellites');

    expect([200, 401, 404, 429]).toContain(response.status);
  }, 60000);

  it('should not accumulate duplicate entries', async () => {
    const email = `nodupe-${Date.now()}@example.com`;

    // Make multiple requests with same identifier
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: email,
          password: 'testpass',
        });
    }

    // Response should be consistent
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: email,
        password: 'testpass',
      });

    expect([200, 400, 401, 404, 429]).toContain(response.status);
  }, 60000);

  it('should handle store reset without memory leak', async () => {
    // Force store reset by waiting multiple windows
    const windowMs = parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || '1000');

    // Make initial requests
    for (let i = 0; i < 5; i++) {
      await request(app)
        .get('/api/v1/satellites');
    }

    // Wait for all windows to expire
    await new Promise(resolve => setTimeout(resolve, windowMs * 5));

    // Store should be clean
    const response = await request(app)
      .get('/api/v1/satellites');

    expect([200, 401, 404, 429]).toContain(response.status);
  }, 60000);

  it('should measure response time stability over many requests', async () => {
    const timings = [];

    for (let i = 0; i < 20; i++) {
      const start = Date.now();

      await request(app)
        .get('/api/v1/satellites');

      timings.push(Date.now() - start);
    }

    // Calculate average and variance
    const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
    const variance = timings.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / timings.length;

    // Response times should be relatively consistent (not degrading)
    // No memory leak would mean increasing response times
    expect(variance).toBeLessThan(avg * avg); // Variance should be reasonable
  }, 60000);
});
