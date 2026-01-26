/**
 * WebSocket Server Configuration
 * Initializes Socket.IO with namespaces, authentication, and event handlers
 */

const { Server } = require('socket.io');
const { verifySocketToken } = require('./middleware/socketAuth');
const { createTelemetryHandler } = require('./handlers/telemetryHandler');
const { createCommandHandler } = require('./handlers/commandHandler');
const SessionManager = require('../services/sessionManager');
const SimulationEngine = require('../services/simulationEngine');
const logger = require('../utils/logger');

/**
 * Initialize WebSocket server
 * @param {object} httpServer - HTTP server instance
 * @returns {object} Socket.IO server instance with sessionManager and simulationEngine
 */
function initializeWebSocket(httpServer) {
  // Create Socket.IO server
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST']
    },
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  logger.info('Socket.IO server initialized', {
    cors: process.env.FRONTEND_URL || 'http://localhost:5173',
    path: '/socket.io/'
  });

  // Initialize session manager and simulation engine (circular dependency resolved)
  const sessionManager = new SessionManager(io);
  const simulationEngine = new SimulationEngine(sessionManager);
  
  // Set simulation engine reference in session manager
  sessionManager.simulationEngine = simulationEngine;
  
  logger.info('Session manager and simulation engine initialized');

  // Telemetry namespace - for real-time data updates
  const telemetryNamespace = io.of('/telemetry');
  telemetryNamespace.use(verifySocketToken);
  telemetryNamespace.on('connection', createTelemetryHandler(io, sessionManager));

  logger.info('Telemetry namespace configured', { path: '/telemetry' });

  // Command namespace - for command transmission
  const commandNamespace = io.of('/commands');
  commandNamespace.use(verifySocketToken);
  commandNamespace.on('connection', createCommandHandler(io, sessionManager, simulationEngine));

  logger.info('Command namespace configured', { path: '/commands' });

  // Connection monitoring
  io.on('connection', (socket) => {
    logger.info('Socket.IO connection (default namespace)', {
      socketId: socket.id
    });
  });

  // Graceful shutdown handler
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, cleaning up WebSocket connections');
    simulationEngine.stopAll();
    io.close(() => {
      logger.info('WebSocket server closed');
    });
  });

  // Expose instances for external access
  io.sessionManager = sessionManager;
  io.simulationEngine = simulationEngine;

  return io;
}

module.exports = { initializeWebSocket };
