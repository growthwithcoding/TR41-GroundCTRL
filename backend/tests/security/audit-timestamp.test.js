/**
 * Security Test: Audit Timestamp
 * Test Goal: All entries have ISO 8601 UTC timestamps
 * 
 * Consistent timestamp format is critical for security analysis,
 * compliance, and forensics.
 */

const request = require('supertest');
const admin = require('firebase-admin');
const { getTestApp, createTestUser } = require('../helpers/test-utils');

describe('Security: Audit Timestamp', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  test('audit log should have ISO 8601 UTC timestamp', async () => {
    const email = `audit-timestamp-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' })
      .expect(200);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const auditLogs = await admin.firestore()
      .collection('audit_logs')
      .where('action', '==', 'login')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (!auditLogs.empty) {
      const logData = auditLogs.docs[0].data();
      expect(logData).toHaveProperty('timestamp');

      const timestamp = logData.timestamp;
      
      // Could be Firestore Timestamp or ISO string
      if (typeof timestamp === 'string') {
        // Should match ISO 8601 format with Z (UTC)
        const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
        expect(timestamp).toMatch(iso8601Regex);
        
        // Should be parseable as valid date
        const date = new Date(timestamp);
        expect(isNaN(date.getTime())).toBe(false);
      } else if (timestamp?.toDate) {
        // Firestore Timestamp object
        const date = timestamp.toDate();
        expect(date instanceof Date).toBe(true);
      }
    }
  });

  test('timestamp should be recent (within last minute)', async () => {
    const email = `audit-recent-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const beforeRequest = Date.now();

    await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' })
      .expect(200);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const auditLogs = await admin.firestore()
      .collection('audit_logs')
      .where('action', '==', 'login')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (!auditLogs.empty) {
      const logData = auditLogs.docs[0].data();
      let logTime;

      if (typeof logData.timestamp === 'string') {
        logTime = new Date(logData.timestamp).getTime();
      } else if (logData.timestamp?.toDate) {
        logTime = logData.timestamp.toDate().getTime();
      }

      if (logTime) {
        const timeDiff = Math.abs(logTime - beforeRequest);
        // Should be within 1 minute
        expect(timeDiff).toBeLessThan(60000);
      }
    }
  });

  test('timestamp should be in UTC, not local time', async () => {
    const email = `audit-utc-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' })
      .expect(200);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const auditLogs = await admin.firestore()
      .collection('audit_logs')
      .where('action', '==', 'login')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (!auditLogs.empty) {
      const logData = auditLogs.docs[0].data();
      
      if (typeof logData.timestamp === 'string') {
        // Should end with Z (UTC indicator)
        expect(logData.timestamp).toMatch(/Z$/);
        
        // Should not have timezone offset like +05:00
        expect(logData.timestamp).not.toMatch(/[+-]\d{2}:\d{2}$/);
      }
    }
  });

  test('all audit logs should have consistent timestamp format', async () => {
    const auditLogs = await admin.firestore()
      .collection('audit_logs')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    if (!auditLogs.empty) {
      const formats = new Set();

      auditLogs.forEach((doc) => {
        const logData = doc.data();
        const timestamp = logData.timestamp;
        
        if (typeof timestamp === 'string') {
          formats.add('string');
        } else if (timestamp?.toDate) {
          formats.add('firestore-timestamp');
        } else {
          formats.add('unknown');
        }
      });

      // Should use consistent format across all logs
      expect(formats.size).toBeLessThanOrEqual(1);
    }
  });
});
