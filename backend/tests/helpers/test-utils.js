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
    
    // Clear the require cache to ensure fresh initialization
    delete require.cache[require.resolve('../../src/app')];
    
    appInstance = require('../../src/app');
  }
  return appInstance;
}

/**
 * Create a test user in Firebase Auth Emulator
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
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for deletion to propagate
    } catch (error) {
      // User doesn't exist, continue
    }
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: true,
    });
    
    // Wait for user creation to propagate
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create corresponding Firestore user document
    const db = admin.firestore();
    const generatedCallSign = callSign || `TEST${Date.now().toString().slice(-6)}`;
    await db.collection('users').doc(userRecord.uid).set({
      email,
      callSign: generatedCallSign,
      displayName: `Test User ${generatedCallSign}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isAdmin: false,
      status: 'ACTIVE'
    });
    
    // Wait for Firestore write to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return userRecord;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

/**
 * Delete a test user from Firebase Auth
 * @param {string} uid - User ID
 */
async function deleteTestUser(uid) {
  try {
    await admin.auth().deleteUser(uid);
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
 * Sign in and get ID token
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<string>} ID token
 */
async function signInTestUser(email, password) {
  // This would normally use Firebase Client SDK
  // For now, create a custom token
  const user = await admin.auth().getUserByEmail(email);
  return generateTestToken(user.uid);
}

/**
 * Clean up test data from Firestore
 * @param {string} collection - Collection name
 */
async function cleanupTestData(collection) {
  const db = admin.firestore();
  const snapshot = await db.collection(collection).get();
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  
  if (snapshot.docs.length > 0) {
    await batch.commit();
  }
}

/**
 * Wait for a specific amount of time
 * @param {number} ms - Milliseconds to wait
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function multiple times with delay
 * @param {Function} fn - Function to retry
 * @param {number} retries - Number of retries
 * @param {number} delayMs - Delay between retries
 * @returns {Promise<any>} Function result
 */
async function retryOperation(fn, retries = 3, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await delay(delayMs);
    }
  }
}

/**
 * Generate a unique email for testing
 * @param {string} prefix - Email prefix
 * @returns {string} Unique email
 */
function generateUniqueEmail(prefix = 'test') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

module.exports = {
  getTestApp,
  createTestUser,
  deleteTestUser,
  generateTestToken,
  signInTestUser,
  cleanupTestData,
  delay,
  retryOperation,
  generateUniqueEmail,
};
