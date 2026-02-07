/**
 * Scenario Validator Service
 * 
 * Evaluates step completion conditions in real-time based on satellite state.
 * Implements all validation types for the game mechanics layer.
 * 
 * Validation Types:
 * - orbital_maneuver: Check orbital parameters (apoapsis, periapsis, eccentricity)
 * - altitude_transition: Monitor altitude changes and visualization triggers
 * - telemetry_threshold: Check resource levels (fuel, power, data)
 * - mission_completion: Final mission validation
 * - manual_confirmation: User-acknowledged steps
 * - command_executed: Verify specific commands were run
 */

const logger = require('../utils/logger');

/**
 * Earth radius constant
 * @const {number}
 */
const EARTH_RADIUS_KM = 6371;

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} passed - Whether validation passed
 * @property {Array<Object>} checks - Individual check results
 * @property {number} [nextStep] - Next step to advance to
 * @property {string} path - 'nominal'|'recovery'|'failed'
 * @property {string} message - Human-readable result message
 * @property {Object} [details] - Additional validation details
 */

class ScenarioValidator {
  constructor() {
    logger.info('ScenarioValidator initialized');
  }

  /**
   * Main validation entry point
   * Routes to appropriate validation method based on type
   * 
   * @param {Object} step - Scenario step definition
   * @param {Object} state - Current satellite/session state
   * @returns {ValidationResult} Validation result
   */
  validateStep(step, state) {
    const { validationType, validationConfig } = step;

    logger.debug('Validating step', {
      stepOrder: step.stepOrder,
      validationType,
      title: step.title
    });

    try {
      let result;

      switch (validationType) {
      case 'orbital_maneuver':
        result = this.validateOrbitalManeuver(validationConfig, state);
        break;

      case 'altitude_transition':
        result = this.validateAltitudeTransition(validationConfig, state);
        break;

      case 'telemetry_threshold':
        result = this.validateTelemetryThreshold(validationConfig, state);
        break;

      case 'mission_completion':
        result = this.validateMissionCompletion(validationConfig, state);
        break;

      case 'manual_confirmation':
        result = this.validateManualConfirmation(validationConfig, state);
        break;

      case 'command_executed':
        result = this.validateCommandExecuted(validationConfig, state);
        break;

      case 'command_sequence':
        result = this.validateCommandSequence(validationConfig, state);
        break;

      case 'subsystem_status':
        result = this.validateSubsystemStatus(validationConfig, state);
        break;

      case 'time_elapsed':
        result = this.validateTimeElapsed(validationConfig, state);
        break;

      case 'beacon_received':
        result = this.validateBeaconReceived(validationConfig, state);
        break;

      default:
        logger.warn('Unknown validation type', { validationType });
        result = {
          passed: false,
          checks: [],
          reason: `Unknown validation type: ${validationType}`
        };
      }

      // Add step transition logic
      return this.determineStepTransition(step, result);

    } catch (error) {
      logger.error('Validation error', {
        error: error.message,
        step: step.stepOrder,
        validationType
      });

      return {
        passed: false,
        checks: [],
        path: 'failed',
        message: `Validation error: ${error.message}`
      };
    }
  }

  /**
   * Validate orbital maneuver completion
   * Checks apoapsis, periapsis, eccentricity, fuel remaining
   * 
   * @param {Object} config - Validation configuration
   * @param {Object} state - Current state
   * @returns {Object} Validation result
   */
  validateOrbitalManeuver(config, state) {
    const { a, e } = state.orbitalElements || {};
    
    if (!a || e === undefined) {
      return {
        passed: false,
        checks: [],
        reason: 'Missing orbital elements'
      };
    }

    const checks = [];

    // Calculate apoapsis and periapsis
    const apoapsis = a * (1 + e) - EARTH_RADIUS_KM;
    const periapsis = a * (1 - e) - EARTH_RADIUS_KM;

    // Check apoapsis
    if (config.targetApoapsis) {
      const inRange = apoapsis >= config.targetApoapsis.min && 
                      apoapsis <= config.targetApoapsis.max;
      checks.push({
        name: 'apoapsis',
        passed: inRange,
        actual: apoapsis,
        target: config.targetApoapsis,
        message: `Apoapsis: ${apoapsis.toFixed(1)} km (target: ${config.targetApoapsis.min}-${config.targetApoapsis.max} km)`
      });
    }

    // Check periapsis
    if (config.targetPeriapsis) {
      const inRange = periapsis >= config.targetPeriapsis.min && 
                      periapsis <= config.targetPeriapsis.max;
      checks.push({
        name: 'periapsis',
        passed: inRange,
        actual: periapsis,
        target: config.targetPeriapsis,
        message: `Periapsis: ${periapsis.toFixed(1)} km (target: ${config.targetPeriapsis.min}-${config.targetPeriapsis.max} km)`
      });
    }

    // Check eccentricity
    if (config.maxEccentricity !== undefined) {
      const passed = e <= config.maxEccentricity;
      checks.push({
        name: 'eccentricity',
        passed,
        actual: e,
        target: { max: config.maxEccentricity },
        message: `Eccentricity: ${e.toFixed(4)} (max: ${config.maxEccentricity})`
      });
    }

    // Check altitude (alternative to apoapsis/periapsis)
    if (config.targetAltitude) {
      const altitude = (apoapsis + periapsis) / 2;
      const inRange = altitude >= config.targetAltitude.min && 
                      altitude <= config.targetAltitude.max;
      checks.push({
        name: 'altitude',
        passed: inRange,
        actual: altitude,
        target: config.targetAltitude,
        message: `Altitude: ${altitude.toFixed(1)} km (target: ${config.targetAltitude.min}-${config.targetAltitude.max} km)`
      });
    }

    // Check fuel remaining
    if (config.fuelRemaining) {
      const fuelKg = state.propellantMass_kg || state.resources?.propellantMass_kg || 0;
      const passed = fuelKg >= config.fuelRemaining.min;
      checks.push({
        name: 'fuel',
        passed,
        actual: fuelKg,
        target: config.fuelRemaining,
        message: `Fuel: ${fuelKg.toFixed(2)} kg (min: ${config.fuelRemaining.min} kg)`
      });
    }

    const allPassed = checks.every(c => c.passed);

    return {
      passed: allPassed,
      checks,
      details: {
        apoapsis: apoapsis.toFixed(1),
        periapsis: periapsis.toFixed(1),
        eccentricity: e.toFixed(4)
      }
    };
  }

  /**
   * Validate altitude transition
   * Used for 2D→3D visualization trigger
   * 
   * @param {Object} config - Validation configuration
   * @param {Object} state - Current state
   * @returns {Object} Validation result
   */
  validateAltitudeTransition(config, state) {
    const altitude = state.altitude || state.orbitalElements?.altitude || 0;

    const checks = [];

    // Check minimum altitude reached
    if (config.minAltitude !== undefined) {
      const passed = altitude >= config.minAltitude;
      checks.push({
        name: 'min_altitude',
        passed,
        actual: altitude,
        target: { min: config.minAltitude },
        message: `Altitude: ${altitude.toFixed(1)} km (min: ${config.minAltitude} km)`
      });
    }

    // Check if in transition zone (2000-3000 km)
    if (config.emphasizeViewChange) {
      const inTransitionZone = altitude >= 2000 && altitude <= 3000;
      checks.push({
        name: 'transition_zone',
        passed: inTransitionZone || altitude > 3000,
        actual: altitude,
        message: inTransitionZone ? 
          `In transition zone: ${altitude.toFixed(1)} km` : 
          altitude > 3000 ? 
            `Above transition: ${altitude.toFixed(1)} km` :
            `Below transition: ${altitude.toFixed(1)} km`
      });
    }

    const allPassed = checks.every(c => c.passed);

    return {
      passed: allPassed,
      checks,
      details: {
        altitude: altitude.toFixed(1),
        emphasizeView: config.emphasizeViewChange && altitude >= 2400
      }
    };
  }

  /**
   * Validate telemetry threshold
   * Check resource levels
   * 
   * @param {Object} config - Validation configuration
   * @param {Object} state - Current state
   * @returns {Object} Validation result
   */
  validateTelemetryThreshold(config, state) {
    const { telemetryPath, condition, minValue, maxValue, duration } = config;

    // Get value from nested path (e.g., 'power.currentCharge_percent')
    const value = this.getNestedValue(state, telemetryPath);

    if (value === undefined || value === null) {
      return {
        passed: false,
        checks: [{
          name: 'telemetry_exists',
          passed: false,
          message: `Telemetry path not found: ${telemetryPath}`
        }]
      };
    }

    const checks = [];
    let passed = false;

    switch (condition) {
    case 'greater_than':
      passed = value > minValue;
      checks.push({
        name: 'threshold',
        passed,
        actual: value,
        target: { min: minValue },
        message: `${telemetryPath}: ${value.toFixed(2)} > ${minValue}`
      });
      break;

    case 'less_than':
      passed = value < maxValue;
      checks.push({
        name: 'threshold',
        passed,
        actual: value,
        target: { max: maxValue },
        message: `${telemetryPath}: ${value.toFixed(2)} < ${maxValue}`
      });
      break;

    case 'between':
      passed = value >= minValue && value <= maxValue;
      checks.push({
        name: 'threshold',
        passed,
        actual: value,
        target: { min: minValue, max: maxValue },
        message: `${telemetryPath}: ${value.toFixed(2)} in [${minValue}, ${maxValue}]`
      });
      break;

    case 'equals':
      passed = Math.abs(value - minValue) < 0.01;
      checks.push({
        name: 'threshold',
        passed,
        actual: value,
        target: minValue,
        message: `${telemetryPath}: ${value.toFixed(2)} ≈ ${minValue}`
      });
      break;
    }

    // TODO: Duration check (requires tracking over time)
    if (duration) {
      checks.push({
        name: 'duration',
        passed: true, // Placeholder
        message: `Duration check: ${duration}s (not yet implemented)`
      });
    }

    return {
      passed: checks.every(c => c.passed),
      checks
    };
  }

  /**
   * Validate mission completion
   * Final step validation
   * 
   * @param {Object} config - Validation configuration
   * @param {Object} state - Current state
   * @returns {Object} Validation result
   */
  validateMissionCompletion(config, state) {
    const checks = [];

    // Check minimum score
    if (config.minScore !== undefined) {
      const score = state.score?.total || 0;
      checks.push({
        name: 'score',
        passed: score >= config.minScore,
        actual: score,
        target: { min: config.minScore },
        message: `Score: ${score} (min: ${config.minScore})`
      });
    }

    // Check required steps completed
    if (config.requiredStepsCompleted) {
      const completed = state.stepsCompleted || [];
      const allCompleted = config.requiredStepsCompleted.every(
        step => completed.includes(step)
      );
      checks.push({
        name: 'steps_completed',
        passed: allCompleted,
        actual: completed.length,
        target: config.requiredStepsCompleted.length,
        message: `Steps: ${completed.length}/${config.requiredStepsCompleted.length}`
      });
    }

    // Check data downlink
    if (config.requiredDataDownlink) {
      const downlinked = state.dataDownlinked_mb || 0;
      checks.push({
        name: 'data_downlink',
        passed: downlinked >= config.requiredDataDownlink,
        actual: downlinked,
        target: { min: config.requiredDataDownlink },
        message: `Data: ${downlinked} MB (min: ${config.requiredDataDownlink} MB)`
      });
    }

    return {
      passed: checks.every(c => c.passed),
      checks
    };
  }

  /**
   * Validate manual confirmation
   * Requires user to acknowledge step
   * 
   * @param {Object} config - Validation configuration
   * @param {Object} state - Current state
   * @returns {Object} Validation result
   */
  validateManualConfirmation(config, state) {
    const confirmed = state.stepConfirmed || false;
    const minDuration = config.minDuration || 0;
    const elapsed = state.stepElapsedTime || 0;

    const checks = [];

    if (minDuration > 0) {
      checks.push({
        name: 'min_duration',
        passed: elapsed >= minDuration,
        actual: elapsed,
        target: { min: minDuration },
        message: `Time: ${elapsed.toFixed(0)}s / ${minDuration}s`
      });
    }

    checks.push({
      name: 'confirmed',
      passed: confirmed,
      message: confirmed ? 'Step confirmed' : 'Awaiting confirmation'
    });

    return {
      passed: checks.every(c => c.passed),
      checks
    };
  }

  /**
   * Validate command executed
   * Check if specific command was run successfully
   * 
   * @param {Object} config - Validation configuration
   * @param {Object} state - Current state
   * @returns {Object} Validation result
   */
  validateCommandExecuted(config, state) {
    const commandHistory = state.commandHistory || [];
    const { commandName, parameters, mustSucceed } = config;

    // Find matching command
    const matchingCommand = commandHistory.find(cmd => {
      if (cmd.name !== commandName && cmd.commandName !== commandName) {
        return false;
      }

      // Check parameters if specified
      if (parameters) {
        const cmdParams = cmd.params || cmd.parameters || cmd.commandPayload || {};
        return Object.keys(parameters).every(
          key => cmdParams[key] === parameters[key]
        );
      }

      return true;
    });

    const commandFound = !!matchingCommand;
    const commandSucceeded = matchingCommand?.resultStatus === 'OK' || 
                            matchingCommand?.status === 'completed';

    const checks = [{
      name: 'command_executed',
      passed: commandFound && (!mustSucceed || commandSucceeded),
      actual: commandFound ? 'executed' : 'not found',
      message: commandFound ? 
        `Command ${commandName} ${commandSucceeded ? 'succeeded' : 'executed'}` :
        `Command ${commandName} not found`
    }];

    return {
      passed: checks.every(c => c.passed),
      checks
    };
  }

  /**
   * Validate command sequence
   * Check if commands were executed in order
   * 
   * @param {Object} config - Validation configuration
   * @param {Object} state - Current state
   * @returns {Object} Validation result
   */
  validateCommandSequence(config, state) {
    const commandHistory = state.commandHistory || [];
    const { commands, strictOrder, allMustSucceed } = config;

    const checks = [];
    let lastIndex = -1;

    for (const cmdName of commands) {
      const cmdIndex = commandHistory.findIndex((cmd, idx) => 
        idx > lastIndex && 
        (cmd.name === cmdName || cmd.commandName === cmdName)
      );

      const found = cmdIndex !== -1;
      const succeeded = found && 
        (commandHistory[cmdIndex].resultStatus === 'OK' || 
         commandHistory[cmdIndex].status === 'completed');

      checks.push({
        name: `command_${cmdName}`,
        passed: found && (!allMustSucceed || succeeded),
        message: found ?
          `${cmdName} ${succeeded ? 'succeeded' : 'executed'}` :
          `${cmdName} not found`
      });

      if (strictOrder && found) {
        lastIndex = cmdIndex;
      }
    }

    return {
      passed: checks.every(c => c.passed),
      checks
    };
  }

  /**
   * Validate subsystem status
   * Check subsystem health/state
   * 
   * @param {Object} config - Validation configuration
   * @param {Object} state - Current state
   * @returns {Object} Validation result
   */
  validateSubsystemStatus(config, state) {
    const { subsystem, statusField, expectedValue } = config;

    const subsystemState = state[subsystem] || {};
    const actualValue = subsystemState[statusField];

    const passed = actualValue === expectedValue;

    return {
      passed,
      checks: [{
        name: 'subsystem_status',
        passed,
        actual: actualValue,
        target: expectedValue,
        message: `${subsystem}.${statusField}: ${actualValue} (expected: ${expectedValue})`
      }]
    };
  }

  /**
   * Validate time elapsed
   * Simple time-based validation
   * 
   * @param {Object} config - Validation configuration
   * @param {Object} state - Current state
   * @returns {Object} Validation result
   */
  validateTimeElapsed(config, state) {
    const elapsed = state.stepElapsedTime || 0;
    const required = config.durationSeconds || 0;

    const passed = elapsed >= required;

    return {
      passed,
      checks: [{
        name: 'time_elapsed',
        passed,
        actual: elapsed,
        target: { min: required },
        message: `Elapsed: ${elapsed.toFixed(0)}s / ${required}s`
      }]
    };
  }

  /**
   * Validate beacon received
   * Check if satellite beacon was received
   * 
   * @param {Object} config - Validation configuration
   * @param {Object} state - Current state
   * @returns {Object} Validation result
   */
  validateBeaconReceived(config, state) {
    const beaconCount = state.communications?.beaconCount || 0;
    const required = config.beaconCount || 1;

    const passed = beaconCount >= required;

    return {
      passed,
      checks: [{
        name: 'beacon_received',
        passed,
        actual: beaconCount,
        target: { min: required },
        message: `Beacons: ${beaconCount} (min: ${required})`
      }]
    };
  }

  /**
   * Determine step transition based on validation result
   * 
   * @param {Object} step - Step definition
   * @param {Object} validationResult - Validation result
   * @returns {ValidationResult} Enhanced result with transition info
   */
  determineStepTransition(step, validationResult) {
    if (validationResult.passed) {
      return {
        ...validationResult,
        nextStep: step.nominalBranch,
        path: 'nominal',
        message: validationResult.message || 'Objective completed successfully'
      };
    } else if (step.recoveryBranch) {
      return {
        ...validationResult,
        nextStep: step.recoveryBranch,
        path: 'recovery',
        message: validationResult.message || 'Entering recovery procedure'
      };
    } else {
      return {
        ...validationResult,
        nextStep: null,
        path: 'failed',
        message: validationResult.message || 'Objective not met'
      };
    }
  }

  /**
   * Get nested value from object using dot notation
   * 
   * @param {Object} obj - Object to search
   * @param {string} path - Dot-notated path (e.g., 'power.currentCharge_percent')
   * @returns {*} Value or undefined
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => 
      current?.[key], obj
    );
  }
}

module.exports = ScenarioValidator;
