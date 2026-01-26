/**
 * GroundCTRL Scenario Seed Data
 * 10 Training Scenarios with Satellites and Steps
 * All data belongs to user: 5usOQ3eOm7OjXmDOFjEmKSQovs42
 */

const CREATED_BY_UID = '5usOQ3eOm7OjXmDOFjEmKSQovs42';

// ============================================================================
// SATELLITES
// ============================================================================

const satellites = [
  {
    code: 'TRAINING_SAT_01',
    data: {
      name: 'TrainingSat-01 Alpha',
      description: 'Beginner training satellite for orbit fundamentals',
      orbit: {
        altitude_km: 408,
        inclination_degrees: 51.6,
      },
      power: {
        solarPower_watts: 100,
        batteryCapacity_wh: 50,
        baseDrawRate_watts: 20,
        currentCharge_percent: 85,
      },
      attitude: {
        currentTarget: 'NADIR',
        error_degrees: 0.5,
      },
      thermal: {
        currentTemp_celsius: 20,
        minSafe_celsius: -20,
        maxSafe_celsius: 50,
        heaterAvailable: true,
      },
      propulsion: {
        propellantRemaining_kg: 2.0,
        maxDeltaV_ms: 50,
      },
      payload: {
        type: 'Camera',
        isActive: false,
        powerDraw_watts: 15,
      },
      status: 'TRAINING',
      isPublic: true,
      capabilities: ['Basic attitude control', 'Power management', 'Thermal control'],
      designSource: 'ISS-inspired LEO trainer',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    code: 'TRAINING_SAT_02',
    data: {
      name: 'TrainingSat-02 Beta',
      description: 'Intermediate satellite with advanced power systems',
      orbit: {
        altitude_km: 550,
        inclination_degrees: 97.8,
      },
      power: {
        solarPower_watts: 150,
        batteryCapacity_wh: 100,
        baseDrawRate_watts: 30,
        currentCharge_percent: 75,
      },
      attitude: {
        currentTarget: 'SUN',
        error_degrees: 1.0,
      },
      thermal: {
        currentTemp_celsius: 15,
        minSafe_celsius: -30,
        maxSafe_celsius: 60,
        heaterAvailable: true,
      },
      propulsion: {
        propellantRemaining_kg: 5.0,
        maxDeltaV_ms: 100,
      },
      payload: {
        type: 'Spectrometer',
        isActive: false,
        powerDraw_watts: 25,
      },
      status: 'TRAINING',
      isPublic: true,
      capabilities: ['Advanced power management', 'Orbital maneuvers', 'Scientific instruments'],
      designSource: 'Polar orbit science satellite',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    code: 'TRAINING_SAT_03',
    data: {
      name: 'TrainingSat-03 Gamma',
      description: 'Advanced satellite for complex mission scenarios',
      orbit: {
        altitude_km: 35786,
        inclination_degrees: 0,
      },
      power: {
        solarPower_watts: 200,
        batteryCapacity_wh: 200,
        baseDrawRate_watts: 40,
        currentCharge_percent: 95,
      },
      attitude: {
        currentTarget: 'INERTIAL_EAST',
        error_degrees: 0.1,
      },
      thermal: {
        currentTemp_celsius: 25,
        minSafe_celsius: -40,
        maxSafe_celsius: 70,
        heaterAvailable: true,
      },
      propulsion: {
        propellantRemaining_kg: 10.0,
        maxDeltaV_ms: 200,
      },
      payload: {
        type: 'Communications Array',
        isActive: true,
        powerDraw_watts: 50,
      },
      status: 'TRAINING',
      isPublic: true,
      capabilities: ['Geostationary operations', 'High-power systems', 'Communications relay'],
      designSource: 'GEO communications satellite',
      createdBy: CREATED_BY_UID,
    },
  },
];

// ============================================================================
// SCENARIOS
// ============================================================================

const scenarios = [
  {
    code: 'ROOKIE_ORBIT_101',
    data: {
      satellite_code: 'TRAINING_SAT_01',
      title: 'Orbit Orientation Basics',
      description: 'Learn the fundamentals of orbital mechanics. Understand altitude, inclination, and how satellites maintain their position in space.',
      difficulty: 'BEGINNER',
      tier: 'ROOKIE_PILOT',
      type: 'GUIDED',
      estimatedDurationMinutes: 15,
      status: 'PUBLISHED',
      isActive: true,
      isCore: true,
      isPublic: true,
      initialState: {
        orbit: {
          altitude_km: 408,
          inclination_degrees: 51.6,
        },
        power: {
          currentCharge_percent: 85,
        },
        attitude: {
          currentTarget: 'NADIR',
          error_degrees: 0.5,
        },
      },
      consoleLayout: {
        panels: ['orbit', 'telemetry', 'map'],
        widgets: ['status', 'mission-objectives'],
      },
      tags: ['orbit', 'basics', 'fundamentals'],
      objectives: [
        'Understand orbital altitude',
        'Learn about inclination',
        'Read orbital parameters',
      ],
      prerequisites: [],
      createdBy: CREATED_BY_UID,
    },
  },
  {
    code: 'ROOKIE_POWER_101',
    data: {
      satellite_code: 'TRAINING_SAT_01',
      title: 'Power Management Fundamentals',
      description: 'Master satellite power systems. Learn to balance solar charging, battery management, and power consumption.',
      difficulty: 'BEGINNER',
      tier: 'ROOKIE_PILOT',
      type: 'GUIDED',
      estimatedDurationMinutes: 20,
      status: 'PUBLISHED',
      isActive: true,
      isCore: true,
      isPublic: true,
      initialState: {
        power: {
          currentCharge_percent: 60,
        },
      },
      consoleLayout: {
        panels: ['power', 'telemetry', 'commands'],
        widgets: ['power-graph', 'mission-objectives'],
      },
      tags: ['power', 'energy', 'basics'],
      objectives: [
        'Monitor battery levels',
        'Understand solar charging',
        'Manage power consumption',
      ],
      prerequisites: ['ROOKIE_ORBIT_101'],
      createdBy: CREATED_BY_UID,
    },
  },
  {
    code: 'ROOKIE_ATTITUDE_101',
    data: {
      satellite_code: 'TRAINING_SAT_01',
      title: 'Attitude Control Basics',
      description: 'Learn to control satellite orientation. Practice pointing the satellite at different targets and maintaining stable attitude.',
      difficulty: 'BEGINNER',
      tier: 'ROOKIE_PILOT',
      type: 'GUIDED',
      estimatedDurationMinutes: 25,
      status: 'PUBLISHED',
      isActive: true,
      isCore: true,
      isPublic: true,
      initialState: {
        attitude: {
          currentTarget: 'NADIR',
          error_degrees: 5.0,
        },
      },
      consoleLayout: {
        panels: ['attitude', 'telemetry', 'visualization'],
        widgets: ['attitude-indicator', 'mission-objectives'],
      },
      tags: ['attitude', 'orientation', 'control'],
      objectives: [
        'Point satellite to NADIR',
        'Reduce pointing error',
        'Maintain stable attitude',
      ],
      prerequisites: ['ROOKIE_ORBIT_101', 'ROOKIE_POWER_101'],
      createdBy: CREATED_BY_UID,
    },
  },
  {
    code: 'SPECIALIST_THERMAL_201',
    data: {
      satellite_code: 'TRAINING_SAT_02',
      title: 'Thermal Management',
      description: 'Advanced thermal control strategies. Learn to maintain optimal temperature ranges and use heaters effectively.',
      difficulty: 'INTERMEDIATE',
      tier: 'MISSION_SPECIALIST',
      type: 'GUIDED',
      estimatedDurationMinutes: 30,
      status: 'PUBLISHED',
      isActive: true,
      isCore: true,
      isPublic: true,
      initialState: {
        thermal: {
          currentTemp_celsius: -10,
        },
      },
      consoleLayout: {
        panels: ['thermal', 'power', 'telemetry'],
        widgets: ['temperature-graph', 'mission-objectives'],
      },
      tags: ['thermal', 'temperature', 'heater'],
      objectives: [
        'Bring temperature to safe range',
        'Use heaters efficiently',
        'Balance thermal and power',
      ],
      prerequisites: ['ROOKIE_POWER_101'],
      createdBy: CREATED_BY_UID,
    },
  },
  {
    code: 'SPECIALIST_MANEUVER_201',
    data: {
      satellite_code: 'TRAINING_SAT_02',
      title: 'Orbital Maneuvers',
      description: 'Execute your first orbital maneuvers. Learn about delta-v, propellant management, and changing orbital parameters.',
      difficulty: 'INTERMEDIATE',
      tier: 'MISSION_SPECIALIST',
      type: 'GUIDED',
      estimatedDurationMinutes: 35,
      status: 'PUBLISHED',
      isActive: true,
      isCore: true,
      isPublic: true,
      initialState: {
        orbit: {
          altitude_km: 550,
          inclination_degrees: 97.8,
        },
        propulsion: {
          propellantRemaining_kg: 5.0,
        },
      },
      consoleLayout: {
        panels: ['orbit', 'propulsion', 'telemetry', 'map'],
        widgets: ['delta-v-calculator', 'mission-objectives'],
      },
      tags: ['maneuver', 'propulsion', 'delta-v'],
      objectives: [
        'Execute altitude adjustment',
        'Monitor propellant usage',
        'Achieve target orbit',
      ],
      prerequisites: ['ROOKIE_ORBIT_101', 'ROOKIE_ATTITUDE_101'],
      createdBy: CREATED_BY_UID,
    },
  },
  {
    code: 'SPECIALIST_PAYLOAD_201',
    data: {
      satellite_code: 'TRAINING_SAT_02',
      title: 'Payload Operations',
      description: 'Operate scientific instruments and manage payload power. Learn to collect data while maintaining satellite health.',
      difficulty: 'INTERMEDIATE',
      tier: 'MISSION_SPECIALIST',
      type: 'GUIDED',
      estimatedDurationMinutes: 30,
      status: 'PUBLISHED',
      isActive: true,
      isCore: false,
      isPublic: true,
      initialState: {
        payload: {
          type: 'Spectrometer',
          isActive: false,
        },
        power: {
          currentCharge_percent: 80,
        },
      },
      consoleLayout: {
        panels: ['payload', 'power', 'telemetry'],
        widgets: ['payload-controls', 'data-collection', 'mission-objectives'],
      },
      tags: ['payload', 'science', 'instruments'],
      objectives: [
        'Activate payload safely',
        'Collect science data',
        'Manage power budget',
      ],
      prerequisites: ['ROOKIE_POWER_101', 'SPECIALIST_THERMAL_201'],
      createdBy: CREATED_BY_UID,
    },
  },
  {
    code: 'COMMANDER_EMERGENCY_301',
    data: {
      satellite_code: 'TRAINING_SAT_03',
      title: 'Emergency Response',
      description: 'Handle critical satellite emergencies. Practice troubleshooting, safe mode operations, and system recovery.',
      difficulty: 'ADVANCED',
      tier: 'MISSION_COMMANDER',
      type: 'GUIDED',
      estimatedDurationMinutes: 40,
      status: 'PUBLISHED',
      isActive: true,
      isCore: true,
      isPublic: true,
      initialState: {
        power: {
          currentCharge_percent: 15,
        },
        attitude: {
          error_degrees: 45.0,
        },
        thermal: {
          currentTemp_celsius: 65,
        },
      },
      consoleLayout: {
        panels: ['all'],
        widgets: ['alerts', 'diagnostics', 'mission-objectives'],
      },
      tags: ['emergency', 'troubleshooting', 'recovery'],
      objectives: [
        'Assess critical systems',
        'Enter safe mode',
        'Restore nominal operations',
      ],
      prerequisites: ['SPECIALIST_THERMAL_201', 'SPECIALIST_MANEUVER_201'],
      createdBy: CREATED_BY_UID,
    },
  },
  {
    code: 'COMMANDER_COMMS_301',
    data: {
      satellite_code: 'TRAINING_SAT_03',
      title: 'Communications Operations',
      description: 'Master geostationary communications satellite operations. Handle data relay, ground station passes, and signal management.',
      difficulty: 'ADVANCED',
      tier: 'MISSION_COMMANDER',
      type: 'GUIDED',
      estimatedDurationMinutes: 45,
      status: 'PUBLISHED',
      isActive: true,
      isCore: false,
      isPublic: true,
      initialState: {
        orbit: {
          altitude_km: 35786,
          inclination_degrees: 0,
        },
        payload: {
          type: 'Communications Array',
          isActive: true,
        },
      },
      consoleLayout: {
        panels: ['communications', 'payload', 'orbit', 'telemetry'],
        widgets: ['ground-stations', 'signal-strength', 'mission-objectives'],
      },
      tags: ['communications', 'GEO', 'relay'],
      objectives: [
        'Maintain geostationary orbit',
        'Handle ground station passes',
        'Optimize signal strength',
      ],
      prerequisites: ['SPECIALIST_MANEUVER_201', 'SPECIALIST_PAYLOAD_201'],
      createdBy: CREATED_BY_UID,
    },
  },
  {
    code: 'COMMANDER_MISSION_301',
    data: {
      satellite_code: 'TRAINING_SAT_03',
      title: 'Complete Mission Simulation',
      description: 'Execute a full mission from launch to end-of-life. Demonstrate mastery of all satellite operations.',
      difficulty: 'ADVANCED',
      tier: 'MISSION_COMMANDER',
      type: 'SANDBOX',
      estimatedDurationMinutes: 60,
      status: 'PUBLISHED',
      isActive: true,
      isCore: true,
      isPublic: true,
      initialState: {
        orbit: {
          altitude_km: 600,
          inclination_degrees: 98.0,
        },
        power: {
          currentCharge_percent: 95,
        },
      },
      consoleLayout: {
        panels: ['all'],
        widgets: ['all'],
      },
      tags: ['mission', 'comprehensive', 'sandbox'],
      objectives: [
        'Complete mission objectives',
        'Maintain satellite health',
        'Demonstrate operational excellence',
      ],
      prerequisites: ['COMMANDER_EMERGENCY_301', 'COMMANDER_COMMS_301'],
      createdBy: CREATED_BY_UID,
    },
  },
  {
    code: 'SANDBOX_FREEPLAY',
    data: {
      satellite_code: 'TRAINING_SAT_01',
      title: 'Free Play Sandbox',
      description: 'Experiment with satellite operations in a no-pressure environment. Perfect for learning and exploration.',
      difficulty: 'BEGINNER',
      tier: 'ROOKIE_PILOT',
      type: 'SANDBOX',
      estimatedDurationMinutes: 30,
      status: 'PUBLISHED',
      isActive: true,
      isCore: false,
      isPublic: true,
      initialState: {
        orbit: {
          altitude_km: 408,
          inclination_degrees: 51.6,
        },
        power: {
          currentCharge_percent: 100,
        },
      },
      consoleLayout: {
        panels: ['all'],
        widgets: ['all'],
      },
      tags: ['sandbox', 'freeplay', 'exploration'],
      objectives: [
        'Explore satellite controls',
        'Experiment with commands',
        'Learn at your own pace',
      ],
      prerequisites: [],
      createdBy: CREATED_BY_UID,
    },
  },
];

// ============================================================================
// SCENARIO STEPS
// ============================================================================

const steps = [
  // ROOKIE_ORBIT_101 steps
  {
    scenarioCode: 'ROOKIE_ORBIT_101',
    data: {
      stepOrder: 1,
      title: 'Identify Current Altitude',
      instructions: 'Look at the orbit telemetry panel and identify the satellite\'s current altitude above Earth.',
      objective: 'Correctly read the altitude_km value from the orbital parameters.',
      completionCondition: 'User acknowledges altitude reading (button click or similar)',
      isCheckpoint: false,
      expectedDurationSeconds: 60,
      hint_suggestion: 'Check the orbit panel on the left. The altitude is shown in kilometers.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'ROOKIE_ORBIT_101',
    data: {
      stepOrder: 2,
      title: 'Understand Inclination',
      instructions: 'Find the inclination value. This tells you the angle of the orbit relative to Earth\'s equator.',
      objective: 'Understand what inclination means for satellite coverage.',
      completionCondition: 'User completes quiz or acknowledges understanding',
      isCheckpoint: true,
      expectedDurationSeconds: 90,
      hint_suggestion: 'Inclination of 51.6° means the satellite crosses the equator at this angle.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'ROOKIE_ORBIT_101',
    data: {
      stepOrder: 3,
      title: 'Track Ground Position',
      instructions: 'Watch the ground track map to see how the satellite moves over Earth\'s surface.',
      objective: 'Observe one complete orbit cycle on the map.',
      completionCondition: 'Time elapsed >= 90 minutes (simulated) OR user confirms',
      isCheckpoint: false,
      expectedDurationSeconds: 120,
      hint_suggestion: 'The ground track shows the satellite\'s path over Earth. Watch it for a few minutes.',
      createdBy: CREATED_BY_UID,
    },
  },

  // ROOKIE_POWER_101 steps
  {
    scenarioCode: 'ROOKIE_POWER_101',
    data: {
      stepOrder: 1,
      title: 'Check Battery Level',
      instructions: 'Find the current battery charge percentage in the power subsystem panel.',
      objective: 'Identify current charge level and understand if it\'s in safe range.',
      completionCondition: 'User reads battery level correctly',
      isCheckpoint: false,
      expectedDurationSeconds: 45,
      hint_suggestion: 'Look at the power panel. Battery charge is shown as a percentage.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'ROOKIE_POWER_101',
    data: {
      stepOrder: 2,
      title: 'Monitor Solar Power',
      instructions: 'Observe how solar power generation changes as the satellite moves in and out of sunlight.',
      objective: 'Understand the relationship between orbital position and solar power.',
      completionCondition: 'User observes at least one eclipse cycle',
      isCheckpoint: true,
      expectedDurationSeconds: 180,
      hint_suggestion: 'Watch the solarPower_watts value. It drops to zero during eclipse.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'ROOKIE_POWER_101',
    data: {
      stepOrder: 3,
      title: 'Manage Power Budget',
      instructions: 'Calculate the power budget: solar input vs. consumption. Ensure battery is charging.',
      objective: 'Verify net power is positive and battery is charging.',
      completionCondition: 'Battery charge increases by at least 5%',
      isCheckpoint: false,
      expectedDurationSeconds: 120,
      hint_suggestion: 'Net power = solar power - consumption. Positive net power means charging.',
      createdBy: CREATED_BY_UID,
    },
  },

  // ROOKIE_ATTITUDE_101 steps
  {
    scenarioCode: 'ROOKIE_ATTITUDE_101',
    data: {
      stepOrder: 1,
      title: 'Check Current Attitude',
      instructions: 'Examine the attitude control panel to see which direction the satellite is pointing.',
      objective: 'Identify the current pointing target (NADIR, SUN, or INERTIAL_EAST).',
      completionCondition: 'User correctly identifies current target',
      isCheckpoint: false,
      expectedDurationSeconds: 45,
      hint_suggestion: 'The attitude panel shows currentTarget. NADIR means pointing at Earth.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'ROOKIE_ATTITUDE_101',
    data: {
      stepOrder: 2,
      title: 'Set Attitude Target',
      instructions: 'Use the attitude control command to change the satellite\'s pointing direction.',
      objective: 'Successfully command the satellite to point at a new target.',
      completionCondition: 'Attitude target command executed successfully',
      isCheckpoint: true,
      expectedDurationSeconds: 90,
      hint_suggestion: 'Use the SET_ATTITUDE_MODE command and choose your target direction.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'ROOKIE_ATTITUDE_101',
    data: {
      stepOrder: 3,
      title: 'Reduce Pointing Error',
      instructions: 'Monitor the error_degrees value. Wait for the attitude control system to stabilize.',
      objective: 'Achieve pointing error less than 2 degrees.',
      completionCondition: 'attitude.error_degrees <= 2.0',
      isCheckpoint: false,
      expectedDurationSeconds: 120,
      hint_suggestion: 'The satellite automatically adjusts. Watch error_degrees decrease over time.',
      createdBy: CREATED_BY_UID,
    },
  },

  // SPECIALIST_THERMAL_201 steps
  {
    scenarioCode: 'SPECIALIST_THERMAL_201',
    data: {
      stepOrder: 1,
      title: 'Assess Thermal Situation',
      instructions: 'Check the current temperature and compare it to safe operating ranges.',
      objective: 'Determine if temperature is outside safe range.',
      completionCondition: 'User identifies temperature is below minSafe_celsius',
      isCheckpoint: false,
      expectedDurationSeconds: 60,
      hint_suggestion: 'Current temperature is shown in the thermal panel. Compare to min/max safe values.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'SPECIALIST_THERMAL_201',
    data: {
      stepOrder: 2,
      title: 'Enable Heater',
      instructions: 'Activate the satellite heater to raise the temperature back to safe range.',
      objective: 'Successfully enable the heater subsystem.',
      completionCondition: 'ENABLE_HEATER command executed',
      isCheckpoint: true,
      expectedDurationSeconds: 90,
      hint_suggestion: 'Use the ENABLE_HEATER command. Check that heaterAvailable is true first.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'SPECIALIST_THERMAL_201',
    data: {
      stepOrder: 3,
      title: 'Monitor Temperature Rise',
      instructions: 'Watch the temperature increase. Disable heater once temperature reaches safe range.',
      objective: 'Bring temperature into safe range and disable heater.',
      completionCondition: 'Temperature >= minSafe_celsius AND heater disabled',
      isCheckpoint: false,
      expectedDurationSeconds: 180,
      hint_suggestion: 'Monitor currentTemp_celsius. Use DISABLE_HEATER when temp is safe.',
      createdBy: CREATED_BY_UID,
    },
  },

  // SPECIALIST_MANEUVER_201 steps
  {
    scenarioCode: 'SPECIALIST_MANEUVER_201',
    data: {
      stepOrder: 1,
      title: 'Plan Orbital Maneuver',
      instructions: 'Calculate the delta-v required to raise orbital altitude by 10 km.',
      objective: 'Understand the relationship between delta-v and altitude change.',
      completionCondition: 'User completes delta-v calculation or uses calculator tool',
      isCheckpoint: false,
      expectedDurationSeconds: 120,
      hint_suggestion: 'Use the delta-v calculator tool. For circular orbits, small altitude changes require modest delta-v.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'SPECIALIST_MANEUVER_201',
    data: {
      stepOrder: 2,
      title: 'Execute Burn',
      instructions: 'Arm the propulsion system and execute the planned maneuver.',
      objective: 'Successfully execute orbital burn.',
      completionCondition: 'EXECUTE_BURN command completed successfully',
      isCheckpoint: true,
      expectedDurationSeconds: 150,
      hint_suggestion: 'First ARM_PROPULSION, then EXECUTE_BURN with your calculated delta-v.',
      createdBy: CREATED_BY_UID,
    },
  },
  {
    scenarioCode: 'SPECIALIST_MANEUVER_201',
    data: {
      stepOrder: 3,
      title: 'Verify New Orbit',
      instructions: 'Check the orbital parameters to confirm the altitude change.',
      objective: 'Verify altitude increased by approximately 10 km.',
      completionCondition: 'New altitude is within 10±2 km of target',
      isCheckpoint: false,
      expectedDurationSeconds: 90,
      hint_suggestion: 'Check altitude_km in the orbit panel. It should be about 10 km higher.',
      createdBy: CREATED_BY_UID,
    },
  },
];

// ============================================================================
// COMMANDS (Reference Data)
// ============================================================================

const commands = [
  // Orbit Commands
  {
    name: 'SET_ORBIT_ALTITUDE',
    subsystem: 'orbit',
    description: 'Adjust the satellite orbital altitude',
    parameters: {
      target_altitude_km: { type: 'number', required: true, min: 160, max: 35786 },
    },
    estimatedDuration: 300,
    powerRequired: 50,
    fuelRequired: 2.0,
    difficultyLevel: 'INTERMEDIATE',
    createdBy: CREATED_BY_UID,
  },
  {
    name: 'EXECUTE_ORBITAL_MANEUVER',
    subsystem: 'orbit',
    description: 'Execute a planned orbital maneuver',
    parameters: {
      delta_v_ms: { type: 'number', required: true, min: 0, max: 500 },
      burn_direction: { type: 'string', required: true, enum: ['prograde', 'retrograde', 'normal', 'anti-normal'] },
    },
    estimatedDuration: 180,
    powerRequired: 100,
    fuelRequired: 5.0,
    difficultyLevel: 'ADVANCED',
    createdBy: CREATED_BY_UID,
  },

  // Power Commands
  {
    name: 'DEPLOY_SOLAR_ARRAYS',
    subsystem: 'power',
    description: 'Deploy solar panel arrays',
    parameters: {},
    estimatedDuration: 60,
    powerRequired: 10,
    fuelRequired: 0,
    difficultyLevel: 'BEGINNER',
    createdBy: CREATED_BY_UID,
  },
  {
    name: 'SET_POWER_MODE',
    subsystem: 'power',
    description: 'Change satellite power mode',
    parameters: {
      mode: { type: 'string', required: true, enum: ['nominal', 'low-power', 'emergency'] },
    },
    estimatedDuration: 30,
    powerRequired: 5,
    fuelRequired: 0,
    difficultyLevel: 'BEGINNER',
    createdBy: CREATED_BY_UID,
  },
  {
    name: 'ENABLE_BATTERY_CHARGING',
    subsystem: 'power',
    description: 'Enable battery charging from solar panels',
    parameters: {},
    estimatedDuration: 10,
    powerRequired: 0,
    fuelRequired: 0,
    difficultyLevel: 'BEGINNER',
    createdBy: CREATED_BY_UID,
  },

  // Attitude Commands
  {
    name: 'SET_ATTITUDE_MODE',
    subsystem: 'attitude',
    description: 'Set satellite attitude control mode',
    parameters: {
      mode: { type: 'string', required: true, enum: ['NADIR', 'SUN', 'INERTIAL_EAST'] },
    },
    estimatedDuration: 120,
    powerRequired: 25,
    fuelRequired: 0.5,
    difficultyLevel: 'BEGINNER',
    createdBy: CREATED_BY_UID,
  },
  {
    name: 'SET_POINTING_TARGET',
    subsystem: 'attitude',
    description: 'Point satellite at specific target',
    parameters: {
      target: { type: 'string', required: true },
      azimuth: { type: 'number', required: false, min: 0, max: 360 },
      elevation: { type: 'number', required: false, min: -90, max: 90 },
    },
    estimatedDuration: 90,
    powerRequired: 30,
    fuelRequired: 0.3,
    difficultyLevel: 'INTERMEDIATE',
    createdBy: CREATED_BY_UID,
  },

  // Thermal Commands
  {
    name: 'ENABLE_HEATER',
    subsystem: 'thermal',
    description: 'Enable thermal heater',
    parameters: {
      heater_id: { type: 'string', required: false },
    },
    estimatedDuration: 20,
    powerRequired: 50,
    fuelRequired: 0,
    difficultyLevel: 'BEGINNER',
    createdBy: CREATED_BY_UID,
  },
  {
    name: 'DISABLE_HEATER',
    subsystem: 'thermal',
    description: 'Disable thermal heater',
    parameters: {
      heater_id: { type: 'string', required: false },
    },
    estimatedDuration: 10,
    powerRequired: 0,
    fuelRequired: 0,
    difficultyLevel: 'BEGINNER',
    createdBy: CREATED_BY_UID,
  },
  {
    name: 'SET_THERMAL_MODE',
    subsystem: 'thermal',
    description: 'Set thermal control mode',
    parameters: {
      mode: { type: 'string', required: true, enum: ['auto', 'manual', 'safe'] },
    },
    estimatedDuration: 30,
    powerRequired: 10,
    fuelRequired: 0,
    difficultyLevel: 'INTERMEDIATE',
    createdBy: CREATED_BY_UID,
  },

  // Propulsion Commands
  {
    name: 'ARM_PROPULSION',
    subsystem: 'propulsion',
    description: 'Arm propulsion system for maneuver',
    parameters: {},
    estimatedDuration: 60,
    powerRequired: 20,
    fuelRequired: 0,
    difficultyLevel: 'INTERMEDIATE',
    createdBy: CREATED_BY_UID,
  },
  {
    name: 'DISARM_PROPULSION',
    subsystem: 'propulsion',
    description: 'Disarm propulsion system',
    parameters: {},
    estimatedDuration: 30,
    powerRequired: 5,
    fuelRequired: 0,
    difficultyLevel: 'BEGINNER',
    createdBy: CREATED_BY_UID,
  },
  {
    name: 'EXECUTE_BURN',
    subsystem: 'propulsion',
    description: 'Execute propulsion burn',
    parameters: {
      duration_seconds: { type: 'number', required: true, min: 1, max: 600 },
      thrust_percent: { type: 'number', required: false, min: 0, max: 100 },
    },
    estimatedDuration: 0, // Duration is variable
    powerRequired: 150,
    fuelRequired: 0, // Calculated based on duration
    difficultyLevel: 'ADVANCED',
    createdBy: CREATED_BY_UID,
  },

  // Communication Commands
  {
    name: 'ENABLE_TRANSMITTER',
    subsystem: 'communications',
    description: 'Enable satellite transmitter',
    parameters: {
      frequency: { type: 'number', required: false },
    },
    estimatedDuration: 30,
    powerRequired: 40,
    fuelRequired: 0,
    difficultyLevel: 'BEGINNER',
    createdBy: CREATED_BY_UID,
  },
  {
    name: 'DISABLE_TRANSMITTER',
    subsystem: 'communications',
    description: 'Disable satellite transmitter',
    parameters: {},
    estimatedDuration: 15,
    powerRequired: 0,
    fuelRequired: 0,
    difficultyLevel: 'BEGINNER',
    createdBy: CREATED_BY_UID,
  },
  {
    name: 'SET_ANTENNA_MODE',
    subsystem: 'communications',
    description: 'Configure antenna mode',
    parameters: {
      mode: { type: 'string', required: true, enum: ['low-gain', 'high-gain', 'omni'] },
    },
    estimatedDuration: 45,
    powerRequired: 20,
    fuelRequired: 0,
    difficultyLevel: 'INTERMEDIATE',
    createdBy: CREATED_BY_UID,
  },
  {
    name: 'DOWNLINK_DATA',
    subsystem: 'communications',
    description: 'Initiate data downlink to ground station',
    parameters: {
      data_volume_mb: { type: 'number', required: true, min: 1, max: 1000 },
    },
    estimatedDuration: 120,
    powerRequired: 60,
    fuelRequired: 0,
    difficultyLevel: 'INTERMEDIATE',
    createdBy: CREATED_BY_UID,
  },

  // System Commands
  {
    name: 'SYSTEM_RESET',
    subsystem: 'system',
    description: 'Perform system reset',
    parameters: {
      reset_type: { type: 'string', required: false, enum: ['soft', 'hard'] },
    },
    estimatedDuration: 180,
    powerRequired: 30,
    fuelRequired: 0,
    difficultyLevel: 'ADVANCED',
    createdBy: CREATED_BY_UID,
  },
  {
    name: 'SAFE_MODE',
    subsystem: 'system',
    description: 'Enter safe mode',
    parameters: {},
    estimatedDuration: 60,
    powerRequired: 10,
    fuelRequired: 0,
    difficultyLevel: 'INTERMEDIATE',
    createdBy: CREATED_BY_UID,
  },
  {
    name: 'NOMINAL_MODE',
    subsystem: 'system',
    description: 'Return to nominal operations mode',
    parameters: {},
    estimatedDuration: 90,
    powerRequired: 20,
    fuelRequired: 0,
    difficultyLevel: 'INTERMEDIATE',
    createdBy: CREATED_BY_UID,
  },
  {
    name: 'RUN_DIAGNOSTICS',
    subsystem: 'system',
    description: 'Run system diagnostics',
    parameters: {
      subsystem: { type: 'string', required: false },
    },
    estimatedDuration: 120,
    powerRequired: 15,
    fuelRequired: 0,
    difficultyLevel: 'BEGINNER',
    createdBy: CREATED_BY_UID,
  },
];

module.exports = {
  satellites,
  scenarios,
  steps,
  commands,
};
