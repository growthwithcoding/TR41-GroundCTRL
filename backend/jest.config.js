/**
 * Jest Configuration for GroundCTRL/MissionCTRL Backend
 * Location: backend/jest.config.js
 * 
 * FIXED: Removed jest-junit reporter that isn't installed
 * CRITICAL: setupFilesAfterEnv must point to tests-backend/setup.js
 */

module.exports = {
  // Test environment (Node.js, not browser)
  testEnvironment: 'node',

  // Root directory for Jest
  rootDir: '.',

  // CRITICAL: Restrict Jest to only search within this directory
  roots: ['<rootDir>'],

  // CRITICAL: Don't look for config files in parent directories
  haste: {
    enableSymlinks: false,
  },

  // Match all .test.js files in tests-backend directory
  testMatch: ['<rootDir>/tests-backend/**/*.test.js'],

  // Ignore test files outside of this project
  testPathIgnorePatterns: [
    '/node_modules/',
    '/\\.\\./.*',  // Ignore any paths containing ../
  ],

  // CRITICAL: Prevent Jest from looking in parent directories for modules
  modulePathIgnorePatterns: [
    '<rootDir>/\\.\\.',  // Ignore parent directory
    '^\\.\\.',           // Ignore paths starting with ..
  ],

  // ✅ CRITICAL: Setup files to run before test framework (for env vars)
  setupFiles: ['<rootDir>/tests-backend/setup.js'],

  // ✅ CRITICAL: Setup files to run after test framework (for hooks)
  setupFilesAfterEnv: ['<rootDir>/tests-backend/setupAfterEnv.js'],

  // Increase timeout for async operations
  testTimeout: 15000,

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.config.js',
    '!src/index.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests-backend/'
  ],

  // Verbose output for debugging
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Reset mocks between tests
  resetMocks: true,

  // Show which tests are slow
  slowTestThreshold: 5
};
