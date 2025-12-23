/**
 * Audit Severity Level Constants
 * Defines severity levels for audit log entries
 */

module.exports = {
  INFO: 'INFO',           // Normal operations (login, read operations)
  WARNING: 'WARNING',     // Suspicious activity (failed logins, permission denied)
  ERROR: 'ERROR',         // Application errors (validation failures, not found)
  CRITICAL: 'CRITICAL'    // Security incidents (account lockout, token revocation, deletions)
};
