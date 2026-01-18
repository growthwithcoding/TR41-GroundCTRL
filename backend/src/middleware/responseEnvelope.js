/**
 * Response Envelope Middleware
 * Wraps all JSON responses in a standardized envelope format
 * This middleware ensures all responses follow the Mission Control response structure
 */

/**
 * Response Envelope Middleware
 * Intercepts res.json() to wrap responses in standardized envelope
 */
const responseEnvelopeMiddleware = (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    // Extract status code (already set or default to 200)
    const statusCode = res.statusCode || 200;
    
    // If data already has COMPLETE envelope structure (status, code, payload), pass through
    if (data && typeof data === 'object' && 'status' in data && 'code' in data && 'payload' in data) {
      return originalJson.call(this, data);
    }
    
    // Create standardized envelope - always wrap raw data in payload
    const response = {
      status: statusCode < 400 ? 'success' : 'error',
      code: statusCode,
      payload: data,
      telemetry: {
        missionTime: new Date().toISOString(),
        operatorCallSign: process.env.OPERATOR_CALL_SIGN || 'GROUNDCTRL-01',
        stationId: process.env.STATION_ID || 'GCTRL-001',
        requestId: req.id || `req-${Date.now()}`
      },
      timestamp: new Date().toISOString()
    };

    return originalJson.call(this, response);
  };

  next();
};

module.exports = { responseEnvelopeMiddleware };
