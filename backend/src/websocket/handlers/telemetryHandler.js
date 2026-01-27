/**
 * Telemetry Handler
 * Handles real-time telemetry updates and session join/leave events
 */

const logger = require('../../utils/logger');

/**
 * Create telemetry event handlers
 * @param {object} io - Socket.IO server instance
 * @param {SessionManager} sessionManager - Session manager instance
 * @returns {function} Connection handler
 */
function createTelemetryHandler(io, sessionManager) {
  return (socket) => {
    logger.info('Telemetry connection established', {
      socketId: socket.id,
      userId: socket.user.id,
      email: socket.user.email
    });

    // Handle session join
    socket.on('session:join', async ({ sessionId }) => {
      try {
        const initialState = await sessionManager.joinSession(
          sessionId,
          socket.user.id,
          socket
        );
        
        socket.emit('session:joined', {
          sessionId,
          state: initialState,
          timestamp: Date.now()
        });
        
        logger.info('User joined telemetry session', {
          socketId: socket.id,
          userId: socket.user.id,
          sessionId
        });
      } catch (error) {
        logger.error('Failed to join telemetry session', {
          socketId: socket.id,
          userId: socket.user.id,
          sessionId,
          error: error.message
        });
        
        socket.emit('session:error', {
          message: error.message,
          code: 'JOIN_FAILED'
        });
      }
    });

    // Handle session leave
    socket.on('session:leave', ({ sessionId }) => {
      try {
        sessionManager.disconnectFromSession(
          sessionId,
          socket.user.id,
          socket
        );
        
        socket.emit('session:left', {
          sessionId,
          timestamp: Date.now()
        });
        
        logger.info('User left telemetry session', {
          socketId: socket.id,
          userId: socket.user.id,
          sessionId
        });
      } catch (error) {
        logger.error('Failed to leave telemetry session', {
          socketId: socket.id,
          userId: socket.user.id,
          sessionId,
          error: error.message
        });
      }
    });

    // Handle request for current state
    socket.on('state:request', ({ sessionId }) => {
      try {
        const currentState = sessionManager.getSessionState(sessionId);
        
        if (currentState) {
          socket.emit('state:update', currentState);
        } else {
          socket.emit('session:error', {
            message: 'Session not found or inactive',
            code: 'SESSION_INACTIVE'
          });
        }
      } catch (error) {
        logger.error('Failed to retrieve session state', {
          socketId: socket.id,
          sessionId,
          error: error.message
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info('Telemetry connection closed', {
        socketId: socket.id,
        userId: socket.user.id,
        reason
      });
    });
  };
}

module.exports = { createTelemetryHandler };
