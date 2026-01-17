/**
 * Jest Test Setup
 * Initializes Firebase with emulator configuration before running tests
 */

const app = require('../src/app');
const { initializeFirebase } = require('../src/config/firebase');

let server;
let testPort;

function normalizeEnvDefaults() {
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  // Don't set PORT here - we'll use dynamic port assignment
  // process.env.PORT = process.env.PORT || '3001';

  process.env.API_RATE_LIMIT_WINDOW_MS = process.env.API_RATE_LIMIT_WINDOW_MS || '60000';
  process.env.API_RATE_LIMIT_MAX_REQUESTS = process.env.API_RATE_LIMIT_MAX_REQUESTS || '100';
  process.env.LOGIN_RATE_LIMIT_WINDOW_MS = process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '60000';
  process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS = process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS || '5';
  process.env.HTTP_CLIENT_TIMEOUT_MS = process.env.HTTP_CLIENT_TIMEOUT_MS || '8000';

  if (process.env.FIREBASE_AUTH_EMULATOR_HOST?.startsWith('127.0.0.1')) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  }
  if (process.env.FIRESTORE_EMULATOR_HOST?.startsWith('127.0.0.1')) {
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  }
}

// Initialize Firebase Admin SDK before running tests
beforeAll((done) => {
  normalizeEnvDefaults();
  jest.setTimeout(30000);

  console.log('🧪 Initializing Firebase for tests...');
  initializeFirebase();
  console.log('✅ Firebase initialized for test suite');

  // Use port 0 to let OS assign an available port dynamically
  server = app.listen(0, () => {
    testPort = server.address().port;
    process.env.PORT = String(testPort);
    process.env.API_BASE_URL = `http://localhost:${testPort}/api/v1`;
    console.log(`🚀 Test server running on http://localhost:${testPort}`);
    done();
  });

  server.on('error', (error) => {
    console.error('❌ Failed to start test server:', error.message);
    done(error);
  });
});

afterAll((done) => {
  if (server) {
    server.close(done);
  } else {
    done();
  }
});
