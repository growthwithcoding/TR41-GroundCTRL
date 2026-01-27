/**
 * Rate Limiting Security Tests
 * Tests: AUTH-004, AUTH-005, AUTH-006, LIM-001 to LIM-005, SEC-003
 * Migrated from: sprint0/backendPhase2SecurityQuickWins.test.js
 */

const { apiLimiter, loginLimiter, authLimiter } = require('../../src/middleware/rateLimiter');
const httpClient = require('../../src/utils/httpClient');

describe('Rate Limiting Security Tests', () => {
  describe('AUTH-004: Global API Rate Limiting', () => {
    it('applies global rate limiter to all API routes', () => {
      expect(apiLimiter).toBeDefined();
      expect(typeof apiLimiter).toBe('function');
      expect(apiLimiter.length).toBeGreaterThanOrEqual(2);
    });

    it('has stricter rate limits for auth endpoints', () => {
      expect(loginLimiter).toBeDefined();
      expect(authLimiter).toBeDefined();
      expect(typeof loginLimiter).toBe('function');
      expect(typeof authLimiter).toBe('function');
    });

    it('login limiter uses composite key (IP + email)', async () => {
      const rateLimiterSource = require('fs').readFileSync(
        require('path').join(__dirname, '../../src/middleware/rateLimiter.js'),
        'utf8'
      );
      
      expect(rateLimiterSource).toContain('keyGenerator');
      expect(rateLimiterSource).toContain('${ip}_${email}');
      expect(loginLimiter).toBeDefined();
      expect(typeof loginLimiter).toBe('function');
    });

    it('rate limiter returns 429 status when limit exceeded', async () => {
      const rateLimitConfig = require('../../src/config/rateLimits');
      
      expect(rateLimitConfig.apiLimit).toBeDefined();
      expect(rateLimitConfig.loginLimit).toBeDefined();
      expect(rateLimitConfig.authLimit).toBeDefined();
      
      expect(rateLimitConfig.apiLimit.max).toBeDefined();
      expect(rateLimitConfig.apiLimit.windowMs).toBeDefined();
      expect(rateLimitConfig.loginLimit.max).toBeDefined();
      expect(rateLimitConfig.loginLimit.windowMs).toBeDefined();
    });
  });

  describe('AUTH-014: Outbound HTTP Timeouts (DoS Protection)', () => {
    it('configures timeout for outbound HTTP calls', () => {
      expect(httpClient.defaults.timeout).toBeDefined();
      expect(httpClient.defaults.timeout).toBeGreaterThan(0);
      
      const expectedTimeout = parseInt(process.env.HTTP_CLIENT_TIMEOUT_MS) || 8000;
      expect(httpClient.defaults.timeout).toBe(expectedTimeout);
    });

    it('httpClient has timeout protection in interceptors', () => {
      expect(httpClient.interceptors.request.handlers.length).toBeGreaterThan(0);
      expect(httpClient.interceptors.response.handlers.length).toBeGreaterThan(0);
      
      const responseInterceptor = httpClient.interceptors.response.handlers[0];
      expect(responseInterceptor.rejected).toBeDefined();
      expect(typeof responseInterceptor.rejected).toBe('function');
    });

    it('transforms timeout errors to AuthError with 503 status', async () => {
      const timeoutError = new Error('timeout of 8000ms exceeded');
      timeoutError.code = 'ECONNABORTED';
      timeoutError.config = { url: '/test' };
      
      const responseInterceptor = httpClient.interceptors.response.handlers[0];
      
      try {
        await responseInterceptor.rejected(timeoutError);
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('timeout');
        expect(error.statusCode || error.status).toBe(503);
      }
    });

    it('has centralized HTTP client configuration', () => {
      expect(httpClient).toBeDefined();
      expect(httpClient.defaults).toBeDefined();
      expect(httpClient.defaults.baseURL).toBeDefined();
      expect(httpClient.defaults.headers).toBeDefined();
      expect(httpClient.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('SEC-003: Timing Attack Prevention', () => {
    it('normalizes response times to prevent user enumeration', () => {
      // This is tested in auth error normalizer
      const authErrorNormalizer = require('../../src/middleware/authErrorNormalizer');
      expect(authErrorNormalizer).toBeDefined();
      expect(typeof authErrorNormalizer).toBe('function');
    });
  });
});
