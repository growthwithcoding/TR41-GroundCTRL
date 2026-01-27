/**
 * Integration Tests for Satellite API Endpoints
 * Uses SuperTest for HTTP assertions
 */

const request = require('supertest');
const { v4: uuidv4 } = require('uuid');

describe('Satellite API - Integration Tests', () => {
  let app;
  let authToken;
  let testSatelliteId;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    
    app = require('../../../src/app');

    // Create a test user and get auth token
    const userData = {
      email: `test-sat-${uuidv4()}@example.com`,
      password: 'TestPassword123!',
      callSign: `SAT-USER-${Date.now()}`,
    };

    const response = await request(app)
      .post('/api/v1/users')
      .send(userData);

    authToken = response.body.payload.data.token;
  });

  describe('POST /api/v1/satellites - Create Satellite', () => {
    it('should create a new satellite successfully', async () => {
      const satelliteData = {
        name: `TestSat-${Date.now()}`,
        status: 'active',
        orbit: 'LEO',
        position: { x: 100, y: 200, z: 300 },
      };

      const response = await request(app)
        .post('/api/v1/satellites')
        .set('Authorization', `Bearer ${authToken}`)
        .send(satelliteData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject({
        payload: {
          data: expect.objectContaining({
            id: expect.any(String),
            name: satelliteData.name,
            status: satelliteData.status,
          }),
        },
      });

      testSatelliteId = response.body.payload.data.id;
    });

    it('should reject satellite creation without auth', async () => {
      const satelliteData = {
        name: 'UnauthorizedSat',
        status: 'active',
      };

      await request(app)
        .post('/api/v1/satellites')
        .send(satelliteData)
        .expect(401);
    });

    it('should reject satellite with invalid data', async () => {
      const invalidData = {
        name: '', // Empty name should fail validation
        status: 'invalid-status',
      };

      await request(app)
        .post('/api/v1/satellites')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/v1/satellites - List Satellites', () => {
    it('should retrieve list of satellites', async () => {
      const response = await request(app)
        .get('/api/v1/satellites')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        payload: {
          data: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
            }),
          ]),
        },
      });
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/satellites?limit=10&offset=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.payload.data).toBeInstanceOf(Array);
      expect(response.body.payload.data.length).toBeLessThanOrEqual(10);
    });

    it('should filter satellites by status', async () => {
      const response = await request(app)
        .get('/api/v1/satellites?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.payload.data.length > 0) {
        response.body.payload.data.forEach(satellite => {
          expect(satellite.status).toBe('active');
        });
      }
    });
  });

  describe('GET /api/v1/satellites/:id - Get Satellite Details', () => {
    it('should retrieve satellite by ID', async () => {
      if (!testSatelliteId) {
        const satelliteData = {
          name: `TestSat-${Date.now()}`,
          status: 'active',
        };

        const createResponse = await request(app)
          .post('/api/v1/satellites')
          .set('Authorization', `Bearer ${authToken}`)
          .send(satelliteData)
          .expect(201);

        testSatelliteId = createResponse.body.payload.data.id;
      }

      const response = await request(app)
        .get(`/api/v1/satellites/${testSatelliteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.payload.data).toMatchObject({
        id: testSatelliteId,
        name: expect.any(String),
      });
    });

    it('should return 404 for non-existent satellite', async () => {
      await request(app)
        .get('/api/v1/satellites/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/satellites/:id - Update Satellite', () => {
    it('should update satellite status', async () => {
      if (!testSatelliteId) {
        const satelliteData = {
          name: `TestSat-${Date.now()}`,
          status: 'active',
        };

        const createResponse = await request(app)
          .post('/api/v1/satellites')
          .set('Authorization', `Bearer ${authToken}`)
          .send(satelliteData)
          .expect(201);

        testSatelliteId = createResponse.body.payload.data.id;
      }

      const updateData = {
        status: 'maintenance',
      };

      const response = await request(app)
        .put(`/api/v1/satellites/${testSatelliteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.payload.data.status).toBe('maintenance');
    });
  });

  describe('DELETE /api/v1/satellites/:id - Delete Satellite', () => {
    it('should delete satellite successfully', async () => {
      // Create a satellite to delete
      const satelliteData = {
        name: `DeleteSat-${Date.now()}`,
        status: 'inactive',
      };

      const createResponse = await request(app)
        .post('/api/v1/satellites')
        .set('Authorization', `Bearer ${authToken}`)
        .send(satelliteData)
        .expect(201);

      const satelliteId = createResponse.body.payload.data.id;

      await request(app)
        .delete(`/api/v1/satellites/${satelliteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/v1/satellites/${satelliteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/satellites/:id/command - Send Command', () => {
    it('should send command to satellite', async () => {
      if (!testSatelliteId) {
        const satelliteData = {
          name: `TestSat-${Date.now()}`,
          status: 'active',
        };

        const createResponse = await request(app)
          .post('/api/v1/satellites')
          .set('Authorization', `Bearer ${authToken}`)
          .send(satelliteData)
          .expect(201);

        testSatelliteId = createResponse.body.payload.data.id;
      }

      const commandData = {
        command: 'ADJUST_ORBIT',
        parameters: { altitude: 500 },
      };

      const response = await request(app)
        .post(`/api/v1/satellites/${testSatelliteId}/command`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commandData)
        .expect(200);

      expect(response.body.payload.data).toMatchObject({
        status: expect.any(String),
        commandId: expect.any(String),
      });
    });
  });
});
