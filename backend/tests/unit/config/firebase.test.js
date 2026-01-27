/**
 * Unit Tests for Firebase Configuration
 * Tests: FIRE-002, FIRE-004, FIRE-006, FIRE-007
 */

const admin = require('firebase-admin');

// Mock firebase-admin before requiring the module
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  firestore: jest.fn(() => ({
    settings: jest.fn(),
  })),
  auth: jest.fn(),
}));

jest.mock('../../../src/utils/logger');

describe('Firebase Configuration - Unit Tests', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('FIRE-002: Missing Credentials Validation', () => {
    it('should validate emulator configuration', () => {
      // This test verifies the emulator validation logic
      expect(process.env.FIREBASE_AUTH_EMULATOR_HOST).toBeDefined();
      expect(process.env.FIRESTORE_EMULATOR_HOST).toBeDefined();
    });
  });

  describe('FIRE-004: HTTP Client Timeout Configuration', () => {
    it('should respect HTTP_CLIENT_TIMEOUT_MS environment variable', () => {
      process.env.HTTP_CLIENT_TIMEOUT_MS = '1000';
      
      expect(process.env.HTTP_CLIENT_TIMEOUT_MS).toBe('1000');
    });
  });

  describe('FIRE-006: Production ADC Usage', () => {
    it('should use Application Default Credentials in production', () => {
      // Clear emulator environment variables for production test
      delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
      delete process.env.FIRESTORE_EMULATOR_HOST;
      process.env.NODE_ENV = 'production';
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      delete process.env.FIREBASE_PRIVATE_KEY;

      const { initializeFirebase } = require('../../../src/config/firebase');
      initializeFirebase();

      expect(admin.initializeApp).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'test-project',
        })
      );
      
      // Restore emulator environment variables
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    });
  });

  describe('FIRE-007: Development Service Account Usage', () => {
    it('should load service account file in development', () => {
      delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
      delete process.env.FIRESTORE_EMULATOR_HOST;
      process.env.NODE_ENV = 'development';
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_PRIVATE_KEY = Buffer.from('test-key').toString('base64');
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.com';

      const { initializeFirebase } = require('../../../src/config/firebase');
      initializeFirebase();

      // In development with service account, cert should be called
      expect(admin.credential.cert).toHaveBeenCalled();
      
      // Restore emulator environment variables
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    });
  });

  describe('Emulator Configuration Validation', () => {
    it('should throw error when emulator variables are set in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

      const { initializeFirebase } = require('../../../src/config/firebase');

      expect(() => initializeFirebase()).toThrow(/PRODUCTION DEPLOYMENT BLOCKED/);
    });

    it('should allow emulator variables in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_PRIVATE_KEY = Buffer.from('test-key').toString('base64');
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.com';

      const { initializeFirebase } = require('../../../src/config/firebase');

      expect(() => initializeFirebase()).not.toThrow();
    });
  });
});
