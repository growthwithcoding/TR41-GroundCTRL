/**
 * Custom Error Classes
 * Defines specialized error types for consistent error handling
 */

const httpStatus = require('../constants/httpStatus');

/**
 * Base Application Error
 */
class AppError extends Error {
  constructor(message, statusCode = httpStatus.INTERNAL_SERVER_ERROR, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = null;
    this.isOperational = true; // Distinguishes operational errors from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication Error
 */
class AuthError extends AppError {
  constructor(message, statusCode = httpStatus.UNAUTHORIZED) {
    super(message, statusCode, 'AUTH_ERROR');
  }
}

/**
 * Validation Error
 */
class ValidationError extends AppError {
  constructor(message, errors = null) {
    super(message, httpStatus.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR');
    this.details = errors;
  }
}

/**
 * Not Found Error
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found', resource = null) {
    super(message, httpStatus.NOT_FOUND, 'NOT_FOUND');
    this.details = resource ? { resource } : null;
  }
}

/**
 * Forbidden Error
 */
class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, httpStatus.FORBIDDEN, 'FORBIDDEN');
  }
}

/**
 * Conflict Error
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, httpStatus.CONFLICT, 'CONFLICT');
  }
}

/**
 * Rate Limit Error
 */
class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, httpStatus.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Service Unavailable Error
 */
class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, httpStatus.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }
}

module.exports = {
  AppError,
  AuthError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError
};
