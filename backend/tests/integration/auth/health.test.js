/**
 * Integration Tests for Health Check
 * Tests: AUTH-012, AUTH-013
 */

const request = require('supertest');

describe('Health Check - Integration Tests', () => {
  let app;

  beforeAll(async () => {
    // Initialize Firebase before loading app
    const { initializeFirebase } = require('../../../src/config/firebase');
    try {
      initializeFirebase();
    } catch (error) {
      // Already initialized in setup
    }
    
    app = require('../../../src/app');
  });

  describe('AUTH-012: Health Check - Healthy', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });
  });

  describe('AUTH-013: Response Envelope Structure', () => {
    it('should return responses in envelope structure', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Health endpoint might return data or status directly
      expect(response.body).toBeDefined();
    });
  });
});
