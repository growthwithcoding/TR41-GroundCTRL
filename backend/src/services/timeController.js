/**
 * Time Controller Service
 * 
 * Manages dynamic time acceleration for mission control simulations
 * Part of Mission Control Enhancement Plan - Phase 3
 * 
 * Features:
 * - Dynamic time scaling based on scenario steps
 * - Operator prompts for time acceleration
 * - Automatic pause during critical operations
 * - Time scale persistence across sessions
 */

const logger = require('../utils/logger');

/**
 * Time Controller Service
 * Controls simulation time acceleration
 */
class TimeController {
  constructor() {
    this.sessionTimeScales = new Map(); // sessionId -> { scale, mode, lastUpdate }
    
    // Time scale presets
    this.TIME_SCALES = {
      REAL_TIME: 1,
      SLOW_MOTION: 0.5,
      FAST_2X: 2,
      FAST_5X: 5,
      FAST_10X: 10,
      FAST_30X: 30,
      FAST_60X: 60,
      FAST_100X: 100,
      FAST_1000X: 1000
    };
    
    // Time modes
    this.TIME_MODES = {
      MANUAL: 'manual',           // Operator controls time
      AUTO: 'auto',               // System controls based on scenario
      PAUSED: 'paused',          // Simulation paused
      STEP_WAITING: 'step_waiting' // Waiting for step completion
    };
  }

  /**
   * Initialize time control for a session
   * @param {string} sessionId - Session ID
   * @param {number} initialScale - Initial time scale (default: 1)
   * @param {string} initialMode - Initial mode (default: 'auto')
   */
  initializeSession(sessionId, initialScale = 1, initialMode = 'auto') {
    this.sessionTimeScales.set(sessionId, {
      scale: initialScale,
      mode: initialMode,
      lastUpdate: Date.now(),
      pendingPrompts: [],
      criticalOperationActive: false
    });
    
    logger.info('Time controller initialized', {
      sessionId,
      initialScale,
      initialMode
    });
  }

  /**
   * Set time scale for a session
   * @param {string} sessionId - Session ID
   * @param {number} newScale - New time scale
   * @param {string} reason - Reason for change
   * @returns {object} Updated time state
   */
  setTimeScale(sessionId, newScale, reason = 'manual') {
    const timeState = this.sessionTimeScales.get(sessionId);
    
    if (!timeState) {
      logger.warn('Cannot set time scale - session not initialized', { sessionId });
      return null;
    }
    
    // Validate time scale
    if (newScale < 0 || newScale > 10000) {
      logger.warn('Invalid time scale requested', { sessionId, newScale });
      return null;
    }
    
    const previousScale = timeState.scale;
    timeState.scale = newScale;
    timeState.lastUpdate = Date.now();
    
    logger.info('Time scale changed', {
      sessionId,
      previousScale,
      newScale,
      reason
    });
    
    return {
      scale: newScale,
      mode: timeState.mode,
      previousScale,
      reason
    };
  }

  /**
   * Get current time scale for session
   * @param {string} sessionId - Session ID
   * @returns {number} Current time scale
   */
  getTimeScale(sessionId) {
    const timeState = this.sessionTimeScales.get(sessionId);
    return timeState ? timeState.scale : 1;
  }

  /**
   * Get time state for session
   * @param {string} sessionId - Session ID
   * @returns {object} Time state
   */
  getTimeState(sessionId) {
    const timeState = this.sessionTimeScales.get(sessionId);
    
    if (!timeState) {
      return {
        scale: 1,
        mode: 'manual',
        criticalOperationActive: false
      };
    }
    
    return {
      scale: timeState.scale,
      mode: timeState.mode,
      criticalOperationActive: timeState.criticalOperationActive,
      lastUpdate: timeState.lastUpdate
    };
  }

  /**
   * Pause simulation
   * @param {string} sessionId - Session ID
   * @param {string} reason - Reason for pause
   */
  pause(sessionId, reason = 'manual') {
    const timeState = this.sessionTimeScales.get(sessionId);
    
    if (!timeState) {
      logger.warn('Cannot pause - session not initialized', { sessionId });
      return;
    }
    
    timeState.mode = this.TIME_MODES.PAUSED;
    timeState.previousScale = timeState.scale;
    timeState.scale = 0;
    timeState.lastUpdate = Date.now();
    
    logger.info('Simulation paused', { sessionId, reason });
  }

  /**
   * Resume simulation
   * @param {string} sessionId - Session ID
   */
  resume(sessionId) {
    const timeState = this.sessionTimeScales.get(sessionId);
    
    if (!timeState) {
      logger.warn('Cannot resume - session not initialized', { sessionId });
      return;
    }
    
    if (timeState.mode === this.TIME_MODES.PAUSED) {
      timeState.scale = timeState.previousScale || 1;
      timeState.mode = this.TIME_MODES.MANUAL;
      timeState.lastUpdate = Date.now();
      
      logger.info('Simulation resumed', {
        sessionId,
        scale: timeState.scale
      });
    }
  }

  /**
   * Set critical operation status
   * @param {string} sessionId - Session ID
   * @param {boolean} isActive - Whether critical operation is active
   * @param {string} operationType - Type of operation
   */
  setCriticalOperation(sessionId, isActive, operationType = 'unknown') {
    const timeState = this.sessionTimeScales.get(sessionId);
    
    if (!timeState) {
      logger.warn('Cannot set critical operation - session not initialized', { sessionId });
      return;
    }
    
    timeState.criticalOperationActive = isActive;
    
    if (isActive) {
      // Automatically slow down or pause during critical operations
      timeState.previousScale = timeState.scale;
      timeState.scale = Math.min(timeState.scale, 1); // Max real-time during critical ops
      
      logger.info('Critical operation started - time slowed', {
        sessionId,
        operationType,
        newScale: timeState.scale
      });
    } else {
      // Restore previous time scale after critical operation
      if (timeState.previousScale) {
        timeState.scale = timeState.previousScale;
      }
      
      logger.info('Critical operation ended - time restored', {
        sessionId,
        operationType,
        restoredScale: timeState.scale
      });
    }
  }

  /**
   * Create time acceleration prompt for operator
   * @param {string} sessionId - Session ID
   * @param {string} reason - Reason for prompt
   * @param {number} suggestedScale - Suggested time scale
   * @param {number} estimatedWaitTime - Estimated wait time in seconds
   * @returns {object} Prompt object
   */
  createTimePrompt(sessionId, reason, suggestedScale, estimatedWaitTime) {
    const timeState = this.sessionTimeScales.get(sessionId);
    
    if (!timeState) {
      logger.warn('Cannot create prompt - session not initialized', { sessionId });
      return null;
    }
    
    const prompt = {
      id: `time_prompt_${Date.now()}`,
      sessionId,
      reason,
      suggestedScale,
      estimatedWaitTime,
      currentScale: timeState.scale,
      timestamp: Date.now()
    };
    
    timeState.pendingPrompts.push(prompt);
    
    logger.info('Time acceleration prompt created', {
      sessionId,
      reason,
      suggestedScale,
      estimatedWaitTime
    });
    
    return prompt;
  }

  /**
   * Respond to time prompt
   * @param {string} sessionId - Session ID
   * @param {string} promptId - Prompt ID
   * @param {boolean} accepted - Whether prompt was accepted
   * @param {number} customScale - Custom scale if different from suggested
   */
  respondToPrompt(sessionId, promptId, accepted, customScale = null) {
    const timeState = this.sessionTimeScales.get(sessionId);
    
    if (!timeState) {
      logger.warn('Cannot respond to prompt - session not initialized', { sessionId });
      return;
    }
    
    const promptIndex = timeState.pendingPrompts.findIndex(p => p.id === promptId);
    
    if (promptIndex === -1) {
      logger.warn('Prompt not found', { sessionId, promptId });
      return;
    }
    
    const prompt = timeState.pendingPrompts[promptIndex];
    timeState.pendingPrompts.splice(promptIndex, 1);
    
    if (accepted) {
      const newScale = customScale || prompt.suggestedScale;
      this.setTimeScale(sessionId, newScale, `prompt_accepted: ${prompt.reason}`);
    } else {
      logger.info('Time acceleration prompt rejected', {
        sessionId,
        promptId,
        reason: prompt.reason
      });
    }
  }

  /**
   * Get pending prompts for session
   * @param {string} sessionId - Session ID
   * @returns {Array} Array of pending prompts
   */
  getPendingPrompts(sessionId) {
    const timeState = this.sessionTimeScales.get(sessionId);
    return timeState ? timeState.pendingPrompts : [];
  }

  /**
   * Determine optimal time scale for scenario step
   * @param {object} step - Scenario step
   * @param {object} sessionState - Current session state
   * @returns {object} Recommendation
   */
  recommendTimeScale(step, sessionState) {
    // Default to real-time
    let recommendedScale = this.TIME_SCALES.REAL_TIME;
    let reason = 'default';
    
    // Check if step has minimum time requirement
    if (step.completionCondition?.type === 'time_elapsed') {
      const requiredSeconds = step.completionCondition.parameters?.seconds || 0;
      
      if (requiredSeconds > 300) { // More than 5 minutes
        recommendedScale = this.TIME_SCALES.FAST_60X;
        reason = 'long_wait';
      } else if (requiredSeconds > 120) { // More than 2 minutes
        recommendedScale = this.TIME_SCALES.FAST_30X;
        reason = 'moderate_wait';
      } else if (requiredSeconds > 30) {
        recommendedScale = this.TIME_SCALES.FAST_10X;
        reason = 'short_wait';
      }
    }
    
    // Check if waiting for orbital pass
    if (step.completionCondition?.type === 'beacon_received') {
      recommendedScale = this.TIME_SCALES.FAST_100X;
      reason = 'waiting_for_pass';
    }
    
    // Check if active commands are executing
    if (sessionState.commandsExecuting > 0) {
      recommendedScale = this.TIME_SCALES.REAL_TIME;
      reason = 'commands_executing';
    }
    
    // Check if critical subsystem status
    if (sessionState.telemetry?.power?.status === 'critical') {
      recommendedScale = this.TIME_SCALES.REAL_TIME;
      reason = 'critical_status';
    }
    
    return {
      scale: recommendedScale,
      reason,
      estimatedTime: this.estimateStepDuration(step, recommendedScale)
    };
  }

  /**
   * Estimate step duration at given time scale
   * @param {object} step - Scenario step
   * @param {number} timeScale - Time scale
   * @returns {number} Estimated duration in seconds (real time)
   */
  estimateStepDuration(step, timeScale) {
    let simulationSeconds = 0;
    
    if (step.completionCondition?.type === 'time_elapsed') {
      simulationSeconds = step.completionCondition.parameters?.seconds || 60;
    } else if (step.completionCondition?.type === 'beacon_received') {
      simulationSeconds = 2700; // Assume 45 minutes to first beacon
    } else {
      simulationSeconds = 120; // Default 2 minutes
    }
    
    return simulationSeconds / timeScale;
  }

  /**
   * Cleanup session
   * @param {string} sessionId - Session ID
   */
  cleanupSession(sessionId) {
    this.sessionTimeScales.delete(sessionId);
    logger.info('Time controller session cleaned up', { sessionId });
  }

  /**
   * Get all active sessions
   * @returns {Array} Array of session IDs
   */
  getActiveSessions() {
    return Array.from(this.sessionTimeScales.keys());
  }
}

module.exports = TimeController;
