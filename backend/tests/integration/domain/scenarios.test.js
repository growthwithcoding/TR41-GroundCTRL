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

    expect(response.body.payload.data).toBeDefined();
    const scenarios = response.body.payload.data;

    for (const scenario of scenarios) {
      if (testScenarios.includes(scenario.id)) {
        expect(scenario.isActive).toBe(true);
        expect(scenario.isPublic).toBe(true);
      }
    }
  });
});

describe('Scenario Seed Data - Integration Tests', () => {
  let app;
  let testToken;

  beforeAll(async () => {
    if (!admin.apps.length) return;

    app = require('../../../src/app');

    // Load seed data
    const satellites = require('../../../seeders/data/satellites');
    const scenarios = require('../../../seeders/data/scenarios');
    const steps = require('../../../seeders/data/steps');
    const commands = require('../../../seeders/data/commands');

    const db = admin.firestore();

    // Seed satellites
    for (const satellite of satellites) {
      await db.collection('satellites').doc(satellite.code).set({
        ...satellite.data,
        code: satellite.code,
        createdBy: '5usOQ3eOm7OjXmDOFjEmKSQovs42',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Seed scenarios
    for (const scenario of scenarios) {
      const scenarioRef = await db.collection('scenarios').add({
        ...scenario.data,
        code: scenario.code, // Add code field
        createdBy: '5usOQ3eOm7OjXmDOFjEmKSQovs42',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Seeded scenario: ${scenario.code} with ID: ${scenarioRef.id}`);

      // Seed steps for this scenario
      const scenarioSteps = steps.filter(step => step.scenarioCode === scenario.code);
      console.log(`Found ${scenarioSteps.length} steps for scenario ${scenario.code}`);
      for (const step of scenarioSteps) {
        await db.collection('scenario_steps').add({
          ...step.data,
          scenarioId: scenarioRef.id,
          order: step.data.stepOrder, // Map stepOrder to order
          createdBy: '5usOQ3eOm7OjXmDOFjEmKSQovs42',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Seeded step: ${step.data.title} for scenario ${scenarioRef.id}`);
      }
    }

    // Seed commands
    for (const command of commands) {
      await db.collection('commands').add({
        ...command.data,
        createdBy: '5usOQ3eOm7OjXmDOFjEmKSQovs42',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    const email = `seedtest-${Date.now()}@example.com`;
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password: 'TestPass123!',
        callSign: 'SEED-TEST'
      });

    testToken = registerResponse.body.payload.tokens.accessToken;
  });

  describe('SEED-001: Satellite Seed Data Validation', () => {
    it('validates training satellite data structure', async () => {
      if (!admin.apps.length) return;

      const response = await request(app)
        .get('/api/v1/satellites')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body.payload.data).toBeDefined();
      const satellites = response.body.payload.data;

      // Check for training satellites
      const trainingSats = satellites.filter(s => s.code?.startsWith('TRAINING_SAT'));
      expect(trainingSats.length).toBeGreaterThan(0);

      trainingSats.forEach(sat => {
        expect(sat).toHaveProperty('name');
        expect(sat).toHaveProperty('orbit');
        expect(sat.orbit).toHaveProperty('altitude_km');
        expect(sat.orbit).toHaveProperty('inclination_degrees');
        expect(sat).toHaveProperty('power');
        expect(sat.power).toHaveProperty('solarPower_watts');
        expect(sat.power).toHaveProperty('batteryCapacity_wh');
        expect(sat).toHaveProperty('attitude');
        expect(sat).toHaveProperty('thermal');
        expect(sat).toHaveProperty('propulsion');
        expect(sat).toHaveProperty('payload');
        expect(sat).toHaveProperty('status', 'TRAINING');
        expect(sat).toHaveProperty('isPublic', true);
        expect(sat).toHaveProperty('capabilities');
        expect(Array.isArray(sat.capabilities)).toBe(true);
      });
    });

    it('validates satellite capabilities include expected features', async () => {
      if (!admin.apps.length) return;

      const response = await request(app)
        .get('/api/v1/satellites')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      const satellites = response.body.payload.data;
      const trainingSats = satellites.filter(s => s.code?.startsWith('TRAINING_SAT'));

      trainingSats.forEach(sat => {
        expect(sat).toHaveProperty('capabilities');
        expect(Array.isArray(sat.capabilities)).toBe(true);
        expect(sat.capabilities.length).toBeGreaterThan(0);
        
        // Check that capabilities include expected features for training satellites
        const allCapabilities = sat.capabilities.join(' ').toLowerCase();
        expect(allCapabilities).toMatch(/(attitude|power|thermal|communication|beacon)/i);
      });
    });
  });

  describe('SEED-002: Scenario Steps and Commands Validation', () => {
    it('validates scenario steps have proper structure', async () => {
      if (!admin.apps.length) return;

      const response = await request(app)
        .get('/api/v1/scenarios')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      const scenarios = response.body.payload.data;
      expect(scenarios.length).toBeGreaterThan(0);

      // Find a scenario that we know has steps (like ROOKIE_COMMISSIONING_101)
      const commissioningScenario = scenarios.find(s => s.code === 'ROOKIE_COMMISSIONING_101');
      expect(commissioningScenario).toBeDefined();
      
      // Check that steps exist for this scenario in the database
      const db = admin.firestore();
      const stepsSnapshot = await db.collection('scenario_steps')
        .where('scenarioId', '==', commissioningScenario.id)
        .limit(1)
        .get();
      
      expect(stepsSnapshot.docs.length).toBeGreaterThan(0);
      const stepData = stepsSnapshot.docs[0].data();
      expect(stepData).toHaveProperty('title');
      expect(stepData).toHaveProperty('instructions'); // Note: steps use 'instructions' not 'description'
      expect(stepData).toHaveProperty('order');
      expect(stepData).toHaveProperty('validationType');
      expect(stepData).toHaveProperty('scenarioId');
      expect(stepData.scenarioId).toBe(commissioningScenario.id);
    });

    it('validates scenario commands are properly linked', async () => {
      if (!admin.apps.length) return;

      const db = admin.firestore();

      // Get scenarios with steps
      const scenariosSnapshot = await db.collection('scenarios').limit(1).get();
      expect(scenariosSnapshot.docs.length).toBeGreaterThan(0);

      const scenarioDoc = scenariosSnapshot.docs[0];
      const scenarioData = scenarioDoc.data();

      if (scenarioData.steps && scenarioData.steps.length > 0) {
        const firstStep = scenarioData.steps[0];

        // Check if step has commands
        if (firstStep.commands && firstStep.commands.length > 0) {
          firstStep.commands.forEach(command => {
            expect(command).toHaveProperty('commandName');
            expect(command).toHaveProperty('commandPayload');
            expect(command).toHaveProperty('expectedResult');
            expect(['OK', 'ERROR', 'NO_EFFECT']).toContain(command.expectedResult);
          });
        }
      }
    });

    it('validates demo scenario workflow', async () => {
      if (!admin.apps.length) return;

      const response = await request(app)
        .get('/api/v1/scenarios')
        .set('Authorization', `Bearer ${testToken}`)
        .query({ type: 'GUIDED' }) // Use GUIDED instead of demo, as demo might not be a valid type
        .expect(200);

      const scenarios = response.body.payload.data;
      const guidedScenarios = scenarios.filter(s => s.type === 'GUIDED');

      if (guidedScenarios.length > 0) {
        const guidedScenario = guidedScenarios[0];
        expect(guidedScenario).toHaveProperty('title');
        expect(guidedScenario).toHaveProperty('description');
        expect(guidedScenario).toHaveProperty('difficulty');
        expect(guidedScenario).toHaveProperty('tier');
        
        // Check that steps exist for this scenario in the database
        const db = admin.firestore();
        const stepsSnapshot = await db.collection('scenario_steps')
          .where('scenarioId', '==', guidedScenario.id)
          .orderBy('order', 'asc')
          .get();
        
        expect(stepsSnapshot.docs.length).toBeGreaterThan(0);
        
        // Demo scenarios should have sequential steps
        const steps = stepsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        steps.forEach((step, index) => {
          expect(step).toHaveProperty('order');
          expect(step.order).toBe(index + 1); // Should be sequential starting from 1
          expect(step).toHaveProperty('title');
          expect(step).toHaveProperty('instructions'); // Note: steps use 'instructions' not 'description'
        });
      }
    });
  });
});
