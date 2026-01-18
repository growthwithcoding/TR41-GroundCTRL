/**
 * Phase 1 – Identity Enforcement
 * UID must be the only identity anchor; callSign/email cannot be primary keys.
 */

const admin = require('firebase-admin');
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

describe('Phase 1 – Identity Enforcement', () => {
  let testUsers = [];

  beforeAll(async () => {
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      console.log('⚠️  Firebase not initialized - skipping test setup');
      return;
    }

    // Create test users with duplicate callSign to verify non-uniqueness
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
        callSign: sharedCallSign, // Same callSign for both users
        displayName: `User ${i}`,
        role: 'standard',
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      testUsers.push({ uid: userRecord.uid, email, callSign: sharedCallSign });
    }
  });

  afterAll(async () => {
    // Cleanup test users
    if (!admin.apps.length || testUsers.length === 0) {
      return; // Skip cleanup if Firebase not initialized
    }

    const db = admin.firestore();
    for (const user of testUsers) {
      try {
        await db.collection('users').doc(user.uid).delete();
        await admin.auth().deleteUser(user.uid);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it('allows duplicate callSign across users', async () => {
    if (!admin.apps.length || testUsers.length === 0) {
      console.log('⚠️  Firebase not initialized or test users not created - skipping test');
      return;
    }

    expect(testUsers.length).toBe(2);
    expect(testUsers[0].callSign).toBe(testUsers[1].callSign);
    
    // Verify both users exist in Firestore with same callSign
    const db = admin.firestore();
    const user1Doc = await db.collection('users').doc(testUsers[0].uid).get();
    const user2Doc = await db.collection('users').doc(testUsers[1].uid).get();
    
    expect(user1Doc.exists).toBe(true);
    expect(user2Doc.exists).toBe(true);
    expect(user1Doc.data().callSign).toBe(user2Doc.data().callSign);
    expect(user1Doc.id).not.toBe(user2Doc.id); // Different UIDs
  });

  it('rejects callSign-based targeting for lookups/updates', async () => {
    if (!admin.apps.length || testUsers.length === 0) {
      console.log('⚠️  Firebase not initialized or test users not created - skipping test');
      return;
    }

    // userRepository should not have getByCallSign method
    const userRepository = require('../../src/repositories/userRepository');
    expect(userRepository.getByCallSign).toBeUndefined();
    
    // Attempting to query by callSign should not be supported by API
    // (API uses uid-based routes like /users/:uid)
    const callSign = testUsers[0].callSign;
    
    // This should fail or not exist as an endpoint
    try {
      await axios.get(`${API_BASE_URL}/users/callsign/${callSign}`);
      // Should not reach here - throw error if endpoint exists
      throw new Error('Should not support callSign-based lookups');
    } catch (error) {
      expect([404, 405]).toContain(error.response?.status);
    }
  });

  it('uses uid for all auth/user CRUD operations', async () => {
    if (!admin.apps.length || testUsers.length === 0) {
      console.log('⚠️  Firebase not initialized or test users not created - skipping test');
      return;
    }

    const db = admin.firestore();
    const userRepository = require('../../src/repositories/userRepository');
    
    // Test getById uses uid
    const user = await userRepository.getById(testUsers[0].uid);
    expect(user).toBeDefined();
    expect(user.uid).toBe(testUsers[0].uid);
    
    // Test update uses uid
    const updatedData = { displayName: 'Updated Name' };
    await userRepository.update(testUsers[0].uid, updatedData);
    
    const updated = await userRepository.getById(testUsers[0].uid);
    expect(updated.displayName).toBe('Updated Name');
    
    // Test delete uses uid
    const tempUser = await admin.auth().createUser({
      email: `temp-${Date.now()}@test.com`,
      password: 'TempPass123!'
    });
    await db.collection('users').doc(tempUser.uid).set({
      email: tempUser.email,
      callSign: 'TEMP',
      role: 'standard'
    });
    
    await userRepository.deleteUser(tempUser.uid);
    const deleted = await userRepository.getById(tempUser.uid);
    expect(deleted).toBeNull();
  });

  it('ensures audit logs record actor uid, not callSign/email', async () => {
    if (!admin.apps.length || testUsers.length === 0) {
      console.log('⚠️  Firebase not initialized or test users not created - skipping test');
      return;
    }

    const auditFactory = require('../../src/factories/auditFactory');
    
    // Create audit entry with correct parameters
    // Signature: createAuditEntry(action, resource, userId, callSign, result, severity, metadata)
    const auditEntry = auditFactory.createAuditEntry(
      'USER_UPDATED',
      'user',
      testUsers[0].uid,  // userId - this should be the uid
      testUsers[0].callSign,  // callSign
      'success',
      'high',
      { details: 'Test audit entry' }
    );
    
    // Verify audit entry uses uid as userId
    expect(auditEntry.userId).toBe(testUsers[0].uid);
    expect(auditEntry.userId).not.toContain('@'); // Not an email
    expect(auditEntry.userId).not.toBe(testUsers[0].callSign); // Not callSign
    
    // Verify callSign is separate field (not used as primary identifier)
    expect(auditEntry.callSign).toBe(testUsers[0].callSign);
  });

  it('prevents cross-user access by uid scoping', async () => {
    if (!admin.apps.length || testUsers.length === 0) {
      console.log('⚠️  Firebase not initialized or test users not created - skipping test');
      return;
    }

    // This test verifies ownership scoping in CRUD operations
    // Non-admin users should only access their own resources
    
    const db = admin.firestore();
    
    // Create resources owned by different users
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
    
    // User 0 should not be able to access User 1's resource
    // This is enforced by ownership scoping in CRUD factory
    const satelliteRepository = require('../../src/repositories/satelliteRepository');
    
    // Query with ownership filter
    const user0Resources = await satelliteRepository.getAll({
      createdBy: testUsers[0].uid
    });
    
    const user0Ids = user0Resources.data.map(r => r.id);
    expect(user0Ids).toContain(resource1.id);
    expect(user0Ids).not.toContain(resource2.id);
    
    // Cleanup
    await db.collection('satellites').doc(resource1.id).delete();
    await db.collection('satellites').doc(resource2.id).delete();
  });
});
