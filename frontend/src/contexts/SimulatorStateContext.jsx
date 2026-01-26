/**
 * Simulator State Context
 * Manages comprehensive simulator state including:
 * - Command history and tracking
 * - Telemetry updates
 * - Scenario step progression
 * - Session data synchronization
 * - SocketIO integration
 */

import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './WebSocketContext';
import { auth } from '@/lib/firebase/config';
import { saveSessionProgress } from '@/lib/firebase/sessionService';

const SimulatorStateContext = createContext(null);

// Action types
const ACTIONS = {
  // Session management
  INITIALIZE_SESSION: 'INITIALIZE_SESSION',
  UPDATE_SESSION_DATA: 'UPDATE_SESSION_DATA',
  SET_MISSION_STARTED: 'SET_MISSION_STARTED',
  
  // Command tracking
  ADD_COMMAND: 'ADD_COMMAND',
  UPDATE_COMMAND_STATUS: 'UPDATE_COMMAND_STATUS',
  
  // Telemetry updates
  UPDATE_TELEMETRY: 'UPDATE_TELEMETRY',
  
  // Scenario progression
  UPDATE_SCENARIO_STEP: 'UPDATE_SCENARIO_STEP',
  COMPLETE_STEP: 'COMPLETE_STEP',
  SET_ACTIVE_STEP: 'SET_ACTIVE_STEP',
  
  // Alerts and notifications
  ADD_ALERT: 'ADD_ALERT',
  ACKNOWLEDGE_ALERT: 'ACKNOWLEDGE_ALERT',
  CLEAR_ALERT: 'CLEAR_ALERT',
  
  // Reset
  RESET_STATE: 'RESET_STATE'
};

// Initial state
const initialState = {
  // Session information
  sessionId: null,
  scenarioId: null,
  missionStarted: false,
  sessionStartTime: null,
  
  // Command tracking
  commands: [], // All commands performed since initial state
  commandsInProgress: new Set(),
  
  // Telemetry data
  telemetry: null,
  telemetryHistory: [], // Last 100 telemetry snapshots
  
  // Scenario progression
  scenario: null,
  steps: [],
  currentStepIndex: 0,
  completedSteps: [],
  missionProgress: 0,
  
  // Alerts and notifications
  alerts: [],
  
  // Sync status
  lastSyncTime: null,
  syncInProgress: false
};

// Reducer function
function simulatorReducer(state, action) {
  switch (action.type) {
    case ACTIONS.INITIALIZE_SESSION: {
      const savedProgress = action.payload.scenario?.savedProgress;
      const steps = action.payload.steps || [];
      
      // Calculate progress if resuming
      let missionProgress = 0;
      if (savedProgress && savedProgress.completedSteps.length > 0) {
        const completedCount = savedProgress.completedSteps.length;
        missionProgress = Math.round((completedCount / steps.length) * 100);
      }
      
      return {
        ...state,
        sessionId: action.payload.sessionId,
        scenarioId: action.payload.scenarioId,
        scenario: action.payload.scenario,
        steps: steps,
        sessionStartTime: Date.now(),
        telemetry: action.payload.initialTelemetry,
        commands: [],
        completedSteps: savedProgress?.completedSteps || [],
        currentStepIndex: savedProgress?.currentStepOrder || 0,
        missionProgress: missionProgress
      };
    }
    
    case ACTIONS.SET_MISSION_STARTED:
      return {
        ...state,
        missionStarted: action.payload,
        sessionStartTime: action.payload ? Date.now() : state.sessionStartTime
      };
    
    case ACTIONS.ADD_COMMAND: {
      const newCommand = {
        id: action.payload.id || `cmd-${Date.now()}`,
        type: action.payload.type,
        name: action.payload.name,
        parameters: action.payload.parameters || {},
        status: 'queued',
        timestamp: Date.now(),
        result: null
      };
      
      return {
        ...state,
        commands: [...state.commands, newCommand],
        commandsInProgress: new Set([...state.commandsInProgress, newCommand.id])
      };
    }
    
    case ACTIONS.UPDATE_COMMAND_STATUS: {
      const { commandId, status, result } = action.payload;
      const updatedCommands = state.commands.map(cmd =>
        cmd.id === commandId
          ? { ...cmd, status, result, lastUpdated: Date.now() }
          : cmd
      );
      
      const inProgress = new Set(state.commandsInProgress);
      if (status === 'completed' || status === 'failed') {
        inProgress.delete(commandId);
      }
      
      return {
        ...state,
        commands: updatedCommands,
        commandsInProgress: inProgress
      };
    }
    
    case ACTIONS.UPDATE_TELEMETRY: {
      const newTelemetry = {
        ...action.payload,
        timestamp: Date.now()
      };
      
      // Keep last 100 telemetry snapshots for history
      const history = [newTelemetry, ...state.telemetryHistory].slice(0, 100);
      
      return {
        ...state,
        telemetry: newTelemetry,
        telemetryHistory: history,
        lastSyncTime: Date.now()
      };
    }
    
    case ACTIONS.UPDATE_SCENARIO_STEP: {
      const { stepIndex, updates } = action.payload;
      const updatedSteps = state.steps.map((step, idx) =>
        idx === stepIndex ? { ...step, ...updates } : step
      );
      
      return {
        ...state,
        steps: updatedSteps
      };
    }
    
    case ACTIONS.COMPLETE_STEP: {
      const stepIndex = action.payload.stepIndex;
      const completedStepId = state.steps[stepIndex]?.id;
      
      const updatedSteps = state.steps.map((step, idx) =>
        idx === stepIndex
          ? { ...step, completed: true, active: false, completedAt: Date.now() }
          : step
      );
      
      const completedCount = updatedSteps.filter(s => s.completed).length;
      const progress = Math.round((completedCount / updatedSteps.length) * 100);
      
      return {
        ...state,
        steps: updatedSteps,
        completedSteps: [...state.completedSteps, completedStepId],
        missionProgress: progress
      };
    }
    
    case ACTIONS.SET_ACTIVE_STEP: {
      const stepIndex = action.payload;
      const updatedSteps = state.steps.map((step, idx) => ({
        ...step,
        active: idx === stepIndex
      }));
      
      return {
        ...state,
        steps: updatedSteps,
        currentStepIndex: stepIndex
      };
    }
    
    case ACTIONS.ADD_ALERT:
      return {
        ...state,
        alerts: [action.payload, ...state.alerts]
      };
    
    case ACTIONS.ACKNOWLEDGE_ALERT: {
      const updatedAlerts = state.alerts.map(alert =>
        alert.id === action.payload
          ? { ...alert, acknowledged: true, acknowledgedAt: Date.now() }
          : alert
      );
      
      return {
        ...state,
        alerts: updatedAlerts
      };
    }
    
    case ACTIONS.CLEAR_ALERT:
      return {
        ...state,
        alerts: state.alerts.filter(alert => alert.id !== action.payload)
      };
    
    case ACTIONS.UPDATE_SESSION_DATA:
      return {
        ...state,
        ...action.payload,
        lastSyncTime: Date.now()
      };
    
    case ACTIONS.RESET_STATE:
      return initialState;
    
    default:
      return state;
  }
}

export function SimulatorStateProvider({ children }) {
  const [state, dispatch] = useReducer(simulatorReducer, initialState);
  const { 
    connected, 
    sessionState, 
    currentSessionId, 
    joinSession, 
    leaveSession, 
    sendCommand: sendWSCommand 
  } = useWebSocket();
  
  const stateRef = useRef(state);
  
  // Keep state ref updated
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  
  /**
   * Initialize a new simulator session
   */
  const initializeSession = useCallback((sessionId, scenarioId, scenario, initialTelemetry) => {
    dispatch({
      type: ACTIONS.INITIALIZE_SESSION,
      payload: {
        sessionId,
        scenarioId,
        scenario,
        steps: scenario?.steps || [],
        initialTelemetry
      }
    });
    
    // Join WebSocket session
    if (connected) {
      joinSession(sessionId);
    }
  }, [connected, joinSession]);
  
  /**
   * Start the mission
   */
  const startMission = useCallback(() => {
    dispatch({
      type: ACTIONS.SET_MISSION_STARTED,
      payload: true
    });
    
    // Set first step as active
    if (stateRef.current.steps.length > 0) {
      dispatch({
        type: ACTIONS.SET_ACTIVE_STEP,
        payload: 0
      });
    }
  }, []);
  
  /**
   * Execute a command
   */
  const executeCommand = useCallback((command) => {
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add command to local state
    dispatch({
      type: ACTIONS.ADD_COMMAND,
      payload: {
        ...command,
        id: commandId
      }
    });
    
    // Send command via WebSocket
    if (connected && stateRef.current.sessionId) {
      sendWSCommand(stateRef.current.sessionId, { ...command, id: commandId }, command.parameters);
    }
    
    return commandId;
  }, [connected, sendWSCommand]);
  
  /**
   * Update telemetry data
   */
  const updateTelemetry = useCallback((telemetryData) => {
    dispatch({
      type: ACTIONS.UPDATE_TELEMETRY,
      payload: telemetryData
    });
  }, []);
  
  /**
   * Complete current step and move to next
   */
  const completeCurrentStep = useCallback(() => {
    const currentIndex = stateRef.current.currentStepIndex;
    
    // Mark current step as completed
    dispatch({
      type: ACTIONS.COMPLETE_STEP,
      payload: { stepIndex: currentIndex }
    });
    
    // Move to next step if available
    const nextIndex = currentIndex + 1;
    if (nextIndex < stateRef.current.steps.length) {
      setTimeout(() => {
        dispatch({
          type: ACTIONS.SET_ACTIVE_STEP,
          payload: nextIndex
        });
      }, 500);
    }
  }, []);
  
  /**
   * Check if a step should be auto-completed based on conditions
   */
  const checkStepCompletion = useCallback((stepId) => {
    const currentStep = stateRef.current.steps[stateRef.current.currentStepIndex];
    
    if (!currentStep || currentStep.id !== stepId || currentStep.completed) {
      return false;
    }
    
    // Check completion conditions based on step requirements
    // This can be expanded with more sophisticated logic
    const { requiredCommands, requiredTelemetry } = currentStep;
    
    if (requiredCommands) {
      const commandsExecuted = stateRef.current.commands
        .filter(cmd => cmd.status === 'completed')
        .map(cmd => cmd.type);
      
      const allCommandsExecuted = requiredCommands.every(reqCmd => 
        commandsExecuted.includes(reqCmd)
      );
      
      if (!allCommandsExecuted) {
        return false;
      }
    }
    
    if (requiredTelemetry) {
      // Check telemetry conditions
      const telemetry = stateRef.current.telemetry;
      // Add telemetry validation logic here
    }
    
    // Auto-complete if all conditions met
    completeCurrentStep();
    return true;
  }, [completeCurrentStep]);
  
  /**
   * Add an alert
   */
  const addAlert = useCallback((alert) => {
    const newAlert = {
      id: `alert-${Date.now()}`,
      timestamp: Date.now(),
      acknowledged: false,
      ...alert
    };
    
    dispatch({
      type: ACTIONS.ADD_ALERT,
      payload: newAlert
    });
  }, []);
  
  /**
   * Acknowledge an alert
   */
  const acknowledgeAlert = useCallback((alertId) => {
    dispatch({
      type: ACTIONS.ACKNOWLEDGE_ALERT,
      payload: alertId
    });
  }, []);
  
  /**
   * Get commands since start
   */
  const getCommandHistory = useCallback(() => {
    return stateRef.current.commands;
  }, []);
  
  /**
   * Get telemetry history
   */
  const getTelemetryHistory = useCallback((count = 10) => {
    return stateRef.current.telemetryHistory.slice(0, count);
  }, []);
  
  /**
   * Reset simulator state
   */
  const resetSimulator = useCallback(() => {
    if (stateRef.current.sessionId) {
      leaveSession(stateRef.current.sessionId);
    }
    
    dispatch({
      type: ACTIONS.RESET_STATE
    });
  }, [leaveSession]);
  
  // Listen for WebSocket session state updates
  useEffect(() => {
    if (sessionState) {
      // Sync telemetry from WebSocket
      if (sessionState.telemetry) {
        updateTelemetry(sessionState.telemetry);
      }
      
      // Sync other session data
      dispatch({
        type: ACTIONS.UPDATE_SESSION_DATA,
        payload: sessionState
      });
    }
  }, [sessionState, updateTelemetry]);
  
  // Listen for command status updates from WebSocket
  useEffect(() => {
    const handleCommandStatus = (event) => {
      const { commandId, status, result } = event.detail;
      
      dispatch({
        type: ACTIONS.UPDATE_COMMAND_STATUS,
        payload: { commandId, status, result }
      });
      
      // Check if this command completion triggers step progression
      if (status === 'completed') {
        checkStepCompletion(stateRef.current.steps[stateRef.current.currentStepIndex]?.id);
      }
    };
    
    window.addEventListener('command:status', handleCommandStatus);
    
    return () => {
      window.removeEventListener('command:status', handleCommandStatus);
    };
  }, [checkStepCompletion]);
  
  // Periodic autosave - save progress every 30 seconds when mission is active
  useEffect(() => {
    if (!state.missionStarted || !state.sessionId) {
      return;
    }
    
    const saveProgress = () => {
      const elapsedTime = state.sessionStartTime 
        ? Math.floor((Date.now() - state.sessionStartTime) / 1000)
        : 0;
      
      saveSessionProgress(state.sessionId, {
        currentStepOrder: state.currentStepIndex,
        completedSteps: state.completedSteps,
        elapsedTime: elapsedTime,
        state: {
          missionProgress: state.missionProgress,
          commandCount: state.commands.length
        }
      });
    };
    
    // Save immediately when mission starts
    saveProgress();
    
    // Then save every 30 seconds
    const intervalId = setInterval(saveProgress, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [state.missionStarted, state.sessionId, state.currentStepIndex, state.completedSteps, state.sessionStartTime, state.missionProgress, state.commands.length]);
  
  // Save progress when user leaves or disconnects
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (stateRef.current.missionStarted && stateRef.current.sessionId) {
        const elapsedTime = stateRef.current.sessionStartTime 
          ? Math.floor((Date.now() - stateRef.current.sessionStartTime) / 1000)
          : 0;
        
        // Use synchronous API for page unload
        const data = {
          currentStepOrder: stateRef.current.currentStepIndex,
          completedSteps: stateRef.current.completedSteps,
          elapsedTime: elapsedTime,
          state: {
            missionProgress: stateRef.current.missionProgress,
            commandCount: stateRef.current.commands.length
          }
        };
        
        // Save progress (non-blocking)
        saveSessionProgress(stateRef.current.sessionId, data);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Save progress when component unmounts
      handleBeforeUnload();
    };
  }, []);
  
  const value = {
    // State
    ...state,
    
    // Session management
    initializeSession,
    startMission,
    resetSimulator,
    
    // Commands
    executeCommand,
    getCommandHistory,
    
    // Telemetry
    updateTelemetry,
    getTelemetryHistory,
    
    // Scenario progression
    completeCurrentStep,
    checkStepCompletion,
    
    // Alerts
    addAlert,
    acknowledgeAlert,
    
    // Connection status
    connected
  };
  
  return (
    <SimulatorStateContext.Provider value={value}>
      {children}
    </SimulatorStateContext.Provider>
  );
}

/**
 * Hook to use simulator state
 */
export function useSimulatorState() {
  const context = useContext(SimulatorStateContext);
  
  if (!context) {
    throw new Error('useSimulatorState must be used within SimulatorStateProvider');
  }
  
  return context;
}

export default SimulatorStateContext;
