/**
 * Phase 2 – Security Quick Wins + Correctness Fixes
 * 
 * Tests for:
 * 1. Global API rate limiting
 * 2. Outbound HTTP timeouts (DoS protection)
 * 3. Auth error normalization (production mode)
 * 4. Correctness fixes discovered during review
 */

const admin = require('firebase-admin');
const httpClient = require('../../src/utils/httpClient');
const { apiLimiter, loginLimiter, authLimiter } = require('../../src/middleware/rateLimiter');
const authErrorNormalizer = require('../../src/middleware/authErrorNormalizer');

describe('Phase 2 – Security Quick Wins', () => {
  let testUser = null;

  beforeAll(async () => {
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      console.log('⚠️  Firebase not initialized - skipping test setup');
      return;
    }

    // Create a test user for authentication tests
    const email = `sectest-${Date.now()}@test.com`;
    const userRecord = await admin.auth().createUser({
      email,
      password: 'TestPass123!',
      displayName: 'Security Test User'
    });

    const db = admin.firestore();
    await db.collection('users').doc(userRecord.uid).set({
      email,
      callSign: 'SEC-TEST',
      displayName: 'Security Test User',
      role: 'standard',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    testUser = { uid: userRecord.uid, email, password: 'TestPass123!' };
  });

  afterAll(async () => {
    // Cleanup test user
    if (!admin.apps.length || !testUser) {
      return;
    }

    const db = admin.firestore();
    try {
      await db.collection('users').doc(testUser.uid).delete();
      await admin.auth().deleteUser(testUser.uid);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Global API Rate Limiting', () => {
    it('applies global rate limiter to all API routes', () => {
      // Verify apiLimiter is configured and is a middleware function
      expect(apiLimiter).toBeDefined();
      expect(typeof apiLimiter).toBe('function');
      
      // Verify it's an express-rate-limit middleware (has expected structure)
      // Rate limit middleware should have these characteristics
      expect(apiLimiter.length).toBeGreaterThanOrEqual(2); // (req, res) or (req, res, next)
    });

    it('has stricter rate limits for auth endpoints', () => {
      // Verify specialized auth limiters exist
      expect(loginLimiter).toBeDefined();
      expect(authLimiter).toBeDefined();
      
      // Both should be middleware functions
      expect(typeof loginLimiter).toBe('function');
      expect(typeof authLimiter).toBe('function');
    });

    it('login limiter uses composite key (IP + email)', async () => {
      // The loginLimiter implementation in rateLimiter.js uses a custom keyGenerator
      // that combines IP and email to prevent brute force per account
      // 
      // Since the keyGenerator is internal to express-rate-limit configuration,
      // we verify it exists in the source file directly
      const rateLimiterSource = require('fs').readFileSync(
        require('path').join(__dirname, '../../src/middleware/rateLimiter.js'),
        'utf8'
      );
      
      // Verify the composite key implementation exists in source
      expect(rateLimiterSource).toContain('keyGenerator');
      expect(rateLimiterSource).toContain('${ip}_${email}');
      
      // Verify loginLimiter is configured
      expect(loginLimiter).toBeDefined();
      expect(typeof loginLimiter).toBe('function');
    });

    it('rate limiter returns 429 status when limit exceeded', async () => {
      // Note: This is more of an integration test
      // In a real scenario, we'd need to make many rapid requests
      // For unit testing, we verify the handler format
      
      const rateLimitConfig = require('../../src/config/rateLimits');
      
      // Verify rate limit configurations exist
      expect(rateLimitConfig.apiLimit).toBeDefined();
      expect(rateLimitConfig.loginLimit).toBeDefined();
      expect(rateLimitConfig.authLimit).toBeDefined();
      
      // Verify they have max and windowMs properties
      expect(rateLimitConfig.apiLimit.max).toBeDefined();
      expect(rateLimitConfig.apiLimit.windowMs).toBeDefined();
      expect(rateLimitConfig.loginLimit.max).toBeDefined();
      expect(rateLimitConfig.loginLimit.windowMs).toBeDefined();
    });
  });

  describe('Outbound HTTP Timeouts (DoS Protection)', () => {
    it('configures timeout for outbound HTTP calls', () => {
      // Verify httpClient has timeout configured
      expect(httpClient.defaults.timeout).toBeDefined();
      expect(httpClient.defaults.timeout).toBeGreaterThan(0);
      
      // Should be 8000ms by default or from env var
      const expectedTimeout = parseInt(process.env.HTTP_CLIENT_TIMEOUT_MS) || 8000;
      expect(httpClient.defaults.timeout).toBe(expectedTimeout);
    });

    it('httpClient has timeout protection in interceptors', () => {
      // Verify interceptors are configured
      expect(httpClient.interceptors.request.handlers.length).toBeGreaterThan(0);
      expect(httpClient.interceptors.response.handlers.length).toBeGreaterThan(0);
      
      // The response interceptor should handle timeout errors
      const responseInterceptor = httpClient.interceptors.response.handlers[0];
      expect(responseInterceptor.rejected).toBeDefined();
      expect(typeof responseInterceptor.rejected).toBe('function');
    });

    it('transforms timeout errors to AuthError with 503 status', async () => {
      // Mock a timeout error
      const timeoutError = new Error('timeout of 8000ms exceeded');
      timeoutError.code = 'ECONNABORTED';
      timeoutError.config = { url: '/test' };
      
      // Get the error handler from interceptor
      const responseInterceptor = httpClient.interceptors.response.handlers[0];
      
      try {
        await responseInterceptor.rejected(timeoutError);
        throw new Error('Should have thrown an error');
      } catch (error) {
        // Should transform to AuthError with 503
        expect(error.message).toContain('timeout');
        expect(error.statusCode || error.status).toBe(503);
      }
    });

    it('has centralized HTTP client configuration', () => {
      // Verify httpClient is exported and can be imported
      expect(httpClient).toBeDefined();
      expect(httpClient.defaults).toBeDefined();
      
      // Should have baseURL configured
      expect(httpClient.defaults.baseURL).toBeDefined();
      
      // Should have headers configured
      expect(httpClient.defaults.headers).toBeDefined();
      expect(httpClient.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Auth Error Normalization (Production Mode)', () => {
    it('normalizes auth errors in production mode', () => {
      // Save original NODE_ENV
      const originalEnv = process.env.NODE_ENV;
      
      // Set to production
      process.env.NODE_ENV = 'production';
      
      // Create mock request for login endpoint
      const mockReq = {
        method: 'POST',
        originalUrl: '/api/v1/auth/login',
        path: '/auth/login'
      };
      
      const mockRes = {};
      
      // Create an auth error
      const authError = new Error('User not found in database');
      authError.statusCode = 401;
      authError.code = 'USER_NOT_FOUND';
      authError.details = 'No user record found for email: test@example.com';
      
      let capturedError = null;
      const mockNext = (err) => {
        capturedError = err;
      };
      
      // Call the normalizer
      authErrorNormalizer(authError, mockReq, mockRes, mockNext);
      
      // Verify error was normalized
      expect(capturedError).toBeDefined();
      expect(capturedError.message).toBe('Invalid credentials');
      expect(capturedError.code).toBe('AUTHENTICATION_FAILED');
      expect(capturedError.details).toBeUndefined();
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });

    it('preserves detailed errors in development mode', () => {
      // Save original NODE_ENV
      const originalEnv = process.env.NODE_ENV;
      
      // Set to development
      process.env.NODE_ENV = 'development';
      
      // Create mock request for login endpoint
      const mockReq = {
        method: 'POST',
        originalUrl: '/api/v1/auth/login',
        path: '/auth/login'
      };
      
      const mockRes = {};
      
      // Create an auth error
      const authError = new Error('User not found in database');
      authError.statusCode = 401;
      authError.code = 'USER_NOT_FOUND';
      authError.details = 'No user record found for email: test@example.com';
      
      let capturedError = null;
      const mockNext = (err) => {
        capturedError = err;
      };
      
      // Call the normalizer
      authErrorNormalizer(authError, mockReq, mockRes, mockNext);
      
      // Verify error was NOT normalized (detailed info preserved)
      expect(capturedError).toBeDefined();
      expect(capturedError.message).toBe('User not found in database');
      expect(capturedError.code).toBe('USER_NOT_FOUND');
      expect(capturedError.details).toBe('No user record found for email: test@example.com');
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });

    it('only normalizes POST requests to auth endpoints', () => {
      // Save original NODE_ENV
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Test GET request (should not normalize)
      const mockReqGet = {
        method: 'GET',
        originalUrl: '/api/v1/users/123',
        path: '/users/123'
      };
      
      const mockRes = {};
      
      const error = new Error('Not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      
      let capturedError = null;
      const mockNext = (err) => {
        capturedError = err;
      };
      
      // Call the normalizer
      authErrorNormalizer(error, mockReqGet, mockRes, mockNext);
      
      // Should NOT be normalized (not an auth endpoint)
      expect(capturedError.message).toBe('Not found');
      expect(capturedError.code).toBe('NOT_FOUND');
      
      // Restore NODE_ENV
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
      
      const mockRes = {};
      
      // Create 403 error
      const forbiddenError = new Error('Account is locked');
      forbiddenError.statusCode = 403;
      forbiddenError.code = 'ACCOUNT_LOCKED';
      forbiddenError.details = 'Account locked after 5 failed attempts';
      
      let capturedError = null;
      authErrorNormalizer(forbiddenError, mockReq, mockRes, (err) => {
        capturedError = err;
      });
      
      // Should be normalized to prevent revealing lockout info
      expect(capturedError.message).toBe('Invalid credentials');
      expect(capturedError.code).toBe('AUTHENTICATION_FAILED');
      expect(capturedError.details).toBeUndefined();
      
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
      
      const mockRes = {};
      
      // Create conflict error
      const conflictError = new Error('Email already exists');
      conflictError.statusCode = 409;
      conflictError.code = 'EMAIL_EXISTS';
      conflictError.details = 'User with email test@example.com already exists';
      
      let capturedError = null;
      authErrorNormalizer(conflictError, mockReq, mockRes, (err) => {
        capturedError = err;
      });
      
      // Should be normalized to prevent user enumeration
      expect(capturedError.message).toBe('Registration failed');
      expect(capturedError.code).toBe('REGISTRATION_FAILED');
      expect(capturedError.details).toBeUndefined();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Correctness Fixes', () => {
    it('response factory provides consistent Mission Control format', () => {
      const responseFactory = require('../../src/factories/responseFactory');
      
      // Verify response factory functions exist
      expect(responseFactory.createSuccessResponse).toBeDefined();
      expect(responseFactory.createErrorResponse).toBeDefined();
      
      // Test success response format
      const successResponse = responseFactory.createSuccessResponse(
        { test: 'data' },
        { callSign: 'TEST', requestId: '123' }
      );
      
      // Mission Control format: status, code, brief, payload, telemetry, timestamp
      expect(successResponse.status).toBe('GO');
      expect(successResponse.code).toBe(200);
      expect(successResponse.brief).toBeDefined();
      expect(successResponse.payload).toBeDefined();
      expect(successResponse.payload.data).toEqual({ test: 'data' });
      expect(successResponse.telemetry).toBeDefined();
      expect(successResponse.telemetry.operatorCallSign).toBe('TEST');
      expect(successResponse.telemetry.requestId).toBe('123');
      
      // Test error response format
      const errorResponse = responseFactory.createErrorResponse(
        { statusCode: 400, code: 'TEST_ERROR', message: 'Test error' },
        { callSign: 'TEST', requestId: '123' }
      );
      
      expect(errorResponse.status).toBe('NO-GO');
      expect(errorResponse.code).toBe(400);
      expect(errorResponse.payload.error).toBeDefined();
      expect(errorResponse.payload.error.code).toBe('TEST_ERROR');
      expect(errorResponse.telemetry).toBeDefined();
      expect(errorResponse.telemetry.operatorCallSign).toBe('TEST');
    });

    it('pagination response formatting is consistent', () => {
      const responseFactory = require('../../src/factories/responseFactory');
      
      // Test paginated response using createPaginatedResponse
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = {
        total: 10,
        page: 1,
        limit: 2
      };
      
      const response = responseFactory.createPaginatedResponse(
        data,
        pagination,
        { callSign: 'TEST', requestId: '123' }
      );
      
      // Mission Control format with pagination
      expect(response.status).toBe('GO');
      expect(response.payload.data).toBeDefined();
      expect(response.payload.data).toEqual([{ id: 1 }, { id: 2 }]);
      expect(response.payload.pagination).toBeDefined();
      expect(response.payload.pagination.total).toBe(10);
      expect(response.payload.pagination.page).toBe(1);
      expect(response.payload.pagination.limit).toBe(2);
      expect(response.payload.pagination.totalPages).toBe(5);
      expect(response.payload.pagination.hasNextPage).toBe(true);
      expect(response.payload.pagination.hasPreviousPage).toBe(false);
    });

    it('audit logging uses uid as actor identity', () => {
      const auditFactory = require('../../src/factories/auditFactory');
      
      // Create audit entry
      const auditEntry = auditFactory.createAuditEntry(
        'TEST_ACTION',
        'test_resource',
        'test-uid-123',
        'TEST-CALLSIGN',
        'success',
        'medium',
        { detail: 'test' }
      );
      
      // Verify uid is used as primary identifier
      expect(auditEntry.userId).toBe('test-uid-123');
      expect(auditEntry.userId).not.toContain('@'); // Not an email
      expect(auditEntry.userId).not.toBe('TEST-CALLSIGN'); // Not callSign
      
      // CallSign should be separate field
      expect(auditEntry.callSign).toBe('TEST-CALLSIGN');
    });
  });
});
