/**
 * Jest Configuration for GroundCTRL/MissionCTRL Backend
 * Location: backend/jest.config.js
 */

module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>'],
  haste: {
    enableSymlinks: false,
  },

  // Set environment variables BEFORE any modules load
  globals: {
    'process.env.FIREBASE_PROJECT_ID': 'groundctrl-c8860',
    'process.env.NODE_ENV': 'test',
    'process.env.FIREBASE_AUTH_EMULATOR_HOST': '127.0.0.1:9099',
    'process.env.FIRESTORE_EMULATOR_HOST': '127.0.0.1:8080',
    'process.env.JWT_SECRET': 'test-secret-key-for-testing-only-do-not-use-in-production',
    'process.env.FIREBASE_WEB_API_KEY': 'test-api-key-for-emulator',
  },

  // Updated: Use new tests/ directory
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],

  testPathIgnorePatterns: [
    '/node_modules/',
    '/\\.\\./.*',
    '/tests-backend/',  // Ignore old directory
  ],

  modulePathIgnorePatterns: [
    '<rootDir>/\\.\\.',
    '^\\.\\.',
  ],

  // Updated: Point to new tests/setup.js location
  setupFiles: ['<rootDir>/tests/setup.js'],

  // Updated: Point to new setupAfterEnv.js if it exists
  // setupFilesAfterEnv: ['<rootDir>/tests/setupAfterEnv.js'],

  testTimeout: 30000, // 30 seconds per test
  forceExit: true, // Force exit after all tests complete
  detectOpenHandles: true, // Detect async operations that kept running after tests
  collectCoverage: false,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/tests-backend/'
  ],
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  slowTestThreshold: 5
};
