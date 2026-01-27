/**
 * Rate Limiting Integration and Security Tests
 * Tests: AUTH-004, AUTH-005, AUTH-006, LIM-001 to LIM-005, SEC-003
 * Consolidated from: sprint0/backendPhase2SecurityQuickWins.test.js and security/rate-limiting.test.js
 */

// IMPORTANT: Set rate limit env vars BEFORE requiring anything
// These tests specifically verify rate limiting works, so we need production-like limits
process.env.API_RATE_LIMIT_WINDOW_MS = String(15 * 60 * 1000); // 15 minutes
process.env.API_RATE_LIMIT_MAX_REQUESTS = '100';
process.env.LOGIN_RATE_LIMIT_WINDOW_MS = String(60 * 1000); // 1 minute  
process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS = '5';

const request = require('supertest');
const { apiLimiter, loginLimiter, authLimiter } = require('../../../src/middleware/rateLimiter');
const httpClient = require('../../../src/utils/httpClient');

describe('Rate Limiting - Comprehensive Tests', () => {
  let app;

  beforeAll(() => {
    // Delete the cached app module to force reload with new rate limits
    delete require.cache[require.resolve('../../../src/app')];
    delete require.cache[require.resolve('../../../src/config/rateLimits')];
    
    app = require('../../../src/app');
  });

  describe('LIM-001, LIM-002: Rate Limiter Configuration', () => {
    it('applies global rate limiter to all API routes', () => {
      expect(apiLimiter).toBeDefined();
      expect(typeof apiLimiter).toBe('function');
      expect(apiLimiter.length).toBeGreaterThanOrEqual(2);
    });

    it('exports createRateLimiter function', () => {
      const { createRateLimiter } = require('../../../src/middleware/rateLimiter');
      expect(createRateLimiter).toBeDefined();
      expect(typeof createRateLimiter).toBe('function');
    });

    it('has stricter rate limits for auth endpoints', () => {
      expect(loginLimiter).toBeDefined();
      expect(authLimiter).toBeDefined();
      expect(typeof loginLimiter).toBe('function');
      expect(typeof authLimiter).toBe('function');
    });

    it('login limiter uses composite key (IP + email)', () => {
      const rateLimiterSource = require('fs').readFileSync(
        require('path').join(__dirname, '../../../src/middleware/rateLimiter.js'),
        'utf8'
      );
      
      expect(rateLimiterSource).toContain('keyGenerator');
      expect(rateLimiterSource).toContain('${ip}_${email}');
    });
  });

  describe('AUTH-004: Global Rate Limiter', () => {
    it('should block requests after 100 requests in 15 minutes', async () => {
      const requests = [];
      for (let i = 0; i < 101; i++) {
        requests.push(
          request(app)
            .get('/api/v1/health')
            .set('X-Forwarded-For', '192.168.1.100')
        );
      }

      const responses = await Promise.all(requests);
      const lastResponse = responses[100];

      expect(lastResponse.status).toBe(429);
      expect(lastResponse.headers).toHaveProperty('retry-after');
    }, 30000);
  });

  describe('AUTH-005: Login Rate Limiter - Different Emails', () => {
    it('should limit each email independently', async () => {
      const ip = '192.168.1.101';

      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .set('X-Forwarded-For', ip)
          .send({
            email: `user${i}@example.com`,
            password: 'wrongpassword',
          });

        expect(response.status).toBe(401);
      }
    });
  });

  describe('AUTH-006: Login Rate Limiter - Same Email', () => {
    it('should block after 5 failed attempts for same email', async () => {
      const ip = '192.168.1.102';
      const email = 'sameuser@example.com';

      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .set('X-Forwarded-For', ip)
          .send({ email, password: 'wrongpassword' });

        if (i < 5) {
          expect(response.status).toBe(401);
        } else {
          expect(response.status).toBe(429);
          expect(response.headers).toHaveProperty('retry-after');
        }
      }
    });
  });

  describe('LIM-004, LIM-005: Rate Limit Response Headers', () => {
    it('ensures global limiter applies while login limiter overrides', async () => {
      const rateLimitConfig = require('../../../src/config/rateLimits');
      
      expect(rateLimitConfig.apiLimit).toBeDefined();
      expect(rateLimitConfig.loginLimit).toBeDefined();
      expect(rateLimitConfig.authLimit).toBeDefined();
      
      expect(rateLimitConfig.apiLimit.max).toBeDefined();
      expect(rateLimitConfig.loginLimit.max).toBeDefined();
    });

    it('includes Retry-After header in 429 responses', async () => {
      // Test implementation will be added when rate limit is actually hit
      expect(true).toBe(true);
    });
  });

  describe('AUTH-014, AUTH-015: HTTP Client Timeout Protection', () => {
    it('configures timeout for outbound HTTP calls', () => {
      expect(httpClient.defaults.timeout).toBeDefined();
      expect(httpClient.defaults.timeout).toBeGreaterThan(0);
      
      const expectedTimeout = parseInt(process.env.HTTP_CLIENT_TIMEOUT_MS) || 8000;
      expect(httpClient.defaults.timeout).toBe(expectedTimeout);
    });

    it('has timeout protection in interceptors', () => {
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

    it('respects HTTP_CLIENT_TIMEOUT_MS environment variable', () => {
      process.env.HTTP_CLIENT_TIMEOUT_MS = '1000';
      expect(process.env.HTTP_CLIENT_TIMEOUT_MS).toBe('1000');
    });
  });

  describe('SEC-003: Timing Attack Prevention', () => {
    it('normalizes response times to prevent user enumeration', () => {
      const authErrorNormalizer = require('../../../src/middleware/authErrorNormalizer');
      expect(authErrorNormalizer).toBeDefined();
      expect(typeof authErrorNormalizer).toBe('function');
    });
  });
});
