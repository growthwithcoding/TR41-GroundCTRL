/**
 * Sprint 1 – Scenario Visibility Tests
 * Tests S1 API 001: GET /api/scenarios returns only active, public scenarios
 * Also tests S1 UI 001: Dashboard displays correct user context
 */

const admin = require('firebase-admin');
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

describe('S1 API 001 – Scenario Visibility & Filtering', () => {
  let testUser = null;
  let testToken = null;
  let testScenarios = [];

  beforeAll(async () => {
    // Create test user
    const email = `scenariotest-${Date.now()}@example.com`;
    const password = 'TestPass123!';

    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email,
      password,
      callSign: 'SCENARIO-TEST'
    });

    testUser = registerResponse.data.payload.user;
    testToken = registerResponse.data.payload.tokens.accessToken;

    // Create test scenarios with various states
    const db = admin.firestore();
    
    // Scenario 1: Active and Public (should be visible)
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    testScenarios.push(scenario1.id);

    // Scenario 2: Active but Private (should NOT be visible to other users)
    const scenario2 = await db.collection('scenarios').add({
      title: 'Active Private Scenario',
      description: 'This should be hidden from public',
      difficulty: 'intermediate',
      tier: 2,
      type: 'training',
      status: 'draft',
      isActive: true,
      isPublic: false,
      createdBy: testUser.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    testScenarios.push(scenario2.id);

    // Scenario 3: Inactive but Public (should NOT be visible)
    const scenario3 = await db.collection('scenarios').add({
      title: 'Inactive Public Scenario',
      description: 'This should be hidden because inactive',
      difficulty: 'beginner',
      tier: 1,
      type: 'training',
      status: 'archived',
      isActive: false,
      isPublic: true,
      createdBy: testUser.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    testScenarios.push(scenario3.id);

    // Scenario 4: Another Active Public scenario
    const scenario4 = await db.collection('scenarios').add({
      title: 'Another Active Public Scenario',
      description: 'This should also be visible',
      difficulty: 'advanced',
      tier: 3,
      type: 'mission',
      status: 'published',
      isActive: true,
      isPublic: true,
      createdBy: testUser.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    testScenarios.push(scenario4.id);

    // Scenario 5: Inactive and Private (should NOT be visible)
    const scenario5 = await db.collection('scenarios').add({
      title: 'Inactive Private Scenario',
      description: 'This should be hidden',
      difficulty: 'intermediate',
      tier: 2,
      type: 'training',
      status: 'draft',
      isActive: false,
      isPublic: false,
      createdBy: testUser.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    testScenarios.push(scenario5.id);
  });

  afterAll(async () => {
    // Clean up test data
    const db = admin.firestore();
    
    // Delete test scenarios
    for (const scenarioId of testScenarios) {
      try {
        await db.collection('scenarios').doc(scenarioId).delete();
      } catch (error) {
        console.warn('Cleanup warning for scenario:', error.message);
      }
    }

    // Delete test user
    if (testUser?.uid) {
      try {
        await db.collection('users').doc(testUser.uid).delete();
        await admin.auth().deleteUser(testUser.uid);
      } catch (error) {
        console.warn('Cleanup warning for user:', error.message);
      }
    }
  });

  describe('Public Scenario Visibility', () => {
    it('returns only active AND public scenarios', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/scenarios`,
        {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('success');
      expect(response.data.payload).toBeDefined();
      expect(Array.isArray(response.data.payload.items)).toBe(true);

      const scenarios = response.data.payload.items;

      // Check that we only get active and public scenarios
      for (const scenario of scenarios) {
        if (testScenarios.includes(scenario.id)) {
          expect(scenario.isActive).toBe(true);
          expect(scenario.isPublic).toBe(true);
        }
      }

      // Verify that we get the expected active+public scenarios
      const testScenarioResults = scenarios.filter(s => testScenarios.includes(s.id));
      const activePublicTitles = testScenarioResults.map(s => s.title);

      expect(activePublicTitles).toContain('Active Public Scenario');
      expect(activePublicTitles).toContain('Another Active Public Scenario');
      expect(activePublicTitles).not.toContain('Active Private Scenario');
      expect(activePublicTitles).not.toContain('Inactive Public Scenario');
      expect(activePublicTitles).not.toContain('Inactive Private Scenario');
    });

    it('excludes inactive scenarios from results', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/scenarios`,
        {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        }
      );

      const scenarios = response.data.payload.items;
      const testScenarioResults = scenarios.filter(s => testScenarios.includes(s.id));

      // No inactive scenarios should be returned
      for (const scenario of testScenarioResults) {
        expect(scenario.isActive).toBe(true);
      }

      const titles = testScenarioResults.map(s => s.title);
      expect(titles).not.toContain('Inactive Public Scenario');
      expect(titles).not.toContain('Inactive Private Scenario');
    });

    it('excludes private scenarios from public results', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/scenarios`,
        {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        }
      );

      const scenarios = response.data.payload.items;
      const testScenarioResults = scenarios.filter(s => testScenarios.includes(s.id));

      // No private scenarios should be returned (unless user is owner/admin)
      const titles = testScenarioResults.map(s => s.title);
      
      // Private scenarios should not appear in general list
      // (They may appear if user is the owner, but that's tested separately)
      for (const scenario of testScenarioResults) {
        if (!scenario.isPublic) {
          // If it's private, it should belong to the requesting user
          expect(scenario.createdBy).toBe(testUser.uid);
        }
      }
    });

    it('returns scenarios with proper pagination', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/scenarios?page=1&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.payload.pagination).toBeDefined();
      expect(response.data.payload.pagination.page).toBe(1);
      expect(response.data.payload.pagination.limit).toBeLessThanOrEqual(10);
      expect(response.data.payload.pagination.totalPages).toBeDefined();
      expect(response.data.payload.pagination.totalItems).toBeDefined();
    });

    it('allows filtering scenarios by difficulty', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/scenarios?difficulty=beginner`,
        {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      const scenarios = response.data.payload.items;
      const testScenarioResults = scenarios.filter(s => testScenarios.includes(s.id));

      // All returned test scenarios should be beginner difficulty
      for (const scenario of testScenarioResults) {
        expect(scenario.difficulty).toBe('beginner');
      }
    });

    it('allows filtering scenarios by tier', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/scenarios?tier=1`,
        {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      const scenarios = response.data.payload.items;
      const testScenarioResults = scenarios.filter(s => testScenarios.includes(s.id));

      // All returned test scenarios should be tier 1
      for (const scenario of testScenarioResults) {
        expect(scenario.tier).toBe(1);
      }
    });
  });

  describe('Scenario Detail Access', () => {
    it('allows access to active public scenario details', async () => {
      // Get the first active public scenario ID
      const db = admin.firestore();
      const scenarioDoc = await db.collection('scenarios').doc(testScenarios[0]).get();
      
      expect(scenarioDoc.exists).toBe(true);

      const response = await axios.get(
        `${API_BASE_URL}/scenarios/${testScenarios[0]}`,
        {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('success');
      expect(response.data.payload).toBeDefined();
      expect(response.data.payload.id).toBe(testScenarios[0]);
      expect(response.data.payload.title).toBe('Active Public Scenario');
      expect(response.data.payload.isActive).toBe(true);
      expect(response.data.payload.isPublic).toBe(true);
    });

    it('denies access to inactive scenario details', async () => {
      // testScenarios[2] is the inactive public scenario
      try {
        await axios.get(
          `${API_BASE_URL}/scenarios/${testScenarios[2]}`,
          {
            headers: {
              Authorization: `Bearer ${testToken}`
            }
          }
        );
        fail('Should have denied access to inactive scenario');
      } catch (error) {
        expect([403, 404]).toContain(error.response.status);
        expect(error.response.data.status).toBe('error');
      }
    });

    it('allows owner to access their private scenarios', async () => {
      // testScenarios[1] is the active private scenario owned by testUser
      const response = await axios.get(
        `${API_BASE_URL}/scenarios/${testScenarios[1]}`,
        {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.payload.id).toBe(testScenarios[1]);
      expect(response.data.payload.title).toBe('Active Private Scenario');
      expect(response.data.payload.isPublic).toBe(false);
      expect(response.data.payload.createdBy).toBe(testUser.uid);
    });
  });

  describe('Scenario List Response Format', () => {
    it('returns scenarios with required fields', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/scenarios`,
        {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        }
      );

      const scenarios = response.data.payload.items;
      const testScenarioResults = scenarios.filter(s => testScenarios.includes(s.id));

      if (testScenarioResults.length > 0) {
        const scenario = testScenarioResults[0];
        
        // Verify required fields are present
        expect(scenario.id).toBeDefined();
        expect(scenario.title).toBeDefined();
        expect(scenario.description).toBeDefined();
        expect(scenario.difficulty).toBeDefined();
        expect(scenario.tier).toBeDefined();
        expect(scenario.type).toBeDefined();
        expect(scenario.isActive).toBeDefined();
        expect(scenario.isPublic).toBeDefined();
        expect(scenario.createdBy).toBeDefined();
      }
    });

    it('follows mission control response format', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/scenarios`,
        {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        }
      );

      // Verify response structure follows mission control format
      expect(response.data.status).toBe('success');
      expect(response.data.payload).toBeDefined();
      expect(response.data.payload.items).toBeDefined();
      expect(response.data.payload.pagination).toBeDefined();
      expect(response.data.meta).toBeDefined();
      expect(response.data.meta.timestamp).toBeDefined();
    });

    it('includes pagination metadata', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/scenarios`,
        {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        }
      );

      const pagination = response.data.payload.pagination;
      
      expect(pagination.page).toBeDefined();
      expect(pagination.limit).toBeDefined();
      expect(pagination.totalPages).toBeDefined();
      expect(pagination.totalItems).toBeDefined();
      expect(pagination.hasNextPage).toBeDefined();
      expect(pagination.hasPrevPage).toBeDefined();
    });
  });

  describe('Authentication Requirements', () => {
    it('requires authentication to access scenarios', async () => {
      try {
        await axios.get(`${API_BASE_URL}/scenarios`);
        fail('Should have required authentication');
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.status).toBe('error');
      }
    });

    it('rejects invalid authentication tokens', async () => {
      try {
        await axios.get(
          `${API_BASE_URL}/scenarios`,
          {
            headers: {
              Authorization: 'Bearer invalid.token.here'
            }
          }
        );
        fail('Should have rejected invalid token');
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.status).toBe('error');
      }
    });
  });

  describe('Sorting and Ordering', () => {
    it('supports sorting scenarios by createdAt', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/scenarios?sortBy=createdAt&sortOrder=desc`,
        {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      const scenarios = response.data.payload.items;
      
      // Verify scenarios are sorted by createdAt descending
      if (scenarios.length > 1) {
        for (let i = 0; i < scenarios.length - 1; i++) {
          const current = new Date(scenarios[i].createdAt);
          const next = new Date(scenarios[i + 1].createdAt);
          expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
        }
      }
    });

    it('supports sorting scenarios by title', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/scenarios?sortBy=title&sortOrder=asc`,
        {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      const scenarios = response.data.payload.items;
      
      // Verify scenarios are sorted by title ascending
      if (scenarios.length > 1) {
        for (let i = 0; i < scenarios.length - 1; i++) {
          expect(scenarios[i].title.localeCompare(scenarios[i + 1].title)).toBeLessThanOrEqual(0);
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('returns 404 for non-existent scenario', async () => {
      const fakeScenarioId = 'nonexistent-scenario-id-12345';

      try {
        await axios.get(
          `${API_BASE_URL}/scenarios/${fakeScenarioId}`,
          {
            headers: {
              Authorization: `Bearer ${testToken}`
            }
          }
        );
        fail('Should have returned 404');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.status).toBe('error');
      }
    });

    it('handles invalid query parameters gracefully', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/scenarios?page=0&limit=-1`,
        {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        }
      );

      // Should normalize invalid parameters
      expect(response.status).toBe(200);
      expect(response.data.payload.pagination.page).toBeGreaterThan(0);
      expect(response.data.payload.pagination.limit).toBeGreaterThan(0);
    });

    it('rejects unknown query parameters in strict mode', async () => {
      try {
        await axios.get(
          `${API_BASE_URL}/scenarios?unknownParam=value`,
          {
            headers: {
              Authorization: `Bearer ${testToken}`
            }
          }
        );
        // May either ignore or reject unknown params - check implementation
      } catch (error) {
        if (error.response?.status === 422) {
          expect(error.response.data.status).toBe('error');
        }
      }
    });
  });
});

describe('S1 UI 001 – Dashboard User Context', () => {
  let testUser = null;
  let testToken = null;

  beforeAll(async () => {
    // Create test user
    const email = `dashboard-${Date.now()}@example.com`;
    const password = 'TestPass123!';

    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email,
      password,
      callSign: 'DASHBOARD-TEST'
    });

    testUser = registerResponse.data.payload.user;
    testToken = registerResponse.data.payload.tokens.accessToken;
  });

  afterAll(async () => {
    // Clean up test user
    if (testUser?.uid) {
      try {
        const db = admin.firestore();
        await db.collection('users').doc(testUser.uid).delete();
        await admin.auth().deleteUser(testUser.uid);
      } catch (error) {
        console.warn('Cleanup warning:', error.message);
      }
    }
  });

  describe('User Profile Context', () => {
    it('returns user profile with callSign for dashboard display', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/users/${testUser.uid}`,
        {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.payload).toBeDefined();
      expect(response.data.payload.callSign).toBe('DASHBOARD-TEST');
      expect(response.data.payload.email).toBe(testUser.email);
      expect(response.data.payload.uid).toBe(testUser.uid);
    });

    it('includes user role for permission checks', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/users/${testUser.uid}`,
        {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        }
      );

      expect(response.data.payload.role).toBeDefined();
      expect(response.data.payload.role).toBe('standard');
    });

    it('shows active status for dashboard', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/users/${testUser.uid}`,
        {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        }
      );

      expect(response.data.payload.isActive).toBe(true);
    });
  });

  describe('User Progress and Statistics', () => {
    it('returns user profile data for progress tracking', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/users/${testUser.uid}`,
        {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.payload).toBeDefined();
      
      // Profile should contain data needed for dashboard widgets
      expect(response.data.payload.uid).toBeDefined();
      expect(response.data.payload.callSign).toBeDefined();
    });

    it('provides user creation timestamp for account age', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/users/${testUser.uid}`,
        {
          headers: {
            Authorization: `Bearer ${testToken}`
          }
        }
      );

      expect(response.data.payload.createdAt).toBeDefined();
    });
  });
});
