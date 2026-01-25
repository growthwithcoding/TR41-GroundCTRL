# WebSocket Implementation Plan

## Executive Summary

Implement real-time bidirectional communication between backend and frontend to enable:
- Live satellite telemetry updates (altitude, subsystems, orbit parameters)
- Real-time command transmission and acknowledgment
- Session state synchronization
- Launch animation with actual satellite data
- Subsystem status indicators matching scenario structure

---

## Current State Analysis

### Backend
- **Server**: Express (HTTP only) on port 8080
- **Dependencies**: No WebSocket library currently installed
- **Data Models**:
  - `scenarioSession`: Has `state` field (JSON blob) for runtime simulation state
  - `satellite`: Contains orbit, power, attitude, thermal, propulsion, payload subsystems
- **Repository Pattern**: CRUD operations via Firestore
- **Authentication**: JWT-based with Firebase Admin

### Frontend
- **Current Data Source**: Mock data from `simulator-state.js`
- **Update Mechanism**: `setInterval` every 2 seconds
- **Dependencies**: No WebSocket client library
- **Components**:
  - `MissionPanel`: Displays orbit params, ground track, subsystem status
  - `WorldMap`: Shows satellite position with hardcoded inclination (53°)
  - Launch animation: Uses mock altitude values

### Identified Issues
1. ✅ Launch animation altitude is hardcoded, not from scenarioSession
2. ✅ Subsystem status lights (POWER, COMMS, ATTITUDE, PAYLOAD) may not match scenario structure
3. ✅ No real-time data flow from backend to frontend
4. ✅ No bidirectional command/telemetry system

---

## Architecture Decision: Socket.IO vs Native WebSocket

### Recommendation: **Socket.IO**

**Rationale:**
1. **Auto-reconnection**: Built-in with exponential backoff
2. **Room Support**: Easy session-based broadcasting
3. **Fallback**: HTTP long-polling if WebSocket unavailable
4. **Event-based**: Cleaner API for different message types
5. **Authentication**: Easy JWT integration with middleware
6. **Namespace Support**: Separate channels for telemetry, commands, sessions

**Alternative (Native WebSocket):**
- Lighter weight but requires manual reconnection logic
- No built-in room/namespace support
- Better for simple use cases

---

## Implementation Roadmap

### Phase 1: Backend WebSocket Infrastructure (Backend)

#### 1.1 Install Dependencies
```bash
cd backend
npm install socket.io
npm install --save-dev @types/socket.io  # if using TypeScript
```

#### 1.2 Create WebSocket Server (`backend/src/websocket/server.js`)
```javascript
const { Server } = require('socket.io');
const { verifySocketToken } = require('./middleware/socketAuth');

function initializeWebSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    },
    path: '/socket.io/'
  });

  // Authentication middleware
  io.use(verifySocketToken);

  // Namespace for telemetry
  const telemetryNamespace = io.of('/telemetry');
  telemetryNamespace.on('connection', (socket) => {
    // Handle telemetry connections
  });

  // Namespace for commands
  const commandNamespace = io.of('/commands');
  commandNamespace.on('connection', (socket) => {
    // Handle command connections
  });

  return io;
}

module.exports = { initializeWebSocket };
```

#### 1.3 Integrate with Express Server (`backend/src/server.js`)
```javascript
const http = require('http');
const app = require('./app');
const { initializeWebSocket } = require('./websocket/server');

const server = http.createServer(app);
const io = initializeWebSocket(server);

server.listen(PORT, HOST, () => {
  // existing startup logic
});
```

#### 1.4 Create Socket Authentication Middleware (`backend/src/websocket/middleware/socketAuth.js`)
```javascript
const { verifyToken } = require('../../utils/jwt');

async function verifySocketToken(socket, next) {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    
    const decoded = await verifyToken(token);
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
}

module.exports = { verifySocketToken };
```

#### 1.5 Create Session Manager Service (`backend/src/services/sessionManager.js`)
```javascript
/**
 * Manages active scenario session states and broadcasts updates
 */
class SessionManager {
  constructor(io) {
    this.io = io;
    this.activeSessions = new Map(); // sessionId -> state
  }

  async joinSession(sessionId, userId, socket) {
    // Join socket.io room
    socket.join(`session:${sessionId}`);
    
    // Verify user has access to session
    const session = await scenarioSessionRepository.getById(sessionId, { createdBy: userId });
    if (!session) throw new Error('Session not found');
    
    // Initialize or retrieve session state
    if (!this.activeSessions.has(sessionId)) {
      this.activeSessions.set(sessionId, session.state || {});
    }
    
    return this.activeSessions.get(sessionId);
  }

  updateSessionState(sessionId, stateUpdate) {
    const currentState = this.activeSessions.get(sessionId) || {};
    const newState = { ...currentState, ...stateUpdate };
    this.activeSessions.set(sessionId, newState);
    
    // Broadcast to all clients in session room
    this.io.to(`session:${sessionId}`).emit('state:update', newState);
    
    // Persist to database (async, non-blocking)
    scenarioSessionRepository.patch(sessionId, { state: newState }).catch(err => {
      logger.error('Failed to persist session state', { sessionId, error: err.message });
    });
  }

  disconnectFromSession(sessionId, socket) {
    socket.leave(`session:${sessionId}`);
  }
}

module.exports = { SessionManager };
```

#### 1.6 Create Telemetry Controller (`backend/src/websocket/handlers/telemetryHandler.js`)
```javascript
/**
 * Handles real-time telemetry updates
 */
function createTelemetryHandler(io, sessionManager) {
  return (socket) => {
    console.log(`Telemetry connection: ${socket.id}, User: ${socket.user.id}`);

    // Join a session
    socket.on('session:join', async ({ sessionId }) => {
      try {
        const initialState = await sessionManager.joinSession(sessionId, socket.user.id, socket);
        socket.emit('session:joined', { sessionId, state: initialState });
      } catch (error) {
        socket.emit('session:error', { message: error.message });
      }
    });

    // Leave a session
    socket.on('session:leave', ({ sessionId }) => {
      sessionManager.disconnectFromSession(sessionId, socket);
      socket.emit('session:left', { sessionId });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Telemetry disconnected: ${socket.id}`);
    });
  };
}

module.exports = { createTelemetryHandler };
```

#### 1.7 Create Command Handler (`backend/src/websocket/handlers/commandHandler.js`)
```javascript
/**
 * Handles command transmission and acknowledgment
 */
function createCommandHandler(io, sessionManager) {
  return (socket) => {
    console.log(`Command connection: ${socket.id}, User: ${socket.user.id}`);

    socket.on('command:send', async ({ sessionId, command, parameters }) => {
      try {
        // Validate command
        socket.emit('command:status', { commandId: command.id, status: 'validating' });
        
        // Simulate transmission delay
        setTimeout(() => {
          socket.emit('command:status', { commandId: command.id, status: 'transmitting' });
        }, 500);
        
        setTimeout(() => {
          socket.emit('command:status', { commandId: command.id, status: 'awaiting-ack' });
        }, 2000);
        
        setTimeout(() => {
          socket.emit('command:status', { commandId: command.id, status: 'executing' });
          
          // Update session state based on command
          sessionManager.updateSessionState(sessionId, {
            lastCommand: { command, parameters, timestamp: Date.now() }
          });
        }, 4000);
        
        setTimeout(() => {
          socket.emit('command:status', { 
            commandId: command.id, 
            status: 'completed',
            result: { success: true, message: 'Command executed successfully' }
          });
        }, 5000);
        
      } catch (error) {
        socket.emit('command:status', { 
          commandId: command.id, 
          status: 'failed',
          error: error.message 
        });
      }
    });
  };
}

module.exports = { createCommandHandler };
```

#### 1.8 Create Simulation Engine Service (`backend/src/services/simulationEngine.js`)
```javascript
/**
 * Runs orbital mechanics and subsystem simulations
 */
class SimulationEngine {
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
    this.activeSimulations = new Map(); // sessionId -> interval
  }

  startSimulation(sessionId, satellite, initialState) {
    if (this.activeSimulations.has(sessionId)) {
      return; // Already running
    }

    const interval = setInterval(() => {
      // Update orbital position
      const newState = this.computeNextState(satellite, initialState);
      
      // Broadcast update
      this.sessionManager.updateSessionState(sessionId, {
        telemetry: newState,
        timestamp: Date.now()
      });
    }, 2000); // Update every 2 seconds

    this.activeSimulations.set(sessionId, interval);
  }

  stopSimulation(sessionId) {
    const interval = this.activeSimulations.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.activeSimulations.delete(sessionId);
    }
  }

  computeNextState(satellite, currentState) {
    // Implement orbital mechanics
    // Update altitude, position, subsystem states
    return {
      orbit: {
        altitude: satellite.orbit.altitude_km + Math.random() * 0.5 - 0.25,
        inclination: satellite.orbit.inclination_degrees,
        // ... other orbital parameters
      },
      power: {
        currentCharge_percent: satellite.power.currentCharge_percent - 0.01,
        solarPower_watts: satellite.power.solarPower_watts,
        // ... other power params
      },
      // ... other subsystems
    };
  }
}

module.exports = { SimulationEngine };
```

---

### Phase 2: Frontend WebSocket Integration (Frontend)

#### 2.1 Install Dependencies
```bash
cd frontend
npm install socket.io-client
```

#### 2.2 Create WebSocket Context (`frontend/src/contexts/WebSocketContext.jsx`)
```javascript
import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const [telemetrySocket, setTelemetrySocket] = useState(null);
  const [commandSocket, setCommandSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [sessionState, setSessionState] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    // Initialize telemetry socket
    const telemetrySock = io('http://localhost:8080/telemetry', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // Initialize command socket
    const commandSock = io('http://localhost:8080/commands', {
      auth: { token },
      reconnection: true
    });

    telemetrySock.on('connect', () => {
      console.log('Telemetry connected');
      setConnected(true);
    });

    telemetrySock.on('disconnect', () => {
      console.log('Telemetry disconnected');
      setConnected(false);
    });

    telemetrySock.on('state:update', (newState) => {
      setSessionState(newState);
    });

    setTelemetrySocket(telemetrySock);
    setCommandSocket(commandSock);

    return () => {
      telemetrySock.disconnect();
      commandSock.disconnect();
    };
  }, []);

  const joinSession = (sessionId) => {
    if (telemetrySocket) {
      telemetrySocket.emit('session:join', { sessionId });
    }
  };

  const leaveSession = (sessionId) => {
    if (telemetrySocket) {
      telemetrySocket.emit('session:leave', { sessionId });
    }
  };

  const sendCommand = (sessionId, command, parameters) => {
    if (commandSocket) {
      commandSocket.emit('command:send', { sessionId, command, parameters });
    }
  };

  return (
    <WebSocketContext.Provider value={{
      connected,
      sessionState,
      joinSession,
      leaveSession,
      sendCommand,
      telemetrySocket,
      commandSocket
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}
```

#### 2.3 Update App.jsx to Include WebSocket Provider
```javascript
import { WebSocketProvider } from '@/contexts/WebSocketContext';

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        {/* existing app content */}
      </WebSocketProvider>
    </AuthProvider>
  );
}
```

#### 2.4 Update MissionPanel to Use Real-Time Data
```javascript
import { useWebSocket } from '@/contexts/WebSocketContext';

export function MissionPanel() {
  const { sessionState, connected } = useWebSocket();
  
  // Use sessionState.telemetry instead of mock data
  const telemetry = sessionState?.telemetry || initialTelemetry;
  
  return (
    <main>
      {/* Connection indicator */}
      <div className={connected ? 'text-green-500' : 'text-red-500'}>
        {connected ? 'CONNECTED' : 'DISCONNECTED'}
      </div>
      
      {/* Display real altitude from session */}
      <OrbitParam 
        label="Altitude" 
        value={telemetry.orbit.altitude.toFixed(1)} 
        unit="km" 
      />
      
      {/* Rest of component using real data */}
    </main>
  );
}
```

#### 2.5 Update WorldMap Component for Launch Animation
```javascript
export function GroundTrackVisualization({ sessionState }) {
  // Use real satellite data instead of hardcoded values
  const inclination = sessionState?.telemetry?.orbit?.inclination || 53;
  const altitude = sessionState?.telemetry?.orbit?.altitude || 415;
  
  // Generate ground track with actual orbital parameters
  const currentOrbit = generateGroundTrack(0, inclination, 200);
  
  return (
    <svg viewBox="0 0 720 360">
      {/* Display actual satellite position and altitude */}
    </svg>
  );
}
```

#### 2.6 Create Subsystem Status Component
```javascript
/**
 * Dynamically renders subsystem status based on scenario structure
 */
export function SubsystemStatus({ sessionState }) {
  const subsystems = sessionState?.satellite?.subsystems || {};
  
  return (
    <div className="grid grid-cols-4 gap-4">
      {Object.entries(subsystems).map(([key, subsystem]) => (
        <SubsystemIndicator 
          key={key}
          name={key.toUpperCase()}
          status={subsystem.status || 'unknown'}
          data={subsystem}
        />
      ))}
    </div>
  );
}

function SubsystemIndicator({ name, status, data }) {
  const statusColors = {
    nominal: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-red-500',
    offline: 'bg-gray-500'
  };

  return (
    <div className="border rounded p-3">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
        <span className="font-semibold">{name}</span>
      </div>
      {/* Display subsystem-specific data */}
    </div>
  );
}
```

---

### Phase 3: Data Flow Integration

#### 3.1 Session Lifecycle
```
1. User loads simulator page
2. Frontend authenticates and connects WebSocket
3. Frontend emits 'session:join' with sessionId
4. Backend verifies access, retrieves session from Firestore
5. Backend starts simulation engine for session
6. Backend broadcasts initial state to client
7. Simulation engine updates state every 2s
8. Frontend receives 'state:update' events and re-renders
9. User sends command via 'command:send'
10. Backend processes command, updates state, broadcasts
11. User navigates away → Frontend emits 'session:leave'
12. Backend stops simulation engine
```

#### 3.2 Message Types

**Telemetry Namespace:**
- `session:join` (client → server)
- `session:joined` (server → client)
- `session:leave` (client → server)
- `session:left` (server → client)
- `state:update` (server → client)
- `session:error` (server → client)

**Command Namespace:**
- `command:send` (client → server)
- `command:status` (server → client)

---

### Phase 4: Testing & Validation

#### 4.1 Backend Tests
- [ ] WebSocket authentication
- [ ] Session join/leave lifecycle
- [ ] State broadcasting to multiple clients
- [ ] Command execution flow
- [ ] Simulation engine calculations
- [ ] Error handling and reconnection

#### 4.2 Frontend Tests
- [ ] WebSocket connection establishment
- [ ] Auto-reconnection on disconnect
- [ ] State updates trigger re-renders
- [ ] Command transmission and status tracking
- [ ] Connection status indicator
- [ ] Graceful degradation without WebSocket

#### 4.3 Integration Tests
- [ ] End-to-end session flow
- [ ] Multiple concurrent sessions
- [ ] Command execution updates telemetry
- [ ] Firestore persistence of session state
- [ ] Performance under load (100+ concurrent connections)

---

## Environment Variables

### Backend (.env)
```
FRONTEND_URL=http://localhost:5173
WEBSOCKET_PORT=8080
```

### Frontend (.env)
```
VITE_WEBSOCKET_URL=http://localhost:8080
```

---

## Security Considerations

1. **Authentication**: JWT tokens required for WebSocket connections
2. **Authorization**: Verify user owns session before allowing join
3. **Rate Limiting**: Limit command send frequency per user
4. **Input Validation**: Validate all command parameters
5. **Session Isolation**: Users can only join their own sessions
6. **CORS**: Restrict WebSocket origins in production

---

## Performance Optimization

1. **State Diffing**: Only broadcast changed fields, not entire state
2. **Throttling**: Limit telemetry updates to 2s intervals
3. **Compression**: Enable WebSocket compression for large payloads
4. **Batching**: Group multiple state updates into single broadcast
5. **Cleanup**: Clear inactive sessions after 30min timeout

---

## Implementation Steps

### Backend Implementation

1. **Install Socket.IO Dependencies**
   - `cd backend && npm install socket.io`
   - Add to package.json dependencies

2. **Create WebSocket Server**
   - Create `backend/src/websocket/server.js`
   - Set up Socket.IO server with CORS configuration
   - Define telemetry and command namespaces

3. **Integrate with Express**
   - Modify `backend/src/server.js` to create HTTP server
   - Attach Socket.IO to HTTP server
   - Ensure both Express and WebSocket use same port

4. **Implement Authentication Middleware**
   - Create `backend/src/websocket/middleware/socketAuth.js`
   - Verify JWT tokens from socket handshake
   - Attach user data to socket instance

5. **Build Session Manager Service**
   - Create `backend/src/services/sessionManager.js`
   - Manage active session states in memory
   - Handle room joins/leaves
   - Broadcast state updates to session rooms
   - Persist state changes to Firestore

6. **Create Telemetry Handler**
   - Create `backend/src/websocket/handlers/telemetryHandler.js`
   - Handle `session:join` and `session:leave` events
   - Emit `session:joined` with initial state
   - Broadcast `state:update` on changes

7. **Create Command Handler**
   - Create `backend/src/websocket/handlers/commandHandler.js`
   - Handle `command:send` events
   - Emit `command:status` updates through execution lifecycle
   - Integrate with session state updates

8. **Build Simulation Engine**
   - Create `backend/src/services/simulationEngine.js`
   - Implement orbital mechanics calculations
   - Compute subsystem state transitions
   - Update session state every 2 seconds
   - Start/stop simulations based on session lifecycle

### Frontend Implementation

9. **Install Socket.IO Client**
   - `cd frontend && npm install socket.io-client`
   - Add to package.json dependencies

10. **Create WebSocket Context**
    - Create `frontend/src/contexts/WebSocketContext.jsx`
    - Implement connection management
    - Handle auto-reconnection
    - Provide session join/leave functions
    - Expose session state to components

11. **Integrate WebSocket Provider**
    - Update `frontend/src/App.jsx`
    - Wrap app with `<WebSocketProvider>`
    - Ensure it's inside authentication context

12. **Update MissionPanel Component**
    - Import `useWebSocket` hook
    - Replace mock data with real-time session state
    - Display connection status indicator
    - Use actual telemetry data for orbit parameters

13. **Update WorldMap Component**
    - Accept `sessionState` prop
    - Use real satellite altitude and inclination
    - Generate ground tracks from actual orbital data
    - Update satellite position from telemetry

14. **Create Subsystem Status Component**
    - Build dynamic subsystem renderer
    - Map subsystem data to status indicators
    - Match POWER, COMMS, ATTITUDE, PAYLOAD to scenario structure
    - Display subsystem-specific metrics

15. **Implement Command Transmission UI**
    - Add command send functionality
    - Display command status (validating → transmitting → executing → completed)
    - Show visual feedback for each stage
    - Handle command errors

### Testing & Validation

16. **Backend Testing**
    - Test WebSocket authentication
    - Verify session join/leave lifecycle
    - Test state broadcasting to multiple clients
    - Validate command execution flow

17. **Frontend Testing**
    - Test WebSocket connection establishment
    - Verify auto-reconnection on disconnect
    - Test state updates trigger re-renders
    - Validate command transmission

18. **Integration Testing**
    - End-to-end session flow
    - Multiple concurrent sessions
    - Command execution updates telemetry
    - Firestore persistence verification

19. **Performance & Security**
    - Load testing (100+ concurrent connections)
    - Rate limiting verification
    - Session isolation testing
    - CORS and authentication validation

---

## Success Criteria

- ✅ Real-time telemetry updates (<500ms latency)
- ✅ Launch animation uses actual satellite altitude
- ✅ Subsystem indicators match scenario structure
- ✅ Command transmission with status tracking
- ✅ Auto-reconnection on network disruption
- ✅ 99.9% uptime for WebSocket connections
- ✅ Support for 100+ concurrent sessions

---

## Future Enhancements

1. **Binary Protocol**: Use binary frames for higher throughput
2. **Redis Adapter**: Scale across multiple backend instances
3. **Replay Mode**: Playback historical session telemetry
4. **Analytics**: Track command success rates and user patterns
5. **Mobile Support**: WebSocket connection on mobile devices
6. **Push Notifications**: Alert users of critical events when offline
