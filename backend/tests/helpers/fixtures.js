/**
 * Test Data Fixtures
 * Common test data used across test suites
 */

const userFixtures = {
  validUser: {
    email: 'valid.user@example.com',
    password: 'ValidPassword123!',
    callSign: 'TESTUSER',
  },
  
  duplicateCallSignUser: {
    email: 'duplicate@example.com',
    password: 'TestPassword123!',
    callSign: 'DUPLICATE',
  },

  invalidEmail: {
    email: 'invalid-email',
    password: 'TestPassword123!',
  },

  weakPassword: {
    email: 'weak@example.com',
    password: '123',
  },
};

const satelliteFixtures = {
  validSatellite: {
    name: 'Test Satellite',
    noradId: '12345',
    type: 'COMM',
  },

  minimalSatellite: {
    name: 'Minimal Sat',
  },
};

const aiHelpFixtures = {
  validQuestion: {
    question: 'How do I launch a satellite?',
  },

  longQuestion: {
    question: 'A'.repeat(5000),
  },

  maliciousQuestion: {
    question: '<script>alert(1)</script>',
  },
};

module.exports = {
  userFixtures,
  satelliteFixtures,
  aiHelpFixtures,
};
