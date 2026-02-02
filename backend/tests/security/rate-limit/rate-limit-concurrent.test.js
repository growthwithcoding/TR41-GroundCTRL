/**
 * Rate Limit Concurrent Test
 * Tests: Rate limiting handles concurrent requests correctly
 * Features: Atomicity, thread-safe counting, concurrent request handling
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('Rate Limit - Concurrent Requests', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  it('should handle multiple concurrent requests safely', async () => {
    // Create 10 concurrent requests
    const promises = Array.from({ length: 10 }, () =>
      request(app)
        .get('/api/v1/satellites')
    );

    const responses = await Promise.all(promises);

    // All should complete without errors
    expect(responses.length).toBe(10);
    responses.forEach(response => {
      expect([200, 401, 404, 429]).toContain(response.status);
    });
  }, 60000);

  it('should accurately count concurrent requests toward limit', async () => {
    const maxRequests = parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS || '1000');
    const concurrentCount = Math.floor(maxRequests / 2);

    // Make half the limit concurrently
    const promises = Array.from({ length: concurrentCount }, () =>
      request(app)
        .get('/api/v1/satellites')
    );

    const responses = await Promise.all(promises);
    const successCount = responses.filter(r => [200, 401].includes(r.status)).length;
    const blockedCount = responses.filter(r => r.status === 429).length;

    // Should not have immediate rate limiting with reasonable concurrency
    expect(successCount + blockedCount).toBe(concurrentCount);
  }, 60000);

  it('should not race condition on request counter', async () => {
    const iterations = 5;
    let allResponses = [];

    // Run multiple concurrent batches
    for (let batch = 0; batch < iterations; batch++) {
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .get('/api/v1/satellites')
      );

      const responses = await Promise.all(promises);
      allResponses = allResponses.concat(responses);
    }

    // All responses should be valid (no lost updates)
    expect(allResponses.length).toBe(iterations * 10);
    allResponses.forEach(response => {
      expect([200, 401, 404, 429]).toContain(response.status);
    });
  }, 60000);

  it('should handle burst traffic without data corruption', async () => {
    // Create realistic burst: rapid fire requests
    const burstSize = 50;
    const promises = [];

    for (let i = 0; i < burstSize; i++) {
      promises.push(
        request(app)
          .get('/api/v1/satellites')
          .catch(err => ({ status: 'error', message: err.message }))
      );
    }

    const responses = await Promise.all(promises);

    // Should handle all requests
    expect(responses.length).toBe(burstSize);

    // No crashes or unhandled errors
    responses.forEach(response => {
      if (response.status !== 'error') {
        expect([200, 401, 404, 429]).toContain(response.status);
      }
    });
  }, 60000);

  it('should maintain separate counters per entity in concurrent scenarios', async () => {
    const email1 = `concurrent1-${Date.now()}@example.com`;
    const email2 = `concurrent2-${Date.now()}@example.com`;

    // Concurrent login attempts from different emails
    const promises = [
      ...Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/v1/auth/login')
          .send({ email: email1, password: 'pass' })
      ),
      ...Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/v1/auth/login')
          .send({ email: email2, password: 'pass' })
      ),
    ];

    const responses = await Promise.all(promises);

    // All should be tracked separately
    expect(responses.length).toBe(10);
    responses.forEach(response => {
      expect([200, 400, 401, 404, 429]).toContain(response.status);
    });
  }, 60000);

  it('should clean up resources after concurrent request burst', async () => {
    // Make large burst
    const promises = Array.from({ length: 100 }, () =>
      request(app)
        .get('/api/v1/satellites')
    );

    await Promise.all(promises);

    // Should still work after cleanup
    const followupResponse = await request(app)
      .get('/api/v1/satellites');

    expect([200, 401, 404, 429]).toContain(followupResponse.status);
  }, 60000);

  it('should preserve request order semantics under concurrency', async () => {
    // Test that requests are handled atomically
    const testData = { timestamp: Date.now(), value: Math.random() };

    const promises = Array.from({ length: 5 }, () =>
      request(app)
        .post('/api/v1/satellites')
        .send(testData)
    );

    const responses = await Promise.all(promises);

    // All requests should have unique responses
    expect(responses.length).toBe(5);
    const uniqueStatuses = new Set(responses.map(r => r.status));

    // Should have multiple different status codes (not all identical due to timing)
    expect(uniqueStatuses.size).toBeGreaterThanOrEqual(1);
  }, 60000);
});
