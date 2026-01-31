/**
 * Body Size Limit Test
 * Tests: SEC-XXX (Request Body Size Limit Enforcement)
 * Protects against DoS attacks via large payload submissions
 */

const request = require('supertest');
const { createTestApp } = require('../helpers/testHelpers');

describe('Body Size Limit Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('SEC-XXX: Request Body Size Limit Enforcement', () => {
    it('should accept requests under 1MB limit', async () => {
      const smallPayload = {
        email: 'test@example.com',
        password: 'TestPass123!',
        callSign: 'TEST',
        displayName: 'Test User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(smallPayload)
        .expect(201);

      expect(response.body.status).toBe('GO');
    });

    it('should reject requests over 1MB limit', async () => {
      // Create a payload larger than 1MB
      const largeData = 'x'.repeat(1024 * 1024 + 1000); // 1MB + 1KB
      const largePayload = {
        email: 'large-test@example.com',
        password: 'TestPass123!',
        callSign: 'LARGE_TEST',
        displayName: largeData // This will make the payload > 1MB
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(largePayload)
        .expect(413); // Payload Too Large

      expect(response.body.payload.error.message).toContain('too large');
    });

    it('should reject JSON payloads over 1MB', async () => {
      // Create a large JSON string
      const largeField = 'x'.repeat(1024 * 1024); // 1MB string
      const largeJsonPayload = JSON.stringify({
        email: 'json-test@example.com',
        password: 'TestPass123!',
        callSign: 'JSON_TEST',
        largeField: largeField
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send(largeJsonPayload)
        .expect(413);

      expect(response.body.payload.error.message).toContain('too large');
    });

    it('should handle edge case payloads close to 1MB', async () => {
      // Create a payload just under 1MB
      const nearLimitData = 'x'.repeat(900 * 1024); // ~900KB
      const nearLimitPayload = {
        email: 'near-limit@example.com',
        password: 'TestPass123!',
        callSign: 'NEAR_LIMIT',
        displayName: 'Near Limit User',
        extraData: nearLimitData
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(nearLimitPayload)
        .expect(201);

      expect(response.body.status).toBe('GO');
    });
  });
});