/**
 * Anonymous User ID Utility
 * Generates and validates anonymous user identifiers for unauthenticated NOVA usage
 */

const crypto = require('crypto');

/**
 * Generate anonymous user ID
 * Format: anon_<uuid>
 * @returns {string} Anonymous user ID
 */
function generateAnonymousId() {
  const uuid = crypto.randomUUID();
  return `anon_${uuid}`;
}

/**
 * Generate help session ID
 * Format: help_sess_<uuid>
 * @returns {string} Help session ID
 */
function generateHelpSessionId() {
  const uuid = crypto.randomUUID();
  return `help_sess_${uuid}`;
}

/**
 * Check if user ID is anonymous
 * @param {string} userId - User ID to check
 * @returns {boolean} True if anonymous
 */
function isAnonymousId(userId) {
  return typeof userId === 'string' && userId.startsWith('anon_');
}

/**
 * Check if session ID is a help session
 * @param {string} sessionId - Session ID to check
 * @returns {boolean} True if help session
 */
function isHelpSession(sessionId) {
  return typeof sessionId === 'string' && sessionId.startsWith('help_sess_');
}

module.exports = {
  generateAnonymousId,
  generateHelpSessionId,
  isAnonymousId,
  isHelpSession
};
