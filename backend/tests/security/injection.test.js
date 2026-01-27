/**
 * Security Tests for Injection Attacks
 * Tests: SEC-001, SEC-004, AI-004, SEC-007
 */

const request = require('supertest');

describe('Security - Injection Tests', () => {
  let app;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    // Initialize Firebase before loading app
    const { initializeFirebase } = require('../../../src/config/firebase');
    try {
      initializeFirebase();
    } catch (error) {
      // Already initialized in setup
    }
    app = require('../../../src/app');
  });

  describe('SEC-001: CallSign Enumeration Prevention', () => {
    it('should return 404 for callSign-based queries', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .query({ callSign: 'KNOWN' })
        .expect(404);

      expect(response.body.payload.error).toHaveProperty('message');
    });
  });

  describe('SEC-004: Payload Size Limits', () => {
    it('should reject oversized payloads', async () => {
      const largePayload = {
        question: 'A'.repeat(5000),
      };

      const response = await request(app)
        .post('/api/v1/ai/help/ask')
        .send(largePayload)
        .expect(400);

      expect(response.body.payload.error.message).toContain('length');
    });
  });

  describe('AI-004: XSS Prevention', () => {
    it('should sanitize malicious script tags', async () => {
      const maliciousPayload = {
        question: '<script>alert(1)</script>',
      };

      const response = await request(app)
        .post('/api/v1/ai/help/ask')
        .send(maliciousPayload)
        .expect(200);

      expect(response.body.payload.data.answer).not.toContain('<script>');
      expect(response.body.payload.data.answer).not.toContain('alert(1)');
    });
  });

  describe('SEC-007: Stack Trace Suppression in Production', () => {
    it('should not include stack traces in production errors', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .post('/api/v1/intentional-error-route')
        .expect(500);

      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('error');
      expect(response.body.payload.error.message).toBe('Internal server error');
      expect(response.body.payload.error).not.toHaveProperty('stack');

      process.env.NODE_ENV = originalEnv;
    });
  });
});
