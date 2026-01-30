/**
 * Audit Timestamp Integration Tests
 * Tests: AUDIT-002
 * Ensures audit logs have proper ISO 8601 UTC timestamps
 */

const admin = require('firebase-admin');
const request = require('supertest');

describe('Audit Timestamp - Integration Tests', () => {
  let app;
  let testUsers = [];

  beforeAll(() => {
    if (!admin.apps.length) return;
    app = require('../../../src/app');
  });

  afterEach(async () => {
    if (!admin.apps.length) return;
    
    const db = admin.firestore();
    
    // Clean up audit logs
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

  describe('AUDIT-002: ISO 8601 UTC Timestamps', () => {
    it('audit entries have ISO 8601 UTC timestamps', async () => {
      if (!admin.apps.length) return;

      const email = `timestamp-test-${Date.now()}@example.com`;
      const password = 'TimestampTest123!';

      // Register user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password })
        .expect(201);

      const user = registerResponse.body.payload.user;
      testUsers.push({ uid: user.uid, email });

      // Perform action to generate audit log
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200);

      // Query audit logs
      const db = admin.firestore();
      const auditLogs = await db.collection('audit_logs')
        .where('userId', '==', user.uid)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      expect(auditLogs.docs.length).toBeGreaterThan(0);

      const logEntry = auditLogs.docs[0].data();
      
      expect(logEntry).toHaveProperty('timestamp');
      const timestamp = logEntry.timestamp;
      
      // Check if it's a Firestore Timestamp or string
      let timestampStr;
      if (timestamp && typeof timestamp.toDate === 'function') {
        timestampStr = timestamp.toDate().toISOString();
      } else if (typeof timestamp === 'string') {
        timestampStr = timestamp;
      } else {
        fail('Timestamp is not in expected format');
      }
      
      // Should match ISO 8601 UTC format
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
      expect(timestampStr).toMatch(isoRegex);
    });
  });
});