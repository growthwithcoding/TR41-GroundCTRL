/**
 * World Handler
 * 
 * Handles world state WebSocket events
 * Provides ground station data to connected clients
 */

const { getAllGroundStations } = require('../../repositories/groundStationRepository');
const logger = require('../../utils/logger');

/**
 * Handle world state events
 * @param {object} socket - Socket.IO socket instance
 */
async function handleWorldState(socket) {
  logger.info('World state handler initialized', {
    socketId: socket.id,
    userId: socket.user?.uid
  });

  try {
    // Fetch ground stations from Firestore
    const groundStations = await getAllGroundStations();

    // Send ground stations data on connection
    socket.emit('world:stations', groundStations);

    logger.info('Ground stations data sent', {
      socketId: socket.id,
      stationCount: groundStations.length
    });
  } catch (error) {
    logger.error('Error fetching ground stations', {
      socketId: socket.id,
      error: error.message
    });
    socket.emit('world:stations', []); // Send empty array on error
  }

  // Handle client requests for ground station updates
  socket.on('world:request-stations', async () => {
    logger.info('Client requested ground stations', {
      socketId: socket.id
    });
    
    try {
      const groundStations = await getAllGroundStations();
      socket.emit('world:stations', groundStations);
    } catch (error) {
      logger.error('Error fetching ground stations on request', {
        socketId: socket.id,
        error: error.message
      });
      socket.emit('world:stations', []);
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    logger.info('World state client disconnected', {
      socketId: socket.id,
      reason
    });
  });
}

module.exports = { handleWorldState };
