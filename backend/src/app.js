/**
 * Express App Configuration
 * Initializes Express app with middleware and routes
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { initializeFirebase } = require('./config/firebase');
const swaggerSpec = require('./config/swagger');
const missionControl = require('./config/missionControl');
const auditLogger = require('./middleware/auditLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authErrorNormalizer = require('./middleware/authErrorNormalizer');
const { apiLimiter } = require('./middleware/rateLimiter');
const { responseEnvelopeMiddleware } = require('./middleware/responseEnvelope');
const routes = require('./routes');
const logger = require('./utils/logger');

// Initialize Express app
const app = express();

// Initialize Firebase with graceful error handling
// Don't exit process on failure - let server start for Cloud Run health checks
let firebaseInitialized = false;
try {
  initializeFirebase();
  firebaseInitialized = true;
  logger.info('Firebase initialized successfully');
} catch (error) {
  logger.error('Failed to initialize Firebase - server will start in degraded mode', { 
    error: error.message,
    stack: error.stack 
  });
  console.error('⚠️  WARNING: Firebase initialization failed');
  console.error('    Server will start but Firebase features will be unavailable');
  console.error('    Error:', error.message);
  // Don't exit - let the server start so Cloud Run health checks pass
  // Firebase errors will be handled by individual endpoints
}

// Expose Firebase status for health checks
app.locals.firebaseInitialized = firebaseInitialized;

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy (required for Cloud Run to get real client IPs from X-Forwarded-* headers)
app.set('trust proxy', 1);

// Response envelope middleware (must be early to wrap all responses)
app.use(responseEnvelopeMiddleware);

// Global API rate limiter (applied to all routes)
app.use(apiLimiter);

// Request logging middleware
app.use(auditLogger);

// Swagger API Documentation
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'GroundCTRL API Documentation',
  customfavIcon: '/favicon.ico'
}));

// API Routes (versioned)
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'GroundCTRL API',
    version: missionControl.version,
    status: 'operational',
    documentation: '/api/v1/docs',
    health: '/api/v1/health'
  });
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Auth error normalizer (must be before global error handler)
app.use(authErrorNormalizer);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
