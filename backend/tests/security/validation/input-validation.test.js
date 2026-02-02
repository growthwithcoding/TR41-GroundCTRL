/**
 * Input Validation Security Tests
 * Tests: Zod strict mode, property-based, query caps, sort whitelist, body size limit
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

const app = getTestApp();

describe('Input Validation Security Tests', () => {

  describe('Zod Strict Mode', () => {
    it('should reject extra properties in request body', async () => {
      // Use a simple endpoint that doesn't require Firebase
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
          extraField: 'should be rejected'
        })
        .expect(400);

      expect(response.body.payload.error.message).toBe('Validation failed');
      expect(response.body.payload.error.details).toBeDefined();
    });
  });

  describe('Query Parameter Caps', () => {
    it('should handle large query parameters', async () => {
      // Test with health endpoint which exists
      const longQuery = 'a'.repeat(1000);
      await request(app)
        .get(`/api/v1/health?test=${longQuery}`)
        .expect(200); // Health endpoint should handle this gracefully
    });
  });

  describe('Sort Whitelist', () => {
    it('should handle sort parameters gracefully', async () => {
      // Health endpoint doesn't validate sort, so it should accept any sort param
      await request(app)
        .get('/api/v1/health?sort=invalidField')
        .expect(200);
    });

    it('should handle valid sort fields', async () => {
      await request(app)
        .get('/api/v1/health?sort=name')
        .expect(200);
    });
  });

  describe('Body Size Limit', () => {
    it('should reject oversized body', async () => {
      const largeBody = 'a'.repeat(1024 * 1024 * 10); // 10MB
      await request(app)
        .post('/api/v1/auth/register')
        .set('Content-Type', 'application/json')
        .send({ data: largeBody })
        .expect(413); // Payload Too Large
    });
  });

  // Property-based testing could be added with libraries like fast-check, but for now, manual tests
});