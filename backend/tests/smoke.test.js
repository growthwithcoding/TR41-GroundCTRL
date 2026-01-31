/**
 * SMOKE TEST - Run this first to verify emulator setup
 */
const admin = require('firebase-admin');
const request = require('supertest');
const { getTestApp, createTestUser, generateUniqueEmail } = require('../helpers/test-utils');

describe('SMOKE TEST: Emulator Connectivity', () => {
  let app;

  beforeAll(() => {
    app = getTestApp();
  });

  test('Firebase Auth emulator is reachable', async () => {
    const email = generateUniqueEmail('smoke');
    const user = await admin.auth().createUser({ email, password: 'test123' });
    expect(user.uid).toBeDefined();
    await admin.auth().deleteUser(user.uid);
  });

  test('Firestore emulator is reachable', async () => {
    const db = admin.firestore();
    const testDoc = await db.collection('test').add({ test: true });
    expect(testDoc.id).toBeDefined();
    await testDoc.delete();
  });

  test('Login endpoint works end-to-end', async () => {
    const email = generateUniqueEmail('smoke-login');
    const password = 'TestPassword123!';
    
    await createTestUser(email, password);
    
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });
    
    if (response.status !== 200) {
      console.error('SMOKE TEST FAILED:', response.body);
    }
    
    expect(response.status).toBe(200);
    expect(response.body.payload.tokens.accessToken).toBeDefined();
  });
});
