/**
 * Test Utilities and Helpers
 * Common functions for all test suites
 */

const { getAuth, getFirestore } = require('../../src/config/firebase');

let appInstance = null;
let firebaseInitialized = false;

/**
 * Ensure Firebase Admin SDK is initialized for tests
 * In test mode, Firebase should already be initialized by the main app
 */
function ensureFirebaseInitialized() {
  if (firebaseInitialized) {
    return;
  }

  // In test mode, Firebase should already be initialized by the main app
  // We don't need to initialize it again
  firebaseInitialized = true;
  console.log(' Firebase Admin SDK ready for tests (using main app instance) - FINAL');
}

/**
 * Get or create the test Express app instance
 * @returns {Express} The Express app instance
 */
function getTestApp() {
  if (!appInstance) {
    // Set test environment and mock emulator hosts
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
 * Generate unique email for testing
 * @param {string} prefix - Email prefix
 * @returns {string} Unique email
 */
function generateUniqueEmail(prefix = 'test') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}@test.com`;
}

/**
 * Create a test user - FAST VERSION
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} callSign - Optional call sign
 * @returns {Promise<admin.auth.UserRecord>} Created user record
 */
async function createTestUser(email, password = 'TestPassword123!', callSign = null) {
  try {
    // Ensure Firebase is initialized
    ensureFirebaseInitialized();

    console.log(' createTestUser: Starting user creation for:', email);

    // First, try to delete existing user with this email
    try {
      const auth = getAuth();
      const existingUser = await auth.getUserByEmail(email);
      console.log(' createTestUser: Found existing user, deleting:', existingUser.uid);
      await auth.deleteUser(existingUser.uid);
      const db = getFirestore();
      await db.collection('users').doc(existingUser.uid).delete();
    } catch (error) {
      console.log(' createTestUser: No existing user found, continuing...');
    }

    console.log(' createTestUser: Creating new user in Auth...');
    // Create user in Firebase Auth
    const auth = getAuth();
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: true,
    });
    console.log(' createTestUser: User created in Auth:', userRecord.uid);

    // Wait for user creation to propagate
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(' createTestUser: Creating Firestore document...');
    // Create corresponding Firestore user document
    const db = getFirestore();
    const generatedCallSign = callSign || `TEST${Date.now().toString().slice(-6)}`;
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      callSign: generatedCallSign,
      displayName: `Test User ${generatedCallSign}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isAdmin: false,
      isActive: true,
      status: 'ACTIVE'
    });
    console.log(' createTestUser: Firestore document created');

    // Wait for Firestore write to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(' createTestUser: User creation completed successfully');
    return userRecord;
  } catch (error) {
    console.error(' createTestUser: Error creating test user:', error);
    throw error;
  }
}

/**
 * Delete a test user
 * @param {string} uid - User ID
 */
async function deleteTestUser(uid) {
  try {
    const auth = getAuth();
    await auth.deleteUser(uid);
    const db = getFirestore();
    await db.collection('users').doc(uid).delete();
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw error;
    }
  }
}

/**
 * Generate JWT token
 * @param {string} uid - User ID
 * @returns {Promise<string>} Custom token
 */
async function generateTestToken(uid) {
  const auth = getAuth();
  return auth.createCustomToken(uid);
}

/**
 * Wait helper
 * @param {number} ms - Milliseconds
 */
function wait(ms) {
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
  return `${prefix}-${Date.now()}-${require('crypto').randomBytes(4).toString('hex')}@example.com`;
}

module.exports = {
  getTestApp,
  createTestUser,
  deleteTestUser,
  generateTestToken,
  generateUniqueEmail,
  ensureFirebaseInitialized,
  wait
};
