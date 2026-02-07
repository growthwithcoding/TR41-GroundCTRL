/**
 * Audit Logging Security Tests
 * Tests: Sanitization, timestamp, anonymous
 */

const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

const app = getTestApp();

describe('Audit Logging Security Tests', () => {

  describe('Audit Logging Sanitization', () => {
    it('should not log sensitive data', async () => {
      const spy = jest.spyOn(console, 'log');

      const loginData = {
        email: 'test@example.com',
        password: 'sensitivepassword'
      };

      await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401); // Wrong password

      // Find the audit log in the calls
      const auditCall = spy.mock.calls.find(call => 
        call[0] && call[0].includes('[AUDIT]') && call[0].includes('Login attempt')
      );
      expect(auditCall).toBeDefined();
      
      const loggedString = auditCall[0];
      const metaPart = loggedString.split(' | ')[1];
      const meta = JSON.parse(metaPart);
      
      expect(meta).not.toHaveProperty('password');
      expect(meta).not.toHaveProperty('sensitivepassword');
      expect(meta).toHaveProperty('timestamp');

      spy.mockRestore();
    });
  });

  describe('Timestamp in Logs', () => {
    it('should include timestamp in audit logs', async () => {
      const spy = jest.spyOn(console, 'log');

      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' })
        .expect(401);

      // Find the audit log in the calls
      const auditCall = spy.mock.calls.find(call => 
        call[0] && call[0].includes('[AUDIT]') && call[0].includes('Login failed')
      );
      expect(auditCall).toBeDefined();
      
      const loggedString = auditCall[0];
      const metaPart = loggedString.split(' | ')[1];
      const meta = JSON.parse(metaPart);
      
      expect(meta).toHaveProperty('timestamp');
      expect(new Date(meta.timestamp)).toBeInstanceOf(Date);

      spy.mockRestore();
    });
  });

  describe('Anonymous Logging', () => {
    it('should anonymize user data in logs', async () => {
      const spy = jest.spyOn(console, 'log');

      // Try to login with invalid credentials (anonymous access to auth endpoint)
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'wrongpassword' })
        .expect(401);

      // Find the audit log in the calls
      const auditCall = spy.mock.calls.find(call => 
        call[0] && call[0].includes('[AUDIT]') && call[0].includes('Login failed') && !call[0].includes('unknown user')
      );
      expect(auditCall).toBeDefined();
      
      const loggedString = auditCall[0];
      const metaPart = loggedString.split(' | ')[1];
      const meta = JSON.parse(metaPart);
      
      // Check that user data is anonymized
      expect(meta.userId).toBe('unknown');
      expect(meta.callSign).toBe('unknown');
      expect(meta).toHaveProperty('timestamp');

      spy.mockRestore();
    }, 60000); // 60 second timeout for this test since Firestore timeout takes ~41 seconds
  });
});