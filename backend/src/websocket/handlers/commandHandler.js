/**
 * Command Handler
 * Handles command transmission and acknowledgment
 */

const logger = require('../../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Create command event handlers
 * @param {object} io - Socket.IO server instance
 * @param {SessionManager} sessionManager - Session manager instance
 * @returns {function} Connection handler
 */
function createCommandHandler(io, sessionManager, simulationEngine) {
  return (socket) => {
    logger.info('Command connection established', {
      socketId: socket.id,
      userId: socket.user.id,
      email: socket.user.email
    });

    // Handle command transmission
    socket.on('command:send', async ({ sessionId, command, parameters }) => {
      const commandId = command.id || uuidv4();
      
      try {
        logger.info('Command transmission initiated', {
          socketId: socket.id,
          userId: socket.user.id,
          sessionId,
          commandId,
          commandType: command.type || command.name
        });

        // Validate command exists
        if (!command || !sessionId) {
          throw new Error('Invalid command or session');
        }

        // Step 1: Validating
        socket.emit('command:status', {
          commandId,
          status: 'validating',
          timestamp: Date.now()
        });

        await delay(500);

        // Step 2: Transmitting
        socket.emit('command:status', {
          commandId,
          status: 'transmitting',
          timestamp: Date.now()
        });

        await delay(1500);

        // Step 3: Awaiting acknowledgment
        socket.emit('command:status', {
          commandId,
          status: 'awaiting-ack',
          timestamp: Date.now()
        });

        await delay(1500);

        // Step 4: Executing
        socket.emit('command:status', {
          commandId,
          status: 'executing',
          timestamp: Date.now()
        });

        // Apply command to simulation engine if available
        if (simulationEngine && simulationEngine.isRunning(sessionId)) {
          simulationEngine.applyCommand(sessionId, {
            id: commandId,
            ...command,
            parameters
          });
        }

        // Update session state based on command
        sessionManager.updateSessionState(sessionId, {
          lastCommand: {
            id: commandId,
            command,
            parameters,
            timestamp: Date.now(),
            status: 'executing'
          }
        });

        await delay(1000);

        // Step 5: Completed
        socket.emit('command:status', {
          commandId,
          status: 'completed',
          timestamp: Date.now(),
          result: {
            success: true,
            message: 'Command executed successfully'
          }
        });

        // Update final command state
        sessionManager.updateSessionState(sessionId, {
          lastCommand: {
            id: commandId,
            command,
            parameters,
            timestamp: Date.now(),
            status: 'completed'
          }
        });

        logger.info('Command execution completed', {
          socketId: socket.id,
          userId: socket.user.id,
          sessionId,
          commandId
        });

      } catch (error) {
        logger.error('Command execution failed', {
          socketId: socket.id,
          userId: socket.user.id,
          sessionId,
          commandId,
          error: error.message
        });

        socket.emit('command:status', {
          commandId,
          status: 'failed',
          timestamp: Date.now(),
          error: error.message
        });

        // Update session with failed command
        sessionManager.updateSessionState(sessionId, {
          lastCommand: {
            id: commandId,
            command,
            parameters,
            timestamp: Date.now(),
            status: 'failed',
            error: error.message
          }
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info('Command connection closed', {
        socketId: socket.id,
        userId: socket.user.id,
        reason
      });
    });
  };
}

/**
 * Helper function to delay execution
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { createCommandHandler };
