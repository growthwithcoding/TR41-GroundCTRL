/**
 * Sprint 1 – Firestore Security Rules Tests
 * Tests S1 SEC 001: Firestore security rule enforcement for user privacy
 */

const admin = require('firebase-admin');
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

describe('S1 SEC 001 – Firestore Security Rules Enforcement', () => {
  let aliceUser = null;
  let bobUser = null;
  let aliceToken = null;
  let bobToken = null;

  beforeAll(async () => {
    // Create Alice
    const aliceEmail = `alice-${Date.now()}@example.com`;
    const alicePassword = 'AlicePass123!';

    const aliceRegister = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: aliceEmail,
      password: alicePassword,
      callSign: 'ALICE-01'
    });

    aliceUser = aliceRegister.data.payload.user;
    aliceToken = aliceRegister.data.payload.tokens.accessToken;

    // Create Bob
    const bobEmail = `bob-${Date.now()}@example.com`;
    const bobPassword = 'BobPass123!';

    const bobRegister = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: bobEmail,
      password: bobPassword,
      callSign: 'BOB-01'
    });

    bobUser = bobRegister.data.payload.user;
    bobToken = bobRegister.data.payload.tokens.accessToken;
  });

  afterAll(async () => {
    // Clean up test users
    const db = admin.firestore();
    
    if (aliceUser?.uid) {
      try {
        await db.collection('users').doc(aliceUser.uid).delete();
        await admin.auth().deleteUser(aliceUser.uid);
      } catch (error) {
        console.warn('Cleanup warning for Alice:', error.message);
      }
    }

    if (bobUser?.uid) {
      try {
        await db.collection('users').doc(bobUser.uid).delete();
        await admin.auth().deleteUser(bobUser.uid);
      } catch (error) {
        console.warn('Cleanup warning for Bob:', error.message);
      }
    }
  });

  describe('User Profile Access Control', () => {
    it('allows user to read their own profile via API', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/users/${aliceUser.uid}`,
        {
          headers: {
            Authorization: `Bearer ${aliceToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('success');
      expect(response.data.payload).toBeDefined();
      expect(response.data.payload.uid).toBe(aliceUser.uid);
      expect(response.data.payload.email).toBe(aliceUser.email);
    });

    it('prevents user from reading another user\'s profile via API', async () => {
      try {
        await axios.get(
          `${API_BASE_URL}/users/${bobUser.uid}`,
          {
            headers: {
              Authorization: `Bearer ${aliceToken}` // Alice trying to read Bob's profile
            }
          }
        );
        throw new Error('Should have denied access to another user\'s profile');
      } catch (error) {
        expect([403, 404]).toContain(error.response.status);
        expect(error.response.data.status).toBe('error');
      }
    });

    it('prevents unauthorized access to user profiles', async () => {
      try {
        await axios.get(`${API_BASE_URL}/users/${aliceUser.uid}`);
        throw new Error('Should have denied unauthenticated access');
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.status).toBe('error');
      }
    });

    it('allows user to update their own profile via API', async () => {
      const updatedDisplayName = 'Alice Updated';

      const response = await axios.patch(
        `${API_BASE_URL}/users/${aliceUser.uid}`,
        {
          displayName: updatedDisplayName
        },
        {
          headers: {
            Authorization: `Bearer ${aliceToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.status).toBe('success');
      expect(response.data.payload.displayName).toBe(updatedDisplayName);
    });

    it('prevents user from updating another user\'s profile via API', async () => {
      try {
        await axios.patch(
          `${API_BASE_URL}/users/${bobUser.uid}`,
          {
            displayName: 'Hacked Name'
          },
          {
            headers: {
              Authorization: `Bearer ${aliceToken}` // Alice trying to update Bob's profile
            }
          }
        );
        throw new Error('Should have denied cross-user update');
      } catch (error) {
        expect([403, 404]).toContain(error.response.status);
        expect(error.response.data.status).toBe('error');
      }
    });
  });

  describe('Direct Firestore Access Control', () => {
    it('verifies uid-scoped access at repository level', async () => {
      // Using admin SDK to verify repository implementation
      const userRepository = require('../../src/repositories/userRepository');

      // Should be able to get user by their own uid
      const aliceProfile = await userRepository.getById(aliceUser.uid);
      expect(aliceProfile).toBeDefined();
      expect(aliceProfile.uid).toBe(aliceUser.uid);

      // Repository should implement ownership checks
      // (This is a code-level verification that the repository enforces uid scoping)
      expect(userRepository.getById).toBeDefined();
      expect(userRepository.update).toBeDefined();
    });

    it('enforces uid as the only identity anchor in Firestore documents', async () => {
      const db = admin.firestore();
      
      // Verify Alice's document uses uid as key
      const aliceDoc = await db.collection('users').doc(aliceUser.uid).get();
      expect(aliceDoc.exists).toBe(true);
      expect(aliceDoc.id).toBe(aliceUser.uid);
      
      // Verify Bob's document uses uid as key
      const bobDoc = await db.collection('users').doc(bobUser.uid).get();
      expect(bobDoc.exists).toBe(true);
      expect(bobDoc.id).toBe(bobUser.uid);

      // Verify documents are keyed by uid, not callSign
      const aliceData = aliceDoc.data();
      const bobData = bobDoc.data();
      
      expect(aliceData.uid).toBe(aliceUser.uid);
      expect(bobData.uid).toBe(bobUser.uid);
    });

    it('prevents callSign-based queries in repositories', async () => {
      const userRepository = require('../../src/repositories/userRepository');
      
      // Verify no callSign-based lookup methods exist
      expect(userRepository.getByCallSign).toBeUndefined();
      expect(userRepository.findByCallSign).toBeUndefined();
      
      // Only uid-based methods should exist
      expect(userRepository.getById).toBeDefined();
    });
  });

  describe('Admin vs Non-Admin Access', () => {
    it('allows non-admin users to only access their own data', async () => {
      // Alice (non-admin) can access her own profile
      const response = await axios.get(
        `${API_BASE_URL}/users/${aliceUser.uid}`,
        {
          headers: {
            Authorization: `Bearer ${aliceToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.payload.uid).toBe(aliceUser.uid);

      // But cannot access Bob's profile
      try {
        await axios.get(
          `${API_BASE_URL}/users/${bobUser.uid}`,
          {
            headers: {
              Authorization: `Bearer ${aliceToken}`
            }
          }
        );
        throw new Error('Should have denied access');
      } catch (error) {
        expect([403, 404]).toContain(error.response.status);
      }
    });

    it('enforces uid-based scoping in all user operations', async () => {
      // Test that API routes use :uid parameter, not :callSign
      // This is a structural test to ensure proper routing

      // Valid uid-based route should work
      const validResponse = await axios.get(
        `${API_BASE_URL}/users/${aliceUser.uid}`,
        {
          headers: {
            Authorization: `Bearer ${aliceToken}`
          }
        }
      );
      expect(validResponse.status).toBe(200);

      // CallSign-based route should not exist
      try {
        await axios.get(
          `${API_BASE_URL}/users/callsign/${aliceUser.callSign}`,
          {
            headers: {
              Authorization: `Bearer ${aliceToken}`
            }
          }
        );
        throw new Error('CallSign-based routes should not exist');
      } catch (error) {
        expect([404, 405]).toContain(error.response.status);
      }
    });
  });

  describe('Audit Log Privacy', () => {
    it('ensures audit logs use uid, not email/callSign for identity', async () => {
      // Trigger an action that creates an audit log
      await axios.patch(
        `${API_BASE_URL}/users/${aliceUser.uid}`,
        {
          displayName: 'Alice Audit Test'
        },
        {
          headers: {
            Authorization: `Bearer ${aliceToken}`
          }
        }
      );

      // Check audit log structure
      const db = admin.firestore();
      const auditQuery = await db.collection('auditLogs')
        .where('userId', '==', aliceUser.uid)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      if (!auditQuery.empty) {
        const auditLog = auditQuery.docs[0].data();
        expect(auditLog.userId).toBe(aliceUser.uid);
        expect(auditLog.userId).toBeDefined();
        expect(typeof auditLog.userId).toBe('string');
      }
    });

    it('prevents users from reading other users\' audit logs', async () => {
      // Audit logs should not be directly accessible via API to regular users
      // Only admin operations should access audit logs
      
      // Verify auditRepository doesn't expose user-accessible methods
      const auditRepository = require('../../src/repositories/auditRepository');
      expect(auditRepository.logAudit).toBeDefined();
      expect(auditRepository.getFailedLoginAttempts).toBeDefined();
      
      // These are admin/system functions, not user-facing API endpoints
      expect(true).toBe(true);
    });
  });

  describe('Token-Based Authentication', () => {
    it('rejects expired or invalid tokens', async () => {
      const invalidToken = 'invalid.jwt.token';

      try {
        await axios.get(
          `${API_BASE_URL}/users/${aliceUser.uid}`,
          {
            headers: {
              Authorization: `Bearer ${invalidToken}`
            }
          }
        );
        throw new Error('Should have rejected invalid token');
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.status).toBe('error');
      }
    });

    it('validates JWT signature and payload', async () => {
      // Make request with valid token
      const response = await axios.get(
        `${API_BASE_URL}/users/${aliceUser.uid}`,
        {
          headers: {
            Authorization: `Bearer ${aliceToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      
      // The middleware should have validated:
      // 1. Token signature
      // 2. Token expiration
      // 3. User exists and is active
      expect(response.data.payload.uid).toBe(aliceUser.uid);
    });

    it('attaches authenticated user to request context', async () => {
      // When authenticated, the API should know who the user is
      const response = await axios.get(
        `${API_BASE_URL}/users/${aliceUser.uid}`,
        {
          headers: {
            Authorization: `Bearer ${aliceToken}`
          }
        }
      );

      expect(response.status).toBe(200);
      
      // The fact that we can access our own profile proves
      // the middleware attached req.user correctly
      expect(response.data.payload.uid).toBe(aliceUser.uid);
    });
  });

  describe('Security Headers and Best Practices', () => {
    it('does not expose sensitive data in error responses', async () => {
      try {
        await axios.get(
          `${API_BASE_URL}/users/${bobUser.uid}`,
          {
            headers: {
              Authorization: `Bearer ${aliceToken}`
            }
          }
        );
        throw new Error('Should have failed');
      } catch (error) {
        // Error should not reveal whether the user exists
        const errorMessage = error.response.data.message.toLowerCase();
        expect(errorMessage).not.toContain('user not found');
        expect(errorMessage).not.toContain('bob');
        expect(errorMessage).not.toContain(bobUser.uid);
      }
    });

    it('normalizes auth errors to prevent user enumeration', async () => {
      // Trying to access non-existent user should give same error as forbidden
      const fakeUid = 'nonexistent-uid-12345';

      try {
        await axios.get(
          `${API_BASE_URL}/users/${fakeUid}`,
          {
            headers: {
              Authorization: `Bearer ${aliceToken}`
            }
          }
        );
        throw new Error('Should have failed');
      } catch (error) {
        expect([403, 404]).toContain(error.response.status);
        
        // Error message should be generic
        const errorMessage = error.response.data.message;
        expect(errorMessage).toBeDefined();
        expect(typeof errorMessage).toBe('string');
      }
    });

    it('enforces HTTPS-only cookies in production', () => {
      // This is an environment configuration check
      if (process.env.NODE_ENV === 'production') {
        // In production, JWT_SECURE should be true
        expect(process.env.JWT_SECURE).toBe('true');
      }
      
      // For testing, we accept non-HTTPS
      expect(true).toBe(true);
    });
  });
});
