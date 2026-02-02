/**
 * Command Schemas
 * 
 * Zod validation schemas for user command CRUD operations
 * Commands are issued by operators during training sessions
 * 
 * Aligned with Phase 8/9 IMPLEMENTATION_PLAN:
 * - Consistent camelCase field naming (matching repository layer)
 * - Foreign key fields use snake_case (session_id, scenario_step_id)
 * - All required fields per Phase 8 spec included
 */

const { z } = require('zod');

// ---------- Command result status enum ----------
const RESULT_STATUS = ['OK', 'ERROR', 'NO_EFFECT'];

// ---------- Command registry (valid command names) ----------
const VALID_COMMAND_NAMES = [
  // Commissioning commands (Mission Control Enhancement - Phase 1)
  'PING',
  'UPDATETIME',
  'DEPLOY_ANTENNA',
  'WAIT_FOR_BEACON',
  
  // Data management commands (Mission Control Enhancement - Phase 1)
  'REQUEST_TELEMETRY',
  'SCHEDULE_DOWNLINK',
  
  // Advanced operations commands (Mission Control Enhancement - Phase 1)
  'CALIBRATE_SENSORS',
  'ENABLE_AUTONOMOUS',
  'DISABLE_AUTONOMOUS',
  
  // Orbit commands
  'SET_ORBIT_ALTITUDE',
  'SET_ORBIT_INCLINATION',
  'EXECUTE_ORBITAL_MANEUVER',
  'STATION_KEEPING',
  
  // Power commands
  'DEPLOY_SOLAR_ARRAYS',
  'RETRACT_SOLAR_ARRAYS',
  'SET_POWER_MODE',
  'ENABLE_BATTERY_CHARGING',
  'DISABLE_BATTERY_CHARGING',
  
  // Attitude commands
  'SET_ATTITUDE_MODE',
  'SET_POINTING_TARGET',
  'EXECUTE_ATTITUDE_MANEUVER',
  'CALIBRATE_GYROSCOPE',
  
  // Thermal commands
  'SET_THERMAL_MODE',
  'ENABLE_HEATER',
  'DISABLE_HEATER',
  'SET_THERMAL_SETPOINT',
  
  // Propulsion commands
  'ARM_PROPULSION',
  'DISARM_PROPULSION',
  'EXECUTE_BURN',
  'ABORT_BURN',
  
  // Communication commands
  'ENABLE_TRANSMITTER',
  'DISABLE_TRANSMITTER',
  'SET_ANTENNA_MODE',
  'UPLINK_DATA',
  'DOWNLINK_DATA',
  
  // System commands
  'SYSTEM_RESET',
  'SAFE_MODE',
  'NOMINAL_MODE',
  'RUN_DIAGNOSTICS'
];

// ---------- CREATE schema ----------
// Aligned with Phase 8 IMPLEMENTATION_PLAN fields

const createCommandSchema = z.object({
  body: z.object({
    // Session reference (nullable until sessions fully exist)
    session_id: z.string()
      .min(1, 'Session ID must not be empty if provided')
      .nullable()
      .optional()
      .describe('FK to user_scenario_sessions.id'),
    
    // Step reference (nullable until sessions fully exist)
    scenario_step_id: z.string()
      .min(1, 'Scenario step ID must not be empty if provided')
      .nullable()
      .optional()
      .describe('FK to scenario_steps.id'),
    
    // Timestamp when command was issued - camelCase for consistency with repository
    issuedAt: z.string()
      .datetime({ message: 'issuedAt must be a valid ISO datetime string' })
      .describe('When the command was issued (ISO datetime)'),
    
    // Command identification - camelCase for consistency with repository
    commandName: z.enum(VALID_COMMAND_NAMES, {
      errorMap: () => ({ message: `commandName must be one of: ${VALID_COMMAND_NAMES.join(', ')}` })
    }).describe('Command type from valid command registry'),
    
    // Command payload - camelCase for consistency with repository
    commandPayload: z.object({})
      .passthrough()
      .optional()
      .default({})
      .describe('Command parameters as JSON (structure varies by commandName)'),
    
    // Result fields - camelCase for consistency with repository
    resultStatus: z.enum(RESULT_STATUS, {
      errorMap: () => ({ message: `resultStatus must be one of: ${RESULT_STATUS.join(', ')}` })
    }).optional()
      .describe('Command execution result status'),
    
    resultMessage: z.string()
      .max(1000, 'resultMessage must be 1000 characters or fewer')
      .trim()
      .optional()
      .describe('Detailed result/error message'),
    
    // Validation flag - camelCase for consistency with repository
    isValid: z.boolean()
      .default(true)
      .describe('Whether command passed validation'),
    
  }).strict(),
}).strict();

// ---------- UPDATE (full replace) schema ----------

const updateCommandSchema = z.object({
  params: z.object({
    id: z.string()
      .min(1, 'Command ID is required')
      .describe('Command document ID'),
  }).strict(),
  body: createCommandSchema.shape.body,
}).strict();

// ---------- PATCH (partial update) schema ----------

const patchCommandSchema = z.object({
  params: z.object({
    id: z.string()
      .min(1, 'Command ID is required')
      .describe('Command document ID'),
  }).strict(),
  body: createCommandSchema.shape.body.partial().strict()
    .refine(
      (data) => Object.keys(data).length > 0,
      'At least one field must be provided for update'
    ),
}).strict();

// ---------- LIST (query parameters) schema ----------

const listCommandsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
    cursor: z.string().optional().describe('Cursor for pagination'),
    sortBy: z.enum(['issuedAt', 'createdAt', 'updatedAt', 'commandName', 'resultStatus']).optional().default('issuedAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    session_id: z.string().optional().describe('Filter by session ID'),
    scenario_step_id: z.string().optional().describe('Filter by scenario step ID'),
    commandName: z.string().optional().describe('Filter by command name'),
    resultStatus: z.enum(RESULT_STATUS).optional().describe('Filter by result status'),
    isValid: z.string().optional().transform(val => val === 'true').describe('Filter by validity'),
  }).strict(),
}).strict();

// ---------- EXECUTE command schema (submit + validate) ----------
// Used when operator issues a command during a session

const executeCommandSchema = z.object({
  body: z.object({
    session_id: z.string()
      .min(1, 'Session ID must not be empty if provided')
      .nullable()
      .optional()
      .describe('FK to user_scenario_sessions.id'),
    
    scenario_step_id: z.string()
      .min(1, 'Scenario step ID must not be empty if provided')
      .nullable()
      .optional()
      .describe('FK to scenario_steps.id'),
    
    command_name: z.enum(VALID_COMMAND_NAMES, {
      errorMap: () => ({ message: `command_name must be one of: ${VALID_COMMAND_NAMES.join(', ')}` })
    }).describe('Command type from valid command registry'),
    
    command_payload: z.object({})
      .passthrough()
      .optional()
      .default({})
      .describe('Command parameters as JSON'),
  }).strict(),
  query: z.object({}).strict(),
  params: z.object({}).strict()
}).strict();

// ---------- BATCH COMMANDS schema ----------
// For retrieving command history for a session

const sessionCommandsSchema = z.object({
  params: z.object({
    sessionId: z.string()
      .min(1, 'Session ID is required')
      .describe('Session ID to get commands for'),
  }).strict(),
  query: z.object({
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
    cursor: z.string().optional().describe('Cursor for pagination'),
  }).strict(),
}).strict();

module.exports = {
  createCommandSchema,
  updateCommandSchema,
  patchCommandSchema,
  listCommandsSchema,
  executeCommandSchema,
  sessionCommandsSchema,
  VALID_COMMAND_NAMES,
  RESULT_STATUS,
};
