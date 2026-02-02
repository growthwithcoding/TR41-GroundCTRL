/**
 * Express App Configuration
 * Initializes Express app with middleware and routes
 * 
 * CRITICAL: This module must load quickly and not throw errors that prevent
 * the server from starting. All initialization must be graceful.
 */

// Load environment variables first
require('dotenv').config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
});

console.log('📦 Loading Express application modules...');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

// Initialize Express app immediately
const app = express();
console.log('✓ Express app instance created');

// Load configuration modules with error handling
let swaggerSpec;
let missionControl;
let routes;
let errorHandler, notFoundHandler;
let authErrorNormalizer;
let apiLimiter;
let auditLogger;

try {
  console.log('📋 Loading middleware and configuration...');
  swaggerSpec = require('./config/swagger');
  missionControl = require('./config/missionControl');
  auditLogger = require('./middleware/auditLogger');
  ({ errorHandler, notFoundHandler } = require('./middleware/errorHandler'));
  authErrorNormalizer = require('./middleware/authErrorNormalizer');
  ({ apiLimiter } = require('./middleware/rateLimiter'));
  routes = require('./routes');
  console.log('✓ Middleware and configuration loaded');
} catch (error) {
  console.error('⚠️  Warning: Some middleware failed to load:', error.message);
  console.error('   Server will start with reduced functionality');
  // Set defaults for failed modules
  swaggerSpec = swaggerSpec || {};
  missionControl = missionControl || { version: 'unknown' };
  auditLogger = auditLogger || ((req, res, next) => next());
  apiLimiter = apiLimiter || ((req, res, next) => next());
  authErrorNormalizer = authErrorNormalizer || ((req, res, next) => next());
  errorHandler = errorHandler || ((err, req, res, next) => {
    res.status(500).json({ error: 'Internal server error' });
  });
  notFoundHandler = notFoundHandler || ((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
}

// Initialize Firebase with graceful error handling
// Don't exit process on failure - let server start for Cloud Run health checks
console.log('🔥 Initializing Firebase...');
let firebaseInitialized = false;
try {
  const { initializeFirebase } = require('./config/firebase');
  initializeFirebase();
  firebaseInitialized = true;
  console.log('✓ Firebase initialized successfully');
} catch (error) {
  console.error('⚠️  WARNING: Firebase initialization failed');
  console.error('    Server will start but Firebase features will be unavailable');
  console.error('    Error:', error.message);
  
  // Log for production debugging
  const logger = require('./utils/logger');
  logger.error('Failed to initialize Firebase - server will start in degraded mode', { 
    error: error.message,
    stack: error.stack,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL
    }
  });
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
if (swaggerSpec && Object.keys(swaggerSpec).length > 0) {
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'GroundCTRL API Documentation',
    customfavIcon: '/favicon.ico'
  }));
} else {
  app.get('/api/v1/docs', (req, res) => {
    res.status(503).json({ error: 'API documentation not available' });
  });
}

// API Routes (versioned)
if (routes) {
  app.use('/api/v1', routes);
} else {
  // Fallback routes if main routes failed to load
  app.get('/api/v1', (req, res) => {
    res.status(503).json({ 
      error: 'API routes not available',
      message: 'Server is in degraded mode due to initialization errors'
    });
  });
}

// Health endpoint at root level for tests and quick checks
// This MUST always work for Cloud Run health checks
app.get('/health', (req, res) => {
  res.json({
    status: 'GO',
    service: 'GroundCTRL API',
    version: missionControl?.version || 'unknown',
    firebase: firebaseInitialized ? 'initialized' : 'unavailable'
  });
});

// Root endpoint - This MUST always work for Cloud Run
app.get('/', (req, res) => {
  res.json({
    service: 'GroundCTRL API',
    version: missionControl?.version || 'unknown',
    status: 'operational',
    documentation: '/api/v1/docs',
    health: '/api/v1/health',
    firebase: firebaseInitialized ? 'initialized' : 'unavailable'
  });
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Auth error normalizer (must be before global error handler)
app.use(authErrorNormalizer);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
