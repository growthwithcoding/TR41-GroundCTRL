/**
 * Server Entry Point
 * Starts the Express server with smart port handling
 */

const app = require('./app');
const logger = require('./utils/logger');

const PREFERRED_PORT = parseInt(process.env.PORT || '3001', 10);
const MAX_PORT_ATTEMPTS = 10;

/**
 * Find an available port starting from the preferred port
 * @param {number} startPort - Starting port number
 * @param {number} maxAttempts - Maximum number of ports to try
 * @returns {Promise<number>} Available port number
 */
async function findAvailablePort(startPort, maxAttempts = MAX_PORT_ATTEMPTS) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const portToTry = startPort + attempt;
    
    try {
      await new Promise((resolve, reject) => {
        const testServer = app.listen(portToTry)
          .once('listening', () => {
            testServer.close();
            resolve(portToTry);
          })
          .once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
              reject(err);
            } else {
              reject(err);
            }
          });
      });
      
      return portToTry;
    } catch (err) {
      if (err.code === 'EADDRINUSE') {
        if (attempt === 0) {
          logger.warn(`Port ${portToTry} is already in use, searching for available port...`);
        } else {
          logger.debug(`Port ${portToTry} is busy, trying next port...`);
        }
        continue;
      }
      throw err;
    }
  }
  
  throw new Error(`Could not find an available port after trying ${maxAttempts} ports starting from ${startPort}`);
}

/**
 * Start the server with smart port handling
 */
async function startServer() {
  try {
    const PORT = await findAvailablePort(PREFERRED_PORT);
    
    const server = app.listen(PORT, () => {
      if (PORT !== PREFERRED_PORT) {
        logger.info('🔄 Using alternative port', {
          preferredPort: PREFERRED_PORT,
          actualPort: PORT,
          reason: 'Preferred port was in use'
        });
      }
      
      logger.info('🚀 GroundCTRL Mission Control System ONLINE', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        station: process.env.CALL_SIGN || 'GROUNDCTRL-01',
        nodeVersion: process.version
      });
      
      const host = `http://localhost:${PORT}`;
      
      console.log('\n========================================');
      console.log('   🛰️  GROUNDCTRL MISSION CONTROL  🛰️');
      console.log('========================================');
      console.log('Status: GO FOR LAUNCH ✓');
      console.log(`Station: ${process.env.CALL_SIGN || 'GROUNDCTRL-01'}`);
      console.log(`Port: ${PORT}${PORT !== PREFERRED_PORT ? ` (preferred: ${PREFERRED_PORT})` : ''}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('========================================');
      console.log('Key Endpoints:');
      console.log(`  API Root:    ${host}/api/v1`);
      console.log(`  Health:      ${host}/api/v1/health`);
      console.log(`  DB Health:   ${host}/api/v1/health/db`);
      console.log(`  Docs:        ${host}/api/v1/docs`);
      console.log('========================================\n');
    });

    // Setup graceful shutdown handlers
    setupGracefulShutdown(server);
    
    return server;
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      preferredPort: PREFERRED_PORT
    });
    console.error('\n❌ LAUNCH ABORTED');
    console.error(`Reason: ${error.message}`);
    console.error('\nTroubleshooting:');
    console.error(`  • Check if ports ${PREFERRED_PORT}-${PREFERRED_PORT + MAX_PORT_ATTEMPTS - 1} are available`);
    console.error('  • Stop other services that might be using these ports');
    console.error('  • Set a different PORT in your .env file\n');
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

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });

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
