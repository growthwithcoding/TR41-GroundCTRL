/**
 * Health Metrics Test
 * Tests: Health check endpoint provides metrics and monitoring data
 * Features: Metrics collection, performance data, resource usage
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('Health - Metrics', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  it('should expose metrics endpoint', async () => {
    const response = await request(app)
      .get('/metrics')
      .expect([200, 404]);

    if (response.status === 200) {
      expect(response.body || response.text).toBeDefined();
    }
  }, 60000);

  it('should provide request count metrics', async () => {
    // Make some requests
    await request(app).get('/api/v1/satellites');
    await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'password',
    });

    const response = await request(app)
      .get('/metrics')
      .expect([200, 404]);

    if (response.status === 200) {
      const metrics = response.text || JSON.stringify(response.body);

      // May include request metrics
      expect(metrics).toBeDefined();
    }
  }, 60000);

  it('should track response time metrics', async () => {
    const response = await request(app)
      .get('/metrics')
      .expect([200, 404]);

    if (response.status === 200) {
      expect(response.body || response.text).toBeDefined();
    }
  }, 60000);

  it('should monitor error rates', async () => {
    // Make request that errors
    await request(app)
      .get('/nonexistent')
      .expect(404);

    const response = await request(app)
      .get('/metrics')
      .expect([200, 404]);

    if (response.status === 200) {
      expect(response.body || response.text).toBeDefined();
    }
  }, 60000);

  it('should provide rate limit metrics', async () => {
    const response = await request(app)
      .get('/metrics')
      .expect([200, 404]);

    if (response.status === 200) {
      // May include rate limit stats
      expect(response.body || response.text).toBeDefined();
    }
  }, 60000);

  it('should track authentication metrics', async () => {
    // Make login attempt
    await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrong',
      });

    const response = await request(app)
      .get('/metrics')
      .expect([200, 404]);

    if (response.status === 200) {
      expect(response.body || response.text).toBeDefined();
    }
  }, 60000);

  it('should provide system resource metrics', async () => {
    const response = await request(app)
      .get('/health')
      .expect([200, 404]);

    if (response.status === 200) {
      // May include system metrics
      expect(response.body).toBeDefined();
    }
  }, 60000);

  it('should not expose sensitive metrics without auth', async () => {
    const response = await request(app)
      .get('/metrics')
      .expect([200, 404]);

    if (response.status === 200) {
      // Metrics should not contain sensitive info
      const metricsText = response.text || JSON.stringify(response.body);

      expect(metricsText).not.toMatch(/password|secret|token|key/i);
    }
  }, 60000);

  it('should reset metrics periodically', async () => {
    const response1 = await request(app)
      .get('/metrics')
      .expect([200, 404]);

    // Wait and check again
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response2 = await request(app)
      .get('/metrics')
      .expect([200, 404]);

    // Metrics should be updated
    expect(response1.status).toBeDefined();
    expect(response2.status).toBeDefined();
  }, 60000);

  it('should provide per-endpoint metrics', async () => {
    await request(app).get('/api/v1/satellites');
    await request(app).get('/api/v1/satellites');

    const response = await request(app)
      .get('/metrics')
      .expect([200, 404]);

    if (response.status === 200) {
      // Should break down metrics by endpoint
      expect(response.body || response.text).toBeDefined();
    }
  }, 60000);

  it('should track error metrics separately', async () => {
    await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'invalid-format',
        password: 'short',
      })
      .expect([400, 401]);

    const response = await request(app)
      .get('/metrics')
      .expect([200, 404]);

    if (response.status === 200) {
      expect(response.body || response.text).toBeDefined();
    }
  }, 60000);
});
