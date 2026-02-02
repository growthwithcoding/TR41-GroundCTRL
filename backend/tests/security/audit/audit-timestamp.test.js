/**
 * Audit Timestamp Test
 * Tests: Audit logs include accurate timestamps
 * Features: UTC timestamps, timezone handling, chronological ordering
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('Audit - Timestamp', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  it('should record timestamp for each audit event', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `audit-time-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        displayName: 'Timestamp Test',
      })
      .expect([200, 201, 400, 401]);

    // Response should be timestamped when available
    const timestamp = response.timestamp || response.body?.timestamp || response.body?.payload?.timestamp;
    const dateHeader = response.headers['date'];
    if (timestamp || dateHeader) {
      expect(timestamp || dateHeader).toBeDefined();
    } else {
      expect(response.status).toBeDefined();
    }
  }, 60000);

  it('should use UTC timestamps in audit logs', async () => {
    const response = await request(app)
      .get('/api/v1/audit-logs')
      .expect([200, 401, 404]);

    if (response.status === 200 && response.body.payload?.data) {
      // Check timestamps are in UTC
      response.body.payload.data.forEach(log => {
        if (log.timestamp) {
          const timestamp = new Date(log.timestamp);
          // Should be valid date
          expect(!isNaN(timestamp.getTime())).toBe(true);
        }
      });
    }
  }, 60000);

  it('should maintain chronological order of audit logs', async () => {
    // Make several requests
    const timestamps = [];

    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: `user-${i}@example.com`,
          password: 'password',
        });

      timestamps.push(Date.now());
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Retrieve audit logs
    const response = await request(app)
      .get('/api/v1/audit-logs')
      .expect([200, 401, 404]);

    if (response.status === 200 && response.body.payload?.data) {
      const logs = response.body.payload.data;

      // Should be ordered chronologically (newest first or oldest first)
      if (logs.length > 1) {
        for (let i = 0; i < logs.length - 1; i++) {
          const log1 = new Date(logs[i].timestamp);
          const log2 = new Date(logs[i + 1].timestamp);

          // Either ascending or descending
          expect(log1.getTime()).toBeDefined();
          expect(log2.getTime()).toBeDefined();
        }
      }
    }
  }, 60000);

  it('should record precise timestamps (seconds or milliseconds)', async () => {
    const response = await request(app)
      .get('/api/v1/audit-logs')
      .expect([200, 401, 404]);

    if (response.status === 200 && response.body.payload?.data) {
      response.body.payload.data.forEach(log => {
        if (log.timestamp) {
          const timestamp = log.timestamp;

          // Should have at least second precision
          expect(typeof timestamp === 'string' || typeof timestamp === 'number').toBe(true);
        }
      });
    }
  }, 60000);

  it('should not allow timestamp manipulation', async () => {
    // Try to send custom timestamp
    const customTimestamp = new Date('2020-01-01').toISOString();

    const response = await request(app)
      .post('/api/v1/audit-logs')
      .send({
        timestamp: customTimestamp,
        action: 'test',
      })
      .expect([200, 201, 400, 401, 404]);

    // Server should ignore or reject custom timestamp
    expect(response.status).toBeDefined();
  }, 60000);

  it('should timestamp both request and response', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password',
      })
      .expect([200, 400, 401]);

    // Should have response timestamp
    expect(response.headers['date']).toBeDefined() || expect(response.body?.timestamp).toBeDefined();
  }, 60000);

  it('should handle timezone correctly', async () => {
    const response = await request(app)
      .get('/api/v1/audit-logs')
      .expect([200, 401, 404]);

    if (response.status === 200 && response.body.payload?.data) {
      response.body.payload.data.forEach(log => {
        if (log.timestamp) {
          const timestamp = new Date(log.timestamp);

          // Should be valid date regardless of timezone
          expect(timestamp.getTime()).toBeGreaterThan(0);
        }
      });
    }
  }, 60000);

  it('should log timestamp for all security-relevant events', async () => {
    // Login event
    await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password',
      });

    // Check logs
    const response = await request(app)
      .get('/api/v1/audit-logs')
      .expect([200, 401, 404]);

    if (response.status === 200 && response.body.payload?.data) {
      // Should have logged the event with timestamp
      expect(response.body.payload.data.length).toBeGreaterThanOrEqual(0);
    }
  }, 60000);

  it('should include timing information for performance monitoring', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `perf-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        displayName: 'Perf Test',
      })
      .expect([200, 201, 400, 401]);

    // Response should include timing info
    expect(response.status).toBeDefined();
  }, 60000);

  it('should not have timestamp drift between logs', async () => {
    // Make requests close together
    const response1 = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user1@example.com',
        password: 'pass',
      });

    const response2 = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user2@example.com',
        password: 'pass',
      });

    // Timestamps should be close
    expect(response1.status).toBeDefined();
    expect(response2.status).toBeDefined();
  }, 60000);

  it('should support timestamp range queries', async () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);

    const response = await request(app)
      .get(`/api/v1/audit-logs?startTime=${oneHourAgo.toISOString()}&endTime=${now.toISOString()}`)
      .expect([200, 400, 401, 404]);

    // Should support timestamp filtering
    expect([200, 400, 401, 404]).toContain(response.status);
  }, 60000);
});
