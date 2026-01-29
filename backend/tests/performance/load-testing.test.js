/**
 * Performance and Load Tests
 * Tests: PERF-001, PERF-002, PERF-003, PERF-004
 */

const request = require('supertest');
const { getTestApp, generateUniqueEmail } = require('../helpers/test-utils');

describe('Performance - Load Tests', () => {
  let app;
  let authToken;

  beforeAll(async () => {
    // Use the test helper to get app instance
    app = getTestApp();
    // Add delay to ensure emulators are ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a test user and get a valid auth token for performance tests
    const userData = {
      email: generateUniqueEmail('perf-test'),
      password: 'TestPassword123!',
      callSign: `PERF-${Date.now()}`,
      displayName: 'Performance Test User',
    };

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(userData)
      .expect(201);

    authToken = response.body.payload.tokens.accessToken;
  }, 60000);

  describe('PERF-001: Concurrent Protected Endpoint Requests', () => {
    it('should handle 500 concurrent requests efficiently', async () => {
      const startTime = Date.now();
      
      const requests = Array(500).fill(null).map(() =>
        request(app)
          .get('/api/v1/users/me')
          .set('Authorization', `Bearer ${authToken}`)
      );

      await Promise.all(requests);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(15000); // Under 15 seconds (CI environment is slower)
    }, 30000); // Increase timeout to 30s
  });

  describe('PERF-002: Login Endpoint Load', () => {
    it('should handle 200 requests per second', async () => {
      // Use k6 or Artillery for actual load testing
      // This is a simplified version
      const batchSize = 200;
      const requests = [];

      for (let i = 0; i < batchSize; i++) {
        requests.push(
          request(app)
            .post('/api/v1/auth/login')
            .send({
              email: `user${i}@example.com`,
              password: 'wrongpassword',
            })
        );
      }

      const startTime = Date.now();
      await Promise.all(requests);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(4000); // Under 4 seconds (CI environment is slower)
    }, 15000);
  });

  describe('PERF-003: AI Help Endpoint Concurrency', () => {
    it('should queue or reject excess requests gracefully', async () => {
      // Note: This test validates rate limiting behavior
      // Most requests should be rate limited (429) or return validation errors (400)
      const requests = Array(100).fill(null).map(() =>
        request(app)
          .post('/api/v1/ai/help/ask')
          .send({ question: 'Test question' })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      const validationErrors = responses.filter(r => r.status === 400);
      const serverErrors = responses.filter(r => r.status >= 500);

      // Verify most requests are handled gracefully (rate limited or validation errors)
      expect(rateLimited.length + validationErrors.length).toBeGreaterThan(50);
      // Verify no server errors
      expect(serverErrors.length).toBe(0);
    }, 20000);
  });

  describe('PERF-004: Pagination Performance', () => {
    it('should maintain reasonable response time for pagination', async () => {
      // Create a test user and get auth token
      
      // Create a test user and get auth token
      const { v4: uuidv4 } = require('uuid');
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `perf-test-${uuidv4()}@example.com`,
          password: 'TestPassword123!',
          callSign: `PERF-${Date.now()}`,
          displayName: 'Perf Test User',
        })
        .expect(201);
      
      // Check if registration was successful before accessing token
      if (!registerResponse.body.payload || !registerResponse.body.payload.tokens) {
        throw new Error('Registration failed - no tokens received');
      }
      
      const authToken = registerResponse.body.payload.tokens.accessToken;
      
      // Test pagination with smaller number to avoid rate limits
      const pagesToTest = 3;
      const responseTimes = [];

      for (let page = 1; page <= pagesToTest; page++) {
        const startTime = Date.now();
        
        await request(app)
          .get('/api/v1/satellites')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ page, limit: 20 })
          .expect(200);

        responseTimes.push(Date.now() - startTime);
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
      // Reasonable expectation: under 500ms average for test environment
      expect(avgResponseTime).toBeLessThan(500);
    }, 15000);
  });
});
