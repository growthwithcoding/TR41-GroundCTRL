/**
 * Test Utilities and Helpers
 * Common functions for all test suites
 */

const admin = require('firebase-admin');

let appInstance = null;

/**
 * Get or create the test Express app instance
 * This ensures Firebase is only initialized once across all tests
 * @returns {Express} The Express app instance
 */
function getTestApp() {
  if (!appInstance) {
    // Set emulator hosts before requiring the app
    process.env.NODE_ENV = 'test';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    process.env.FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || 'test-api-key-for-emulator';

    // Clear the require cache to ensure fresh initialization
    delete require.cache[require.resolve('../../src/app')];

    appInstance = require('../../src/app');
  }
  return appInstance;
}

/**
 * Create a test user in Firebase Auth Emulator AND Firestore
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} callSign - Optional call sign
 * @returns {Promise<admin.auth.UserRecord>} Created user record
 */
async function createTestUser(email, password = 'TestPassword123!', callSign = null) {
  try {
    // First, try to delete existing user with this email
    try {
      const existingUser = await admin.auth().getUserByEmail(email);
      await admin.auth().deleteUser(existingUser.uid);
      // Also delete Firestore document
      const db = admin.firestore();
      await db.collection('users').doc(existingUser.uid).delete();
      // Wait longer for deletion to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      // User doesn't exist, continue
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: true,
    });

    // Wait longer for user creation to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create corresponding Firestore user document (REQUIRED for login!)
    const db = admin.firestore();
    const generatedCallSign = callSign || `TEST${Date.now().toString().slice(-6)}`;
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      callSign: generatedCallSign,
      displayName: `Test User ${generatedCallSign}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isAdmin: false,
      isActive: true,
      status: 'ACTIVE'
    });

    // Wait longer for Firestore write to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    return userRecord;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

/**
 * Delete a test user from Firebase Auth and Firestore
 * @param {string} uid - User ID
 */
async function deleteTestUser(uid) {
  try {
    await admin.auth().deleteUser(uid);
    const db = admin.firestore();
    await db.collection('users').doc(uid).delete();
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw error;
    }
  }
}

/**
 * Generate a valid JWT token for testing
 * @param {string} uid - User ID
 * @returns {Promise<string>} Custom token
 */
async function generateTestToken(uid) {
  return admin.auth().createCustomToken(uid);
}

/**
 * Wait helper
 * @param {number} ms - Milliseconds to wait
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Login with retry logic for flaky emulator
 * @param {object} app - Express app
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<object>} Login response
 */
async function loginWithRetry(app, email, password, maxRetries = 3) {
  const request = require('supertest');
  let lastResponse;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    lastResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });
    
    if (lastResponse.status === 200) {
      return lastResponse;
    }
    
    console.log(`Login attempt ${attempt}/${maxRetries} failed with status ${lastResponse.status}`);
    
    if (attempt < maxRetries) {
      await wait(1000);
    }
  }
  
  return lastResponse;
}

module.exports = {
  getTestApp,
  createTestUser,
  deleteTestUser,
  generateTestToken,
  wait,
  loginWithRetry
};
