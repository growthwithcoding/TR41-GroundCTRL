/**
 * Jest Setup File for Firebase Emulator Tests
 * Location: tests-backend/setup.js
 *
 * This file runs BEFORE all tests to configure the test environment.
 * Critical: Sets emulator environment variables BEFORE Firebase SDK imports.
 */

// ============================================
// 0. LOAD ENVIRONMENT VARIABLES FROM .env.test
// ============================================

const dotenv = require('dotenv');
const path = require('path');

// Load .env.test file
dotenv.config({ path: path.join(__dirname, '../.env.test') });

// ============================================
// 1. SET EMULATOR ENVIRONMENT VARIABLES
// ============================================

// Must be set BEFORE any Firebase module imports
process.env.FIREBASE_AUTH_EMULATOR_HOST =
  process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST =
  process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';

// ============================================
// 2. SET TEST ENVIRONMENT
// ============================================

process.env.NODE_ENV = 'test';

// ============================================
// 3. SET API BASE URL FOR TEST REQUESTS
// ============================================

process.env.API_BASE_URL =
  process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

// ============================================
// 4. FIREBASE CONFIGURATION
// ============================================

process.env.FIREBASE_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID || 'test-project';
process.env.FIREBASE_WEB_API_KEY =
  process.env.FIREBASE_WEB_API_KEY || 'test-api-key-12345';

// ============================================
// 5. AXIOS CONFIGURATION FOR COOKIES
// ============================================

const axios = require('axios');
axios.defaults.withCredentials = true; // Enable sending/receiving cookies

// ============================================
// 6. INITIALIZE FIREBASE FOR TESTING
// ============================================

// Use the application's Firebase initialization wrapper
// This ensures the app's isInitialized flag is set correctly
try {
  const { initializeFirebase } = require('../src/config/firebase');
  initializeFirebase();
} catch (error) {
  console.error('⚠️  Failed to initialize Firebase:', error.message);
  // Fallback: Initialize directly if the wrapper fails
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
      admin.firestore().settings({
        host: `${host}:${port}`,
        ssl: false
      });
    }
  }
}

// ============================================
// 7. LOGGING
// ============================================

console.log('\n' + '='.repeat(60));
console.log('🧪 TEST ENVIRONMENT INITIALIZED');
console.log('='.repeat(60));
console.log('Firebase Auth Emulator: ' + process.env.FIREBASE_AUTH_EMULATOR_HOST);
console.log('Firestore Emulator: ' + process.env.FIRESTORE_EMULATOR_HOST);
console.log('API Base URL: ' + process.env.API_BASE_URL);
console.log('Project ID: ' + process.env.FIREBASE_PROJECT_ID);
console.log('Node Environment: ' + process.env.NODE_ENV);
console.log('='.repeat(60) + '\n');
