/**
 * Anomaly Injector Service
 * Injects realistic anomalies into simulations based on scenario difficulty
 * Enhances educational value by teaching troubleshooting and emergency response
 */

const logger = require('../utils/logger');

/**
 * Anomaly Types and Their Effects
 */
const ANOMALY_TYPES = {
  // Power Anomalies
  SOLAR_PANEL_DEGRADATION: {
    id: 'SOLAR_PANEL_DEGRADATION',
    category: 'power',
    severity: 'warning',
    description: 'Solar panel efficiency degraded',
    effects: { solarPowerMultiplier: 0.7 },
    duration: 300000, // 5 minutes
    recoverableWithCommand: 'RESET_SOLAR',
    ttl: 600000 // 10 minutes if not addressed
  },
  
  BATTERY_OVERHEATING: {
    id: 'BATTERY_OVERHEATING',
    category: 'power',
    severity: 'critical',
    description: 'Battery temperature exceeding safe limits',
    effects: { batteryDrainMultiplier: 1.5, thermalIncrease: 10 },
    duration: 180000, // 3 minutes
    recoverableWithCommand: 'SAFE_MODE',
    ttl: 300000
  },
  
  POWER_DISTRIBUTION_FAULT: {
    id: 'POWER_DISTRIBUTION_FAULT',
    category: 'power',
    severity: 'warning',
    description: 'Power distribution system inefficiency detected',
    effects: { consumptionMultiplier: 1.3 },
    duration: 420000, // 7 minutes
    recoverableWithCommand: 'RESET_POWER_BUS',
    ttl: 600000
  },

  // Attitude/Orientation Anomalies
  GYRO_DRIFT: {
    id: 'GYRO_DRIFT',
    category: 'attitude',
    severity: 'warning',
    description: 'Gyroscope drift detected - attitude accuracy degraded',
    effects: { attitudeDriftRate: 2.0 },
    duration: 600000, // 10 minutes
    recoverableWithCommand: 'CALIBRATE_SENSORS',
    ttl: 1200000
  },
  
  REACTION_WHEEL_SATURATION: {
    id: 'REACTION_WHEEL_SATURATION',
    category: 'attitude',
    severity: 'critical',
    description: 'Reaction wheel approaching saturation limit',
    effects: { attitudeControlDegraded: true, powerDraw: 15 },
    duration: 240000, // 4 minutes
    recoverableWithCommand: 'DESATURATE_WHEELS',
    ttl: 400000
  },
  
  MAGNETORQUER_FAILURE: {
    id: 'MAGNETORQUER_FAILURE',
    category: 'attitude',
    severity: 'warning',
    description: 'Magnetorquer coil malfunction',
    effects: { attitudeControlLimited: true },
    duration: 900000, // 15 minutes
    recoverableWithCommand: 'SWITCH_ATTITUDE_MODE',
    ttl: 1800000
  },

  // Thermal Anomalies
  THERMAL_RUNAWAY: {
    id: 'THERMAL_RUNAWAY',
    category: 'thermal',
    severity: 'critical',
    description: 'Component temperature rising rapidly',
    effects: { thermalIncrease: 15, performanceDegradation: 0.3 },
    duration: 180000, // 3 minutes
    recoverableWithCommand: 'SAFE_MODE',
    ttl: 240000
  },
  
  RADIATOR_BLOCKAGE: {
    id: 'RADIATOR_BLOCKAGE',
    category: 'thermal',
    severity: 'warning',
    description: 'Thermal radiator partially blocked',
    effects: { coolingEfficiency: 0.6 },
    duration: 600000, // 10 minutes
    recoverableWithCommand: 'CYCLE_THERMAL_LOUVERS',
    ttl: 900000
  },

  // Communications Anomalies
  ANTENNA_POINTING_ERROR: {
    id: 'ANTENNA_POINTING_ERROR',
    category: 'communications',
    severity: 'warning',
    description: 'Antenna pointing accuracy degraded',
    effects: { signalStrengthMultiplier: 0.5 },
    duration: 300000, // 5 minutes
    recoverableWithCommand: 'REPOINT_ANTENNA',
    ttl: 600000
  },
  
  TRANSPONDER_LOCKUP: {
    id: 'TRANSPONDER_LOCKUP',
    category: 'communications',
    severity: 'critical',
    description: 'Communications transponder locked up',
    effects: { commDisabled: true },
    duration: 120000, // 2 minutes
    recoverableWithCommand: 'RESET_TRANSPONDER',
    ttl: 180000
  },
  
  SIGNAL_INTERFERENCE: {
    id: 'SIGNAL_INTERFERENCE',
    category: 'communications',
    severity: 'warning',
    description: 'External RF interference detected',
    effects: { signalStrengthMultiplier: 0.7, dataRateReduced: 0.5 },
    duration: 420000, // 7 minutes
    recoverableWithCommand: 'SWITCH_FREQUENCY',
    ttl: 600000
  },

  // Propulsion Anomalies
  THRUSTER_VALVE_STUCK: {
    id: 'THRUSTER_VALVE_STUCK',
    category: 'propulsion',
    severity: 'warning',
    description: 'Thruster valve stuck partially open',
    effects: { fuelLeakRate: 0.01 }, // % per second
    duration: 0, // Continuous until fixed
    recoverableWithCommand: 'CYCLE_THRUSTER_VALVES',
    ttl: 300000
  },
  
  FUEL_PRESSURE_LOW: {
    id: 'FUEL_PRESSURE_LOW',
    category: 'propulsion',
    severity: 'warning',
    description: 'Propulsion system pressure below nominal',
    effects: { maneuverEfficiency: 0.7 },
    duration: 600000, // 10 minutes
    recoverableWithCommand: 'PRESSURIZE_FUEL_TANK',
    ttl: 900000
  },

  // Payload Anomalies
  SENSOR_CALIBRATION_DRIFT: {
    id: 'SENSOR_CALIBRATION_DRIFT',
    category: 'payload',
    severity: 'warning',
    description: 'Science sensor calibration drifting',
    effects: { dataQuality: 0.6 },
    duration: 900000, // 15 minutes
    recoverableWithCommand: 'CALIBRATE_PAYLOAD',
    ttl: 1800000
  },
  
  DATA_STORAGE_ERROR: {
    id: 'DATA_STORAGE_ERROR',
    category: 'payload',
    severity: 'critical',
    description: 'Onboard data storage errors detected',
    effects: { dataCollectionStopped: true },
    duration: 240000, // 4 minutes
    recoverableWithCommand: 'FORMAT_STORAGE',
    ttl: 360000
  }
};

/**
 * Difficulty-based anomaly configuration
 * Defines how likely anomalies are based on scenario difficulty
 */
const DIFFICULTY_CONFIGS = {
  BEGINNER: {
    enabled: false, // No anomalies for beginners
    anomalyChance: 0,
    maxConcurrentAnomalies: 0,
    allowedSeverities: [],
    checkIntervalMinutes: 0
  },
  
  INTERMEDIATE: {
    enabled: true,
    anomalyChance: 0.15, // 15% chance per check
    maxConcurrentAnomalies: 1,
    allowedSeverities: ['warning'],
    checkIntervalMinutes: 10,
    allowedCategories: ['power', 'communications', 'thermal']
  },
  
  ADVANCED: {
    enabled: true,
    anomalyChance: 0.30, // 30% chance per check
    maxConcurrentAnomalies: 2,
    allowedSeverities: ['warning', 'critical'],
    checkIntervalMinutes: 7,
    allowedCategories: ['power', 'attitude', 'thermal', 'communications', 'propulsion', 'payload']
  }
};

class AnomalyInjector {
  constructor() {
    this.activeAnomalies = new Map(); // sessionId -> { anomalyId: anomalyState }
    this.injectionTimers = new Map(); // sessionId -> intervalId
  }

  /**
   * Start anomaly injection for a session
   * @param {string} sessionId - Session ID
   * @param {string} difficulty - Scenario difficulty (BEGINNER, INTERMEDIATE, ADVANCED)
   * @param {object} simulationEngine - Reference to simulation engine
   */
  startInjection(sessionId, difficulty, simulationEngine) {
    const config = DIFFICULTY_CONFIGS[difficulty];
    
    if (!config || !config.enabled) {
      logger.info('Anomaly injection disabled for difficulty level', { sessionId, difficulty });
      return;
    }

    // Initialize active anomalies map for this session
    this.activeAnomalies.set(sessionId, new Map());

    // Set up periodic anomaly checks
    const checkInterval = config.checkIntervalMinutes * 60 * 1000;
    const timerId = setInterval(() => {
      this.checkAndInjectAnomaly(sessionId, config, simulationEngine);
    }, checkInterval);

    this.injectionTimers.set(sessionId, timerId);

    logger.info('Anomaly injection started', {
      sessionId,
      difficulty,
      checkInterval: config.checkIntervalMinutes,
      anomalyChance: (config.anomalyChance * 100) + '%'
    });
  }

  /**
   * Check if anomaly should be injected and inject it
   * @param {string} sessionId - Session ID
   * @param {object} config - Difficulty configuration
   * @param {object} simulationEngine - Simulation engine reference
   */
  checkAndInjectAnomaly(sessionId, config, simulationEngine) {
    const sessionAnomalies = this.activeAnomalies.get(sessionId);
    if (!sessionAnomalies) return;

    // Check if we're at max concurrent anomalies
    if (sessionAnomalies.size >= config.maxConcurrentAnomalies) {
      logger.debug('Max concurrent anomalies reached', { sessionId, count: sessionAnomalies.size });
      return;
    }

    // Roll for anomaly injection
    if (Math.random() > config.anomalyChance) {
      logger.debug('Anomaly roll failed', { sessionId });
      return;
    }

    // Select random anomaly that matches config
    const eligibleAnomalies = this.getEligibleAnomalies(config, sessionAnomalies);
    if (eligibleAnomalies.length === 0) {
      logger.debug('No eligible anomalies to inject', { sessionId });
      return;
    }

    const anomaly = eligibleAnomalies[Math.floor(Math.random() * eligibleAnomalies.length)];
    this.injectAnomaly(sessionId, anomaly, simulationEngine);
  }

  /**
   * Get list of eligible anomalies based on config and current state
   * @param {object} config - Difficulty configuration
   * @param {Map} activeAnomalies - Currently active anomalies
   * @returns {Array} Eligible anomalies
   */
  getEligibleAnomalies(config, activeAnomalies) {
    return Object.values(ANOMALY_TYPES).filter(anomaly => {
      // Check if severity is allowed
      if (!config.allowedSeverities.includes(anomaly.severity)) {
        return false;
      }

      // Check if category is allowed
      if (!config.allowedCategories.includes(anomaly.category)) {
        return false;
      }

      // Don't inject same anomaly twice
      if (activeAnomalies.has(anomaly.id)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Inject an anomaly into the simulation
   * @param {string} sessionId - Session ID
   * @param {object} anomalyDef - Anomaly definition
   * @param {object} simulationEngine - Simulation engine reference
   */
  injectAnomaly(sessionId, anomalyDef, simulationEngine) {
    const sessionAnomalies = this.activeAnomalies.get(sessionId);
    if (!sessionAnomalies) return;

    const anomalyState = {
      id: anomalyDef.id,
      definition: anomalyDef,
      injectedAt: Date.now(),
      expiresAt: Date.now() + anomalyDef.ttl,
      active: true,
      resolvedAt: null,
      resolvedBy: null
    };

    sessionAnomalies.set(anomalyDef.id, anomalyState);

    // Apply anomaly effects to simulation
    if (simulationEngine) {
      simulationEngine.applyAnomalyEffects(sessionId, anomalyDef);
    }

    // Emit anomaly event to frontend via WebSocket
    if (simulationEngine?.sessionManager?.io) {
      simulationEngine.sessionManager.io.to(sessionId).emit('anomaly:detected', {
        anomaly: {
          id: anomalyDef.id,
          category: anomalyDef.category,
          severity: anomalyDef.severity,
          description: anomalyDef.description,
          detectedAt: anomalyState.injectedAt,
          recoverable: !!anomalyDef.recoverableWithCommand,
          recommendedAction: anomalyDef.recoverableWithCommand
        }
      });
    }

    logger.warn('Anomaly injected', {
      sessionId,
      anomalyId: anomalyDef.id,
      severity: anomalyDef.severity,
      category: anomalyDef.category
    });

    // Set up auto-expiration
    setTimeout(() => {
      this.expireAnomaly(sessionId, anomalyDef.id, simulationEngine);
    }, anomalyDef.ttl);
  }

  /**
   * Resolve an anomaly (when correct command is executed)
   * @param {string} sessionId - Session ID
   * @param {string} commandName - Command name executed
   * @param {object} simulationEngine - Simulation engine reference
   * @returns {boolean} True if anomaly was resolved
   */
  resolveAnomaly(sessionId, commandName, simulationEngine) {
    const sessionAnomalies = this.activeAnomalies.get(sessionId);
    if (!sessionAnomalies) return false;

    let resolved = false;

    for (const [anomalyId, anomalyState] of sessionAnomalies.entries()) {
      if (anomalyState.active && anomalyState.definition.recoverableWithCommand === commandName) {
        anomalyState.active = false;
        anomalyState.resolvedAt = Date.now();
        anomalyState.resolvedBy = commandName;

        // Remove anomaly effects
        if (simulationEngine) {
          simulationEngine.removeAnomalyEffects(sessionId, anomalyState.definition);
        }

        // Emit resolution event
        if (simulationEngine?.sessionManager?.io) {
          simulationEngine.sessionManager.io.to(sessionId).emit('anomaly:resolved', {
            anomalyId,
            resolvedAt: anomalyState.resolvedAt,
            resolvedBy: commandName,
            timeToResolve: anomalyState.resolvedAt - anomalyState.injectedAt
          });
        }

        logger.info('Anomaly resolved by command', {
          sessionId,
          anomalyId,
          command: commandName,
          timeToResolve: anomalyState.resolvedAt - anomalyState.injectedAt
        });

        sessionAnomalies.delete(anomalyId);
        resolved = true;
      }
    }

    return resolved;
  }

  /**
   * Expire an anomaly (TTL reached without resolution)
   * @param {string} sessionId - Session ID
   * @param {string} anomalyId - Anomaly ID
   * @param {object} simulationEngine - Simulation engine reference
   */
  expireAnomaly(sessionId, anomalyId, simulationEngine) {
    const sessionAnomalies = this.activeAnomalies.get(sessionId);
    if (!sessionAnomalies) return;

    const anomalyState = sessionAnomalies.get(anomalyId);
    if (!anomalyState || !anomalyState.active) return;

    // Anomaly expired - may cause mission failure or degradation
    logger.warn('Anomaly expired without resolution', {
      sessionId,
      anomalyId,
      severity: anomalyState.definition.severity,
      duration: Date.now() - anomalyState.injectedAt
    });

    // Emit expiration event
    if (simulationEngine?.sessionManager?.io) {
      simulationEngine.sessionManager.io.to(sessionId).emit('anomaly:expired', {
        anomalyId,
        severity: anomalyState.definition.severity,
        description: anomalyState.definition.description,
        consequence: 'Mission objectives may be affected'
      });
    }

    // For critical anomalies, may need to trigger safe mode or mission abort
    if (anomalyState.definition.severity === 'critical') {
      this.handleCriticalAnomalyExpiration(sessionId, anomalyState, simulationEngine);
    }

    sessionAnomalies.delete(anomalyId);
  }

  /**
   * Handle critical anomaly expiration
   * @param {string} sessionId - Session ID
   * @param {object} anomalyState - Anomaly state
   * @param {object} simulationEngine - Simulation engine reference
   */
  handleCriticalAnomalyExpiration(sessionId, anomalyState, simulationEngine) {
    logger.error('Critical anomaly expired - triggering emergency procedures', {
      sessionId,
      anomalyId: anomalyState.id
    });

    // Emit critical alert
    if (simulationEngine?.sessionManager?.io) {
      simulationEngine.sessionManager.io.to(sessionId).emit('alert:critical', {
        type: 'CRITICAL_ANOMALY_UNRESOLVED',
        title: 'Critical System Failure',
        message: `${anomalyState.definition.description} has not been resolved. System entering degraded state.`,
        severity: 'critical',
        requiresAction: true
      });
    }
  }

  /**
   * Get active anomalies for a session
   * @param {string} sessionId - Session ID
   * @returns {Array} Active anomalies
   */
  getActiveAnomalies(sessionId) {
    const sessionAnomalies = this.activeAnomalies.get(sessionId);
    if (!sessionAnomalies) return [];

    return Array.from(sessionAnomalies.values()).filter(a => a.active);
  }

  /**
   * Stop anomaly injection for a session
   * @param {string} sessionId - Session ID
   */
  stopInjection(sessionId) {
    const timerId = this.injectionTimers.get(sessionId);
    if (timerId) {
      clearInterval(timerId);
      this.injectionTimers.delete(sessionId);
    }

    this.activeAnomalies.delete(sessionId);

    logger.info('Anomaly injection stopped', { sessionId });
  }

  /**
   * Get anomaly statistics for a session
   * @param {string} sessionId - Session ID
   * @returns {object} Statistics
   */
  getStats(sessionId) {
    const sessionAnomalies = this.activeAnomalies.get(sessionId);
    if (!sessionAnomalies) {
      return {
        totalActive: 0,
        byCategory: {},
        bySeverity: {}
      };
    }

    const stats = {
      totalActive: 0,
      byCategory: {},
      bySeverity: {}
    };

    for (const anomaly of sessionAnomalies.values()) {
      if (anomaly.active) {
        stats.totalActive++;
        
        const category = anomaly.definition.category;
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        
        const severity = anomaly.definition.severity;
        stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
      }
    }

    return stats;
  }
}

module.exports = AnomalyInjector;
module.exports.ANOMALY_TYPES = ANOMALY_TYPES;
module.exports.DIFFICULTY_CONFIGS = DIFFICULTY_CONFIGS;
