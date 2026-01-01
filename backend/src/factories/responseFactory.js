/**
 * Response Factory
 * Creates Mission Control formatted responses with telemetry
 */

const { v4: uuidv4 } = require('uuid');
const missionControl = require('../config/missionControl');
const httpStatus = require('../constants/httpStatus');

/**
 * Get Mission Control lingo (phrase and brief) based on HTTP status code
 * @param {number} httpStatus - HTTP status code
 * @returns {object} Object with phrase and brief
 */
const getMissionLingo = (httpStatus) => {
  switch (httpStatus) {
  case 200: return { phrase: 'GO', brief: 'Satellite uplink established. Telemetry nominal.' };
  case 201: return { phrase: 'GO', brief: 'New asset deployed to orbit. All systems green.' };
  case 202: return { phrase: 'GO', brief: 'Command acknowledged. Processing orbital maneuver.' };
  case 204: return { phrase: 'GO', brief: 'Operation complete. No telemetry data to transmit.' };
  case 400: return { phrase: 'NO-GO', brief: 'Invalid trajectory parameters. Recalculate and retry.' };
  case 401: return { phrase: 'NO-GO', brief: 'Ground station authorization required. Authentication failed.' };
  case 403: return { phrase: 'NO-GO', brief: 'Clearance insufficient. Contact Mission Control for access.' };
  case 404: return { phrase: 'NO-GO', brief: 'Target not in tracking database. Verify coordinates.' };
  case 409: return { phrase: 'NO-GO', brief: 'Orbital slot conflict. Resource already exists in database.' };
  case 422: return { phrase: 'NO-GO', brief: 'Payload validation failed. Check data integrity and format.' };
  case 429: return { phrase: 'NO-GO', brief: 'Ground station capacity exceeded. Rate limiting engaged.' };
  case 500: return { phrase: 'ABORT', brief: 'Critical system failure. Ground control investigating anomaly.' };
  case 501: return { phrase: 'NO-GO', brief: 'Flight plan drafted, systems not commissioned yet.' };
  case 502: return { phrase: 'ABORT', brief: 'Upstream relay failure. Ground station communication lost.' };
  case 503: return { phrase: 'HOLD', brief: 'Ground stations offline. Awaiting uplink restoration.' };
  case 504: return { phrase: 'HOLD', brief: 'Satellite response timeout. Link budget may be insufficient.' };
  default:
    if (httpStatus >= 200 && httpStatus < 300)
      return { phrase: 'GO', brief: 'All systems green. Mission parameters within tolerances.' };
    if (httpStatus >= 400 && httpStatus < 500)
      return { phrase: 'NO-GO', brief: 'Command rejected. Verify parameters and retry transmission.' };
    return { phrase: 'ABORT', brief: 'Unexpected anomaly detected. Mission Control investigating.' };
  }
};

/**
 * Determine Mission Control status based on HTTP status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} Mission Control status (GO, NO-GO, HOLD, ABORT)
 */
function getMissionStatus(statusCode) {
  return getMissionLingo(statusCode).phrase;
}

/**
 * Create success response
 * @param {any} data - Response data
 * @param {object} options - Additional options
 * @param {string} options.callSign - Operator call sign
 * @param {string} options.requestId - Request identifier
 * @param {object} options.meta - Additional metadata
 * @param {number} options.statusCode - HTTP status code (default: 200)
 * @param {boolean} options.flatten - If true, spread data directly into payload without wrapper (default: false)
 * @returns {object} Mission Control formatted response
 */
function createSuccessResponse(data, options = {}) {
  const {
    callSign = 'SYSTEM',
    requestId = uuidv4(),
    meta = {},
    statusCode = httpStatus.OK,
    flatten = false
  } = options;

  // Build payload based on flatten option
  const payload = flatten 
    ? { ...data, ...meta }  // Spread data directly into payload
    : { data, ...meta };     // Wrap data in data property

  const lingo = getMissionLingo(statusCode);

  return {
    status: lingo.phrase,
    code: statusCode,
    brief: lingo.brief,
    payload,
    telemetry: {
      missionTime: new Date().toISOString(),
      operatorCallSign: callSign,
      stationId: missionControl.stationId,
      requestId
    },
    timestamp: Date.now()
  };
}

/**
 * Create error response
 * @param {Error|object} error - Error object or error details
 * @param {object} options - Additional options
 * @param {string} options.callSign - Operator call sign
 * @param {string} options.requestId - Request identifier
 * @returns {object} Mission Control formatted error response
 */
function createErrorResponse(error, options = {}) {
  const {
    callSign = 'SYSTEM',
    requestId = uuidv4()
  } = options;

  const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  const errorCode = error.code || 'UNKNOWN_ERROR';
  const message = error.message || 'An unexpected error occurred';
  const details = error.details || null;

  const lingo = getMissionLingo(statusCode);

  return {
    status: lingo.phrase,
    code: statusCode,
    brief: lingo.brief,
    payload: {
      error: {
        code: errorCode,
        message,
        details
      }
    },
    telemetry: {
      missionTime: new Date().toISOString(),
      operatorCallSign: callSign,
      stationId: missionControl.stationId,
      requestId
    },
    timestamp: Date.now()
  };
}

/**
 * Create paginated response
 * @param {array} data - Array of items
 * @param {object} pagination - Pagination metadata
 * @param {number} pagination.page - Current page
 * @param {number} pagination.limit - Items per page
 * @param {number} pagination.total - Total items
 * @param {object} options - Additional options
 * @returns {object} Mission Control formatted paginated response
 */
function createPaginatedResponse(data, pagination, options = {}) {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  
  return createSuccessResponse(data, {
    ...options,
    meta: {
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages,
        hasNextPage: pagination.page < totalPages,
        hasPreviousPage: pagination.page > 1
      }
    }
  });
}

/**
 * Generic createResponse - Alias for createSuccessResponse
 * Added for backward compatibility
 * @deprecated Use createSuccessResponse instead
 */
function createResponse(data, options = {}) {
  return createSuccessResponse(data, options);
}

module.exports = {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  getMissionStatus,
  createResponse  // Backward compatibility alias
};
