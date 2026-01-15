/**
 * Jest Test Setup
 * Initializes Firebase with emulator configuration before running tests
 */

const { initializeFirebase } = require('../src/config/firebase');

// Initialize Firebase Admin SDK before running tests
beforeAll(() => {
  console.log('🧪 Initializing Firebase for tests...');
  initializeFirebase();
  console.log('✅ Firebase initialized for test suite');
});
