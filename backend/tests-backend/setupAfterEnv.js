/**
 * Jest Setup File (After Test Framework)
 * Location: tests-backend/setupAfterEnv.js
 *
 * This file runs AFTER the test framework is initialized.
 * Use this for test hooks like beforeAll, afterAll, etc.
 */

const admin = require('firebase-admin');

// ============================================
// 1. EXTEND TEST TIMEOUTS
// ============================================

// Firebase operations can be slower in emulator, especially first call
jest.setTimeout(15000);

// ============================================
// 2. GLOBAL TEST CLEANUP
// ============================================

afterAll(async () => {
  // Clean up Firebase Admin app instances to avoid handle leaks in Jest
  try {
    const apps = admin.apps || [];
    await Promise.all(apps.map((app) => app.delete()));
  } catch {
    // Swallow errors if Firebase was never initialized or already cleaned up
  }
});
