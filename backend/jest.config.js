module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/scripts/**',
  ],
  testMatch: [
    '**/tests-backend/**/*.test.js',
  ],
  verbose: true,
};
