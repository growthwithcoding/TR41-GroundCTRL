/**
 * Jest Configuration for GroundCTRL/MissionCTRL Backend
 * Location: backend/jest.config.js
 */

module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  haste: {
    enableSymlinks: false,
  },

  // Run tests sequentially to avoid port conflicts
  maxWorkers: 1,

  // Help Jest find modules - search in src/ directory and node_modules
  moduleDirectories: ['node_modules', 'src'],

  // Map absolute imports to support cleaner paths
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
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

  // Transform ES modules in node_modules (for p-queue)
  transformIgnorePatterns: [
    'node_modules/(?!(p-queue|eventemitter3)/)',
  ],

  // Updated: Point to new tests/setup.js location
  setupFiles: ['<rootDir>/tests/setup.js'],

  // Teardown after each test file to prevent open handles
  setupFilesAfterEnv: ['<rootDir>/tests/teardown.js'],

  // Global teardown for final cleanup
  globalTeardown: '<rootDir>/tests/global-teardown.js',

  testTimeout: 90000, // 90 seconds per test (increased for CI environments)
  forceExit: false, // Don't force exit - let cleanup complete naturally
  detectOpenHandles: true, // Detect async operations that keep running
  collectCoverage: false,
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
