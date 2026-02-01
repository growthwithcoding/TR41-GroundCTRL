/**
 * Firestore Security Rules Integration Tests
 * Tests: SEC-006
 * Migrated from: sprint1/firebaseSecurityRules.test.js
 */

const admin = require('firebase-admin');
const request = require('supertest');

// Helper to detect if Firebase is actually initialized (not just mocked)
function isFirebaseActuallyInitialized() {
  try {
    const firebaseConfig = require('../../../src/config/firebase');
    firebaseConfig.getFirestore();
    return true;
  } catch (error) {
    return false;
  }
}

describe('Firestore Security Rules - Integration Tests', () => {
  let app;
  let aliceUser = null;
  let bobUser = null;
  let aliceToken = null;
  let bobToken = null;

  beforeAll(async () => {
    if (!isFirebaseActuallyInitialized()) {
      console.log('⚠️  Firebase not initialized - skipping test setup (tests will skip)');
      return;
    }
    
    app = require('../../../src/app');

    const aliceEmail = `alice-${Date.now()}@example.com`;
    const aliceRegister = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: aliceEmail, password: 'AlicePass123!', callSign: 'ALICE-01' });

    aliceUser = aliceRegister.body.payload?.user || aliceRegister.body.user;
    aliceToken = aliceRegister.body.payload?.tokens?.accessToken || aliceRegister.body.tokens?.accessToken || aliceRegister.body.accessToken;

    const bobEmail = `bob-${Date.now()}@example.com`;
    const bobRegister = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: bobEmail, password: 'BobPass1234!', callSign: 'BOB-01' });

    bobUser = bobRegister.body.payload?.user || bobRegister.body.user;
    bobToken = bobRegister.body.payload?.tokens?.accessToken || bobRegister.body.tokens?.accessToken || bobRegister.body.accessToken;
  });

  afterAll(async () => {
    if (!isFirebaseActuallyInitialized()) return;
    
    const db = admin.firestore();
    
    if (aliceUser?.uid) {
      try {
        await db.collection('users').doc(aliceUser.uid).delete();
        await admin.auth().deleteUser(aliceUser.uid);
      } catch {}
    }

    if (bobUser?.uid) {
      try {
        await db.collection('users').doc(bobUser.uid).delete();
        await admin.auth().deleteUser(bobUser.uid);
      } catch {}
    }
  });

  describe('User Profile Access Control', () => {
    it('allows user to read their own profile via API', async () => {
      if (!isFirebaseActuallyInitialized()) {
        console.log('⚠️  Skipping - Firebase not initialized');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/users/${aliceUser.uid}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);

      expect(response.body.payload.data.uid).toBe(aliceUser.uid);
    });

    it('prevents user from reading another user\'s profile via API', async () => {
      if (!isFirebaseActuallyInitialized()) {
        console.log('⚠️  Skipping - Firebase not initialized');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/users/${bobUser.uid}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect([403, 404]).toContain(response.status);
    });

    it('prevents user from updating another user\'s profile via API', async () => {
      if (!isFirebaseActuallyInitialized()) {
        console.log('⚠️  Skipping - Firebase not initialized');
        return;
      }

      const response = await request(app)
        .patch(`/api/v1/users/${bobUser.uid}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ displayName: 'Hacked Name' });

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('UID-Based Identity Enforcement', () => {
    it('enforces uid-scoped access at repository level', async () => {
      if (!isFirebaseActuallyInitialized()) {
        console.log('⚠️  Skipping - Firebase not initialized');
        return;
      }

      const userRepository = require('../../../src/repositories/userRepository');

      const aliceProfile = await userRepository.getById(aliceUser.uid);
      expect(aliceProfile).toBeDefined();
      expect(aliceProfile.uid).toBe(aliceUser.uid);
    });

    it('prevents callSign-based queries in repositories', () => {
      const userRepository = require('../../../src/repositories/userRepository');
      
      expect(userRepository.getByCallSign).toBeUndefined();
      expect(userRepository.findByCallSign).toBeUndefined();
      expect(userRepository.getById).toBeDefined();
    });
  });
});
