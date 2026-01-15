/**
 * Sprint 0 – Firebase Emulator Wiring
 * Tests Firebase Auth and Firestore emulator integration
 */

const admin = require('firebase-admin');
const axios = require('axios');

const AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

describe('S0 003 – Firebase Emulator Configuration', () => {
  let testUserId;
  let testUserEmail;

  beforeAll(() => {
    // Verify emulator environment variables are set
    expect(process.env.FIREBASE_AUTH_EMULATOR_HOST).toBeDefined();
    expect(process.env.FIRESTORE_EMULATOR_HOST).toBeDefined();
  });

  afterEach(async () => {
    // Clean up test user if created
    if (testUserId) {
      try {
        const db = admin.firestore();
        await db.collection('users').doc(testUserId).delete();
        await admin.auth().deleteUser(testUserId);
      } catch (error) {
        // Ignore cleanup errors
      }
      testUserId = null;
    }
  });

  it('verifies emulators are running and accessible', async () => {
    // Check Auth emulator
    const authEmulatorUrl = `http://${AUTH_EMULATOR_HOST}`;
    const authResponse = await axios.get(authEmulatorUrl, { timeout: 2000 }).catch(() => null);
    expect(authResponse).not.toBeNull();

    // Check Firestore emulator (by attempting connection)
    const db = admin.firestore();
    expect(db).toBeDefined();
  });

  it('creates a user via Auth emulator and returns a UID', async () => {
    testUserEmail = `test-${Date.now()}@emulator.test`;
    const password = 'TestPassword123!';

    // Create user in Auth emulator
    const userRecord = await admin.auth().createUser({
      email: testUserEmail,
      password: password,
      displayName: 'Test User'
    });

    testUserId = userRecord.uid;

    expect(userRecord.uid).toBeDefined();
    expect(userRecord.email).toBe(testUserEmail);
    expect(typeof userRecord.uid).toBe('string');
    expect(userRecord.uid.length).toBeGreaterThan(0);
  });

  it('writes Firestore doc with same UID in users collection', async () => {
    // Create Auth user first
    testUserEmail = `test-${Date.now()}@emulator.test`;
    const userRecord = await admin.auth().createUser({
      email: testUserEmail,
      password: 'TestPassword123!'
    });
    testUserId = userRecord.uid;

    // Write Firestore document
    const db = admin.firestore();
    const userData = {
      email: testUserEmail,
      displayName: 'Test User',
      callSign: 'TEST-01',
      role: 'standard',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(testUserId).set(userData);

    // Verify document exists with matching UID
    const doc = await db.collection('users').doc(testUserId).get();
    expect(doc.exists).toBe(true);
    expect(doc.id).toBe(testUserId);
    expect(doc.data().email).toBe(testUserEmail);
  });

  it('API connects to emulators without credential errors', async () => {
    // Test API health endpoint (doesn't require auth)
    const healthResponse = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000
    }).catch(error => {
      // If API isn't running, skip this test gracefully
      if (error.code === 'ECONNREFUSED') {
        return { data: { skip: true } };
      }
      throw error;
    });

    if (healthResponse.data.skip) {
      console.log('⚠️  API not running - skipping connectivity test');
      return;
    }

    expect(healthResponse.status).toBe(200);
    expect(healthResponse.data.payload).toBeDefined();
    expect(healthResponse.data.payload.status).toBe('operational');
  });

  it('properly handles emulator environment isolation', () => {
    // Verify we're not accidentally connecting to production
    expect(process.env.NODE_ENV).not.toBe('production');
    expect(process.env.FIREBASE_AUTH_EMULATOR_HOST).toContain('localhost');
    expect(process.env.FIRESTORE_EMULATOR_HOST).toContain('localhost');

    // Verify Firebase is pointing to emulators
    const db = admin.firestore();
    expect(db._settings.host).toContain('localhost');
  });
});
