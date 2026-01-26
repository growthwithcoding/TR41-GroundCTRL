/**
 * WebSocket Session Logs Routes (Development Only)
 * Provides endpoints to monitor active WebSocket sessions
 */

const express = require('express');
const router = express.Router();

// Only enable routes in development mode
if (process.env.NODE_ENV === 'development') {
  /**
   * GET /api/websocket-logs/sessions
   * Get list of active WebSocket sessions
   */
  router.get('/sessions', (req, res) => {
    const io = req.app.get('io');
    
    if (!io) {
      return res.status(503).json({
        status: 'error',
        message: 'Socket.IO server not initialized',
      });
    }

    // Get telemetry namespace
    const telemetryNsp = io.of('/telemetry');
    const commandNsp = io.of('/commands');

    const telemetrySessions = [];
    const commandSessions = [];

    // Get all connected sockets in telemetry namespace
    telemetryNsp.sockets.forEach((socket) => {
      telemetrySessions.push({
        socketId: socket.id,
        userId: socket.userId,
        sessionId: socket.currentSessionId,
        connected: socket.connected,
        connectedAt: socket.handshake.time,
        ip: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
      });
    });

    // Get all connected sockets in command namespace
    commandNsp.sockets.forEach((socket) => {
      commandSessions.push({
        socketId: socket.id,
        userId: socket.userId,
        sessionId: socket.currentSessionId,
        connected: socket.connected,
        connectedAt: socket.handshake.time,
        ip: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
      });
    });

    res.json({
      status: 'success',
      data: {
        telemetry: {
          namespace: '/telemetry',
          activeConnections: telemetrySessions.length,
          sessions: telemetrySessions,
        },
        commands: {
          namespace: '/commands',
          activeConnections: commandSessions.length,
          sessions: commandSessions,
        },
        summary: {
          totalConnections: telemetrySessions.length + commandSessions.length,
          telemetryConnections: telemetrySessions.length,
          commandConnections: commandSessions.length,
        },
      },
    });
  });

  /**
   * GET /api/websocket-logs/stats
   * Get WebSocket server statistics
   */
  router.get('/stats', (req, res) => {
    const io = req.app.get('io');
    
    if (!io) {
      return res.status(503).json({
        status: 'error',
        message: 'Socket.IO server not initialized',
      });
    }

    const telemetryNsp = io.of('/telemetry');
    const commandNsp = io.of('/commands');

    res.json({
      status: 'success',
      data: {
        server: {
          engine: io.engine.clientsCount,
          namespaces: Object.keys(io._nsps).length,
        },
        namespaces: {
          telemetry: {
            path: '/telemetry',
            sockets: telemetryNsp.sockets.size,
            rooms: telemetryNsp.adapter.rooms.size,
          },
          commands: {
            path: '/commands',
            sockets: commandNsp.sockets.size,
            rooms: commandNsp.adapter.rooms.size,
          },
        },
      },
    });
  });

  /**
   * GET /api/websocket-logs/rooms
   * Get list of active rooms (sessions)
   */
  router.get('/rooms', (req, res) => {
    const io = req.app.get('io');
    
    if (!io) {
      return res.status(503).json({
        status: 'error',
        message: 'Socket.IO server not initialized',
      });
    }

    const telemetryNsp = io.of('/telemetry');
    const rooms = [];

    // Get all rooms
    telemetryNsp.adapter.rooms.forEach((sockets, roomName) => {
      // Skip socket ID rooms (private rooms)
      if (!telemetryNsp.sockets.has(roomName)) {
        rooms.push({
          roomName: roomName,
          participants: sockets.size,
          socketIds: Array.from(sockets),
        });
      }
    });

    res.json({
      status: 'success',
      data: {
        totalRooms: rooms.length,
        rooms: rooms,
      },
    });
  });

  /**
   * POST /api/websocket-logs/broadcast
   * Broadcast a test message to all connected clients
   */
  router.post('/broadcast', (req, res) => {
    const io = req.app.get('io');
    const { namespace = '/telemetry', event = 'test:message', data } = req.body;
    
    if (!io) {
      return res.status(503).json({
        status: 'error',
        message: 'Socket.IO server not initialized',
      });
    }

    const nsp = io.of(namespace);
    nsp.emit(event, data || { message: 'Test broadcast from server' });

    res.json({
      status: 'success',
      message: `Broadcast sent to ${namespace}`,
      data: {
        namespace,
        event,
        recipients: nsp.sockets.size,
      },
    });
  });
}

module.exports = router;
