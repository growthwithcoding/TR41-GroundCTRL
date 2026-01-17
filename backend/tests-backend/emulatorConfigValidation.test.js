/**
 * Firebase Emulator Configuration Validation Tests
 * 
 * These tests verify that the application correctly prevents emulator
 * variables from being set in production environments.
 */

describe('Firebase Emulator Configuration Validation', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Clear any cached Firebase modules
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Production Environment', () => {
    it('should throw error when FIREBASE_AUTH_EMULATOR_HOST is set in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';

      const { initializeFirebase } = require('../src/config/firebase');

      try {
        initializeFirebase();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('PRODUCTION DEPLOYMENT BLOCKED');
        expect(error.message).toContain('FIREBASE_AUTH_EMULATOR_HOST');
      }
    });

    it('should throw error when FIRESTORE_EMULATOR_HOST is set in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';

      const { initializeFirebase } = require('../src/config/firebase');

      try {
        initializeFirebase();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('PRODUCTION DEPLOYMENT BLOCKED');
        expect(error.message).toContain('FIRESTORE_EMULATOR_HOST');
      }
    });

    it('should throw error when both emulator variables are set in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';

      const { initializeFirebase } = require('../src/config/firebase');

      try {
        initializeFirebase();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('PRODUCTION DEPLOYMENT BLOCKED');
        expect(error.message).toContain('FIREBASE_AUTH_EMULATOR_HOST');
        expect(error.message).toContain('FIRESTORE_EMULATOR_HOST');
      }
    });

    it('should initialize successfully when no emulator variables are set in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      
      // Remove any emulator variables
      delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
      delete process.env.FIRESTORE_EMULATOR_HOST;

      const { initializeFirebase } = require('../src/config/firebase');

      // Should not throw
      expect(() => initializeFirebase()).not.toThrow(/PRODUCTION DEPLOYMENT BLOCKED/);
    });
  });

  describe('Development Environment', () => {
    it('should allow emulator variables in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';

      const { initializeFirebase } = require('../src/config/firebase');

      // Should not throw emulator-related errors
      expect(() => initializeFirebase()).not.toThrow(/PRODUCTION DEPLOYMENT BLOCKED/);
    });

    it('should work without emulator variables in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      
      // Remove any emulator variables
      delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
      delete process.env.FIRESTORE_EMULATOR_HOST;

      const { initializeFirebase } = require('../src/config/firebase');

      // Should not throw emulator-related errors
      expect(() => initializeFirebase()).not.toThrow(/PRODUCTION DEPLOYMENT BLOCKED/);
    });
  });

  describe('Error Message Quality', () => {
    it('should provide clear instructions in error message', () => {
      process.env.NODE_ENV = 'production';
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';

      const { initializeFirebase } = require('../src/config/firebase');

      try {
        initializeFirebase();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('PRODUCTION DEPLOYMENT BLOCKED');
        expect(error.message).toContain('FIREBASE_AUTH_EMULATOR_HOST');
        expect(error.message).toContain('apphosting.yaml');
        expect(error.message).toContain('PRODUCTION_DEPLOYMENT.md');
      }
    });
  });
});
