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
router.use('/users', authMiddleware, userRoutes);
router.use('/satellites', authMiddleware, satelliteRoutes);
router.use('/scenarios', authMiddleware, scenarioRoutes);
router.use('/scenario-steps', authMiddleware, scenarioStepRoutes);
router.use('/scenario-sessions', authMiddleware, scenarioSessionRoutes);
// AI routes handle their own auth (some endpoints use optionalAuth)
router.use('/ai', aiRoutes);
router.use('/commands', authMiddleware, commandRoutes);
router.use('/help', authMiddleware, helpRoutes);
router.use('/websocket-logs', authMiddleware, websocketLogsRoutes);

// Root API endpoint
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

module.exports = router;
