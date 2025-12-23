/**
 * Audit Repository
 * Handles persistence of audit logs to Firebase Firestore
 */

const { getFirestore } = require('../config/firebase');
const logger = require('../utils/logger');

const COLLECTION_NAME = 'audit_logs';

/**
 * Log audit entry to Firestore
 * @param {object} entry - Audit log entry
 * @returns {Promise<object>} Saved audit entry with Firestore ID
 */
async function logAudit(entry) {
  try {
    const db = getFirestore();
    const docRef = await db.collection(COLLECTION_NAME).add(entry);
    
    logger.debug('Audit log created', { id: docRef.id, action: entry.action });
    
    return {
      id: docRef.id,
      ...entry
    };
  } catch (error) {
    logger.error('Failed to create audit log', { error: error.message });
    // Don't throw - audit logging should not break the application
    return null;
  }
}

/**
 * Get audit logs by user ID
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @param {number} options.limit - Maximum number of results (default: 50)
 * @param {Date} options.startDate - Start date filter
 * @param {Date} options.endDate - End date filter
 * @returns {Promise<array>} Array of audit entries
 */
async function getAuditsByUserId(userId, options = {}) {
  try {
    const { limit = 50, startDate, endDate } = options;
    const db = getFirestore();
    
    let query = db.collection(COLLECTION_NAME)
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit);
    
    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }
    if (endDate) {
      query = query.where('timestamp', '<=', endDate);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    logger.error('Failed to fetch audit logs by user ID', { error: error.message, userId });
    throw error;
  }
}

/**
 * Get failed login attempts for a user
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @param {number} options.hoursBack - Hours to look back (default: 1)
 * @param {number} options.limit - Maximum number of results (default: 10)
 * @returns {Promise<array>} Array of failed login audit entries
 */
async function getFailedLoginAttempts(userId, options = {}) {
  try {
    const { hoursBack = 1, limit = 10 } = options;
    const db = getFirestore();
    
    const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    
    const snapshot = await db.collection(COLLECTION_NAME)
      .where('userId', '==', userId)
      .where('action', '==', 'LOGIN_FAILED')
      .where('timestamp', '>=', startTime)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    logger.error('Failed to fetch failed login attempts', { error: error.message, userId });
    throw error;
  }
}

/**
 * Get audit logs by action type
 * @param {string} action - Action type
 * @param {object} options - Query options
 * @param {number} options.limit - Maximum number of results (default: 50)
 * @returns {Promise<array>} Array of audit entries
 */
async function getAuditsByAction(action, options = {}) {
  try {
    const { limit = 50 } = options;
    const db = getFirestore();
    
    const snapshot = await db.collection(COLLECTION_NAME)
      .where('action', '==', action)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    logger.error('Failed to fetch audit logs by action', { error: error.message, action });
    throw error;
  }
}

/**
 * Get audit logs by severity
 * @param {string} severity - Severity level
 * @param {object} options - Query options
 * @param {number} options.limit - Maximum number of results (default: 50)
 * @returns {Promise<array>} Array of audit entries
 */
async function getAuditsBySeverity(severity, options = {}) {
  try {
    const { limit = 50 } = options;
    const db = getFirestore();
    
    const snapshot = await db.collection(COLLECTION_NAME)
      .where('severity', '==', severity)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    logger.error('Failed to fetch audit logs by severity', { error: error.message, severity });
    throw error;
  }
}

/**
 * Get all audit logs with pagination
 * @param {object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 50)
 * @returns {Promise<object>} Paginated audit logs
 */
async function getAllAudits(options = {}) {
  try {
    const { page = 1, limit = 50 } = options;
    const db = getFirestore();
    
    const offset = (page - 1) * limit;
    
    const snapshot = await db.collection(COLLECTION_NAME)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .offset(offset)
      .get();
    
    const audits = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get total count
    const countSnapshot = await db.collection(COLLECTION_NAME).count().get();
    const total = countSnapshot.data().count;
    
    return {
      audits,
      pagination: {
        page,
        limit,
        total
      }
    };
  } catch (error) {
    logger.error('Failed to fetch all audit logs', { error: error.message });
    throw error;
  }
}

module.exports = {
  logAudit,
  getAuditsByUserId,
  getFailedLoginAttempts,
  getAuditsByAction,
  getAuditsBySeverity,
  getAllAudits
};
