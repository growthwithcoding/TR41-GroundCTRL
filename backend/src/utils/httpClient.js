/**
 * Centralized HTTP Client
 * Provides a configured axios instance with timeout management,
 * request/response logging, and error transformation
 */

const axios = require('axios');
const logger = require('./logger');
const { AuthError } = require('./errors');

/**
 * Create axios instance with centralized configuration
 */
const httpClient = axios.create({
  timeout: parseInt(process.env.HTTP_CLIENT_TIMEOUT_MS) || 8000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request interceptor for logging
 */
httpClient.interceptors.request.use(
  (config) => {
    logger.debug('HTTP Request', {
      method: config.method?.toUpperCase(),
      url: config.url,
      timeout: config.timeout
    });
    return config;
  },
  (error) => {
    logger.error('HTTP Request Error', { error: error.message });
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for logging and error transformation
 */
httpClient.interceptors.response.use(
  (response) => {
    logger.debug('HTTP Response', {
      status: response.status,
      url: response.config.url
    });
    return response;
  },
  (error) => {
    // Log the error
    logger.error('HTTP Response Error', {
      message: error.message,
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });

    // Transform axios errors to application errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return Promise.reject(
        new AuthError('Request timeout - authentication service unavailable', 503)
      );
    }

    // Pass through the error for service-level handling
    return Promise.reject(error);
  }
);

module.exports = httpClient;
