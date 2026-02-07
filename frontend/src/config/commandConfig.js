/**
 * Command Configuration
 * Maps backend commands to appropriate UI component types
 * Based on parameter structure from backend/seeders/data/commands.js
 */

export const COMMAND_COMPONENTS = {
  // ===== BUTTON COMMANDS (No parameters) =====
  PING: { type: 'button', icon: '📡' },
  DEPLOY_ANTENNA: { type: 'button', icon: '📡' },
  DEPLOY_SOLAR_ARRAYS: { type: 'button', icon: '☀️' },
  ARM_PROPULSION: { type: 'button', icon: '🚀' },
  DISARM_PROPULSION: { type: 'button', icon: '🔒' },
  ENABLE_AUTONOMOUS: { type: 'button', icon: '🤖' },
  DISABLE_AUTONOMOUS: { type: 'button', icon: '👤' },
  SAFE_MODE: { type: 'button', icon: '🛡️' },
  NOMINAL_MODE: { type: 'button', icon: '✅' },
  DISABLE_TRANSMITTER: { type: 'button', icon: '📴' },

  // ===== SLIDER COMMANDS (Numeric ranges) =====
  SET_ORBIT_ALTITUDE: {
    type: 'slider',
    parameter: 'target_altitude_km',
    min: 160,
    max: 35786,
    step: 10,
    defaultValue: 400,
    unit: 'km',
    icon: '🛰️'
  },
  WAIT_FOR_BEACON: {
    type: 'slider',
    parameter: 'timeout_seconds',
    min: 60,
    max: 3600,
    step: 30,
    defaultValue: 300,
    unit: 's',
    icon: '⏱️'
  },
  DOWNLINK_DATA: {
    type: 'slider',
    parameter: 'data_volume_mb',
    min: 1,
    max: 1000,
    step: 10,
    defaultValue: 100,
    unit: 'MB',
    icon: '📥'
  },

  // ===== DROPDOWN COMMANDS (Enum selections) =====
  REQUEST_TELEMETRY: {
    type: 'dropdown',
    parameter: 'packet_type',
    options: ['health', 'orbit', 'attitude', 'power', 'thermal', 'all'],
    defaultValue: 'all',
    icon: '📊'
  },
  SET_POWER_MODE: {
    type: 'dropdown',
    parameter: 'mode',
    options: ['nominal', 'low-power', 'emergency'],
    defaultValue: 'nominal',
    icon: '⚡'
  },
  SET_ATTITUDE_MODE: {
    type: 'dropdown',
    parameter: 'mode',
    options: ['NADIR', 'SUN', 'INERTIAL_EAST'],
    defaultValue: 'NADIR',
    icon: '🧭'
  },
  SET_ANTENNA_MODE: {
    type: 'dropdown',
    parameter: 'mode',
    options: ['low-gain', 'high-gain', 'omni'],
    defaultValue: 'low-gain',
    icon: '📡'
  },
  SET_THERMAL_MODE: {
    type: 'dropdown',
    parameter: 'mode',
    options: ['auto', 'manual', 'safe'],
    defaultValue: 'auto',
    icon: '🌡️'
  },
  CALIBRATE_SENSORS: {
    type: 'dropdown',
    parameter: 'sensor_type',
    options: ['gyro', 'magnetometer', 'sun_sensor', 'star_tracker', 'all'],
    defaultValue: 'all',
    icon: '🎯'
  },
  SYSTEM_RESET: {
    type: 'dropdown',
    parameter: 'reset_type',
    options: ['soft', 'hard'],
    defaultValue: 'soft',
    icon: '🔄'
  },

  // ===== TOGGLE COMMANDS (Binary enable/disable) =====
  ENABLE_BATTERY_CHARGING: {
    type: 'toggle',
    label: 'Battery Charging',
    icon: '🔋'
  },
  ENABLE_TRANSMITTER: {
    type: 'toggle',
    label: 'Transmitter',
    icon: '📶'
  },
  ENABLE_HEATER: {
    type: 'toggle',
    label: 'Thermal Heater',
    icon: '🔥'
  },

  // ===== COMBO COMMANDS (Multiple parameters) =====
  EXECUTE_ORBITAL_MANEUVER: {
    type: 'combo',
    parameters: [
      {
        name: 'delta_v_ms',
        type: 'slider',
        label: 'Delta-V',
        min: 0,
        max: 500,
        step: 1,
        defaultValue: 150,
        unit: 'm/s'
      },
      {
        name: 'burn_direction',
        type: 'dropdown',
        label: 'Direction',
        options: ['prograde', 'retrograde', 'normal', 'anti-normal'],
        defaultValue: 'prograde'
      }
    ],
    icon: '🚀'
  },
  EXECUTE_BURN: {
    type: 'combo',
    parameters: [
      {
        name: 'duration_seconds',
        type: 'slider',
        label: 'Duration',
        min: 1,
        max: 600,
        step: 1,
        defaultValue: 60,
        unit: 's'
      },
      {
        name: 'thrust_percent',
        type: 'slider',
        label: 'Thrust',
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 100,
        unit: '%'
      }
    ],
    icon: '🔥'
  },
  SET_POINTING_TARGET: {
    type: 'combo',
    parameters: [
      {
        name: 'target',
        type: 'text',
        label: 'Target Name',
        placeholder: 'e.g., Earth, Moon, Sun'
      },
      {
        name: 'azimuth',
        type: 'slider',
        label: 'Azimuth',
        min: 0,
        max: 360,
        step: 1,
        defaultValue: 0,
        unit: '°'
      },
      {
        name: 'elevation',
        type: 'slider',
        label: 'Elevation',
        min: -90,
        max: 90,
        step: 1,
        defaultValue: 0,
        unit: '°'
      }
    ],
    icon: '🎯'
  },
  SCHEDULE_DOWNLINK: {
    type: 'combo',
    parameters: [
      {
        name: 'data_volume_mb',
        type: 'slider',
        label: 'Data Volume',
        min: 1,
        max: 1000,
        step: 10,
        defaultValue: 100,
        unit: 'MB'
      },
      {
        name: 'priority',
        type: 'dropdown',
        label: 'Priority',
        options: ['low', 'normal', 'high'],
        defaultValue: 'normal'
      }
    ],
    icon: '📡'
  },
  UPDATETIME: {
    type: 'combo',
    parameters: [
      {
        name: 'timestamp',
        type: 'number',
        label: 'Timestamp (ms)',
        defaultValue: Date.now()
      }
    ],
    icon: '🕐'
  },
  RUN_DIAGNOSTICS: {
    type: 'combo',
    parameters: [
      {
        name: 'subsystem',
        type: 'dropdown',
        label: 'Subsystem',
        options: ['all', 'power', 'attitude', 'propulsion', 'communications', 'thermal'],
        defaultValue: 'all'
      }
    ],
    icon: '🔍'
  }
};

// Subsystem groupings
export const COMMAND_GROUPS = {
  commissioning: {
    title: '🚀 Commissioning',
    description: 'Initial satellite setup and verification',
    commands: ['PING', 'UPDATETIME', 'DEPLOY_ANTENNA', 'WAIT_FOR_BEACON']
  },
  telemetry: {
    title: '📊 Telemetry & Data',
    description: 'Data management and telemetry requests',
    commands: ['REQUEST_TELEMETRY', 'SCHEDULE_DOWNLINK', 'DOWNLINK_DATA']
  },
  orbital: {
    title: '🛰️ Orbital Maneuvers',
    description: 'Orbit control and propulsion',
    commands: ['SET_ORBIT_ALTITUDE', 'EXECUTE_ORBITAL_MANEUVER', 'ARM_PROPULSION', 'DISARM_PROPULSION', 'EXECUTE_BURN']
  },
  attitude: {
    title: '🧭 Attitude Control',
    description: 'Satellite pointing and orientation',
    commands: ['SET_ATTITUDE_MODE', 'SET_POINTING_TARGET', 'CALIBRATE_SENSORS']
  },
  power: {
    title: '⚡ Power Management',
    description: 'Energy and battery control',
    commands: ['DEPLOY_SOLAR_ARRAYS', 'SET_POWER_MODE', 'ENABLE_BATTERY_CHARGING']
  },
  thermal: {
    title: '🌡️ Thermal Control',
    description: 'Temperature management',
    commands: ['ENABLE_HEATER', 'DISABLE_HEATER', 'SET_THERMAL_MODE']
  },
  communications: {
    title: '📡 Communications',
    description: 'Radio and antenna control',
    commands: ['ENABLE_TRANSMITTER', 'DISABLE_TRANSMITTER', 'SET_ANTENNA_MODE']
  },
  system: {
    title: '🖥️ System Operations',
    description: 'System modes and diagnostics',
    commands: ['ENABLE_AUTONOMOUS', 'DISABLE_AUTONOMOUS', 'SAFE_MODE', 'NOMINAL_MODE', 'SYSTEM_RESET', 'RUN_DIAGNOSTICS']
  }
};

// Get component configuration for a command
export function getCommandConfig(commandName) {
  return COMMAND_COMPONENTS[commandName] || { type: 'button' };
}

// Get all commands in a group
export function getCommandsByGroup(groupName) {
  const group = COMMAND_GROUPS[groupName];
  return group ? group.commands : [];
}

// Get subsystem for a command name
export function getCommandSubsystem(commandName) {
  for (const [groupName, group] of Object.entries(COMMAND_GROUPS)) {
    if (group.commands.includes(commandName)) {
      return groupName;
    }
  }
  return 'system';
}
