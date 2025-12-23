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
 */
const loginLimiter = rateLimit({
  ...rateLimitConfig.loginLimit,
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

module.exports = {
  apiLimiter,
  loginLimiter,
  authLimiter
};
