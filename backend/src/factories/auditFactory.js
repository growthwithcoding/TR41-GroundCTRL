/**
 * Audit Factory
 * Creates standardized audit log entries for system operations
 */

const { v4: uuidv4 } = require('uuid');
const auditEvents = require('../constants/auditEvents');
const auditSeverity = require('../constants/auditSeverity');

/**
 * Create audit log entry
 * @param {string} action - Action performed (from auditEvents)
 * @param {string} resource - Resource type affected
 * @param {string} userId - User ID performing action
 * @param {string} callSign - User's call sign
 * @param {string} result - Result of action ('success' or 'failure')
 * @param {string} severity - Severity level (from auditSeverity)
 * @param {object} metadata - Additional metadata
 * @returns {object} Audit log entry
 */
function createAuditEntry(action, resource, userId, callSign, result, severity = auditSeverity.INFO, metadata = {}) {
  // Extract userId if it's accidentally passed as an object
  const extractedUserId = (typeof userId === 'object' && userId?.userId) ? userId.userId : userId;
  const finalUserId = extractedUserId || 'ANONYMOUS';
  
  return {
    id: uuidv4(),
    timestamp: new Date(),
    missionTime: new Date().toISOString(),
    action,
    eventType: action,  // Alias for compatibility with tests
    resource,
    userId: finalUserId,
    actor: finalUserId,  // Actor field for identity enforcement tracking
    callSign: callSign || 'UNKNOWN',
    result,
    outcome: result,  // Alias for compatibility with tests
    severity,
    statusCode: metadata.statusCode || 200,
    ipAddress: metadata.ipAddress || null,
    userAgent: metadata.userAgent || null,
    changes: metadata.changes || null,
    resourceId: metadata.resourceId || null,
    details: metadata.details || null,
    errorMessage: metadata.errorMessage || null,
    metadata: metadata.details ? { details: metadata.details } : null
  };
}

/**
 * Create login audit entry
 * @param {string} userId - User ID
 * @param {string} callSign - User's call sign
 * @param {boolean} success - Login success status
 * @param {object} metadata - Additional metadata
 * @returns {object} Audit log entry
 */
function createLoginAudit(userId, callSign, success, metadata = {}) {
  return createAuditEntry(
    success ? auditEvents.LOGIN : auditEvents.LOGIN_FAILED,
    'auth',
    userId,
    callSign,
    success ? 'success' : 'failure',
    success ? auditSeverity.INFO : auditSeverity.WARNING,
    {
      ...metadata,
      statusCode: success ? 200 : metadata.statusCode || 401
    }
  );
}

/**
 * Create logout audit entry
 * @param {string} userId - User ID
 * @param {string} callSign - User's call sign
 * @param {object} metadata - Additional metadata
 * @returns {object} Audit log entry
 */
function createLogoutAudit(userId, callSign, metadata = {}) {
  return createAuditEntry(
    auditEvents.LOGOUT,
    'auth',
    userId,
    callSign,
    'success',
    auditSeverity.INFO,
    metadata
  );
}

/**
 * Create registration audit entry
 * @param {string} userId - User ID
 * @param {string} callSign - User's call sign
 * @param {boolean} success - Registration success status
 * @param {object} metadata - Additional metadata
 * @returns {object} Audit log entry
 */
function createRegisterAudit(userId, callSign, success, metadata = {}) {
  return createAuditEntry(
    success ? auditEvents.REGISTER : auditEvents.REGISTER_FAILED,
    'user',
    userId,
    callSign,
    success ? 'success' : 'failure',
    success ? auditSeverity.INFO : auditSeverity.WARNING,
    {
      ...metadata,
      statusCode: success ? 201 : metadata.statusCode || 400
    }
  );
}

/**
 * Create CRUD audit entry
 * @param {string} operation - CRUD operation (CREATE, UPDATE, PATCH, DELETE, GET, LIST)
 * @param {string} resource - Resource type
 * @param {string} userId - User ID
 * @param {string} callSign - User's call sign
 * @param {boolean} success - Operation success status
 * @param {object} metadata - Additional metadata
 * @returns {object} Audit log entry
 */
function createCrudAudit(operation, resource, userId, callSign, success, metadata = {}) {
  const actionMap = {
    CREATE: `CREATE_${resource.toUpperCase()}`,
    UPDATE: `UPDATE_${resource.toUpperCase()}`,
    PATCH: `PATCH_${resource.toUpperCase()}`,
    DELETE: `DELETE_${resource.toUpperCase()}`,
    GET: `GET_${resource.toUpperCase()}`,
    LIST: `LIST_${resource.toUpperCase()}S`
  };

  const severityMap = {
    CREATE: auditSeverity.INFO,
    UPDATE: auditSeverity.INFO,
    PATCH: auditSeverity.INFO,
    DELETE: auditSeverity.CRITICAL,
    GET: auditSeverity.INFO,
    LIST: auditSeverity.INFO
  };

  return createAuditEntry(
    actionMap[operation] || operation,
    resource,
    userId,
    callSign,
    success ? 'success' : 'failure',
    success ? severityMap[operation] : auditSeverity.ERROR,
    metadata
  );
}

/**
 * Create permission denied audit entry
 * @param {string} resource - Resource attempted to access
 * @param {string} userId - User ID
 * @param {string} callSign - User's call sign
 * @param {object} metadata - Additional metadata
 * @returns {object} Audit log entry
 */
function createPermissionDeniedAudit(resource, userId, callSign, metadata = {}) {
  return createAuditEntry(
    auditEvents.PERMISSION_DENIED,
    resource,
    userId,
    callSign,
    'failure',
    auditSeverity.WARNING,
    {
      ...metadata,
      statusCode: 403
    }
  );
}

/**
 * Create error audit entry
 * @param {string} resource - Resource where error occurred
 * @param {string} userId - User ID
 * @param {string} callSign - User's call sign
 * @param {Error} error - Error object
 * @param {object} metadata - Additional metadata
 * @returns {object} Audit log entry
 */
function createErrorAudit(resource, userId, callSign, error, metadata = {}) {
  return createAuditEntry(
    auditEvents.API_ERROR,
    resource,
    userId,
    callSign,
    'failure',
    error.statusCode >= 500 ? auditSeverity.CRITICAL : auditSeverity.ERROR,
    {
      ...metadata,
      statusCode: error.statusCode || 500,
      errorMessage: error.message,
      details: error.details || null
    }
  );
}

module.exports = {
  createAuditEntry,
  createLoginAudit,
  createLogoutAudit,
  createRegisterAudit,
  createCrudAudit,
  createPermissionDeniedAudit,
  createErrorAudit
};
