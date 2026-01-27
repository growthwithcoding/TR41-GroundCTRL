/**
 * Injection Attack Prevention Tests
 * Tests: SEC-001, SEC-004, AI-004
 */

const request = require('supertest');

describe('Injection Prevention - Security Tests', () => {
  let app;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    app = require('../../src/app');
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

  describe('SEC-004, AI-004: Payload Size and XSS Prevention', () => {
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
});
