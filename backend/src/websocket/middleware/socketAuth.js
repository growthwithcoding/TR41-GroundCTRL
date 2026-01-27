/**
 * Socket.IO Authentication Middleware
 * Verifies Firebase ID tokens for WebSocket connections
 */

const { getAuth } = require('../../config/firebase');
const logger = require('../../utils/logger');

/**
 * Middleware to verify Firebase ID token from socket handshake
 * Attaches decoded user data to socket instance
 * @param {object} socket - Socket.IO socket instance
 * @param {function} next - Callback to continue or reject connection
 */
async function verifySocketToken(socket, next) {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      logger.warn('Socket connection attempt without token', {
        socketId: socket.id,
        ip: socket.handshake.address
      });
      return next(new Error('Authentication token required'));
    }
    
    // Verify the Firebase ID token using Firebase Admin SDK
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Attach user data to socket for use in handlers
    socket.user = {
      id: decodedToken.uid,
      email: decodedToken.email,
      uid: decodedToken.uid
    };
    
    logger.info('Socket authenticated', {
      socketId: socket.id,
      userId: decodedToken.uid,
      email: decodedToken.email
    });
    
    next();
  } catch (error) {
    logger.warn('Socket authentication failed', {
      socketId: socket.id,
      error: error.message,
      ip: socket.handshake.address
    });
    next(new Error('Authentication failed'));
  }
}

module.exports = { verifySocketToken };
