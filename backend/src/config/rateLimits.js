/**
 * Rate Limiting Configuration
 * Centralized rate limit settings for different endpoints
 */

module.exports = {
  // Login endpoint: 5 requests per 60 seconds (1 minute) in production, can be overridden for testing
  loginLimit: {
    windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 60 * 1000,
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS) || 5,
    standardHeaders: true,
    legacyHeaders: false
  },

  // Auth endpoints (register, refresh): 1000 requests per 15 minutes
  authLimit: {
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false
  },

  // General API: 100 requests per 15 minutes
  apiLimit: {
    windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS) || 100,
    standardHeaders: true,
    legacyHeaders: false
  },

  // Help AI endpoint: 20 requests per 5 minutes (stricter for anonymous users)
  helpAiLimit: {
    windowMs: 5 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false
  }
};
