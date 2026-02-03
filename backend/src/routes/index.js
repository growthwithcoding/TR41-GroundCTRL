/**
 * Routes Index
 * Aggregates and versions all API routes
 */

const express = require('express');
const router = express.Router();
const missionControl = require('../config/missionControl');
const { authMiddleware } = require('../middleware/authMiddleware');

// Import route modules
const healthRoutes = require('./health');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const satelliteRoutes = require('./satellites');
const scenarioRoutes = require('./scenarios');
const scenarioStepRoutes = require('./scenarioSteps');
const scenarioSessionRoutes = require('./scenarioSessions');
const aiRoutes = require('./ai');
const commandRoutes = require('./commands');
const helpRoutes = require('./help');
const websocketLogsRoutes = require('./websocket-logs');

/**
 * API v1 Routes
 */

// Public routes (no auth required)
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Protected routes (auth required)

// API root endpoint - provides information about available routes
router.get('/', (req, res) => {
  res.json({
    status: 'GO',
    code: 200,
    payload: {
      message: 'GroundCTRL API v1',
      version: missionControl.version,
      availableRoutes: [
        { path: '/health', methods: ['GET'], description: 'Health check and system status' },
        { path: '/auth/login', methods: ['POST'], description: 'Operator authentication' },
        { path: '/auth/logout', methods: ['POST'], description: 'Operator session termination' },
        { path: '/auth/refresh', methods: ['POST'], description: 'Token refresh' },
        { path: '/users', methods: ['GET', 'POST'], description: 'User management' },
        { path: '/satellites', methods: ['GET'], description: 'Satellite operations' },
        { path: '/scenarios', methods: ['GET'], description: 'Mission scenarios' },
        { path: '/scenario-steps', methods: ['GET'], description: 'Scenario steps' },
        { path: '/scenario-sessions', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], description: 'Scenario sessions' },
        { path: '/ai', methods: ['GET'], description: 'AI-powered features' },
        { path: '/commands', methods: ['GET'], description: 'Command operations' },
        { path: '/help', methods: ['GET'], description: 'Help documentation and knowledge base' }
      ]
    },
    telemetry: {
      missionTime: new Date().toISOString(),
      operatorCallSign: 'SYSTEM',
      stationId: 'GROUNDCTRL-01',
      requestId: req.id || 'N/A'
    },
    timestamp: Date.now()
  });
});

// Network Segmentation: Route Groups with Different Security Levels
// =================================================================

// Public routes (no authentication required)
const publicRoutes = express.Router();
publicRoutes.use('/health', healthRoutes);
publicRoutes.use('/auth', authRoutes);

// Protected routes (authentication required)
const protectedRoutes = express.Router();
protectedRoutes.use(authMiddleware);
protectedRoutes.use('/users', userRoutes);
protectedRoutes.use('/satellites', satelliteRoutes);
protectedRoutes.use('/scenarios', scenarioRoutes);
protectedRoutes.use('/scenario-steps', scenarioStepRoutes);
protectedRoutes.use('/scenario-sessions', scenarioSessionRoutes);
protectedRoutes.use('/ai', aiRoutes);
protectedRoutes.use('/commands', commandRoutes);
protectedRoutes.use('/help', helpRoutes);
protectedRoutes.use('/websocket-logs', websocketLogsRoutes);

// Apply route groups
router.use('/', publicRoutes);
router.use('/', protectedRoutes);
protectedRoutes.use('/satellites', satelliteRoutes);
protectedRoutes.use('/scenarios', scenarioRoutes);
protectedRoutes.use('/scenario-steps', scenarioStepRoutes);
protectedRoutes.use('/scenario-sessions', scenarioSessionRoutes);
protectedRoutes.use('/ai', aiRoutes);
protectedRoutes.use('/commands', commandRoutes);
protectedRoutes.use('/help', helpRoutes);
protectedRoutes.use('/websocket-logs', websocketLogsRoutes);

// Apply route groups
router.use('/', publicRoutes);
router.use('/', protectedRoutes);

module.exports = router;
