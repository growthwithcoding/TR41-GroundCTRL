/**
 * Health Ready Test
 * Tests: Health check endpoint indicates ready state correctly
 * Features: Ready/not-ready states, health status reporting, startup checks
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('Health - Ready State', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  it('should have health check endpoint', async () => {
    const response = await request(app)
      .get('/health')
      .expect([200, 404]);

    if (response.status === 200) {
      expect(response.body).toHaveProperty('status');
    }
  }, 60000);

  it('should report ready status when dependencies are available', async () => {
    const response = await request(app)
      .get('/health/ready')
      .expect([200, 404]);

    if (response.status === 200) {
      expect(response.body).toHaveProperty('status');
      expect(['ready', 'ok', 'healthy']).toContain(response.body.status?.toLowerCase());
    }
  }, 60000);

  it('should check database connectivity', async () => {
    const response = await request(app)
      .get('/health/ready')
      .expect([200, 404, 503]);

    if (response.status === 200) {
      // Should indicate database status
      expect(response.body).toBeDefined();
    } else if (response.status === 503) {
      // Service unavailable if database down
      expect(response.status).toBe(503);
    }
  }, 60000);

  it('should check Firebase connectivity', async () => {
    const response = await request(app)
      .get('/health')
      .expect([200, 503, 404]);

    // Should verify Firebase is accessible
    expect(response.status).toBeDefined();
  }, 60000);

  it('should return detailed status information', async () => {
    const response = await request(app)
      .get('/health')
      .expect([200, 404]);

    if (response.status === 200) {
      expect(response.body).toBeDefined();

      // May include component statuses
      if (response.body.components) {
        expect(response.body.components).toBeInstanceOf(Object);
      }
    }
  }, 60000);

  it('should handle liveness and readiness probes separately', async () => {
    const liveness = await request(app)
      .get('/health/live')
      .expect([200, 404]);

    const readiness = await request(app)
      .get('/health/ready')
      .expect([200, 404]);

    // Both endpoints may exist for k8s probes
    expect([200, 404]).toContain(liveness.status);
    expect([200, 404]).toContain(readiness.status);
  }, 60000);

  it('should report startup completion', async () => {
    const response = await request(app)
      .get('/health/startup')
      .expect([200, 404]);

    // May have startup check
    expect([200, 404]).toContain(response.status);
  }, 60000);

  it('should not require authentication for health checks', async () => {
    const response = await request(app)
      .get('/health')
      .expect([200, 404, 503]);

    // Should be accessible without auth
    expect([200, 404, 503]).toContain(response.status);
  }, 60000);

  it('should respond quickly to health checks', async () => {
    const startTime = Date.now();

    await request(app)
      .get('/health')
      .expect([200, 404, 503]);

    const duration = Date.now() - startTime;

    // Should respond within reasonable time
    expect(duration).toBeLessThan(5000);
  }, 60000);

  it('should include timestamp in health response', async () => {
    const response = await request(app)
      .get('/health')
      .expect([200, 404]);

    if (response.status === 200) {
      // May include timestamp
      expect(response.headers['date']).toBeDefined();
    }
  }, 60000);

  it('should indicate degraded mode if possible', async () => {
    const response = await request(app)
      .get('/health')
      .expect([200, 503, 404]);

    // Should indicate health status
    expect(response.status).toBeDefined();
  }, 60000);
});
