/**
 * Simulation Engine Service
 * Runs orbital mechanics and subsystem simulations
 */

const logger = require('../utils/logger');

class SimulationEngine {
  constructor(sessionManager) {
    this.sessionManager = sessionManager;
    this.activeSimulations = new Map(); // sessionId -> { interval, satellite, startTime, commands, state }
  }

  /**
   * Start simulation for a session
   * @param {string} sessionId - Scenario session ID
   * @param {object} satellite - Satellite configuration
   * @param {object} initialState - Initial simulation state
   */
  startSimulation(sessionId, satellite, initialState = {}) {
    if (this.activeSimulations.has(sessionId)) {
      logger.warn('Simulation already running for session', { sessionId });
      return;
    }

    const startTime = Date.now();
    const simState = {
      satellite,
      startTime,
      currentState: initialState,
      commands: [], // Track all commands executed
      commandEffects: {} // Track ongoing effects from commands
    };

    // Update every 2 seconds
    const interval = setInterval(() => {
      try {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        const simulation = this.activeSimulations.get(sessionId);
        
        if (!simulation) return;
        
        const newState = this.computeNextState(
          satellite, 
          simulation.state.currentState, 
          elapsedSeconds,
          simulation.state.commandEffects
        );
        
        simulation.state.currentState = newState;
        
        // Broadcast update via session manager
        this.sessionManager.updateSessionState(sessionId, {
          telemetry: newState,
          timestamp: Date.now(),
          elapsedTime: elapsedSeconds,
          commandsExecuted: simulation.state.commands.length
        });
      } catch (error) {
        logger.error('Simulation update failed', {
          sessionId,
          error: error.message
        });
      }
    }, 2000);

    this.activeSimulations.set(sessionId, {
      interval,
      satellite,
      startTime,
      state: simState
    });

    logger.info('Simulation started', {
      sessionId,
      satelliteName: satellite.name || 'Unknown',
      updateInterval: '2s'
    });
  }

  /**
   * Stop simulation for a session
   * @param {string} sessionId - Scenario session ID
   */
  stopSimulation(sessionId) {
    const simulation = this.activeSimulations.get(sessionId);
    
    if (simulation) {
      clearInterval(simulation.interval);
      this.activeSimulations.delete(sessionId);
      
      logger.info('Simulation stopped', { sessionId });
    }
  }

  /**
   * Apply a command effect to the simulation
   * @param {string} sessionId - Scenario session ID
   * @param {object} command - Command to apply
   */
  applyCommand(sessionId, command) {
    const simulation = this.activeSimulations.get(sessionId);
    
    if (!simulation) {
      logger.warn('Cannot apply command to inactive simulation', { sessionId });
      return;
    }
    
    // Add command to history
    simulation.state.commands.push({
      ...command,
      appliedAt: Date.now()
    });
    
    // Apply command effects based on command type
    switch (command.type) {
    case 'orbital-maneuver':
      this.applyOrbitalManeuver(simulation, command);
      break;
    case 'attitude-control':
      this.applyAttitudeControl(simulation, command);
      break;
    case 'power-management':
      this.applyPowerManagement(simulation, command);
      break;
    case 'communications':
      this.applyCommunications(simulation, command);
      break;
    default:
      logger.warn('Unknown command type', { type: command.type });
    }
    
    logger.info('Command applied to simulation', {
      sessionId,
      commandType: command.type,
      commandId: command.id
    });
  }
  
  /**
   * Apply orbital maneuver command
   */
  applyOrbitalManeuver(simulation, command) {
    const effects = simulation.state.commandEffects;
    
    // Set effect that will modify orbit over time
    effects.orbitalManeuver = {
      startTime: Date.now(),
      duration: 30000, // 30 seconds
      targetAltitude: command.parameters?.targetAltitude || 400,
      fuelConsumption: 0.5 // % per maneuver
    };
  }
  
  /**
   * Apply attitude control command
   */
  applyAttitudeControl(simulation, command) {
    const effects = simulation.state.commandEffects;
    
    effects.attitudeChange = {
      startTime: Date.now(),
      duration: 15000, // 15 seconds
      targetMode: command.parameters?.mode || 'nadir',
      powerDraw: 10 // Additional watts
    };
  }
  
  /**
   * Apply power management command
   */
  applyPowerManagement(simulation, command) {
    const effects = simulation.state.commandEffects;
    
    effects.powerMode = {
      mode: command.parameters?.mode || 'normal',
      appliedAt: Date.now()
    };
  }
  
  /**
   * Apply communications command
   */
  applyCommunications(simulation, command) {
    const effects = simulation.state.commandEffects;
    
    effects.commLink = {
      startTime: Date.now(),
      duration: 600000, // 10 minutes
      station: command.parameters?.station || 'Goldstone',
      dataRate: command.parameters?.dataRate || 2.4
    };
  }
  
  /**
   * Compute next simulation state
   * @param {object} satellite - Satellite configuration
   * @param {object} currentState - Current simulation state
   * @param {number} elapsedSeconds - Elapsed time since simulation start
   * @param {object} commandEffects - Active command effects
   * @returns {object} Updated simulation state
   */
  computeNextState(satellite, currentState, elapsedSeconds, commandEffects = {}) {
    // Initialize state if empty
    if (!currentState.orbit) {
      currentState = this.initializeState(satellite);
    }

    // Simulate orbital mechanics (simplified model)
    const orbit = this.simulateOrbit(
      satellite, 
      currentState.orbit, 
      elapsedSeconds, 
      commandEffects.orbitalManeuver
    );
    
    // Simulate power subsystem
    const power = this.simulatePower(
      satellite, 
      currentState.power, 
      elapsedSeconds,
      commandEffects.powerMode,
      commandEffects.attitudeChange
    );
    
    // Simulate attitude control
    const attitude = this.simulateAttitude(
      satellite, 
      currentState.attitude, 
      elapsedSeconds,
      commandEffects.attitudeChange
    );
    
    // Simulate thermal
    const thermal = this.simulateThermal(satellite, currentState.thermal, elapsedSeconds);
    
    // Simulate propulsion
    const propulsion = this.simulatePropulsion(
      satellite, 
      currentState.propulsion, 
      elapsedSeconds,
      commandEffects.orbitalManeuver
    );
    
    // Simulate payload
    const payload = this.simulatePayload(satellite, currentState.payload, elapsedSeconds);

    return {
      orbit,
      power,
      attitude,
      thermal,
      propulsion,
      payload,
      timestamp: Date.now()
    };
  }

  /**
   * Initialize simulation state from satellite configuration
   * @param {object} satellite - Satellite configuration
   * @returns {object} Initial state
   */
  initializeState(satellite) {
    return {
      orbit: {
        altitude_km: satellite.orbit?.altitude_km || 415,
        inclination_degrees: satellite.orbit?.inclination_degrees || 53,
        eccentricity: satellite.orbit?.eccentricity || 0.0,
        longitude: 0,
        latitude: 0,
        velocity_mps: 7660
      },
      power: {
        currentCharge_percent: satellite.power?.currentCharge_percent || 95,
        solarPower_watts: satellite.power?.solarPower_watts || 100,
        consumption_watts: satellite.power?.consumption_watts || 45,
        status: 'nominal'
      },
      attitude: {
        roll_degrees: 0,
        pitch_degrees: 0,
        yaw_degrees: 0,
        status: 'nominal'
      },
      thermal: {
        temperature_celsius: satellite.thermal?.temperature_celsius || 20,
        status: 'nominal'
      },
      propulsion: {
        fuel_percent: satellite.propulsion?.fuel_percent || 100,
        status: 'nominal'
      },
      payload: {
        status: satellite.payload?.status || 'nominal',
        dataCollected_mb: 0
      }
    };
  }

  /**
   * Simulate orbital motion
   */
  simulateOrbit(satellite, currentOrbit, _elapsedSeconds, maneuverEffect) {
    const orbitalPeriod = 5580; // ~93 minutes in seconds for LEO
    const angle = (_elapsedSeconds / orbitalPeriod) * 360; // degrees
    
    let altitudeChange = (Math.random() - 0.5) * 0.1;
    
    // Apply maneuver effect if active
    if (maneuverEffect) {
      const elapsed = Date.now() - maneuverEffect.startTime;
      if (elapsed < maneuverEffect.duration) {
        const targetDelta = maneuverEffect.targetAltitude - currentOrbit.altitude_km;
        altitudeChange += targetDelta * 0.05; // Gradual altitude change
      }
    }
    
    return {
      ...currentOrbit,
      altitude_km: currentOrbit.altitude_km + altitudeChange,
      longitude: (angle * 4) % 360, // 4 orbits per day approximation
      latitude: currentOrbit.inclination_degrees * Math.sin(angle * Math.PI / 180)
    };
  }

  /**
   * Simulate power subsystem
   */
  simulatePower(satellite, currentPower, _elapsedSeconds, powerMode, attitudeEffect) {
    let solarPower = currentPower.solarPower_watts;
    let consumption = currentPower.consumption_watts;
    
    // Apply power mode effects
    if (powerMode?.mode === 'low-power') {
      consumption *= 0.7; // Reduce consumption by 30%
    } else if (powerMode?.mode === 'high-performance') {
      consumption *= 1.3; // Increase consumption by 30%
    }
    
    // Apply attitude change power draw
    if (attitudeEffect) {
      const elapsed = Date.now() - attitudeEffect.startTime;
      if (elapsed < attitudeEffect.duration) {
        consumption += attitudeEffect.powerDraw;
      }
    }
    
    const netPower = solarPower - consumption;
    
    // Simple battery model
    const chargeRate = netPower / 1000; // per second
    const newCharge = Math.max(0, Math.min(100, 
      currentPower.currentCharge_percent + chargeRate * 2
    ));

    return {
      ...currentPower,
      solarPower_watts: solarPower,
      consumption_watts: consumption,
      currentCharge_percent: newCharge,
      status: newCharge > 20 ? 'nominal' : (newCharge > 10 ? 'warning' : 'critical')
    };
  }

  /**
   * Simulate attitude control subsystem
   */
  simulateAttitude(satellite, currentAttitude, _elapsedSeconds, attitudeEffect) {
    let roll = currentAttitude.roll_degrees + (Math.random() - 0.5) * 0.5;
    let pitch = currentAttitude.pitch_degrees + (Math.random() - 0.5) * 0.5;
    let yaw = currentAttitude.yaw_degrees + (Math.random() - 0.5) * 0.5;
    let mode = currentAttitude.mode || 'nominal';
    
    // Apply attitude change effect
    if (attitudeEffect) {
      const elapsed = Date.now() - attitudeEffect.startTime;
      if (elapsed < attitudeEffect.duration) {
        mode = `changing-to-${attitudeEffect.targetMode}`;
        // Gradually adjust to target orientation
        roll *= 0.9; // Converge to target
        pitch *= 0.9;
        yaw *= 0.9;
      } else {
        mode = attitudeEffect.targetMode;
      }
    }
    
    return {
      roll_degrees: roll,
      pitch_degrees: pitch,
      yaw_degrees: yaw,
      mode,
      status: 'nominal'
    };
  }

  /**
   * Simulate thermal subsystem
   */
  simulateThermal(satellite, currentThermal, _elapsedSeconds) {
    // Temperature varies slightly
    const temp = currentThermal.temperature_celsius + (Math.random() - 0.5) * 2;
    
    return {
      temperature_celsius: temp,
      status: (temp > -20 && temp < 50) ? 'nominal' : 'warning'
    };
  }

  /**
   * Simulate propulsion subsystem
   */
  simulatePropulsion(satellite, currentPropulsion, _elapsedSeconds, maneuverEffect) {
    let fuelDepletion = 0.001; // Base depletion
    
    // Apply maneuver fuel consumption
    if (maneuverEffect) {
      const elapsed = Date.now() - maneuverEffect.startTime;
      if (elapsed < maneuverEffect.duration) {
        fuelDepletion += maneuverEffect.fuelConsumption / (maneuverEffect.duration / 1000);
      }
    }
    
    const newFuelPercent = Math.max(0, currentPropulsion.fuel_percent - fuelDepletion);
    
    return {
      fuel_percent: newFuelPercent,
      status: newFuelPercent > 10 ? 'nominal' : 'warning'
    };
  }

  /**
   * Simulate payload subsystem
   */
  simulatePayload(satellite, currentPayload, _elapsedSeconds) {
    // Data collection over time
    return {
      status: currentPayload.status || 'nominal',
      dataCollected_mb: (currentPayload.dataCollected_mb || 0) + (Math.random() * 0.5)
    };
  }

  /**
   * Get all active simulation IDs
   * @returns {Array<string>} Array of active session IDs
   */
  getActiveSimulations() {
    return Array.from(this.activeSimulations.keys());
  }

  /**
   * Get simulation state for a session
   * @param {string} sessionId - Scenario session ID
   * @returns {object|null} Simulation state
   */
  getSimulationState(sessionId) {
    const simulation = this.activeSimulations.get(sessionId);
    return simulation ? simulation.state : null;
  }
  
  /**
   * Get command history for a session
   * @param {string} sessionId - Scenario session ID
   * @returns {Array} Command history
   */
  getCommandHistory(sessionId) {
    const simulation = this.activeSimulations.get(sessionId);
    return simulation ? simulation.state.commands : [];
  }
  
  /**
   * Check if simulation is running
   * @param {string} sessionId - Scenario session ID
   * @returns {boolean} True if simulation is active
   */
  isRunning(sessionId) {
    return this.activeSimulations.has(sessionId);
  }

  /**
   * Stop all simulations (for graceful shutdown)
   */
  stopAll() {
    const sessions = Array.from(this.activeSimulations.keys());
    sessions.forEach(sessionId => this.stopSimulation(sessionId));
    logger.info('All simulations stopped', { count: sessions.length });
  }
}

module.exports = SimulationEngine;
