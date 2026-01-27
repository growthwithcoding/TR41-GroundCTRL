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
  detectOpenHandles: false, // Don't hang waiting for handles
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
