/**
 * Audit Logger Middleware
 * Logs all requests and responses for audit trail
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Audit logger middleware
 * Attaches request ID and logs request/response details
 */
function auditLogger(req, res, next) {
  // Attach unique request ID
  req.id = uuidv4();
  
  // Log request
  const startTime = Date.now();
  
  logger.info('Incoming request', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.uid,
    callSign: req.callSign
  });

  // Capture response
  const originalSend = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    logger.info('Outgoing response', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.uid,
      callSign: req.callSign
    });
    
    return originalSend.call(this, data);
  };
  
  next();
}

module.exports = auditLogger;
