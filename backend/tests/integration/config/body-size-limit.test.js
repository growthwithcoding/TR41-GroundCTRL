/**
 * Body Size Limit Integration Tests
 * Tests: VAL-006
 * Ensures Express body parser limits payload size to prevent DoS
 */

const request = require('supertest');

describe('Body Size Limit - Integration Tests', () => {
  let app;

  beforeAll(async () => {
    // Initialize Firebase before loading app
    const { initializeFirebase } = require('../../../src/config/firebase');
    try {
      initializeFirebase();
    } catch (error) {
      // Already initialized
    }
    
    app = require('../../../src/app');
  });

  describe('VAL-006: Body Parser Size Limit', () => {
    it('rejects payloads larger than 1 MiB', async () => {
      // Create a payload larger than 1 MiB (2 MiB)
      const largePayload = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPass123!',
        // Add large data to exceed limit
        largeField: 'x'.repeat(2 * 1024 * 1024) // 2 MB string
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(largePayload);

      expect(response.status).toBe(413);
      expect(response.text).toContain('Payload Too Large');
    });

    it('accepts payloads under the limit', async () => {
      const normalPayload = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPass123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(normalPayload);

      // Should not be 413, could be 201 or validation error, but not size error
      expect(response.status).not.toBe(413);
    });
  });
});