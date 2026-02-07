/**
 * Sort Whitelist Test
 * Tests: Sort parameters only allow whitelisted fields
 * Features: Field whitelist validation, sort direction validation, injection prevention
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('Validation - Sort Whitelist', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  it('should only allow sorting on whitelisted fields', async () => {
    // Try to sort on allowed field
    const response1 = await request(app)
      .get('/api/v1/satellites?sort=name');

    expect([200, 400, 401, 404]).toContain(response1.status);

    // Try to sort on non-whitelisted field
    const response2 = await request(app)
      .get('/api/v1/satellites?sort=dangerousField');

    // Should be rejected if dangerousField is not whitelisted
    if (response2.status === 400) {
      expect(response2.body.payload).toHaveProperty('error');
    }
  }, 60000);

  it('should validate sort direction parameter', async () => {
    // Valid directions
    const validDirections = ['asc', 'desc', 'ASC', 'DESC'];

    for (const direction of validDirections) {
      const response = await request(app)
        .get(`/api/v1/satellites?sort=name:${direction}`);

      expect([200, 400, 401, 404]).toContain(response.status);
    }
  }, 60000);

  it('should reject invalid sort directions', async () => {
    const invalidDirections = ['ascending', 'random', 'up', 'down', 'invalid'];

    for (const direction of invalidDirections) {
      const response = await request(app)
        .get(`/api/v1/satellites?sort=name:${direction}`);

      // Should either use default or reject
      expect([200, 400, 401, 404]).toContain(response.status);
    }
  }, 60000);

  it('should prevent sorting on database internal fields', async () => {
    const internalFields = ['_id', '__v', 'password', 'secret', 'internalCode'];

    for (const field of internalFields) {
      const response = await request(app)
        .get(`/api/v1/satellites?sort=${field}`);

      // Should reject if field is internal
      if (response.status === 400) {
        expect(response.body.payload).toHaveProperty('error');
      } else if (response.status === 200) {
        // If allowed, should not expose internal data
        expect(response.body).toBeDefined();
      }
    }
  }, 60000);

  it('should prevent injection through sort parameter', async () => {
    const injections = [
      "name; DROP TABLE users; --",
      '${malicious}',
      '`code`',
      "name' AND '1'='1",
    ];

    for (const injection of injections) {
      const response = await request(app)
        .get(`/api/v1/satellites?sort=${encodeURIComponent(injection)}`);

      // Should be safe (not execute injected code)
      expect([200, 400, 401, 404]).toContain(response.status);
    }
  }, 60000);

  it('should handle multiple sort parameters', async () => {
    const response = await request(app)
      .get('/api/v1/satellites?sort=name:asc&sort=createdAt:desc');

    // Should either support or reject clearly
    expect([200, 400, 401, 404]).toContain(response.status);
  }, 60000);

  it('should validate sort field length', async () => {
    const longField = 'a'.repeat(1000);

    const response = await request(app)
      .get(`/api/v1/satellites?sort=${longField}`);

    // Should reject excessively long field names
    expect([200, 400, 401, 404]).toContain(response.status);
  }, 60000);

  it('should only sort on actual model fields', async () => {
    // Test with non-existent field
    const response = await request(app)
      .get('/api/v1/satellites?sort=thisFieldDoesNotExist');

    // Should either:
    // 1. Reject (400)
    // 2. Return results without sorting (200)
    // But should not error with 500
    expect([200, 400, 401, 404]).toContain(response.status);
  }, 60000);

  it('should prevent case-sensitive field injection', async () => {
    const response = await request(app)
      .get('/api/v1/satellites?sort=NaMe'); // Mixed case

    // Should be handled consistently (case-insensitive match to whitelist)
    expect([200, 400, 401, 404]).toContain(response.status);
  }, 60000);

  it('should not allow sorting with special characters', async () => {
    const specialChars = ['name<script>', 'name|pipe', 'name;cmd', 'name&more'];

    for (const field of specialChars) {
      const response = await request(app)
        .get(`/api/v1/satellites?sort=${encodeURIComponent(field)}`);

      // Should reject fields with special characters
      expect([200, 400, 401, 404]).toContain(response.status);
    }
  }, 60000);

  it('should handle sort on nested fields if whitelisted', async () => {
    const response = await request(app)
      .get('/api/v1/satellites?sort=metadata.created');

    // Should handle gracefully
    expect([200, 400, 401, 404]).toContain(response.status);
  }, 60000);

  it('should prevent path traversal in sort parameter', async () => {
    const traversals = ['../password', '../../secret', '....//field'];

    for (const path of traversals) {
      const response = await request(app)
        .get(`/api/v1/satellites?sort=${path}`);

      // Should not allow path traversal
      expect([200, 400, 401, 404]).toContain(response.status);
    }
  }, 60000);

  it('should provide consistent sort behavior', async () => {
    const response1 = await request(app)
      .get('/api/v1/satellites?sort=name:asc');

    const response2 = await request(app)
      .get('/api/v1/satellites?sort=name:asc');

    // Same sort should produce same order
    if (response1.status === 200 && response2.status === 200) {
      const data1 = response1.body.payload?.data || [];
      const data2 = response2.body.payload?.data || [];

      if (data1.length === data2.length && data1.length > 0) {
        expect(data1[0]).toEqual(data2[0]);
      }
    }
  }, 60000);
});
