/**
 * Command Queue Service
 * 
 * Simulates realistic command uplink latency and execution tracking
 * Part of Mission Control Enhancement Plan - Phase 1
 * 
 * Features:
 * - Configurable uplink delays (default: 90 seconds)
 * - Command status tracking (uplink_in_progress, executing, completed, failed)
 * - Real-time progress updates via WebSocket
 * - Priority handling for critical commands
 * - Command history management
 */

const logger = require('../utils/logger');

/**
 * Generate unique command ID
 * @returns {string} Unique command ID
 */
function generateCommandId() {
  return `cmd_${Date.now()}_${require('crypto').randomBytes(6).toString('hex')}`;
}

/**
 * Command Queue Service
 * Manages command uplink latency and execution state
 */
class CommandQueue {
  constructor(sessionId, simulationEngine) {
    this.sessionId = sessionId;
    this.simulationEngine = simulationEngine;
    this.queue = [];
    this.interval = null;
    this.defaultLatencySeconds = 90; // 1.5 minutes default (realistic for LEO)
  }

  /**
   * Add command to queue with uplink latency
   * @param {object} command - Command to execute
   * @param {number} latencySeconds - Uplink delay (default: calculated based on command)
   * @returns {string} Command ID for tracking
   */
  enqueueCommand(command, latencySeconds = null) {
    const actualLatency = latencySeconds !== null ? latencySeconds : this.calculateLatency(command);
    
    const queuedCommand = {
      id: generateCommandId(),
      command,
      status: 'uplink_in_progress',
      enqueuedAt: Date.now(),
      executeAt: Date.now() + (actualLatency * 1000),
      completedAt: null,
      latencySeconds: actualLatency,
      result: null,
      error: null
    };
    
    this.queue.push(queuedCommand);
    
    logger.info('Command queued', {
      sessionId: this.sessionId,
      commandId: queuedCommand.id,
      commandName: command.commandName,
      latency: actualLatency
    });
    
    // Emit initial status
    this.emitCommandStatus(queuedCommand);
    
    return queuedCommand.id;
  }

  /**
   * Calculate latency based on command type and ground station visibility
   * @param {object} command - Command object
   * @returns {number} Latency in seconds
   */
  calculateLatency(command) {
    // Base latency: signal propagation time (includes processing)
    let latency = this.defaultLatencySeconds;
    
    // Critical commands get priority (faster processing)
    const criticalCommands = ['SAFE_MODE', 'ABORT_BURN', 'DISABLE_AUTONOMOUS', 'SYSTEM_RESET'];
    if (criticalCommands.includes(command.commandName)) {
      latency *= 0.5; // 50% faster (45 seconds)
    }
    
    // Large data uploads take longer
    if (command.commandName === 'UPLINK_DATA') {
      const dataSize = command.commandPayload?.data_volume_mb || 1;
      latency += dataSize * 2; // 2 seconds per MB
    }
    
    // Passive commands (like WAIT_FOR_BEACON) have no latency
    const passiveCommands = ['WAIT_FOR_BEACON'];
    if (passiveCommands.includes(command.commandName)) {
      latency = 0;
    }
    
    // Quick commands (pings, status requests)
    const quickCommands = ['PING', 'REQUEST_TELEMETRY', 'RUN_DIAGNOSTICS'];
    if (quickCommands.includes(command.commandName)) {
      latency *= 0.3; // 30% of normal (27 seconds)
    }
    
    return latency;
  }

  /**
   * Process pending commands (called every second)
   */
  processQueue() {
    const now = Date.now();
    
    this.queue.forEach(queuedCmd => {
      // Check if command is ready to execute
      if (queuedCmd.status === 'uplink_in_progress' && queuedCmd.executeAt <= now) {
        queuedCmd.status = 'executing';
        this.emitCommandStatus(queuedCmd);
        
        logger.info('Command executing', {
          sessionId: this.sessionId,
          commandId: queuedCmd.id,
          commandName: queuedCmd.command.commandName
        });
        
        // Execute command in simulation
        try {
          const result = this.simulationEngine.applyCommand(
            this.sessionId, 
            queuedCmd.command
          );
          
          // Get execution duration from command metadata
          const executionDuration = this.getExecutionDuration(queuedCmd.command);
          
          // Mark as complete after execution duration
          setTimeout(() => {
            queuedCmd.status = result?.success !== false ? 'completed' : 'failed';
            queuedCmd.completedAt = Date.now();
            queuedCmd.result = result;
            this.emitCommandStatus(queuedCmd);
            
            logger.info('Command completed', {
              sessionId: this.sessionId,
              commandId: queuedCmd.id,
              status: queuedCmd.status
            });
          }, executionDuration * 1000);
          
        } catch (error) {
          queuedCmd.status = 'failed';
          queuedCmd.completedAt = Date.now();
          queuedCmd.error = error.message;
          this.emitCommandStatus(queuedCmd);
          
          logger.error('Command execution failed', {
            sessionId: this.sessionId,
            commandId: queuedCmd.id,
            error: error.message
          });
        }
      }
    });
    
    // Clean up old commands (keep last 100)
    if (this.queue.length > 100) {
      this.queue = this.queue.slice(-100);
    }
  }

  /**
   * Get execution duration for a command
   * @param {object} command - Command object
   * @returns {number} Duration in seconds
   */
  getExecutionDuration(command) {
    // Command execution durations (based on command schemas in enhancement plan)
    const durations = {
      // Commissioning commands
      'PING': 10,
      'UPDATETIME': 5,
      'DEPLOY_ANTENNA': 60,
      'WAIT_FOR_BEACON': 0,
      
      // Quick commands
      'REQUEST_TELEMETRY': 30,
      'SCHEDULE_DOWNLINK': 15,
      'ENABLE_TRANSMITTER': 10,
      'DISABLE_TRANSMITTER': 5,
      
      // Standard commands
      'SET_ATTITUDE_MODE': 30,
      'SET_POWER_MODE': 15,
      'SET_THERMAL_MODE': 20,
      'DEPLOY_SOLAR_ARRAYS': 120,
      'RETRACT_SOLAR_ARRAYS': 120,
      
      // Long-running commands
      'EXECUTE_ORBITAL_MANEUVER': 300,
      'EXECUTE_BURN': 180,
      'CALIBRATE_SENSORS': 180,
      'CALIBRATE_GYROSCOPE': 120,
      'STATION_KEEPING': 120,
      
      // Critical commands
      'SAFE_MODE': 30,
      'ABORT_BURN': 5,
      'SYSTEM_RESET': 60
    };
    
    return durations[command.commandName] || 30; // Default 30 seconds
  }

  /**
   * Emit command status via WebSocket
   * @param {object} queuedCommand - Queued command object
   */
  emitCommandStatus(queuedCommand) {
    const io = this.simulationEngine.sessionManager?.io;
    
    if (!io) {
      logger.warn('WebSocket not available for command status updates', {
        sessionId: this.sessionId
      });
      return;
    }
    
    io.to(this.sessionId).emit('command:status', {
      commandId: queuedCommand.id,
      commandName: queuedCommand.command.commandName,
      status: queuedCommand.status,
      progress: this.calculateProgress(queuedCommand),
      estimatedCompletion: queuedCommand.executeAt,
      enqueuedAt: queuedCommand.enqueuedAt,
      completedAt: queuedCommand.completedAt,
      latencySeconds: queuedCommand.latencySeconds,
      result: queuedCommand.result || null,
      error: queuedCommand.error || null
    });
  }

  /**
   * Calculate command progress percentage
   * @param {object} queuedCommand - Queued command object
   * @returns {number} Progress percentage (0-100)
   */
  calculateProgress(queuedCommand) {
    if (queuedCommand.status === 'completed' || queuedCommand.status === 'failed') {
      return 100;
    }
    
    if (queuedCommand.status === 'executing') {
      return 95; // Show near-complete during execution
    }
    
    const elapsed = Date.now() - queuedCommand.enqueuedAt;
    const total = queuedCommand.executeAt - queuedCommand.enqueuedAt;
    
    if (total === 0) return 100;
    
    return Math.min(95, Math.round((elapsed / total) * 100));
  }

  /**
   * Get command status by ID
   * @param {string} commandId - Command ID
   * @returns {object|null} Command object or null
   */
  getCommandStatus(commandId) {
    return this.queue.find(cmd => cmd.id === commandId) || null;
  }

  /**
   * Get all pending commands
   * @returns {Array} Array of queued commands
   */
  getPendingCommands() {
    return this.queue.filter(cmd => 
      cmd.status === 'uplink_in_progress' || cmd.status === 'executing'
    );
  }

  /**
   * Get completed commands
   * @returns {Array} Array of completed commands
   */
  getCompletedCommands() {
    return this.queue.filter(cmd => 
      cmd.status === 'completed' || cmd.status === 'failed'
    );
  }

  /**
   * Start processing queue
   */
  start() {
    if (this.interval) {
      logger.warn('Command queue already running', { sessionId: this.sessionId });
      return;
    }
    
    this.interval = setInterval(() => this.processQueue(), 1000); // Process every second
    logger.info('Command queue started', { sessionId: this.sessionId });
  }

  /**
   * Stop processing queue
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('Command queue stopped', { sessionId: this.sessionId });
    }
  }

  /**
   * Clear all pending commands (emergency use)
   */
  clear() {
    const pendingCount = this.getPendingCommands().length;
    this.queue = this.queue.filter(cmd => 
      cmd.status === 'completed' || cmd.status === 'failed'
    );
    logger.warn('Command queue cleared', { 
      sessionId: this.sessionId,
      clearedCount: pendingCount 
    });
  }

  /**
   * Get queue statistics
   * @returns {object} Queue statistics
   */
  getStats() {
    return {
      total: this.queue.length,
      pending: this.getPendingCommands().length,
      completed: this.getCompletedCommands().length,
      failed: this.queue.filter(cmd => cmd.status === 'failed').length
    };
  }
}

module.exports = CommandQueue;
