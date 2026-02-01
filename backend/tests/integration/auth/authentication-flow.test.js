/**
 * Authentication Flow Integration Tests
 * Tests: Complete registration, login, and lockout flows
 * Migrated from: sprint1/authenticationFlow.test.js
 */

const admin = require('firebase-admin');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

describe('Authentication Flow - Integration Tests', () => {
  let app;
  let testUsers = [];

  beforeAll(() => {
    if (!admin.apps.length) return;
    app = require('../../../src/app');
  });

  afterEach(async () => {
    if (!admin.apps.length) return;
    
    const db = admin.firestore();
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

  describe('User Registration', () => {
    it('registers user and persists Firestore doc with auto-generated callSign', async () => {
      if (!admin.apps.length) return;

      const email = `alice-${Date.now()}@example.com`;
      const password = 'StrongPass123!';

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password })
        .expect(201);

      expect(response.body.status).toBe('GO');
      expect(response.body.payload.user).toBeDefined();
      expect(response.body.payload.tokens.accessToken).toBeDefined();

      const user = response.body.payload.user;
      testUsers.push({ uid: user.uid, email });

      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(user.uid).get();

      expect(userDoc.exists).toBe(true);
      const userData = userDoc.data();
      expect(userData.email).toBe(email);
      expect(userData.callSign).toBeDefined();
      expect(userData.callSign).toMatch(/^Pilot-/);
    });

    it('rejects registration with invalid email format', async () => {
      if (!admin.apps.length) return;

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'invalid-email', password: 'StrongPass123!' })
        .expect(400); // Validation errors return 400 Bad Request

      expect(response.body.status).toBe('NO-GO');
      expect(response.body.payload.error.details).toBeDefined();
    });

    it('rejects password under 12 characters', async () => {
      if (!admin.apps.length) return;

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: `test-${Date.now()}@example.com`, password: 'Short1!' })
        .expect(400); // Validation errors return 400 Bad Request

      expect(response.body.status).toBe('NO-GO');
    });
  });

  describe('Login Success & JWT Issuance', () => {
    it('logs in user with valid credentials and returns JWT', async () => {
      if (!admin.apps.length) return;

      const email = `logintest-${Date.now()}@example.com`;
      const password = 'StrongPass123!';

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password });

      const user = registerResponse.body.payload.user;
      testUsers.push({ uid: user.uid, email });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200);

      expect(loginResponse.body.payload.tokens.accessToken).toBeDefined();
      
      const accessToken = loginResponse.body.payload.tokens.accessToken;
      expect(accessToken.split('.').length).toBe(3);
    });
  });

  describe('Login Failure & Lockout', () => {
    it('rejects login with invalid credentials', async () => {
      if (!admin.apps.length) return;

      const email = `faillogin-${Date.now()}@example.com`;
      const password = 'StrongPass123!';

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password });

      testUsers.push({ uid: registerResponse.body.payload.user.uid, email });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'WrongPassword123!' })
        .expect(401);

      expect(response.body.status).toBe('NO-GO');
    });

    it('locks account after 5 failed login attempts', async () => {
      if (!admin.apps.length) return;

      const email = `lockout-${Date.now()}@example.com`;
      const password = 'StrongPass123!';

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password });

      testUsers.push({ uid: registerResponse.body.payload.user.uid, email });

      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({ email, password: 'WrongPassword!' });
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password });

      expect([401, 423, 429]).toContain(response.status);
      expect(response.body.payload.error.message).toMatch(/locked|lockout/i);
    });
  });

  describe('Token Expiration & Validation', () => {
    it('access token contains exp claim within 15-30 minutes', async () => {
      if (!admin.apps.length) return;

      const email = `token-test-${Date.now()}@example.com`;
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password: 'TokenTest123!' });

      testUsers.push({ uid: response.body.payload.user.uid, email });

      const token = response.body.payload.tokens.accessToken;
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      expect(payload.exp).toBeDefined();

      const nowSecs = Math.floor(Date.now() / 1000);
      const ttlSeconds = payload.exp - nowSecs;

      expect(ttlSeconds).toBeGreaterThan(15 * 60);
      expect(ttlSeconds).toBeLessThan(30 * 60 + 30);
    });

    it('rejects expired access token', async () => {
      if (!admin.apps.length) return;

      const email = `expired-${Date.now()}@example.com`;
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password: 'ExpiredTest123!' });

      const user = registerResponse.body.payload.user;
      testUsers.push({ uid: user.uid, email });

      const expiredToken = jwt.sign(
        { uid: user.uid, email: user.email },
        JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get(`/api/v1/users/${user.uid}`)
        .set('Authorization', `Bearer ${expiredToken}`);

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Logout & Session Termination', () => {
    it('invalidates access token after logout', async () => {
      if (!admin.apps.length) return;

      const email = `logout-${Date.now()}@example.com`;
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password: 'LogoutTest123!' });

      const user = response.body.payload.user;
      const token = response.body.payload.tokens.accessToken;
      testUsers.push({ uid: user.uid, email });

      await request(app)
        .get(`/api/v1/users/${user.uid}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const postLogout = await request(app)
        .get(`/api/v1/users/${user.uid}`)
        .set('Authorization', `Bearer ${token}`);

      expect([401, 403]).toContain(postLogout.status);
    });
  });
});
