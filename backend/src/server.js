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
  console.log('🔧 Starting server initialization...');
  console.log(`Target PORT: ${PORT}`);
  console.log(`Target HOST: ${HOST}`);
  
  try {
    console.log('📡 Creating HTTP server...');
    // Create HTTP server
    const server = http.createServer(app);
    
    console.log('🔌 Initializing WebSocket server...');
    // Initialize Socket.IO with error handling
    let io;
    try {
      io = initializeWebSocket(server);
      console.log('✅ WebSocket server initialized successfully');
    } catch (error) {
      console.error('⚠️  WebSocket initialization failed:', error.message);
      logger.error('WebSocket initialization failed', { error: error.message, stack: error.stack });
      // Continue without WebSocket if it fails
    }
    
    // Store io instance for potential use in routes (only if initialized)
    if (io) {
      app.set('io', io);
    }
    
    console.log(`🚀 Attempting to bind to ${HOST}:${PORT}...`);
    
    // Add a startup timeout to prevent hanging
    const startupTimeout = setTimeout(() => {
      console.error('❌ Server startup timeout - failed to bind to port within 30 seconds');
      logger.error('Server startup timeout', { port: PORT, host: HOST });
      process.exit(1);
    }, 30000); // 30 second timeout
    
    server.listen(PORT, HOST, () => {
      clearTimeout(startupTimeout); // Clear timeout on successful startup
      console.log(`✅ Server successfully listening on ${HOST}:${PORT}`);
      
      // Mark server as fully ready
      app.locals.serverReady = true;
      
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

    // Add server error handlers
    server.on('error', (error) => {
      clearTimeout(startupTimeout);
      console.error('❌ Server error:', error.message);
      logger.error('Server error during startup', { 
        error: error.message, 
        code: error.code,
        port: PORT,
        host: HOST,
        stack: error.stack 
      });
      
      if (error.code === 'EADDRINUSE') {
        console.error(`   Port ${PORT} is already in use`);
        process.exit(1);
      } else if (error.code === 'EACCES') {
        console.error(`   Permission denied accessing port ${PORT}`);
        process.exit(1);
      } else {
        console.error(`   Unexpected server error: ${error.code || error.message}`);
        process.exit(1);
      }
    });

    server.on('close', () => {
      console.log('🔌 HTTP server closed');
      logger.info('HTTP server closed');
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
