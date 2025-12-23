/**
 * Rate Limiting Configuration
 * Centralized rate limit settings for different endpoints
 */

module.exports = {
  // Login endpoint: 5 requests per 15 minutes
  loginLimit: {
    windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS) || 5,
    standardHeaders: true,
    legacyHeaders: false
  },

  // Auth endpoints (register, refresh): 10 requests per 15 minutes
  authLimit: {
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false
  },

  // General API: 100 requests per 15 minutes
  apiLimit: {
    windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS) || 100,
    standardHeaders: true,
    legacyHeaders: false
  }
};
