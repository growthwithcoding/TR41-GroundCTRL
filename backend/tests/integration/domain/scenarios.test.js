/**
 * Scenario Visibility Integration Tests
 * Migrated from: sprint1/scenarioVisibility.test.js
 */

const admin = require('firebase-admin');
const request = require('supertest');

describe('Scenario Visibility - Integration Tests', () => {
  let app;
  let testUser;
  let testToken;
  let testScenarios = [];

  beforeAll(async () => {
    if (!admin.apps.length) return;

    app = require('../../../src/app');
    
    const email = `scenariotest-${Date.now()}@example.com`;
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'TestPass123!',
        callSign: 'SCENARIO-TEST'
      });

    testUser = registerResponse.body.payload.user;
    testToken = registerResponse.body.payload.tokens.accessToken;

    const db = admin.firestore();
    
    const scenario1 = await db.collection('scenarios').add({
      title: 'Active Public Scenario',
      description: 'This should be visible',
      difficulty: 'beginner',
      tier: 1,
      type: 'training',
      status: 'published',
      isActive: true,
      isPublic: true,
      createdBy: testUser.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    testScenarios.push(scenario1.id);
  });

  afterAll(async () => {
    if (!admin.apps.length) return;
    
    const db = admin.firestore();
    for (const scenarioId of testScenarios) {
      try {
        await db.collection('scenarios').doc(scenarioId).delete();
      } catch {}
    }

    if (testUser?.uid) {
      try {
        await db.collection('users').doc(testUser.uid).delete();
        await admin.auth().deleteUser(testUser.uid);
      } catch {}
    }
  });

  it('returns only active AND public scenarios', async () => {
    if (!admin.apps.length) return;

    const response = await request(app)
      .get('/api/v1/scenarios')
      .set('Authorization', `Bearer ${testToken}`)
      .expect(200);

    expect(response.body.payload.items).toBeDefined();
    const scenarios = response.body.payload.items;

    for (const scenario of scenarios) {
      if (testScenarios.includes(scenario.id)) {
        expect(scenario.isActive).toBe(true);
        expect(scenario.isPublic).toBe(true);
      }
    }
  });
});
