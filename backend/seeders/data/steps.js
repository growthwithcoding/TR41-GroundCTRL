/**
 * Scenario Steps Seed Data
 * Steps with new validation types for Mission Control enhancement
 */

const CREATED_BY_UID = '5usOQ3eOm7OjXmDOFjEmKSQovs42';

const steps = [
  // ROOKIE_COMMISSIONING_101 - New scenario with beacon and command validation
  {
    scenarioCode: 'ROOKIE_COMMISSIONING_101',
    data: {
      stepOrder: 1,
      title: 'Wait for First Beacon',
      instructions: 'The satellite will transmit a beacon signal every 2 minutes. Wait for the first beacon to confirm the satellite is operational.',
      validationType: 'beacon_received',
      validationConfig: {
        beaconCount: 1,
      },
      isCheckpoint: true,
      expectedDurationSeconds: 150,
      hint: 'Beacons are transmitted automatically. Just wait and monitor communications.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'ROOKIE_COMMISSIONING_101',
    data: {
      stepOrder: 2,
      title: 'Establish Communications (PING)',
      instructions: 'Send a PING command to establish two-way communications with the satellite.',
      validationType: 'command_executed',
      validationConfig: {
        commandName: 'PING',
        mustSucceed: true,
      },
      isCheckpoint: true,
      expectedDurationSeconds: 120,
      hint: 'Use the PING command from the communications panel.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'ROOKIE_COMMISSIONING_101',
    data: {
      stepOrder: 3,
      title: 'Deploy Antenna',
      instructions: 'Deploy the communications antenna to establish full communications capability.',
      validationType: 'command_executed',
      validationConfig: {
        commandName: 'DEPLOY_ANTENNA',
        mustSucceed: true,
      },
      isCheckpoint: true,
      expectedDurationSeconds: 90,
      hint: 'The DEPLOY_ANTENNA command is a one-time operation.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'ROOKIE_COMMISSIONING_101',
    data: {
      stepOrder: 4,
      title: 'Verify Communications',
      instructions: 'Wait for confirmation beacon after antenna deployment.',
      validationType: 'beacon_received',
      validationConfig: {
        beaconCount: 2,
        afterCommand: 'DEPLOY_ANTENNA',
      },
      isCheckpoint: false,
      expectedDurationSeconds: 150,
      hint: 'The satellite will send a beacon to confirm antenna deployment.',
      createdBy: CREATED_BY_UID,
    },
  },

  // ROOKIE_ORBIT_101
  {
    scenarioCode: 'ROOKIE_ORBIT_101',
    data: {
      stepOrder: 1,
      title: 'Observe Current Altitude',
      instructions: 'Check the orbital telemetry and note the current altitude.',
      validationType: 'manual_confirmation',
      validationConfig: {
        requiresOperatorInput: true,
      },
      isCheckpoint: false,
      expectedDurationSeconds: 60,
      hint: 'Look at the orbit panel for altitude_km.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'ROOKIE_ORBIT_101',
    data: {
      stepOrder: 2,
      title: 'Complete One Orbit',
      instructions: 'Accelerate time and watch the satellite complete one full orbit (about 93 minutes).',
      validationType: 'time_elapsed',
      validationConfig: {
        durationSeconds: 5580, // 93 minutes
        allowTimeAcceleration: true,
      },
      isCheckpoint: true,
      expectedDurationSeconds: 180,
      hint: 'Use time acceleration to speed up the wait.',
      createdBy: CREATED_BY_UID,
    },
  },

  // ROOKIE_POWER_101
  {
    scenarioCode: 'ROOKIE_POWER_101',
    data: {
      stepOrder: 1,
      title: 'Monitor Battery Level',
      instructions: 'Check the current battery charge. It should be around 60%.',
      validationType: 'telemetry_threshold',
      validationConfig: {
        telemetryPath: 'power.currentCharge_percent',
        condition: 'between',
        minValue: 55,
        maxValue: 65,
      },
      isCheckpoint: false,
      expectedDurationSeconds: 30,
      hint: 'Check the power panel for battery percentage.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'ROOKIE_POWER_101',
    data: {
      stepOrder: 2,
      title: 'Survive Eclipse Period',
      instructions: 'Monitor power during eclipse. Battery should not drop below 40%.',
      validationType: 'telemetry_threshold',
      validationConfig: {
        telemetryPath: 'power.currentCharge_percent',
        condition: 'greater_than',
        minValue: 40,
        duration: 1800, // 30 minutes
      },
      isCheckpoint: true,
      expectedDurationSeconds: 120,
      hint: 'Watch power consumption during shadow periods.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'ROOKIE_POWER_101',
    data: {
      stepOrder: 3,
      title: 'Recharge Battery',
      instructions: 'Wait for battery to recharge to at least 75% during sunlight.',
      validationType: 'telemetry_threshold',
      validationConfig: {
        telemetryPath: 'power.currentCharge_percent',
        condition: 'greater_than',
        minValue: 75,
      },
      isCheckpoint: false,
      expectedDurationSeconds: 240,
      hint: 'Solar panels will recharge the battery when in sunlight.',
      createdBy: CREATED_BY_UID,
    },
  },

  // SPECIALIST_GROUND_STATION_201
  {
    scenarioCode: 'SPECIALIST_GROUND_STATION_201',
    data: {
      stepOrder: 1,
      title: 'Request Telemetry',
      instructions: 'Request full telemetry packet from the satellite.',
      validationType: 'command_executed',
      validationConfig: {
        commandName: 'REQUEST_TELEMETRY',
        parameters: { packet_type: 'all' },
        mustSucceed: true,
      },
      isCheckpoint: false,
      expectedDurationSeconds: 90,
      hint: 'Use REQUEST_TELEMETRY command with packet_type: all.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'SPECIALIST_GROUND_STATION_201',
    data: {
      stepOrder: 2,
      title: 'Schedule Data Downlink',
      instructions: 'Schedule a 100MB data downlink during the next ground station pass.',
      validationType: 'command_executed',
      validationConfig: {
        commandName: 'SCHEDULE_DOWNLINK',
        parameters: { data_volume_mb: 100 },
        mustSucceed: true,
      },
      isCheckpoint: true,
      expectedDurationSeconds: 120,
      hint: 'Use SCHEDULE_DOWNLINK with 100MB volume.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'SPECIALIST_GROUND_STATION_201',
    data: {
      stepOrder: 3,
      title: 'Complete Downlink',
      instructions: 'Wait for scheduled downlink to complete during ground station visibility.',
      validationType: 'subsystem_status',
      validationConfig: {
        subsystem: 'communications',
        statusField: 'downlinkComplete',
        expectedValue: true,
      },
      isCheckpoint: false,
      expectedDurationSeconds: 300,
      hint: 'Downlink will execute automatically when ground station is visible.',
      createdBy: CREATED_BY_UID,
    },
  },

  // SPECIALIST_MANEUVER_201
  {
    scenarioCode: 'SPECIALIST_MANEUVER_201',
    data: {
      stepOrder: 1,
      title: 'Arm Propulsion System',
      instructions: 'Safety first - arm the propulsion system before maneuvering.',
      validationType: 'command_executed',
      validationConfig: {
        commandName: 'ARM_PROPULSION',
        mustSucceed: true,
      },
      isCheckpoint: true,
      expectedDurationSeconds: 90,
      hint: 'Use ARM_PROPULSION command.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'SPECIALIST_MANEUVER_201',
    data: {
      stepOrder: 2,
      title: 'Execute Orbital Burn',
      instructions: 'Execute a burn to raise altitude by approximately 10km.',
      validationType: 'command_sequence',
      validationConfig: {
        commands: ['ARM_PROPULSION', 'EXECUTE_BURN'],
        strictOrder: true,
        allMustSucceed: true,
      },
      isCheckpoint: true,
      expectedDurationSeconds: 180,
      hint: 'First ARM_PROPULSION, then EXECUTE_BURN.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'SPECIALIST_MANEUVER_201',
    data: {
      stepOrder: 3,
      title: 'Verify New Altitude',
      instructions: 'Confirm altitude has increased to approximately 560km.',
      validationType: 'telemetry_threshold',
      validationConfig: {
        telemetryPath: 'orbit.altitude_km',
        condition: 'between',
        minValue: 558,
        maxValue: 562,
      },
      isCheckpoint: false,
      expectedDurationSeconds: 120,
      hint: 'Check orbit telemetry for new altitude.',
      createdBy: CREATED_BY_UID,
    },
  },

  // COMMANDER_EMERGENCY_301
  {
    scenarioCode: 'COMMANDER_EMERGENCY_301',
    data: {
      stepOrder: 1,
      title: 'Assess Critical Status',
      instructions: 'Review all subsystem status. Multiple systems are in critical state.',
      validationType: 'manual_confirmation',
      validationConfig: {
        requiresOperatorInput: true,
      },
      isCheckpoint: false,
      expectedDurationSeconds: 60,
      hint: 'Check power (15%), attitude error (45°), and temperature (65°C).',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'COMMANDER_EMERGENCY_301',
    data: {
      stepOrder: 2,
      title: 'Enter Safe Mode',
      instructions: 'Immediately enter safe mode to stabilize the satellite.',
      validationType: 'command_executed',
      validationConfig: {
        commandName: 'SAFE_MODE',
        mustSucceed: true,
      },
      isCheckpoint: true,
      expectedDurationSeconds: 90,
      hint: 'Use SAFE_MODE command to enter protective mode.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'COMMANDER_EMERGENCY_301',
    data: {
      stepOrder: 3,
      title: 'Stabilize Power',
      instructions: 'Wait for battery to charge above 30% before recovery.',
      validationType: 'telemetry_threshold',
      validationConfig: {
        telemetryPath: 'power.currentCharge_percent',
        condition: 'greater_than',
        minValue: 30,
      },
      isCheckpoint: true,
      expectedDurationSeconds: 300,
      hint: 'Safe mode reduces power consumption. Wait for solar charging.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'COMMANDER_EMERGENCY_301',
    data: {
      stepOrder: 4,
      title: 'Return to Nominal Operations',
      instructions: 'Exit safe mode and return to nominal operations.',
      validationType: 'command_executed',
      validationConfig: {
        commandName: 'NOMINAL_MODE',
        mustSucceed: true,
      },
      isCheckpoint: false,
      expectedDurationSeconds: 120,
      hint: 'Use NOMINAL_MODE to exit safe mode.',
      createdBy: CREATED_BY_UID,
    },
  },

  // DEMO_COMPLETE_HUD - Comprehensive demonstration of all command types
  {
    scenarioCode: 'DEMO_COMPLETE_HUD',
    data: {
      stepOrder: 1,
      title: '🎮 Commissioning Commands',
      instructions: 'Test commissioning commands: Deploy antenna and verify beacon reception.',
      validationType: 'command_executed',
      validationConfig: {
        commandName: 'DEPLOY_ANTENNA',
        mustSucceed: true,
      },
      isCheckpoint: false,
      expectedDurationSeconds: 90,
      hint: 'Check the Commissioning panel (Secondary Systems tab) - Deploy antenna using button control.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'DEMO_COMPLETE_HUD',
    data: {
      stepOrder: 2,
      title: '📊 Telemetry Commands',
      instructions: 'Request telemetry data using dropdown to select packet type.',
      validationType: 'command_executed',
      validationConfig: {
        commandName: 'REQUEST_TELEMETRY',
        mustSucceed: true,
      },
      isCheckpoint: false,
      expectedDurationSeconds: 60,
      hint: 'Telemetry panel (Secondary tab) - Use dropdown to select packet type (health, orbit, or all).',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'DEMO_COMPLETE_HUD',
    data: {
      stepOrder: 3,
      title: '🛰️ Orbital Maneuvers',
      instructions: 'Execute an altitude adjustment using the slider control.',
      validationType: 'command_executed',
      validationConfig: {
        commandName: 'ADJUST_ALTITUDE',
        mustSucceed: true,
      },
      isCheckpoint: true,
      expectedDurationSeconds: 120,
      hint: 'Orbital panel (Primary tab) - Use slider to set target altitude, then execute.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'DEMO_COMPLETE_HUD',
    data: {
      stepOrder: 4,
      title: '🎯 Attitude Control',
      instructions: 'Point the satellite using the combo control (target + coordinates).',
      validationType: 'command_executed',
      validationConfig: {
        commandName: 'POINT_TO_TARGET',
        mustSucceed: true,
      },
      isCheckpoint: false,
      expectedDurationSeconds: 90,
      hint: 'Attitude panel (Primary tab) - Select pointing mode and enter coordinates if needed.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'DEMO_COMPLETE_HUD',
    data: {
      stepOrder: 5,
      title: '⚡ Power Management',
      instructions: 'Toggle battery charging mode on/off using the toggle control.',
      validationType: 'command_executed',
      validationConfig: {
        commandName: 'TOGGLE_BATTERY_CHARGE',
        mustSucceed: true,
      },
      isCheckpoint: false,
      expectedDurationSeconds: 60,
      hint: 'Power panel (Primary tab) - Use toggle switch to enable/disable battery charging.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'DEMO_COMPLETE_HUD',
    data: {
      stepOrder: 6,
      title: '🌡️ Thermal Control',
      instructions: 'Activate heaters to maintain temperature.',
      validationType: 'command_executed',
      validationConfig: {
        commandName: 'ACTIVATE_HEATER',
        mustSucceed: true,
      },
      isCheckpoint: false,
      expectedDurationSeconds: 60,
      hint: 'Thermal panel (Secondary tab) - Toggle heater on to maintain optimal temperature.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'DEMO_COMPLETE_HUD',
    data: {
      stepOrder: 7,
      title: '📡 Communications Setup',
      instructions: 'Configure data downlink using combo control (volume + priority).',
      validationType: 'command_executed',
      validationConfig: {
        commandName: 'SCHEDULE_DOWNLINK',
        mustSucceed: true,
      },
      isCheckpoint: true,
      expectedDurationSeconds: 90,
      hint: 'Communications panel (Primary tab) - Set data volume and priority level.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'DEMO_COMPLETE_HUD',
    data: {
      stepOrder: 8,
      title: '⚙️ System Commands',
      instructions: 'Execute system status check to verify all subsystems.',
      validationType: 'command_executed',
      validationConfig: {
        commandName: 'SYSTEM_HEALTH_CHECK',
        mustSucceed: true,
      },
      isCheckpoint: false,
      expectedDurationSeconds: 60,
      hint: 'System panel (Secondary tab) - Run complete system health diagnostic.',
      createdBy: CREATED_BY_UID,
    },
  },

  // COMMANDER_FULL_MISSION_301
  {
    scenarioCode: 'COMMANDER_FULL_MISSION_301',
    data: {
      stepOrder: 1,
      title: 'Complete Commissioning Phase',
      instructions: 'Perform initial satellite commissioning: beacon, ping, antenna deployment.',
      validationType: 'command_sequence',
      validationConfig: {
        commands: ['WAIT_FOR_BEACON', 'PING', 'DEPLOY_ANTENNA'],
        strictOrder: false,
        allMustSucceed: true,
      },
      isCheckpoint: true,
      expectedDurationSeconds: 600,
      hint: 'Follow standard commissioning procedures.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'COMMANDER_FULL_MISSION_301',
    data: {
      stepOrder: 2,
      title: 'Maintain Satellite Health',
      instructions: 'Keep all systems within nominal ranges for 30 minutes of mission time.',
      validationType: 'subsystem_status',
      validationConfig: {
        subsystems: ['power', 'thermal', 'attitude'],
        checkAllNominal: true,
        duration: 1800,
      },
      isCheckpoint: true,
      expectedDurationSeconds: 300,
      hint: 'Monitor all subsystems. Use time acceleration.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'COMMANDER_FULL_MISSION_301',
    data: {
      stepOrder: 3,
      title: 'Demonstrate Excellence',
      instructions: 'Complete mission with >90% command accuracy.',
      validationType: 'manual_confirmation',
      validationConfig: {
        requiresOperatorInput: true,
        performanceThreshold: 90,
      },
      isCheckpoint: false,
      expectedDurationSeconds: 60,
      hint: 'Execute commands carefully for high accuracy score.',
      createdBy: CREATED_BY_UID,
    },
  },
];

module.exports = steps;
