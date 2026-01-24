/**
 * Rate Limiter Middleware
 * Applies rate limiting to protect against abuse
 */

const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const rateLimitConfig = require('../config/rateLimits');
const responseFactory = require('../factories/responseFactory');
const logger = require('../utils/logger');

/**
 * General API rate limiter
 * Applied to all API routes
 */
const apiLimiter = rateLimit({
  ...rateLimitConfig.apiLimit,
  handler: (req, res) => {
    logger.warn('API rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.user?.uid,
      callSign: req.callSign
    });
    
    const error = {
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      details: 'API rate limit exceeded'
    };
    
    const response = responseFactory.createErrorResponse(error, {
      callSign: req.callSign || 'UNKNOWN',
      requestId: req.id || uuidv4()
    });
    
    res.status(429).json(response);
  }
});

/**
 * Login rate limiter
 * Stricter limits for login endpoint
 * Uses composite key of IP + email for rate limiting (5 requests per minute per IP+email combination)
 */
const loginLimiter = rateLimit({
  ...rateLimitConfig.loginLimit,
  keyGenerator: (req) => {
    // Create composite key using IP address and email
    const ip = req.ip || 'unknown-ip';
    const email = req.body?.email || 'no-email';
    return `${ip}_${email}`;
  },
  handler: (req, res) => {
    logger.warn('Login rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email
    });
    
    const error = {
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts. Please try again later.',
      details: 'Login rate limit exceeded'
    };
    
    const response = responseFactory.createErrorResponse(error, {
      callSign: 'UNKNOWN',
      requestId: req.id || uuidv4()
    });
    
    res.status(429).json(response);
  }
});

/**
 * Auth rate limiter
 * For registration, token refresh, and other auth operations
 */
const authLimiter = rateLimit({
  ...rateLimitConfig.authLimit,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.user?.uid
    });
    
    const error = {
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again later.',
      details: 'Auth rate limit exceeded'
    };
    
    const response = responseFactory.createErrorResponse(error, {
      callSign: req.callSign || 'UNKNOWN',
      requestId: req.id || uuidv4()
    });
    
    res.status(429).json(response);
  }
});

/**
 * Password change rate limiter
 * Limit password change attempts (5 per minute)
 */
const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Password change rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.uid
    });
    
    const error = {
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password change attempts. Please try again later.',
      details: 'Password change rate limit exceeded'
    };
    
    const response = responseFactory.createErrorResponse(error, {
      callSign: req.callSign || 'UNKNOWN',
      requestId: req.id || uuidv4()
    });
    
    res.status(429).json(response);
  }
});

/**
 * Password reset request rate limiter
 * Limit password reset requests (3 per hour)
 */
const passwordResetRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Password reset request rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email
    });
    
    const error = {
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset requests. Please try again later.',
      details: 'Password reset request rate limit exceeded'
    };
    
    const response = responseFactory.createErrorResponse(error, {
      callSign: 'UNKNOWN',
      requestId: req.id || uuidv4()
    });
    
    res.status(429).json(response);
  }
});

/**
 * Password reset rate limiter
 * Limit password reset attempts (5 per 15 minutes)
 */
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Password reset rate limit exceeded', {
      ip: req.ip
    });
    
    const error = {
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset attempts. Please try again later.',
      details: 'Password reset rate limit exceeded'
    };
    
    const response = responseFactory.createErrorResponse(error, {
      callSign: 'UNKNOWN',
      requestId: req.id || uuidv4()
    });
    
    res.status(429).json(response);
  }
});

/**
 * Create a custom rate limiter with the given configuration
 * @param {object} config - Rate limit configuration
 * @returns {function} Express middleware
 */
function createRateLimiter(config) {
  return rateLimit({
    ...config,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userId: req.user?.uid,
        callSign: req.callSign
      });
      
      const error = {
        statusCode: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        details: 'Rate limit exceeded'
      };
      
      const response = responseFactory.createErrorResponse(error, {
        callSign: req.callSign || 'UNKNOWN',
        requestId: req.id || uuidv4()
      });
      
      res.status(429).json(response);
    }
  });
}

module.exports = {
  apiLimiter,
  loginLimiter,
  authLimiter,
  passwordChangeLimiter,
  passwordResetRequestLimiter,
  passwordResetLimiter,
  createRateLimiter
};
