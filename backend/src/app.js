/**
 * Express App Configuration
 * Initializes Express app with middleware and routes
 */

require('dotenv').config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
});
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const { initializeFirebase } = require('./config/firebase');
const swaggerSpec = require('./config/swagger');
const missionControl = require('./config/missionControl');
const auditLogger = require('./middleware/auditLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authErrorNormalizer = require('./middleware/authErrorNormalizer');
const { apiLimiter } = require('./middleware/rateLimiter');
// const { responseEnvelopeMiddleware } = require('./middleware/responseEnvelope'); // Temporarily disabled
const routes = require('./routes');
const logger = require('./utils/logger');

// Initialize Express app
const app = express();

// Track application readiness
let appReady = false;
app.locals.appReady = false;
app.locals.firebaseInitialized = false;

// Initialize Firebase with graceful error handling
// Don't exit process on failure - let server start for Cloud Run health checks
let firebaseInitialized = false;

// Add startup logging for Cloud Run debugging
console.log('🚀 Starting GroundCTRL Backend Server...');
console.log(`Node Version: ${process.version}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`PORT: ${process.env.PORT || '8080'}`);

try {
  console.log('📡 Initializing Firebase Admin SDK...');
  initializeFirebase();
  firebaseInitialized = true;
  app.locals.firebaseInitialized = true;
  console.log('✅ Firebase initialized successfully');
  logger.info('Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  app.locals.firebaseInitialized = false;
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

// Security headers middleware (helmet)
// Enable for all environments including tests so security header tests work
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''], // Allow inline styles for now
      scriptSrc: ['\'self\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
      reportUri: '/csp-report', // CSP violation reporting endpoint
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
    'http://localhost:3001', 
    'http://localhost:5173',
    'http://localhost:5174',  // Allow alternate port
    'http://localhost:5175',  // Allow alternate port
    'http://localhost:8080'   // Allow backend port
  ];

logger.info('CORS Configuration', {
  nodeEnv: process.env.NODE_ENV,
  allowedOriginsEnv: process.env.ALLOWED_ORIGINS,
  allowedOriginsArray: allowedOrigins
});

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow any localhost origin
    if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin', { origin, allowedOrigins });
      // Return false to block without throwing error (prevents 500)
      callback(null, false);
    }
  },
  credentials: true, // Allow cookies/credentials with allowed origins
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204, // Return 204 for successful OPTIONS requests
  maxAge: 86400 // 24 hours
}));

// Expose Firebase status for health checks
app.locals.firebaseInitialized = firebaseInitialized;

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy (required for Cloud Run to get real client IPs from X-Forwarded-* headers)
app.set('trust proxy', 1);

// Response envelope middleware (must be early to wrap all responses)
// app.use(responseEnvelopeMiddleware); // Temporarily disabled for testing

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

// Health endpoint at root level for tests and quick checks
app.get('/health', (req, res) => {
  res.json({
    status: 'GO',
    service: 'GroundCTRL API',
    version: missionControl.version
  });
});

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

// Mark app as ready after all middleware and routes are configured
console.log('✅ Express app configuration complete');
app.locals.appReady = true;

module.exports = app;
