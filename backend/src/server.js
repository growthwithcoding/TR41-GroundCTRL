/**
 * Server Entry Point
 * Starts the Express server with Socket.IO for real-time communication
 */

const http = require('http');
const app = require('./app');
const { initializeWebSocket } = require('./websocket/server');
const logger = require('./utils/logger');

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = '0.0.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Start the server with Socket.IO support
 * Cloud Run requires immediate binding to PORT environment variable
 */
function startServer() {
  try {
    // Create HTTP server
    const server = http.createServer(app);
    
    // Initialize Socket.IO
    const io = initializeWebSocket(server);
    
    // Store io instance for potential use in routes
    app.set('io', io);
    
    server.listen(PORT, HOST, () => {
      logger.info('🚀 GroundCTRL Mission Control System ONLINE', {
        port: PORT,
        host: HOST,
        environment: process.env.NODE_ENV || 'development',
        station: process.env.CALL_SIGN || 'GROUNDCTRL-01',
        nodeVersion: process.version
      });
      
      const hostUrl = IS_PRODUCTION ? `https://${process.env.CALL_SIGN || 'groundctrl'}.web.app` : `http://localhost:${PORT}`;
      
      console.log('\n========================================');
      console.log('   🛰️  GROUNDCTRL MISSION CONTROL  🛰️');
      console.log('========================================');
      console.log('Status: GO FOR LAUNCH ✓');
      console.log(`Station: ${process.env.CALL_SIGN || 'GROUNDCTRL-01'}`);
      console.log(`Port: ${PORT}`);
      console.log(`Host: ${HOST}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('========================================');
      console.log('Key Endpoints:');
      console.log(`  API Root:    ${hostUrl}/api/v1`);
      console.log(`  Health:      ${hostUrl}/api/v1/health`);
      console.log(`  DB Health:   ${hostUrl}/api/v1/health/db`);
      console.log(`  Docs:        ${hostUrl}/api/v1/docs`);
      console.log(`  WebSocket:   ${hostUrl}/socket.io/`);
      console.log('========================================');
      console.log('Real-time Features:');
      console.log('  🔌 Socket.IO: ENABLED');
      console.log('  📡 Telemetry: /telemetry namespace');
      console.log('  🎮 Commands:  /commands namespace');
      console.log('========================================\n');
    });

    // Setup graceful shutdown handlers
    setupGracefulShutdown(server);
    
    return server;
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      port: PORT,
      stack: error.stack
    });
    console.error('\n❌ LAUNCH ABORTED');
    console.error(`Reason: ${error.message}`);
    console.error('\nTroubleshooting:');
    console.error(`  • Check if port ${PORT} is available`);
    console.error('  • Verify PORT environment variable is set correctly');
    console.error('  • Check application logs for initialization errors\n');
    process.exit(1);
  }
}

/**
 * Setup graceful shutdown handlers
 * @param {object} server - HTTP server instance
 */
function setupGracefulShutdown(server) {
  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });

  // Skip SIGINT handler in test environment to prevent Jest from shutting down the server
  if (process.env.NODE_ENV !== 'test') {
    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });
  }

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
    server.close(() => {
      process.exit(1);
    });
  });
}

// Start the server
startServer();

module.exports = { startServer };
