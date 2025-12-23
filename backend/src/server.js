/**
 * Server Entry Point
 * Starts the Express server
 */

const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3001;

// Start server
const server = app.listen(PORT, () => {
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
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('========================================');
  console.log('Key Endpoints:');
  console.log(`  API Root:    ${host}/api/v1`);
  console.log(`  Health:      ${host}/api/v1/health`);
  console.log(`  DB Health:   ${host}/api/v1/health/db`);
  console.log(`  Docs:        ${host}/api/v1/docs`);
  console.log('========================================\n');
});

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
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

module.exports = server;
