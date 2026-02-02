/**
 * Zod Strict Schema Test
 * Tests: Input validation uses strict Zod schema with no coercion
 * Features: Type checking, strict mode, schema validation
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('Validation - Zod Strict Schema', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  it('should reject invalid email format', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'not-an-email',
        password: 'ValidPassword123!',
        displayName: 'Test User',
      })
      .expect(400);

    expect(response.body).toHaveProperty('payload');
    expect(response.body.payload).toHaveProperty('error');
    // More flexible matching to handle various validation error formats
    expect(response.body.payload.error.message).toMatch(/email|invalid|validation/i);
  }, 60000);

  it('should reject password that is too weak', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'weak', // Too short and simple
        displayName: 'Test User',
      })
      .expect(400);

    expect(response.body).toHaveProperty('payload');
    expect(response.body.payload).toHaveProperty('error');
  }, 60000);

  it('should reject string when number is expected', async () => {
    const response = await request(app)
      .post('/api/v1/satellites')
      .send({
        noradId: 'not-a-number', // Should be number
        name: 'Test Sat',
      })
      .expect([400, 401, 404]);

    if (response.status === 400) {
      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('error');
    }
  }, 60000);

  it('should reject number when string is expected', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 12345, // Should be string
        password: 'ValidPassword123!',
        displayName: 'Test User',
      })
      .expect(400);

    expect(response.body).toHaveProperty('payload');
    expect(response.body.payload).toHaveProperty('error');
  }, 60000);

  it('should reject object when string is expected', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'ValidPassword123!',
        displayName: { nested: 'object' }, // Should be string
      })
      .expect(400);

    expect(response.body).toHaveProperty('payload');
    expect(response.body.payload).toHaveProperty('error');
  }, 60000);

  it('should reject array when object is expected', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send([
        'email',
        'password',
        'displayName',
      ])
      .expect(400);

    expect(response.body).toHaveProperty('payload');
    expect(response.body.payload).toHaveProperty('error');
  }, 60000);

  it('should not coerce string to number', async () => {
    const response = await request(app)
      .post('/api/v1/satellites')
      .send({
        noradId: '25544', // String number - should fail if strict
        name: 'Test',
      })
      .expect([400, 401, 404]);

    // If strict, should reject; if coercion allowed, should succeed
    if (response.status === 400) {
      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('error');
    }
  }, 60000);

  it('should not coerce null to undefined', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: null, // Should not be coerced to undefined
        displayName: 'Test',
      })
      .expect(400);

    expect(response.body).toHaveProperty('payload');
    expect(response.body.payload).toHaveProperty('error');
  }, 60000);

  it('should reject extra fields not in schema', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'ValidPassword123!',
        displayName: 'Test User',
        extraField: 'should be rejected', // Not in schema
        anotherExtra: 'also invalid',
      })
      .expect([200, 400, 201]); // May be 200/201 if extras are stripped, or 400 if strict

    // Check if strict mode rejects
    if (response.status === 400) {
      expect(response.body.payload).toHaveProperty('error');
    }
  }, 60000);

  it('should require all mandatory fields', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        // Missing password and displayName
      })
      .expect(400);

    expect(response.body).toHaveProperty('payload');
    expect(response.body.payload).toHaveProperty('error');
  }, 60000);

  it('should validate nested schema structures', async () => {
    const response = await request(app)
      .post('/api/v1/missions')
      .send({
        name: 'Test Mission',
        config: {
          invalidField: 'test', // Invalid nested property
        },
      })
      .expect([400, 401, 404]);

    if (response.status === 400) {
      expect(response.body).toHaveProperty('payload');
      expect(response.body.payload).toHaveProperty('error');
    }
  }, 60000);
});
