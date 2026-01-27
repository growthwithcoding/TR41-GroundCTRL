/**
 * Routes Index
 * Aggregates and versions all API routes
 */

const express = require('express');
const router = express.Router();
const missionControl = require('../config/missionControl');

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

// Health check (no /api/v1 prefix needed, applied in app.js)
router.use('/health', healthRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// User management routes
router.use('/users', userRoutes);

// Satellite routes (stub)
router.use('/satellites', satelliteRoutes);

// Scenario routes (stub)
router.use('/scenarios', scenarioRoutes);

// Scenario Step routes
router.use('/scenario-steps', scenarioStepRoutes);

// Scenario Session routes
router.use('/scenario-sessions', scenarioSessionRoutes);

// AI routes (stub)
router.use('/ai', aiRoutes);

// Command routes (stub)
router.use('/commands', commandRoutes);

// Help routes
router.use('/help', helpRoutes);

// WebSocket logs routes (development only)
router.use('/websocket-logs', websocketLogsRoutes);

module.exports = router;
