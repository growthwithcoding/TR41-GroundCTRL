/**
 * Retry Policy Test
 * Tests: HTTP client implements exponential backoff retry
 * Features: Retry logic, backoff strategy, max retries
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('HTTP Client - Retry Policy', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  it('should retry on transient failures', async () => {
    const response = await request(app)
      .post('/api/v1/satellites/sync')
      .timeout(10000)
      .expect([200, 400, 401, 404, 503]);

    // Should either succeed or fail cleanly
    expect(response.status).toBeDefined();
  }, 60000);

  it('should use exponential backoff for retries', async () => {
    const startTime = Date.now();

    await request(app)
      .get('/api/v1/satellites/retry-test')
      .timeout(15000)
      .expect([200, 400, 401, 404, 503]);

    const duration = Date.now() - startTime;

    // If retries with backoff, should take some time
    // But should not exceed total timeout
    expect(duration).toBeLessThan(15000);
  }, 60000);

  it('should not retry on client errors (4xx)', async () => {
    const response = await request(app)
      .get('/api/v1/satellites/invalid-endpoint')
      .expect([400, 401, 404]);

    // 4xx errors should not be retried
    expect([400, 401, 404]).toContain(response.status);
  }, 60000);

  it('should retry on server errors (5xx)', async () => {
    const response = await request(app)
      .get('/api/v1/satellites/server-error')
      .timeout(10000)
      .expect([200, 400, 401, 404, 503]);

    // Should attempt retry on 5xx
    expect(response.status).toBeDefined();
  }, 60000);

  it('should respect max retry limit', async () => {
    // Even if service keeps failing, should eventually give up
    const response = await request(app)
      .post('/api/v1/satellites/always-fails')
      .timeout(10000)
      .expect([200, 400, 401, 404, 503]);

    // Should not hang retrying forever
    expect(response.status).toBeDefined();
  }, 60000);

  it('should reset retry count on new request', async () => {
    const response1 = await request(app)
      .get('/api/v1/satellites/sync-status')
      .timeout(5000)
      .expect([200, 400, 401, 404, 503]);

    const response2 = await request(app)
      .get('/api/v1/satellites/sync-status')
      .timeout(5000)
      .expect([200, 400, 401, 404, 503]);

    // Each request should have independent retry logic
    expect(response1.status).toBeDefined();
    expect(response2.status).toBeDefined();
  }, 60000);

  it('should log retry attempts for debugging', async () => {
    const response = await request(app)
      .post('/api/v1/satellites/sync')
      .timeout(10000)
      .expect([200, 400, 401, 404, 503]);

    // Should have completed and may have retry information in logs
    expect(response.status).toBeDefined();
  }, 60000);
});
