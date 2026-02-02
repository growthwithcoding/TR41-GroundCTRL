/**
 * Step Validation Engine
 * 
 * Validates scenario step completion based on various condition types
 * Part of Mission Control Enhancement Plan - Phase 1
 * 
 * Condition Types Supported:
 * - beacon_received: Satellite beacon detected
 * - command_executed: Specific command completed successfully
 * - command_sequence: Multiple commands in order
 * - telemetry_threshold: Telemetry value meets threshold
 * - time_elapsed: Minimum time has passed
 * - subsystem_status: Subsystem in required state
 * - manual_confirmation: Operator confirms completion
 */

const logger = require('../utils/logger');

/**
 * Step Validation Engine
 * Validates step completion based on various condition types
 */
class StepValidator {
  constructor() {
    this.validationMethods = {
      'beacon_received': this.validateBeacon.bind(this),
      'command_executed': this.validateCommandExecution.bind(this),
      'telemetry_threshold': this.validateTelemetry.bind(this),
      'time_elapsed': this.validateTimeElapsed.bind(this),
      'command_sequence': this.validateCommandSequence.bind(this),
      'subsystem_status': this.validateSubsystemStatus.bind(this),
      'manual_confirmation': this.validateManualConfirmation.bind(this)
    };
  }

  /**
   * Main validation method
   * @param {object} step - Scenario step object
   * @param {object} sessionState - Current session state
   * @param {Array} commandHistory - Command history for session
   * @returns {object} Validation result { isComplete: boolean, details: object }
   */
  validateStepCompletion(step, sessionState, commandHistory) {
    const condition = step.completionCondition;
    
    if (!condition || !condition.type) {
      logger.warn('Step has no completion condition', { stepId: step.id });
      return { isComplete: false, reason: 'No completion condition defined' };
    }
    
    const validationMethod = this.validationMethods[condition.type];
    
    if (!validationMethod) {
      logger.error('Unknown validation type', { type: condition.type });
      return { isComplete: false, reason: `Unknown validation type: ${condition.type}` };
    }
    
    try {
      const result = validationMethod(condition, sessionState, commandHistory);
      
      logger.debug('Step validation result', {
        stepId: step.id,
        stepTitle: step.title,
        conditionType: condition.type,
        isComplete: result.isComplete
      });
      
      return result;
      
    } catch (error) {
      logger.error('Step validation error', {
        stepId: step.id,
        error: error.message
      });
      return { isComplete: false, reason: error.message };
    }
  }

  /**
   * Validate beacon received condition
   */
  validateBeacon(condition, sessionState, _commandHistory) {
    const params = condition.parameters || {};
    const beaconType = params.beaconType || 'any';
    
    const lastBeacon = sessionState.lastBeaconReceived;
    const lastBeaconType = sessionState.beaconType;
    
    if (!lastBeacon) {
      return { 
        isComplete: false, 
        reason: 'No beacon received yet',
        progress: 0 
      };
    }
    
    if (beaconType !== 'any' && lastBeaconType !== beaconType) {
      return { 
        isComplete: false, 
        reason: `Waiting for ${beaconType} beacon, received ${lastBeaconType}`,
        progress: 50 
      };
    }
    
    return { 
      isComplete: true, 
      reason: `Beacon received (${lastBeaconType})`,
      completedAt: lastBeacon 
    };
  }

  /**
   * Validate single command execution
   */
  validateCommandExecution(condition, _sessionState, commandHistory) {
    const params = condition.parameters || {};
    const requiredCommand = params.commandName;
    
    if (!requiredCommand) {
      return { isComplete: false, reason: 'No command name specified' };
    }
    
    const executedCommand = commandHistory.find(cmd => 
      cmd.commandName === requiredCommand && cmd.resultStatus === 'OK'
    );
    
    if (!executedCommand) {
      return { 
        isComplete: false, 
        reason: `Command ${requiredCommand} not yet executed`,
        progress: 0 
      };
    }
    
    return { 
      isComplete: true, 
      reason: `Command ${requiredCommand} executed successfully`,
      completedAt: executedCommand.issuedAt 
    };
  }

  /**
   * Validate command sequence (order matters)
   */
  validateCommandSequence(condition, _sessionState, commandHistory) {
    const params = condition.parameters || {};
    const { requiredCommands, order } = params;
    
    if (!requiredCommands || !Array.isArray(requiredCommands)) {
      return { isComplete: false, reason: 'No command sequence specified' };
    }
    
    if (order === 'strict') {
      return this.checkStrictSequence(requiredCommands, commandHistory);
    } else {
      return this.checkFlexibleSequence(requiredCommands, commandHistory);
    }
  }

  /**
   * Check strict command sequence (exact order required)
   */
  checkStrictSequence(requiredCommands, commandHistory) {
    let requiredIdx = 0;
    let lastMatchedTime = null;
    
    for (const cmd of commandHistory) {
      if (cmd.commandName === requiredCommands[requiredIdx] && cmd.resultStatus === 'OK') {
        requiredIdx++;
        lastMatchedTime = cmd.issuedAt;
        
        if (requiredIdx === requiredCommands.length) {
          return { 
            isComplete: true, 
            reason: 'Command sequence completed in order',
            completedAt: lastMatchedTime 
          };
        }
      }
    }
    
    const progress = (requiredIdx / requiredCommands.length) * 100;
    
    return { 
      isComplete: false, 
      reason: `Sequence progress: ${requiredIdx}/${requiredCommands.length} commands`,
      progress: Math.round(progress),
      nextRequired: requiredCommands[requiredIdx]
    };
  }

  /**
   * Check flexible command sequence (any order)
   */
  checkFlexibleSequence(requiredCommands, commandHistory) {
    const completedCommands = requiredCommands.filter(reqCmd =>
      commandHistory.some(histCmd => 
        histCmd.commandName === reqCmd && histCmd.resultStatus === 'OK'
      )
    );
    
    const isComplete = completedCommands.length === requiredCommands.length;
    const progress = (completedCommands.length / requiredCommands.length) * 100;
    
    if (isComplete) {
      const lastCommand = commandHistory
        .filter(cmd => requiredCommands.includes(cmd.commandName))
        .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))[0];
      
      return { 
        isComplete: true, 
        reason: `All ${requiredCommands.length} commands executed`,
        completedAt: lastCommand.issuedAt 
      };
    }
    
    const missing = requiredCommands.filter(cmd => !completedCommands.includes(cmd));
    
    return { 
      isComplete: false, 
      reason: `Missing commands: ${missing.join(', ')}`,
      progress: Math.round(progress),
      completedCommands,
      missingCommands: missing
    };
  }

  /**
   * Validate telemetry threshold condition
   */
  validateTelemetry(condition, sessionState, _commandHistory) {
    const params = condition.parameters || {};
    const { subsystem, parameter, operator, value } = params;
    
    if (!subsystem || !parameter || !operator || value === undefined) {
      return { isComplete: false, reason: 'Incomplete telemetry condition' };
    }
    
    const telemetry = sessionState.telemetry;
    
    if (!telemetry || !telemetry[subsystem]) {
      return { 
        isComplete: false, 
        reason: `No telemetry for subsystem: ${subsystem}`,
        progress: 0 
      };
    }
    
    const currentValue = telemetry[subsystem][parameter];
    
    if (currentValue === undefined) {
      return { 
        isComplete: false, 
        reason: `Parameter ${parameter} not found in ${subsystem}`,
        progress: 0 
      };
    }
    
    const conditionMet = this.evaluateOperator(currentValue, operator, value);
    
    if (conditionMet) {
      return { 
        isComplete: true, 
        reason: `${subsystem}.${parameter} ${operator} ${value} (current: ${currentValue})`,
        currentValue 
      };
    }
    
    // Calculate progress for numeric comparisons
    let progress = 0;
    if (typeof currentValue === 'number' && typeof value === 'number') {
      if (operator === 'gt' || operator === 'gte') {
        progress = Math.min(95, (currentValue / value) * 100);
      } else if (operator === 'lt' || operator === 'lte') {
        progress = Math.min(95, ((value - currentValue) / value) * 100);
      }
    }
    
    return { 
      isComplete: false, 
      reason: `${subsystem}.${parameter} is ${currentValue}, need ${operator} ${value}`,
      progress: Math.round(progress),
      currentValue 
    };
  }

  /**
   * Evaluate comparison operators
   */
  evaluateOperator(currentValue, operator, targetValue) {
    switch (operator) {
    case 'gt': return currentValue > targetValue;
    case 'lt': return currentValue < targetValue;
    case 'gte': return currentValue >= targetValue;
    case 'lte': return currentValue <= targetValue;
    case 'eq': return currentValue === targetValue;
    case 'neq': return currentValue !== targetValue;
    default: 
      logger.warn('Unknown operator', { operator });
      return false;
    }
  }

  /**
   * Validate time elapsed condition
   */
  validateTimeElapsed(condition, sessionState, _commandHistory) {
    const params = condition.parameters || {};
    const requiredSeconds = params.seconds || 0;
    
    const sessionStart = new Date(sessionState.startedAt).getTime();
    const elapsedSeconds = (Date.now() - sessionStart) / 1000;
    
    if (elapsedSeconds >= requiredSeconds) {
      return { 
        isComplete: true, 
        reason: `Required time elapsed: ${requiredSeconds}s`,
        elapsedSeconds: Math.round(elapsedSeconds) 
      };
    }
    
    const progress = (elapsedSeconds / requiredSeconds) * 100;
    const remaining = requiredSeconds - elapsedSeconds;
    
    return { 
      isComplete: false, 
      reason: `Time remaining: ${Math.round(remaining)}s`,
      progress: Math.round(progress),
      elapsedSeconds: Math.round(elapsedSeconds),
      remainingSeconds: Math.round(remaining)
    };
  }

  /**
   * Validate subsystem status condition
   */
  validateSubsystemStatus(condition, sessionState, _commandHistory) {
    const params = condition.parameters || {};
    const { subsystem, requiredStatus } = params;
    
    if (!subsystem || !requiredStatus) {
      return { isComplete: false, reason: 'Incomplete subsystem status condition' };
    }
    
    const telemetry = sessionState.telemetry;
    
    if (!telemetry || !telemetry[subsystem]) {
      return { 
        isComplete: false, 
        reason: `No telemetry for subsystem: ${subsystem}`,
        progress: 0 
      };
    }
    
    const currentStatus = telemetry[subsystem].status;
    
    if (currentStatus === requiredStatus) {
      return { 
        isComplete: true, 
        reason: `${subsystem} status is ${requiredStatus}`,
        currentStatus 
      };
    }
    
    return { 
      isComplete: false, 
      reason: `${subsystem} status is ${currentStatus}, need ${requiredStatus}`,
      progress: 50,
      currentStatus 
    };
  }

  /**
   * Validate manual confirmation (operator clicked confirmation button)
   */
  validateManualConfirmation(condition, sessionState, _commandHistory) {
    const confirmed = sessionState.manualConfirmations || [];
    const stepId = condition.parameters?.stepId;
    
    if (confirmed.includes(stepId)) {
      return { 
        isComplete: true, 
        reason: 'Operator confirmed step completion' 
      };
    }
    
    return { 
      isComplete: false, 
      reason: 'Awaiting operator confirmation',
      progress: 0 
    };
  }

  /**
   * Validate multiple conditions (AND/OR logic)
   */
  validateMultipleConditions(conditions, sessionState, commandHistory, logic = 'AND') {
    const results = conditions.map(condition => 
      this.validateStepCompletion({ completionCondition: condition }, sessionState, commandHistory)
    );
    
    if (logic === 'AND') {
      const isComplete = results.every(r => r.isComplete);
      const completedCount = results.filter(r => r.isComplete).length;
      const progress = (completedCount / results.length) * 100;
      
      return {
        isComplete,
        reason: `${completedCount}/${results.length} conditions met`,
        progress: Math.round(progress),
        details: results
      };
    } else { // OR
      const isComplete = results.some(r => r.isComplete);
      const reason = isComplete ? 
        'At least one condition met' : 
        'No conditions met yet';
      
      return {
        isComplete,
        reason,
        progress: isComplete ? 100 : 0,
        details: results
      };
    }
  }
}

module.exports = StepValidator;
