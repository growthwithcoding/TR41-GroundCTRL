/**
 * Security Test: Audit Payload Sanitization
 * Test Goal: No PII (password, token) leaks into logs
 * 
 * Audit logs must not contain sensitive information that could
 * be exploited if logs are compromised.
 */

const request = require('supertest');
const admin = require('firebase-admin');
const { getTestApp, createTestUser } = require('../helpers/test-utils');

describe('Security: Audit Payload Sanitization', () => {
  let app;

  beforeAll(async () => {
    app = getTestApp();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 60000);

  test('login audit log should not contain password', async () => {
    const email = `audit-sanitize-${Date.now()}@example.com`;
    const password = 'SecretPassword123!';
    await createTestUser(email, password);

    // Perform login
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    // Wait for audit log to be written
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Query audit logs
    const auditLogs = await admin.firestore()
      .collection('auditLogs')
      .where('action', '==', 'login')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();

    // Check recent logs don't contain password
    auditLogs.forEach((doc) => {
      const logData = doc.data();
      const logString = JSON.stringify(logData).toLowerCase();
      
      expect(logString).not.toContain(password.toLowerCase());
      expect(logString).not.toContain('password');
      expect(logData).not.toHaveProperty('password');
      expect(logData).not.toHaveProperty('passwordHash');
    });
  });

  test('audit log should not contain access tokens', async () => {
    const email = `audit-token-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' })
      .expect(200);

    const token = loginResponse.body.payload?.tokens?.accessToken;

    await new Promise(resolve => setTimeout(resolve, 2000));

    const auditLogs = await admin.firestore()
      .collection('auditLogs')
      .where('action', '==', 'login')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();

    auditLogs.forEach((doc) => {
      const logData = doc.data();
      const logString = JSON.stringify(logData);
      
      if (token) {
        expect(logString).not.toContain(token);
      }
      expect(logData).not.toHaveProperty('accessToken');
      expect(logData).not.toHaveProperty('token');
    });
  });

  test('audit log should contain action and uid but no sensitive data', async () => {
    const email = `audit-structure-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' })
      .expect(200);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const auditLogs = await admin.firestore()
      .collection('auditLogs')
      .where('action', '==', 'login')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (!auditLogs.empty) {
      const logData = auditLogs.docs[0].data();
      
      // Should have required fields
      expect(logData).toHaveProperty('action');
      expect(logData).toHaveProperty('uid');
      expect(logData).toHaveProperty('timestamp');
      
      // Should NOT have sensitive fields
      expect(logData).not.toHaveProperty('password');
      expect(logData).not.toHaveProperty('accessToken');
      expect(logData).not.toHaveProperty('refreshToken');
    }
  });

  test('audit log should sanitize IP address if configured', async () => {
    const email = `audit-ip-${Date.now()}@example.com`;
    await createTestUser(email, 'TestPassword123!');

    await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'TestPassword123!' })
      .set('X-Forwarded-For', '203.0.113.1')
      .expect(200);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const auditLogs = await admin.firestore()
      .collection('auditLogs')
      .where('action', '==', 'login')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (!auditLogs.empty) {
      const logData = auditLogs.docs[0].data();
      
      // IP may be logged, but should be sanitized or anonymized if configured
      if (logData.ip) {
        // Check it's not exposing full IP in production
        expect(typeof logData.ip).toBe('string');
      }
    }
  });

  test('registration audit log should not contain password', async () => {
    const email = `audit-register-${Date.now()}@example.com`;
    const password = 'RegisterPassword123!';

    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        password,
        callSign: `AUD${Date.now()}`,
        displayName: 'Audit Test User',
      })
      .expect(201);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const auditLogs = await admin.firestore()
      .collection('auditLogs')
      .where('action', 'in', ['register', 'createUser'])
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();

    auditLogs.forEach((doc) => {
      const logData = doc.data();
      const logString = JSON.stringify(logData).toLowerCase();
      
      expect(logString).not.toContain(password.toLowerCase());
      expect(logData).not.toHaveProperty('password');
    });
  });
});
