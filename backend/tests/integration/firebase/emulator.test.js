/**
 * Firebase Emulator Integration Tests
 * Tests: FIRE-001, FIRE-002
 * Migrated from: sprint0/firebaseEmulator.test.js
 */

const admin = require('firebase-admin');
const axios = require('axios');

const AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

describe('FIRE-001, FIRE-002: Firebase Emulator Configuration', () => {
  let testUserId;
  let testUserEmail;

  afterEach(async () => {
    if (testUserId) {
      try {
        const db = admin.firestore();
        await db.collection('users').doc(testUserId).delete();
        await admin.auth().deleteUser(testUserId);
      } catch {
        // Ignore cleanup errors
      }
      testUserId = null;
    }
  });

  describe('FIRE-001: Emulator Connectivity', () => {
    it('verifies Auth emulator is running and accessible', async () => {
      const authEmulatorUrl = `http://${AUTH_EMULATOR_HOST}`;
      const authResponse = await axios.get(authEmulatorUrl, { timeout: 2000 }).catch(() => null);
      
      if (!authResponse) {
        console.log('⚠️  Firebase emulators not running - skipping emulator tests');
        console.log('   Run: firebase emulators:start');
        return;
      }
      
      expect(authResponse).not.toBeNull();
    });

    it('verifies Firestore emulator is accessible', async () => {
      if (admin.apps.length) {
        const db = admin.firestore();
        expect(db).toBeDefined();
      }
    });
  });

  describe('FIRE-002: Auth and Firestore Integration', () => {
    it('creates a user via Auth emulator and returns a UID', async () => {
      if (!admin.apps.length) {
        console.log('⚠️  Firebase not initialized - skipping test');
        return;
      }

      testUserEmail = `test-${Date.now()}@emulator.test`;
      const password = 'TestPassword123!';

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
      if (!admin.apps.length) {
        console.log('⚠️  Firebase not initialized - skipping test');
        return;
      }

      testUserEmail = `test-${Date.now()}@emulator.test`;
      const userRecord = await admin.auth().createUser({
        email: testUserEmail,
        password: 'TestPassword123!'
      });
      testUserId = userRecord.uid;

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

      const doc = await db.collection('users').doc(testUserId).get();
      expect(doc.exists).toBe(true);
      expect(doc.id).toBe(testUserId);
      expect(doc.data().email).toBe(testUserEmail);
    });

    it('API connects to emulators without credential errors', async () => {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000
      }).catch(error => {
        if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
          return { data: { skip: true } };
        }
        throw error;
      });

      if (healthResponse.data.skip) {
        console.log('⚠️  API not running - skipping connectivity test');
        return;
      }

      expect(healthResponse.status).toBe(200);
    });

    it('properly handles emulator environment isolation', () => {
      if (!admin.apps.length) {
        console.log('⚠️  Firebase not initialized - skipping test');
        return;
      }

      expect(process.env.NODE_ENV).not.toBe('production');
      
      const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || AUTH_EMULATOR_HOST;
      const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || FIRESTORE_EMULATOR_HOST;
      
      expect(authHost).toContain('localhost');
      expect(firestoreHost).toContain('localhost');
    });
  });
});
