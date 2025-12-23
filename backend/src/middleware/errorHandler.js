/**
 * Error Handler Middleware
 * Global error handling with Mission Control formatted responses
 */

const responseFactory = require('../factories/responseFactory');
const auditFactory = require('../factories/auditFactory');
const auditRepository = require('../repositories/auditRepository');
const logger = require('../utils/logger');
const httpStatus = require('../constants/httpStatus');

/**
 * Global error handler middleware
 * Catches all errors and formats them in Mission Control style
 */
function errorHandler(err, req, res, _next) {
  // Default values
  const statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error occurred', {
      statusCode,
      code,
      message,
      path: req.path,
      method: req.method,
      userId: req.user?.uid,
      callSign: req.callSign,
      stack: err.stack
    });
  } else {
    logger.warn('Client error occurred', {
      statusCode,
      code,
      message,
      path: req.path,
      method: req.method,
      userId: req.user?.uid,
      callSign: req.callSign
    });
  }

  // Create audit log entry (non-blocking)
  const auditEntry = auditFactory.createErrorAudit(
    req.path,
    req.user?.uid || 'ANONYMOUS',
    req.callSign || 'UNKNOWN',
    err,
    {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      method: req.method
    }
  );
  auditRepository.logAudit(auditEntry).catch(auditError => {
    logger.error('Failed to log error audit', { auditError: auditError.message });
  });

  // Create response
  const errorResponse = responseFactory.createErrorResponse(
    {
      statusCode,
      code,
      message,
      details: err.details || null
    },
    {
      callSign: req.callSign || 'SYSTEM',
      requestId: req.id
    }
  );

  // Send response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res, _next) {
  const error = {
    statusCode: httpStatus.NOT_FOUND,
    code: 'ROUTE_NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    details: {
      method: req.method,
      path: req.path
    }
  };

  const response = responseFactory.createErrorResponse(error, {
    callSign: req.callSign || 'SYSTEM',
    requestId: req.id
  });

  res.status(httpStatus.NOT_FOUND).json(response);
}

module.exports = {
  errorHandler,
  notFoundHandler
};
