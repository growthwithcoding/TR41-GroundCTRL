/**
 * Server Entry Point
 * Starts the Express server with Socket.IO for real-time communication
 * 
 * CRITICAL: Cloud Run requires the container to listen on the PORT environment
 * variable within the startup timeout. This server MUST bind to the port
 * immediately, before any initialization that could delay or fail.
 */

const http = require('http');
const logger = require('./utils/logger');

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = '0.0.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Log critical startup information immediately
console.log('========================================');
console.log('   🛰️  GROUNDCTRL SERVER STARTING  🛰️');
console.log('========================================');
console.log(`Port: ${PORT}`);
console.log(`Host: ${HOST}`);
console.log(`Node: ${process.version}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Time: ${new Date().toISOString()}`);
console.log('========================================\n');

/**
 * Start the server with Socket.IO support
 * Cloud Run requires immediate binding to PORT environment variable
 */
function startServer() {
  console.log('🚀 Initializing server...');
  
  try {
    // Import app - wrapped in try/catch to catch any initialization errors
    console.log('📦 Loading Express application...');
    const app = require('./app');
    console.log('✓ Express application loaded');
    
    // Create HTTP server immediately
    console.log('🔧 Creating HTTP server...');
    const server = http.createServer(app);
    console.log('✓ HTTP server created');
    
    // Bind to port IMMEDIATELY - this is critical for Cloud Run health checks
    console.log(`🔌 Binding to ${HOST}:${PORT}...`);
    server.listen(PORT, HOST, () => {
      console.log(`✓ Server listening on ${HOST}:${PORT}`);
      
      // Initialize WebSocket AFTER server is listening
      // This ensures health checks pass even if WebSocket init fails
      try {
        console.log('🔌 Initializing WebSocket (Socket.IO)...');
        const { initializeWebSocket } = require('./websocket/server');
        const io = initializeWebSocket(server);
        app.set('io', io);
        console.log('✓ WebSocket initialized');
      } catch (wsError) {
        logger.error('WebSocket initialization failed - server will run without WebSocket', {
          error: wsError.message,
          stack: wsError.stack
        });
        console.error('⚠️  WebSocket initialization failed, but server will continue');
        console.error('    Error:', wsError.message);
      }
      
      // Log successful startup
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
      console.log('  🔌 Socket.IO: ' + (app.get('io') ? 'ENABLED' : 'DISABLED'));
      console.log('  📡 Telemetry: /telemetry namespace');
      console.log('  🎮 Commands:  /commands namespace');
      console.log('========================================\n');
    });

    // Setup graceful shutdown handlers
    setupGracefulShutdown(server);
    
    // Add error handler for the server itself
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`, { error: error.message });
        console.error(`\n❌ ERROR: Port ${PORT} is already in use`);
      } else {
        logger.error('Server error', { error: error.message, stack: error.stack });
        console.error('\n❌ Server error:', error.message);
      }
      process.exit(1);
    });
    
    return server;
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      port: PORT,
      stack: error.stack
    });
    console.error('\n========================================');
    console.error('❌ LAUNCH ABORTED');
    console.error('========================================');
    console.error(`Reason: ${error.message}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    console.error('\n========================================');
    console.error('Troubleshooting:');
    console.error(`  • Check if port ${PORT} is available`);
    console.error('  • Verify PORT environment variable is set correctly');
    console.error('  • Check application logs for initialization errors');
    console.error('  • Verify all required secrets are set in Firebase');
    console.error('  • Check Firebase initialization logs above');
    console.error('========================================\n');
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
