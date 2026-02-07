/**
 * Scenario Seed Data
 * Training scenarios with time control and validation settings
 */

const CREATED_BY_UID = '5usOQ3eOm7OjXmDOFjEmKSQovs42';

const scenarios = [
  {
    code: 'ROOKIE_COMMISSIONING_101',
    data: {
      satellite_code: 'TRAINING_SAT_01',
      title: 'First Contact: Satellite Commissioning',
      description: 'Learn to establish contact with your satellite for the first time. Wait for beacons, ping the satellite, and deploy critical systems.',
      difficulty: 'BEGINNER',
      tier: 'ROOKIE_PILOT',
      type: 'GUIDED',
      estimatedDurationMinutes: 20,
      status: 'PUBLISHED',
      isActive: true,
      isCore: true,
      isPublic: true,
      
      timeControl: {
        initialScale: 'real_time',
        allowedScales: ['real_time', '2x', '5x'],
        autoAccelerate: false,
      },
      
      initialState: {
        missionElapsedTime: 0,
        communications: {
          antennaDeployed: false,
          beaconCount: 0,
        },
      },
      
      tags: ['commissioning', 'first_contact', 'beacon', 'basics'],
      objectives: [
        'Wait for first beacon signal',
        'Establish communications link (PING)',
        'Deploy antenna',
        'Verify two-way communications',
      ],
      prerequisites: [],
      createdBy: CREATED_BY_UID,
    },
  },
  
  {
    code: 'ROOKIE_ORBIT_101',
    data: {
      satellite_code: 'TRAINING_SAT_01',
      title: 'Understanding Your Orbit',
      description: 'Master orbital mechanics fundamentals. Learn about altitude, inclination, ground tracks, and orbital periods.',
      difficulty: 'BEGINNER',
      tier: 'ROOKIE_PILOT',
      type: 'GUIDED',
      estimatedDurationMinutes: 15,
      status: 'PUBLISHED',
      isActive: true,
      isCore: true,
      isPublic: true,
      
      timeControl: {
        initialScale: '10x',
        allowedScales: ['real_time', '2x', '5x', '10x', '30x'],
        autoAccelerate: true,
      },
      
      tags: ['orbit', 'basics', 'fundamentals'],
      objectives: [
        'Understand orbital altitude',
        'Learn about inclination',
        'Track ground position',
        'Observe one complete orbit',
      ],
      prerequisites: ['ROOKIE_COMMISSIONING_101'],
      createdBy: CREATED_BY_UID,
    },
  },
  
  {
    code: 'ROOKIE_POWER_101',
    data: {
      satellite_code: 'TRAINING_SAT_01',
      title: 'Power Management Fundamentals',
      description: 'Master satellite power systems. Balance solar charging, battery management, and power consumption through day/night cycles.',
      difficulty: 'BEGINNER',
      tier: 'ROOKIE_PILOT',
      type: 'GUIDED',
      estimatedDurationMinutes: 25,
      status: 'PUBLISHED',
      isActive: true,
      isCore: true,
      isPublic: true,
      
      timeControl: {
        initialScale: '30x',
        allowedScales: ['10x', '30x', '60x'],
        autoAccelerate: true,
      },
      
      initialState: {
        power: {
          currentCharge_percent: 60,
        },
      },
      
      tags: ['power', 'energy', 'eclipse', 'basics'],
      objectives: [
        'Monitor battery levels',
        'Understand solar charging',
        'Survive an eclipse period',
        'Manage power consumption',
      ],
      prerequisites: ['ROOKIE_ORBIT_101'],
      createdBy: CREATED_BY_UID,
    },
  },
  
  {
    code: 'SPECIALIST_GROUND_STATION_201',
    data: {
      satellite_code: 'TRAINING_SAT_02',
      title: 'Ground Station Communications',
      description: 'Master ground station passes. Learn to predict visibility windows, schedule downlinks, and manage data transmission.',
      difficulty: 'INTERMEDIATE',
      tier: 'MISSION_SPECIALIST',
      type: 'GUIDED',
      estimatedDurationMinutes: 30,
      status: 'PUBLISHED',
      isActive: true,
      isCore: true,
      isPublic: true,
      
      timeControl: {
        initialScale: '60x',
        allowedScales: ['30x', '60x', '100x'],
        autoAccelerate: true,
      },
      
      tags: ['ground_station', 'communications', 'downlink', 'visibility'],
      objectives: [
        'Identify next ground station pass',
        'Schedule data downlink',
        'Complete successful data transmission',
        'Verify ground station visibility',
      ],
      prerequisites: ['ROOKIE_POWER_101', 'ROOKIE_COMMISSIONING_101'],
      createdBy: CREATED_BY_UID,
    },
  },
  
  {
    code: 'SPECIALIST_MANEUVER_201',
    data: {
      satellite_code: 'TRAINING_SAT_02',
      title: 'Orbital Maneuvers',
      description: 'Execute your first orbital maneuvers. Learn about delta-v, propellant management, and changing orbital parameters safely.',
      difficulty: 'INTERMEDIATE',
      tier: 'MISSION_SPECIALIST',
      type: 'GUIDED',
      estimatedDurationMinutes: 35,
      status: 'PUBLISHED',
      isActive: true,
      isCore: true,
      isPublic: true,
      
      timeControl: {
        initialScale: '10x',
        allowedScales: ['real_time', '2x', '5x', '10x'],
        autoAccelerate: false,
      },
      
      tags: ['maneuver', 'propulsion', 'delta-v', 'orbit_change'],
      objectives: [
        'Plan orbital maneuver',
        'Execute altitude adjustment',
        'Monitor propellant usage',
        'Achieve target orbit',
      ],
      prerequisites: ['ROOKIE_ORBIT_101'],
      createdBy: CREATED_BY_UID,
    },
  },
  
  {
    code: 'COMMANDER_EMERGENCY_301',
    data: {
      satellite_code: 'TRAINING_SAT_03',
      title: 'Emergency Response Procedures',
      description: 'Handle critical satellite emergencies. Practice troubleshooting, safe mode operations, and system recovery under pressure.',
      difficulty: 'ADVANCED',
      tier: 'MISSION_COMMANDER',
      type: 'GUIDED',
      estimatedDurationMinutes: 40,
      status: 'PUBLISHED',
      isActive: true,
      isCore: true,
      isPublic: true,
      
      timeControl: {
        initialScale: 'real_time',
        allowedScales: ['real_time', '2x'],
        autoAccelerate: false,
      },
      
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
      
      tags: ['emergency', 'troubleshooting', 'recovery', 'safe_mode'],
      objectives: [
        'Assess critical systems',
        'Enter safe mode',
        'Stabilize satellite',
        'Restore nominal operations',
      ],
      prerequisites: ['SPECIALIST_GROUND_STATION_201', 'SPECIALIST_MANEUVER_201'],
      createdBy: CREATED_BY_UID,
    },
  },
  
  {
    code: 'COMMANDER_FULL_MISSION_301',
    data: {
      satellite_code: 'TRAINING_SAT_03',
      title: 'Complete Mission Simulation',
      description: 'Execute a full mission from commissioning to operations. Demonstrate mastery of all satellite operations in a comprehensive scenario.',
      difficulty: 'ADVANCED',
      tier: 'MISSION_COMMANDER',
      type: 'SANDBOX',
      estimatedDurationMinutes: 60,
      status: 'PUBLISHED',
      isActive: true,
      isCore: true,
      isPublic: true,
      
      timeControl: {
        initialScale: '30x',
        allowedScales: ['real_time', '2x', '5x', '10x', '30x', '60x', '100x'],
        autoAccelerate: true,
      },
      
      tags: ['mission', 'comprehensive', 'sandbox', 'mastery'],
      objectives: [
        'Complete commissioning phase',
        'Execute mission objectives',
        'Maintain satellite health',
        'Demonstrate operational excellence',
      ],
      prerequisites: ['COMMANDER_EMERGENCY_301'],
      createdBy: CREATED_BY_UID,
    },
  },
  
  {
    code: 'DEMO_COMPLETE_HUD',
    data: {
      satellite_code: 'TRAINING_SAT_02',
      title: '🎮 Complete HUD Demonstration',
      description: 'Comprehensive demonstration mission showcasing all command types and subsystems. Perfect for exploring the complete unified command interface.',
      difficulty: 'INTERMEDIATE',
      tier: 'MISSION_SPECIALIST',
      type: 'GUIDED',
      estimatedDurationMinutes: 45,
      status: 'PUBLISHED',
      isActive: true,
      isCore: false,
      isPublic: true,
      
      timeControl: {
        initialScale: '10x',
        allowedScales: ['real_time', '2x', '5x', '10x', '30x', '60x'],
        autoAccelerate: true,
      },
      
      initialState: {
        missionElapsedTime: 0,
        communications: {
          antennaDeployed: true,
          beaconCount: 5,
        },
        power: {
          currentCharge_percent: 85,
        },
      },
      
      tags: ['demo', 'comprehensive', 'all_systems', 'training'],
      objectives: [
        'Commissioning: Deploy antenna and establish communications',
        'Telemetry: Request and analyze satellite health data',
        'Orbital: Execute altitude adjustment maneuver',
        'Attitude: Point satellite to specific target',
        'Power: Manage battery and solar systems',
        'Thermal: Activate heaters for temperature control',
        'Communications: Configure and test data downlink',
        'System: Monitor overall satellite status',
      ],
      prerequisites: [],
      createdBy: CREATED_BY_UID,
    },
  },
  
  {
    code: 'SANDBOX_FREEPLAY',
    data: {
      satellite_code: 'TRAINING_SAT_01',
      title: 'Free Play Sandbox',
      description: 'Experiment with satellite operations in a no-pressure environment. Perfect for learning and exploration at your own pace.',
      difficulty: 'BEGINNER',
      tier: 'ROOKIE_PILOT',
      type: 'SANDBOX',
      estimatedDurationMinutes: 30,
      status: 'PUBLISHED',
      isActive: true,
      isCore: false,
      isPublic: true,
      
      timeControl: {
        initialScale: '10x',
        allowedScales: ['real_time', '2x', '5x', '10x', '30x', '60x', '100x', '1000x'],
        autoAccelerate: false,
      },
      
      tags: ['sandbox', 'freeplay', 'exploration', 'practice'],
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

module.exports = scenarios;
