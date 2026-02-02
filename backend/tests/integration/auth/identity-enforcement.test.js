/**
 * Identity Enforcement Integration Tests
 * Tests: AUTH-003, SEC-001
 * Migrated from: sprint0/backendPhase1IdentityEnforcement.test.js
 */

const admin = require('firebase-admin');
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

// Helper to detect if Firebase is actually initialized (not just mocked)
function isFirebaseActuallyInitialized() {
  try {
    // Try to import the firebase config module
    const firebaseConfig = require('../../../src/config/firebase');
    // Try to get firestore - will throw if not initialized
    firebaseConfig.getFirestore();
    return true;
  } catch (error) {
    // If it throws "Firebase not initialized", we're using mocks
    return false;
  }
}

describe('AUTH-003, SEC-001: UID-Based Identity Enforcement', () => {
  let testUsers = [];

  beforeAll(async () => {
    if (!isFirebaseActuallyInitialized()) {
      console.log('⚠️  Firebase not initialized - skipping test setup (tests will skip)');
      return;
    }

    const sharedCallSign = 'ALPHA-01';
    
    for (let i = 1; i <= 2; i++) {
      const email = `user${i}-${Date.now()}@test.com`;
      const userRecord = await admin.auth().createUser({
        email,
        password: 'TestPass123!',
        displayName: `User ${i}`
      });

      const db = admin.firestore();
      await db.collection('users').doc(userRecord.uid).set({
        email,
        callSign: sharedCallSign,
        displayName: `User ${i}`,
        role: 'standard',
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      testUsers.push({ uid: userRecord.uid, email, callSign: sharedCallSign });
    }
  });

  afterAll(async () => {
    if (!isFirebaseActuallyInitialized() || testUsers.length === 0) return;

    const db = admin.firestore();
    for (const user of testUsers) {
      try {
        await db.collection('users').doc(user.uid).delete();
        await admin.auth().deleteUser(user.uid);
      } catch {}
    }
  });

  describe('AUTH-002: Duplicate CallSign Support', () => {
    it('allows duplicate callSign across users', async () => {
      if (!isFirebaseActuallyInitialized() || testUsers.length === 0) {
        console.log('⚠️  Skipping - Firebase not initialized');
        return;
      }

      expect(testUsers.length).toBe(2);
      expect(testUsers[0].callSign).toBe(testUsers[1].callSign);
      
      const db = admin.firestore();
      const user1Doc = await db.collection('users').doc(testUsers[0].uid).get();
      const user2Doc = await db.collection('users').doc(testUsers[1].uid).get();
      
      expect(user1Doc.exists).toBe(true);
      expect(user2Doc.exists).toBe(true);
      expect(user1Doc.data().callSign).toBe(user2Doc.data().callSign);
      expect(user1Doc.id).not.toBe(user2Doc.id);
    });
  });

  describe('AUTH-003: CallSign Query Prevention', () => {
    it('rejects callSign-based targeting for lookups/updates', async () => {
      if (!isFirebaseActuallyInitialized() || testUsers.length === 0) {
        console.log('⚠️  Skipping - Firebase not initialized');
        return;
      }

      const userRepository = require('../../../src/repositories/userRepository');
      expect(userRepository.getByCallSign).toBeUndefined();
      
      const callSign = testUsers[0].callSign;
      
      try {
        await axios.get(`${API_BASE_URL}/users/callsign/${callSign}`);
        throw new Error('Should not support callSign-based lookups');
      } catch (error) {
        expect([404, 405]).toContain(error.response?.status);
      }
    });
  });

  describe('UID-Based Operations', () => {
    it('uses uid for all auth/user CRUD operations', async () => {
      if (!isFirebaseActuallyInitialized() || testUsers.length === 0) {
        console.log('⚠️  Skipping - Firebase not initialized');
        return;
      }

      const db = admin.firestore();
      const userRepository = require('../../../src/repositories/userRepository');
      
      const user = await userRepository.getById(testUsers[0].uid);
      expect(user).toBeDefined();
      expect(user.uid).toBe(testUsers[0].uid);
      
      const updatedData = { displayName: 'Updated Name' };
      await userRepository.update(testUsers[0].uid, updatedData);
      
      const updated = await userRepository.getById(testUsers[0].uid);
      expect(updated.displayName).toBe('Updated Name');
    });

    it('ensures audit logs record actor uid, not callSign/email', async () => {
      if (!isFirebaseActuallyInitialized() || testUsers.length === 0) {
        console.log('⚠️  Skipping - Firebase not initialized');
        return;
      }

      const auditFactory = require('../../../src/factories/auditFactory');
      
      const auditEntry = auditFactory.createAuditEntry(
        'USER_UPDATED',
        'user',
        testUsers[0].uid,
        testUsers[0].callSign,
        'success',
        'high',
        { details: 'Test audit entry' }
      );
      
      expect(auditEntry.userId).toBe(testUsers[0].uid);
      expect(auditEntry.userId).not.toContain('@');
      expect(auditEntry.userId).not.toBe(testUsers[0].callSign);
      expect(auditEntry.callSign).toBe(testUsers[0].callSign);
    });

    it('prevents cross-user access by uid scoping', async () => {
      if (!isFirebaseActuallyInitialized() || testUsers.length === 0) {
        console.log('⚠️  Skipping - Firebase not initialized');
        return;
      }

      const db = admin.firestore();
      
      const resource1 = await db.collection('satellites').add({
        name: 'Satellite 1',
        createdBy: testUsers[0].uid,
        isActive: true
      });
      
      const resource2 = await db.collection('satellites').add({
        name: 'Satellite 2',
        createdBy: testUsers[1].uid,
        isActive: true
      });
      
      const satelliteRepository = require('../../../src/repositories/satelliteRepository');
      
      const user0Resources = await satelliteRepository.getAll({
        createdBy: testUsers[0].uid
      });
      
      const user0Ids = user0Resources.data.map(r => r.id);
      expect(user0Ids).toContain(resource1.id);
      expect(user0Ids).not.toContain(resource2.id);
      
      await db.collection('satellites').doc(resource1.id).delete();
      await db.collection('satellites').doc(resource2.id).delete();
    });
  });
});
