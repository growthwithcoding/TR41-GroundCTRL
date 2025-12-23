/**
 * Lockout Service
 * Handles account lockout logic based on failed login attempts
 */

const auditRepository = require('../repositories/auditRepository');
const auditFactory = require('../factories/auditFactory');
const { AuthError } = require('../utils/errors');
const logger = require('../utils/logger');

// Lockout configuration
const LOCKOUT_THRESHOLD = parseInt(process.env.LOCKOUT_THRESHOLD) || 5;
const LOCKOUT_DURATION_MINUTES = parseInt(process.env.LOCKOUT_DURATION_MINUTES) || 15;
const LOCKOUT_WINDOW_HOURS = parseInt(process.env.LOCKOUT_WINDOW_HOURS) || 1;

/**
 * Check if account is locked out
 * @param {string} userId - User ID to check
 * @param {string} callSign - User's call sign
 * @returns {Promise<boolean>} True if account is locked
 * @throws {AuthError} If account is locked
 */
async function checkAccountLockout(userId, callSign) {
  try {
    // Get recent failed login attempts
    const recentFailures = await auditRepository.getFailedLoginAttempts(userId, {
      hoursBack: LOCKOUT_WINDOW_HOURS,
      limit: LOCKOUT_THRESHOLD + 1
    });
    
    if (recentFailures.length >= LOCKOUT_THRESHOLD) {
      const lastFailure = recentFailures[0].timestamp;
      const lastFailureDate = lastFailure instanceof Date ? lastFailure : lastFailure.toDate();
      const lockoutExpiry = new Date(lastFailureDate.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
      
      if (new Date() < lockoutExpiry) {
        const remainingMinutes = Math.ceil((lockoutExpiry - new Date()) / 1000 / 60);
        
        // Log lockout attempt
        const auditEntry = auditFactory.createAuditEntry(
          'LOGIN_ATTEMPT_LOCKED',
          'auth',
          userId,
          callSign,
          'failure',
          'WARNING',
          {
            details: `Account locked due to ${recentFailures.length} failed login attempts`,
            lockoutExpiry: lockoutExpiry.toISOString(),
            remainingMinutes
          }
        );
        
        await auditRepository.logAudit(auditEntry);
        
        logger.warn('Account lockout enforced', {
          userId,
          callSign,
          failedAttempts: recentFailures.length,
          remainingMinutes
        });
        
        throw new AuthError(
          `Account temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
          429
        );
      }
    }
    
    return false;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    logger.error('Failed to check account lockout', { error: error.message, userId });
    // Don't block login if lockout check fails
    return false;
  }
}

/**
 * Record login attempt
 * @param {string} userId - User ID
 * @param {string} callSign - User's call sign
 * @param {boolean} success - Whether login was successful
 * @param {object} metadata - Additional metadata
 * @returns {Promise<void>}
 */
async function recordLoginAttempt(userId, callSign, success, metadata = {}) {
  try {
    const auditEntry = auditFactory.createLoginAudit(userId, callSign, success, metadata);
    await auditRepository.logAudit(auditEntry);
    
    if (!success) {
      // Check if this failure triggers lockout
      const recentFailures = await auditRepository.getFailedLoginAttempts(userId, {
        hoursBack: LOCKOUT_WINDOW_HOURS,
        limit: LOCKOUT_THRESHOLD + 1
      });
      
      if (recentFailures.length === LOCKOUT_THRESHOLD) {
        logger.warn('Account lockout threshold reached', {
          userId,
          callSign,
          failedAttempts: recentFailures.length
        });
      }
    }
  } catch (error) {
    logger.error('Failed to record login attempt', { error: error.message, userId });
    // Don't throw - audit logging should not break authentication
  }
}

/**
 * Get failed login count for user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of failed login attempts in lockout window
 */
async function getFailedLoginCount(userId) {
  try {
    const recentFailures = await auditRepository.getFailedLoginAttempts(userId, {
      hoursBack: LOCKOUT_WINDOW_HOURS,
      limit: LOCKOUT_THRESHOLD + 1
    });
    
    return recentFailures.length;
  } catch (error) {
    logger.error('Failed to get failed login count', { error: error.message, userId });
    return 0;
  }
}

/**
 * Check if user is currently locked out
 * @param {string} userId - User ID
 * @returns {Promise<object>} Lockout status with details
 */
async function getLockoutStatus(userId) {
  try {
    const recentFailures = await auditRepository.getFailedLoginAttempts(userId, {
      hoursBack: LOCKOUT_WINDOW_HOURS,
      limit: LOCKOUT_THRESHOLD + 1
    });
    
    if (recentFailures.length >= LOCKOUT_THRESHOLD) {
      const lastFailure = recentFailures[0].timestamp;
      const lastFailureDate = lastFailure instanceof Date ? lastFailure : lastFailure.toDate();
      const lockoutExpiry = new Date(lastFailureDate.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
      
      if (new Date() < lockoutExpiry) {
        const remainingMinutes = Math.ceil((lockoutExpiry - new Date()) / 1000 / 60);
        
        return {
          isLocked: true,
          failedAttempts: recentFailures.length,
          lockoutExpiry: lockoutExpiry.toISOString(),
          remainingMinutes
        };
      }
    }
    
    return {
      isLocked: false,
      failedAttempts: recentFailures.length,
      lockoutExpiry: null,
      remainingMinutes: 0
    };
  } catch (error) {
    logger.error('Failed to get lockout status', { error: error.message, userId });
    return {
      isLocked: false,
      failedAttempts: 0,
      lockoutExpiry: null,
      remainingMinutes: 0
    };
  }
}

module.exports = {
  checkAccountLockout,
  recordLoginAttempt,
  getFailedLoginCount,
  getLockoutStatus
};
