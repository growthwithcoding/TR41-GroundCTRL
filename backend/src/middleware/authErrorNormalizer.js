/**
 * Authentication Error Normalizer Middleware
 * Normalizes authentication errors to prevent user enumeration attacks
 * In production, returns generic error messages
 * In development, returns detailed error information for debugging
 */

const logger = require('../utils/logger');

/**
 * List of authentication endpoints that need error normalization
 */
const AUTH_ENDPOINTS = [
  '/api/v1/auth/register',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/v1/auth/revoke'
];

/**
 * Check if the request path matches an auth endpoint
 * @param {string} path - Request path
 * @returns {boolean} True if path is an auth endpoint
 */
function isAuthEndpoint(path) {
  return AUTH_ENDPOINTS.some(endpoint => path === endpoint);
}

/**
 * Check if the request is a POST request to an auth endpoint
 * @param {object} req - Express request object
 * @returns {boolean} True if should normalize
 */
function shouldNormalizeError(req) {
  // Use originalUrl to get the full path including /api/v1 prefix
  const fullPath = req.originalUrl.split('?')[0]; // Remove query params if any
  return req.method === 'POST' && isAuthEndpoint(fullPath);
}

/**
 * Error normalizer middleware
 * Must be placed before the global error handler
 * @param {Error} err - Error object
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function authErrorNormalizer(err, req, res, next) {
  // Only normalize errors for POST requests to auth endpoints
  if (!shouldNormalizeError(req)) {
    return next(err);
  }

  const isProduction = process.env.NODE_ENV === 'production';

  // Log the original error for monitoring (always log in production)
  if (isProduction) {
    logger.warn('Auth error normalized', {
      path: req.path,
      originalCode: err.code,
      originalMessage: err.message,
      statusCode: err.statusCode
    });
  }

  // In production, normalize authentication errors to prevent user enumeration
  if (isProduction) {
    // Normalize common authentication errors
    if (err.statusCode === 401 || err.statusCode === 403) {
      // Use "Invalid email or password" for login failures to match security test expectations
      err.message = 'Invalid email or password';
      err.code = 'AUTHENTICATION_FAILED';
      delete err.details; // Remove any detailed error information
    } else if (err.statusCode === 409) {
      // Conflict errors (e.g., email already exists)
      err.message = 'Registration failed';
      err.code = 'REGISTRATION_FAILED';
      delete err.details;
    } else if (err.statusCode === 422) {
      // Validation errors - keep them as-is but remove sensitive details
      if (err.details && typeof err.details === 'object') {
        // Keep validation structure but sanitize messages
        err.message = 'Validation failed';
      }
    }
  }

  // In development, pass through detailed errors for debugging
  // No normalization needed - developers need full error context

  // Pass the (potentially normalized) error to the global error handler
  next(err);
}

module.exports = authErrorNormalizer;
