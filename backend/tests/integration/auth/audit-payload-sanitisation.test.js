/**
 * Audit Payload Sanitisation Integration Tests
 * Tests: AUDIT-001
 * Ensures audit logs don't leak PII like passwords or tokens
 */

const admin = require('firebase-admin');
const request = require('supertest');

describe('Audit Payload Sanitisation - Integration Tests', () => {
  let app;
  let testUsers = [];

  beforeAll(() => {
    if (!admin.apps.length) return;
    app = require('../../../src/app');
  });

  afterEach(async () => {
    if (!admin.apps.length) return;
    
    const db = admin.firestore();
    
    // Clean up audit logs for test users
    for (const user of testUsers) {
      try {
        const auditLogs = await db.collection('audit_logs')
          .where('userId', '==', user.uid)
          .get();
        
        const batch = db.batch();
        auditLogs.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      } catch {}
    }
    
    // Clean up users
    for (const user of testUsers) {
      try {
        if (user.uid) {
          await db.collection('users').doc(user.uid).delete();
          await admin.auth().deleteUser(user.uid);
        }
      } catch {}
    }
    testUsers = [];
  });

  describe('AUDIT-001: PII Sanitisation in Logs', () => {
    it('login audit log does not contain password or accessToken', async () => {
      if (!admin.apps.length) return;

      const email = `audit-test-${Date.now()}@example.com`;
      const password = 'AuditTest123!';

      // Register user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password })
        .expect(201);

      const user = registerResponse.body.payload.user;
      testUsers.push({ uid: user.uid, email });

      // Login to generate audit log
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200);

      // Query audit logs
      const db = admin.firestore();
      const auditLogs = await db.collection('audit_logs')
        .where('userId', '==', user.uid)
        .where('action', '==', 'LOGIN')
        .get();

      expect(auditLogs.docs.length).toBeGreaterThan(0);

      const logEntry = auditLogs.docs[0].data();
      
      // Ensure no PII in the log
      expect(logEntry).not.toHaveProperty('password');
      expect(logEntry).not.toHaveProperty('accessToken');
      expect(logEntry).not.toHaveProperty('refreshToken');
      
      // Should have safe fields
      expect(logEntry).toHaveProperty('userId');
      expect(logEntry).toHaveProperty('action');
      expect(logEntry).toHaveProperty('timestamp');
    });
  });
});