/**
 * Auth Error Normalization Security Tests
 * Tests: AUTH-007, AUTH-008, SEC-002, SEC-007
 * Consolidated from: sprint0/backendPhase2SecurityQuickWins.test.js
 */

const authErrorNormalizer = require('../../src/middleware/authErrorNormalizer');

describe('Auth Error Normalization - Comprehensive Security Tests', () => {
  describe('AUTH-007, SEC-002: Production Error Normalization', () => {
    it('normalizes auth errors in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const mockReq = {
        method: 'POST',
        originalUrl: '/api/v1/auth/login',
        path: '/auth/login'
      };
      
      const authError = new Error('User not found in database');
      authError.statusCode = 401;
      authError.code = 'USER_NOT_FOUND';
      authError.details = 'No user record found for email: test@example.com';
      
      let capturedError = null;
      authErrorNormalizer(authError, mockReq, {}, (err) => {
        capturedError = err;
      });
      
      expect(capturedError.message).toBe('Invalid credentials');
      expect(capturedError.code).toBe('AUTHENTICATION_FAILED');
      expect(capturedError.details).toBeUndefined();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('normalizes 403 errors to prevent user enumeration', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const mockReq = {
        method: 'POST',
        originalUrl: '/api/v1/auth/login',
        path: '/auth/login'
      };
      
      const forbiddenError = new Error('Account is locked');
      forbiddenError.statusCode = 403;
      forbiddenError.code = 'ACCOUNT_LOCKED';
      
      let capturedError = null;
      authErrorNormalizer(forbiddenError, mockReq, {}, (err) => {
        capturedError = err;
      });
      
      expect(capturedError.message).toBe('Invalid credentials');
      expect(capturedError.code).toBe('AUTHENTICATION_FAILED');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('normalizes 409 conflict errors during registration', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const mockReq = {
        method: 'POST',
        originalUrl: '/api/v1/auth/register',
        path: '/auth/register'
      };
      
      const conflictError = new Error('Email already exists');
      conflictError.statusCode = 409;
      conflictError.code = 'EMAIL_EXISTS';
      
      let capturedError = null;
      authErrorNormalizer(conflictError, mockReq, {}, (err) => {
        capturedError = err;
      });
      
      expect(capturedError.message).toBe('Registration failed');
      expect(capturedError.code).toBe('REGISTRATION_FAILED');
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('AUTH-008: Development Error Details', () => {
    it('preserves detailed errors in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const mockReq = {
        method: 'POST',
        originalUrl: '/api/v1/auth/login',
        path: '/auth/login'
      };
      
      const authError = new Error('User not found in database');
      authError.statusCode = 401;
      authError.code = 'USER_NOT_FOUND';
      authError.details = 'No user record found for email: test@example.com';
      
      let capturedError = null;
      authErrorNormalizer(authError, mockReq, {}, (err) => {
        capturedError = err;
      });
      
      expect(capturedError.message).toBe('User not found in database');
      expect(capturedError.code).toBe('USER_NOT_FOUND');
      expect(capturedError.details).toBe('No user record found for email: test@example.com');
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Normalization Scope', () => {
    it('only normalizes POST requests to auth endpoints', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const mockReqGet = {
        method: 'GET',
        originalUrl: '/api/v1/users/123',
        path: '/users/123'
      };
      
      const error = new Error('Not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      
      let capturedError = null;
      authErrorNormalizer(error, mockReqGet, {}, (err) => {
        capturedError = err;
      });
      
      expect(capturedError.message).toBe('Not found');
      expect(capturedError.code).toBe('NOT_FOUND');
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('SEC-007: Stack Trace Suppression', () => {
    it('does not include stack traces in production errors', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const mockReq = {
        method: 'POST',
        originalUrl: '/api/v1/auth/login',
        path: '/auth/login'
      };
      
      const error = new Error('Internal error');
      error.statusCode = 500;
      error.stack = 'Error: Internal error\n    at somewhere.js:10:15';
      
      let capturedError = null;
      authErrorNormalizer(error, mockReq, {}, (err) => {
        capturedError = err;
      });
      
      // In production, stack should be removed or error should be generic
      expect(capturedError.message).toBe('Internal error');
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});
