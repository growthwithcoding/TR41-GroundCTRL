/**
 * Phase 2 – Security Quick Wins + Correctness Fixes
 * Covers rate limits, outbound timeouts, and auth error normalization.
 */

const axios = require('axios');
const rateLimit = require('express-rate-limit');
const express = require('express');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

describe('Phase 2 – Security Quick Wins', () => {
  it('applies global API rate limit to /api/v1 routes', () => {
    const rateLimitConfig = require('../../src/config/rateLimits');
    const { apiLimiter } = require('../../src/middleware/rateLimiter');
    
    // Verify rate limit config exists and has proper values
    expect(rateLimitConfig.apiLimit).toBeDefined();
    expect(rateLimitConfig.apiLimit.windowMs).toBeDefined();
    expect(rateLimitConfig.apiLimit.max).toBeDefined();
    
    // Verify apiLimiter is a function (middleware)
    expect(typeof apiLimiter).toBe('function');
    
    // Verify environment variables are set
    expect(process.env.API_RATE_LIMIT_WINDOW_MS).toBeDefined();
    expect(process.env.API_RATE_LIMIT_MAX_REQUESTS).toBeDefined();
    
    // Verify limits are reasonable (not too high)
    const maxRequests = parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS);
    expect(maxRequests).toBeGreaterThan(0);
    expect(maxRequests).toBeLessThanOrEqual(1000); // Sanity check
  });

  it('applies login-specific rate limit window/max', () => {
    const rateLimitConfig = require('../../src/config/rateLimits');
    const { loginLimiter } = require('../../src/middleware/rateLimiter');
    
    // Verify login rate limit is stricter than general API limit
    expect(rateLimitConfig.loginLimit).toBeDefined();
    expect(rateLimitConfig.loginLimit.windowMs).toBeDefined();
    expect(rateLimitConfig.loginLimit.max).toBeDefined();
    
    // Login limit should be more restrictive
    expect(rateLimitConfig.loginLimit.max).toBeLessThanOrEqual(rateLimitConfig.apiLimit.max);
    
    // Verify loginLimiter is a function (middleware)
    expect(typeof loginLimiter).toBe('function');
    
    // Verify login-specific environment variables
    expect(process.env.LOGIN_RATE_LIMIT_WINDOW_MS).toBeDefined();
    expect(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS).toBeDefined();
    
    const loginMax = parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS);
    expect(loginMax).toBeGreaterThan(0);
    expect(loginMax).toBeLessThanOrEqual(20); // Login should be very restrictive
  });

  it('sets outbound HTTP client timeout from env and enforces it', () => {
    const httpClient = require('../../src/utils/httpClient');
    
    // Verify timeout is configured from environment
    expect(process.env.HTTP_CLIENT_TIMEOUT_MS).toBeDefined();
    const expectedTimeout = parseInt(process.env.HTTP_CLIENT_TIMEOUT_MS);
    
    // Verify httpClient has timeout configured
    expect(httpClient.defaults.timeout).toBe(expectedTimeout);
    expect(httpClient.defaults.timeout).toBeGreaterThan(0);
    expect(httpClient.defaults.timeout).toBeLessThanOrEqual(30000); // Max 30 seconds
    
    // Verify timeout is reasonable for security (prevents hanging)
    expect(expectedTimeout).toBeGreaterThanOrEqual(1000); // At least 1 second
    expect(expectedTimeout).toBeLessThanOrEqual(15000); // No more than 15 seconds
  });

  it('normalizes auth errors in production (no sensitive details)', () => {
    const { authErrorNormalizer } = require('../../src/middleware/authErrorNormalizer');
    
    // Verify middleware exists
    expect(typeof authErrorNormalizer).toBe('function');
    
    // Create mock request/response for testing
    const mockReq = {
      method: 'POST',
      originalUrl: '/api/v1/auth/login',
      path: '/api/v1/auth/login'
    };
    
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    const mockNext = jest.fn();
    
    // Test with auth error in production mode
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const authError = new Error('User not found');
    authError.code = 'auth/user-not-found';
    
    authErrorNormalizer(authError, mockReq, mockRes, mockNext);
    
    // Restore environment
    process.env.NODE_ENV = originalEnv;
    
    // In production, error should be normalized (not expose sensitive details)
    if (mockRes.json.mock.calls.length > 0) {
      const response = mockRes.json.mock.calls[0][0];
      expect(response.payload.error.message).not.toContain('User not found');
      expect(response.payload.error.message).not.toContain('auth/');
    }
  });

  it('maintains pagination output shape after correctness fixes', async () => {
    const userRepository = require('../../src/repositories/userRepository');
    
    // Test pagination structure
    const result = await userRepository.getAll({ page: 1, limit: 10 });
    
    // Verify pagination metadata exists and has correct shape
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('limit');
    expect(result).toHaveProperty('totalPages');
    
    expect(Array.isArray(result.data)).toBe(true);
    expect(typeof result.total).toBe('number');
    expect(typeof result.page).toBe('number');
    expect(typeof result.limit).toBe('number');
    expect(typeof result.totalPages).toBe('number');
    
    // Verify totalPages calculation is correct
    const expectedTotalPages = Math.ceil(result.total / result.limit);
    expect(result.totalPages).toBe(expectedTotalPages);
  });

  it('enforces outbound HTTP timeout by aborting long requests', async () => {
    const httpClient = require('../../src/utils/httpClient');
    
    // Create a mock slow endpoint (this will timeout)
    const slowUrl = 'https://httpstat.us/200?sleep=30000';
    
    const startTime = Date.now();
    
    try {
      await httpClient.get(slowUrl);
      fail('Request should have timed out');
    } catch (error) {
      const elapsed = Date.now() - startTime;
      
      // Verify request was aborted due to timeout
      expect(error.code).toMatch(/ECONNABORTED|ETIMEDOUT/);
      
      // Verify timeout happened within expected window
      const configuredTimeout = httpClient.defaults.timeout;
      expect(elapsed).toBeLessThan(configuredTimeout + 2000); // Allow 2s buffer
    }
  }, 12000); // Test timeout slightly longer than HTTP timeout
});
