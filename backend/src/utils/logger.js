/**
 * Logger Utility
 * Provides consistent logging with severity levels
 */

const logLevel = process.env.LOG_LEVEL || 'info';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = levels[logLevel] || levels.info;

/**
 * Format log message with timestamp
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {object} meta - Additional metadata
 * @returns {string} Formatted log message
 */
function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaString = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
}

/**
 * Log error message
 */
function error(message, meta = {}) {
  if (currentLevel >= levels.error) {
    console.error(formatLog('error', message, meta));
  }
}

/**
 * Log warning message
 */
function warn(message, meta = {}) {
  if (currentLevel >= levels.warn) {
    console.warn(formatLog('warn', message, meta));
  }
}

/**
 * Log info message
 */
function info(message, meta = {}) {
  if (currentLevel >= levels.info) {
    console.log(formatLog('info', message, meta));
  }
}

/**
 * Log debug message
 */
function debug(message, meta = {}) {
  if (currentLevel >= levels.debug) {
    console.log(formatLog('debug', message, meta));
  }
}

/**
 * Log audit message (for security events)
 */
function audit(message, meta = {}) {
  // Sanitize sensitive data
  const sanitizedMeta = { ...meta };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'credentials'];
  sensitiveFields.forEach(field => {
    if (sanitizedMeta[field]) {
      sanitizedMeta[field] = '[REDACTED]';
    }
  });
  
  // Add timestamp
  sanitizedMeta.timestamp = new Date().toISOString();
  
  // Always log audit events regardless of log level
  console.log(formatLog('audit', message, sanitizedMeta));
}

module.exports = {
  error,
  warn,
  info,
  debug,
  audit
};
