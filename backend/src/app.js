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
const auditLogger = require('./middleware/auditLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authErrorNormalizer = require('./middleware/authErrorNormalizer');
const { apiLimiter } = require('./middleware/rateLimiter');
const routes = require('./routes');
const logger = require('./utils/logger');

// Initialize Express app
const app = express();

// Initialize Firebase
try {
  initializeFirebase();
} catch (error) {
  logger.error('Failed to initialize Firebase', { error: error.message });
  process.exit(1);
}

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3001', 'http://localhost:5173'];

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

// Trust proxy (for accurate IP addresses behind reverse proxies like Vercel)
app.set('trust proxy', 1);

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
    version: '1.0.0',
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
