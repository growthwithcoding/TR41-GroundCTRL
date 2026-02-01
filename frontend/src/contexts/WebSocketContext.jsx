/**
 * WebSocket Context
 * Provides Socket.IO client connections and real-time state management
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { auth } from '@/lib/firebase/config';

const WebSocketContext = createContext(null);

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Module-level flag to prevent duplicate connections during React StrictMode double-mount
let isConnecting = false;
let connectionPromise = null;

export function WebSocketProvider({ children }) {
  const [telemetrySocket, setTelemetrySocket] = useState(null);
  const [commandSocket, setCommandSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [sessionState, setSessionState] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [groundStations, setGroundStations] = useState([]);
  
  // Mission Control Enhancement - Phase 6 state
  const [commandQueueStatus, setCommandQueueStatus] = useState(new Map()); // commandId -> status
  const [beaconStatus, setBeaconStatus] = useState({ received: false, lastBeacon: null });
  const [groundStationLink, setGroundStationLink] = useState({ isVisible: false, station: null });
  const [timeScale, setTimeScale] = useState(1);
  const [stepValidation, setStepValidation] = useState(null);
  
  // Use refs to avoid dependency issues in useCallback
  const telemetrySocketRef = useRef(null);
  const commandSocketRef = useRef(null);
  const isInitializingRef = useRef(false);
  const hasConnectedRef = useRef(false); // Track if we've ever connected successfully
  
  // Keep refs in sync with state
  useEffect(() => {
    telemetrySocketRef.current = telemetrySocket;
  }, [telemetrySocket]);
  
  useEffect(() => {
    commandSocketRef.current = commandSocket;
  }, [commandSocket]);
  
  useEffect(() => {
    isInitializingRef.current = isInitializing;
  }, [isInitializing]);

  /**
   * Initialize WebSocket connections on-demand
   * Should be called when user enters the simulator
   */
  const connect = useCallback(async () => {
    console.log('[WebSocket] connect() called', { 
      alreadyConnected: telemetrySocketRef.current?.connected,
      isInitializing: isInitializingRef.current,
      moduleIsConnecting: isConnecting
    });
    
    // Don't reconnect if already connected or initializing
    if (telemetrySocketRef.current?.connected || isInitializingRef.current || isConnecting) {
      console.log('[WebSocket] Already connected or connecting, skipping');
      return;
    }
    
    // If there's a connection in progress, wait for it
    if (connectionPromise) {
      console.log('[WebSocket] Connection already in progress, waiting...');
      return connectionPromise;
    }

    const user = auth.currentUser;
    if (!user) {
      console.error('[WebSocket] Cannot connect: No authenticated user');
      return;
    }

    console.log('[WebSocket] User authenticated, getting token...');
    
    // Set module-level flag to prevent concurrent connections
    isConnecting = true;
    setIsInitializing(true);
    
    // Create a promise for this connection attempt
    connectionPromise = (async () => {
    
    try {
      const token = await user.getIdToken();
        
      if (!token) {
        console.error('[WebSocket] Failed to get auth token');
        setIsInitializing(false);
        return;
      }

      console.log('[WebSocket] Token retrieved, creating socket connections...');

        // Initialize telemetry socket
        const telemetrySock = io(`${BACKEND_URL}/telemetry`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

        // Initialize command socket
        const commandSock = io(`${BACKEND_URL}/commands`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

        // Telemetry socket event handlers
        telemetrySock.on('connect', () => {
      console.log('✅ Telemetry socket connected:', telemetrySock.id);
      setConnected(true);
    });

        telemetrySock.on('disconnect', (reason) => {
          console.log('❌ Telemetry socket disconnected:', reason);
          setConnected(false);
        });

        telemetrySock.on('connect_error', (error) => {
          console.error('Telemetry connection error:', error.message);
        });

        telemetrySock.on('session:joined', ({ sessionId, state, timestamp }) => {
          console.log('Joined session:', sessionId, 'at', new Date(timestamp).toISOString());
          setSessionState(state);
        });

        telemetrySock.on('state:update', (newState) => {
          console.log('Session state updated:', newState);
          setSessionState(newState);
        });

        telemetrySock.on('session:error', ({ message, code }) => {
          console.error('Session error:', code, message);
        });

        telemetrySock.on('session:left', ({ sessionId, timestamp }) => {
          console.log('Left session:', sessionId, 'at', new Date(timestamp).toISOString());
          setCurrentSessionId(null);
          setSessionState(null);
        });

        // Listen for ground station data on default namespace
        const defaultSocket = io(`${BACKEND_URL}`, {
          auth: { token },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling']
        });

        defaultSocket.on('connect', () => {
          console.log('✅ Default socket connected:', defaultSocket.id);
        });

        defaultSocket.on('world:stations', (stations) => {
          console.log('📡 Received ground stations:', stations.length);
          setGroundStations(stations);
        });

        defaultSocket.on('disconnect', (reason) => {
          console.log('❌ Default socket disconnected:', reason);
        });

        // Command socket event handlers
        commandSock.on('connect', () => {
          console.log('✅ Command socket connected:', commandSock.id);
        });

        commandSock.on('disconnect', (reason) => {
          console.log('❌ Command socket disconnected:', reason);
        });

        commandSock.on('connect_error', (error) => {
          console.error('Command connection error:', error.message);
        });

        commandSock.on('command:status', (statusUpdate) => {
          console.log('🔄 Command status update:', statusUpdate);
          // Update command queue status map
          setCommandQueueStatus(prev => {
            const newMap = new Map(prev);
            newMap.set(statusUpdate.commandId, statusUpdate);
            return newMap;
          });
          // Also emit event for direct component listening
          window.dispatchEvent(new CustomEvent('command:status', { detail: statusUpdate }));
        });
        
        // Mission Control Enhancement - Phase 6 event handlers
        telemetrySock.on('beacon:received', (beaconData) => {
          console.log('📡 Beacon received:', beaconData);
          setBeaconStatus({
            received: true,
            lastBeacon: beaconData.beacon,
            timestamp: Date.now(),
            signalStrength: beaconData.signalStrength,
            groundStation: beaconData.groundStation
          });
          setGroundStationLink({
            isVisible: true,
            station: beaconData.groundStation,
            visibility: beaconData.visibility
          });
        });
        
        telemetrySock.on('beacon:transmitted', (beaconData) => {
          console.log('📡 Beacon transmitted (not received):', beaconData);
          setBeaconStatus({
            received: false,
            lastBeacon: beaconData.beacon,
            timestamp: Date.now(),
            reason: beaconData.reason,
            nextPass: beaconData.nextPass
          });
          setGroundStationLink({
            isVisible: false,
            station: null,
            nextPass: beaconData.nextPass
          });
        });
        
        telemetrySock.on('time:scale_change', (timeData) => {
          console.log('⏱️ Time scale changed:', timeData);
          setTimeScale(timeData.scale || 1);
        });
        
        telemetrySock.on('step:validation_update', (validationData) => {
          console.log('✅ Step validation update:', validationData);
          setStepValidation(validationData);
        });
        
        telemetrySock.on('ground_station:visibility', (visibilityData) => {
          console.log('🛰️ Ground station visibility:', visibilityData);
          setGroundStationLink(visibilityData);
        });

      setTelemetrySocket(telemetrySock);
      setCommandSocket(commandSock);
      setIsInitializing(false);
      isConnecting = false;
      connectionPromise = null;
      console.log('[WebSocket] Sockets initialized and stored in state');
    } catch (error) {
      console.error('[WebSocket] Error initializing connections:', error);
      setIsInitializing(false);
      isConnecting = false;
      connectionPromise = null;
    }
    })();
    
    return connectionPromise;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - uses refs for checks

  /**
   * Disconnect WebSocket connections
   * Should be called when user leaves the simulator
   */
  const disconnect = useCallback(() => {
    console.log('Disconnecting WebSocket connections...');
    
    // Use refs to get current socket instances
    if (telemetrySocketRef.current) {
      telemetrySocketRef.current.disconnect();
      telemetrySocketRef.current = null;
      setTelemetrySocket(null);
    }
    
    if (commandSocketRef.current) {
      commandSocketRef.current.disconnect();
      commandSocketRef.current = null;
      setCommandSocket(null);
    }
    
    setConnected(false);
    setSessionState(null);
    setCurrentSessionId(null);
    setIsInitializing(false);
  }, []); // Empty deps - uses refs

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (telemetrySocket) telemetrySocket.disconnect();
      if (commandSocket) commandSocket.disconnect();
    };
  }, [telemetrySocket, commandSocket]);

  /**
   * Join a telemetry session
   */
  const joinSession = useCallback((sessionId) => {
    if (!telemetrySocket) {
      console.error('Telemetry socket not initialized');
      return;
    }

    console.log('Joining session:', sessionId);
    setCurrentSessionId(sessionId);
    telemetrySocket.emit('session:join', { sessionId });
  }, [telemetrySocket]);

  /**
   * Leave current telemetry session
   */
  const leaveSession = useCallback((sessionId) => {
    if (!telemetrySocket) {
      console.error('Telemetry socket not initialized');
      return;
    }

    console.log('Leaving session:', sessionId);
    telemetrySocket.emit('session:leave', { sessionId });
    setCurrentSessionId(null);
    setSessionState(null);
  }, [telemetrySocket]);

  /**
   * Send a command
   */
  const sendCommand = useCallback((sessionId, command, parameters = {}) => {
    if (!commandSocket) {
      console.error('Command socket not initialized');
      return;
    }

    console.log('Sending command:', command, 'to session:', sessionId);
    commandSocket.emit('command:send', {
      sessionId,
      command,
      parameters
    });
  }, [commandSocket]);

  /**
   * Request current session state
   */
  const requestState = useCallback((sessionId) => {
    if (!telemetrySocket) {
      console.error('Telemetry socket not initialized');
      return;
    }

    console.log('Requesting state for session:', sessionId);
    telemetrySocket.emit('state:request', { sessionId });
  }, [telemetrySocket]);

  const value = {
    // Existing
    connected,
    sessionState,
    currentSessionId,
    groundStations,
    connect,
    disconnect,
    joinSession,
    leaveSession,
    sendCommand,
    requestState,
    telemetrySocket,
    commandSocket,
    
    // Mission Control Enhancement - Phase 6
    commandQueueStatus,
    beaconStatus,
    groundStationLink,
    timeScale,
    stepValidation
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook to use WebSocket context
 */
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  
  return context;
}

export default WebSocketContext;
