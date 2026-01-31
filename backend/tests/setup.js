/**
 * Global Test Setup
 * Runs before all tests
 */

// Set test environment variables BEFORE any imports
process.env.NODE_ENV = 'test';
// Use 127.0.0.1 instead of localhost for better compatibility
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only-do-not-use-in-production';
process.env.FIREBASE_WEB_API_KEY = 'test-api-key-for-emulator';
process.env.FIREBASE_PROJECT_ID = 'groundctrl-c8860'; // Match .firebaserc project ID

console.log('TEST SETUP: FIREBASE_PROJECT_ID set to:', process.env.FIREBASE_PROJECT_ID);

// Disable external network requests
process.env.FIREBASE_EMULATOR_HUB = '127.0.0.1:4400';

// Configure rate limits for testing - much more lenient to avoid test failures
// Use shorter windows and higher limits
process.env.LOGIN_RATE_LIMIT_WINDOW_MS = '1000'; // 1 second
process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS = '1000'; // 1000 requests per second
process.env.AUTH_RATE_LIMIT_WINDOW_MS = '1000'; // 1 second 
process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = '10000'; // 10000 requests per second
process.env.API_RATE_LIMIT_WINDOW_MS = '1000'; // 1 second
process.env.API_RATE_LIMIT_MAX_REQUESTS = '10000'; // 10000 requests per second
process.env.HELP_AI_RATE_LIMIT_WINDOW_MS = '1000'; // 1 second
process.env.HELP_AI_RATE_LIMIT_MAX_REQUESTS = '1000'; // 1000 requests per second

// Suppress console logs during tests (optional)
if (process.env.SUPPRESS_TEST_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Set longer timeout for all tests - Firebase emulator operations can be slow
jest.setTimeout(60000); // Increase to 60s for Firebase emulator operations

