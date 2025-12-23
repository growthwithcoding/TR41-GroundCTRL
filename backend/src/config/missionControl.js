/**
 * Mission Control Configuration
 * Defines Mission Control response codes and telemetry settings
 */

module.exports = {
  // Mission Control Status Codes
  statusCodes: {
    GO: 'GO',           // 200-299: Success
    NO_GO: 'NO-GO',     // 400-499: Client errors
    HOLD: 'HOLD',       // 503: Service unavailable
    ABORT: 'ABORT'      // 500-599: Server errors (except 503)
  },

  // Station Identifier
  stationId: process.env.CALL_SIGN || 'GROUNDCTRL-01',

  // Telemetry settings
  telemetry: {
    includeRequestId: true,
    includeTimestamp: true,
    includeOperatorCallSign: true,
    includeStationId: true
  },

  // Mission Control terminology mappings
  terminology: {
    success: 'Mission successful',
    created: 'Resource deployed',
    updated: 'Resource modified',
    deleted: 'Resource decommissioned',
    notFound: 'Resource not in registry',
    unauthorized: 'Clearance required',
    forbidden: 'Insufficient clearance level',
    validationError: 'Pre-flight check failed',
    serverError: 'Ground station malfunction'
  }
};
