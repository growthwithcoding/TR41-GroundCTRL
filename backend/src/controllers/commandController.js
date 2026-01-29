/**
 * Command Controller
 * 
 * Generates CRUD handlers using the crudFactory pattern
 * Provides command submission, validation, and result storage for NOVA tutoring
 */

const commandRepository = require('../repositories/commandRepository');
const { createCrudHandlers } = require('../factories/crudFactory');
const responseFactory = require('../factories/responseFactory');
const logger = require('../utils/logger');
const httpStatus = require('../constants/httpStatus');
const {
  createCommandSchema,
  updateCommandSchema,
  patchCommandSchema,
  executeCommandSchema,
  VALID_COMMAND_NAMES
} = require('../schemas/commandSchemas');

const hooks = {
  /**
   * Ownership scoping hook
   * Non-admins can only see commands they created
   */
  ownershipScope: async (req, operation, options) => {
    if (req.user?.isAdmin) {
      return options;
    }
    return { ...options, createdBy: req.user?.uid };
  },

  beforeCreate: async (req, data) => {
    logger.debug('Command pre-create validation', {
      commandName: data.commandName,
      userId: req.user?.uid
    });
  },

  afterCreate: async (req, doc) => {
    logger.info('Command created', {
      commandId: doc.id,
      commandName: doc.commandName,
      userId: req.user?.uid
    });
  },

  auditMetadata: async (req, _operation, _result) => {
    return {
      source: 'api',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };
  }
};

const handlers = createCrudHandlers(
  commandRepository,
  'command',
  {
    create: createCommandSchema.shape.body,
    update: updateCommandSchema.shape.body,
    patch: patchCommandSchema.shape.body
  },
  hooks
);

/**
 * Execute command - validates and stores with result
 * POST /api/v1/commands/execute
 */
async function execute(req, res, next) {
  try {
    // Validate request body using execute schema
    const parseResult = executeCommandSchema.shape.body.safeParse(req.body);
    if (!parseResult.success) {
      const response = responseFactory.createErrorResponse(
        {
          statusCode: httpStatus.BAD_REQUEST,
          code: 'VALIDATION_ERROR',
          message: 'Invalid command payload',
          details: parseResult.error.errors
        },
        {
          callSign: req.user?.callSign || 'UNKNOWN',
          requestId: req.id
        }
      );
      return res.status(httpStatus.BAD_REQUEST).json(response);
    }

    const { command_name, command_payload, session_id, scenario_step_id } = parseResult.data;

    // Validate command name is in registry
    const isValid = VALID_COMMAND_NAMES.includes(command_name);
    
    // Simulate command execution (placeholder for actual satellite system integration)
    const executionResult = simulateCommandExecution(command_name, command_payload);

    // Store command with result
    const commandData = {
      session_id: session_id || null,
      scenario_step_id: scenario_step_id || null,
      commandName: command_name,
      commandPayload: command_payload,
      resultStatus: executionResult.status,
      resultMessage: executionResult.message,
      isValid,
      issuedAt: new Date().toISOString()
    };

    const metadata = {
      createdBy: req.user?.uid,
      createdByCallSign: req.user?.callSign
    };

    const savedCommand = await commandRepository.create(commandData, metadata);

    const response = responseFactory.createSuccessResponse(
      {
        command: savedCommand,
        execution: executionResult
      },
      {
        callSign: req.user?.callSign || 'UNKNOWN',
        requestId: req.id
      }
    );

    res.status(httpStatus.CREATED).json(response);

  } catch (error) {
    logger.error('Command execution failed', {
      error: error.message,
      userId: req.user?.uid
    });
    next(error);
  }
}

/**
 * Get command history for current user
 * GET /api/v1/commands/history
 */
async function getHistory(req, res, next) {
  try {
    const userId = req.user?.uid;
    const limit = parseInt(req.query.limit, 10) || 20;

    const commands = await commandRepository.getRecentByUser(userId, limit);

    const response = responseFactory.createSuccessResponse(
      {
        commands,
        total: commands.length
      },
      {
        callSign: req.user?.callSign || 'UNKNOWN',
        requestId: req.id
      }
    );

    res.status(httpStatus.OK).json(response);

  } catch (error) {
    logger.error('Failed to fetch command history', {
      error: error.message,
      userId: req.user?.uid
    });
    next(error);
  }
}

/**
 * Get commands by session (for NOVA context building)
 * GET /api/v1/commands/session/:sessionId
 */
async function getBySession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 50;

    const commands = await commandRepository.getBySessionId(sessionId, { limit });

    const response = responseFactory.createSuccessResponse(
      {
        commands,
        total: commands.length,
        session_id: sessionId
      },
      {
        callSign: req.user?.callSign || 'UNKNOWN',
        requestId: req.id
      }
    );

    res.status(httpStatus.OK).json(response);

  } catch (error) {
    logger.error('Failed to fetch commands by session', {
      error: error.message,
      sessionId: req.params.sessionId
    });
    next(error);
  }
}

/**
 * Get valid command registry
 * GET /api/v1/commands/registry
 */
async function getRegistry(req, res) {
  const commandRegistry = {
    orbit: [
      'SET_ORBIT_ALTITUDE',
      'SET_ORBIT_INCLINATION',
      'EXECUTE_ORBITAL_MANEUVER',
      'STATION_KEEPING'
    ],
    power: [
      'DEPLOY_SOLAR_ARRAYS',
      'RETRACT_SOLAR_ARRAYS',
      'SET_POWER_MODE',
      'ENABLE_BATTERY_CHARGING',
      'DISABLE_BATTERY_CHARGING'
    ],
    attitude: [
      'SET_ATTITUDE_MODE',
      'SET_POINTING_TARGET',
      'EXECUTE_ATTITUDE_MANEUVER',
      'CALIBRATE_GYROSCOPE'
    ],
    thermal: [
      'SET_THERMAL_MODE',
      'ENABLE_HEATER',
      'DISABLE_HEATER',
      'SET_THERMAL_SETPOINT'
    ],
    propulsion: [
      'ARM_PROPULSION',
      'DISARM_PROPULSION',
      'EXECUTE_BURN',
      'ABORT_BURN'
    ],
    communication: [
      'ENABLE_TRANSMITTER',
      'DISABLE_TRANSMITTER',
      'SET_ANTENNA_MODE',
      'UPLINK_DATA',
      'DOWNLINK_DATA'
    ],
    system: [
      'SYSTEM_RESET',
      'SAFE_MODE',
      'NOMINAL_MODE',
      'RUN_DIAGNOSTICS'
    ]
  };

  const response = responseFactory.createSuccessResponse(
    {
      registry: commandRegistry,
      totalCommands: VALID_COMMAND_NAMES.length
    },
    {
      callSign: req.user?.callSign || 'SYSTEM',
      requestId: req.id
    }
  );

  res.status(httpStatus.OK).json(response);
}

/**
 * Simulate command execution (placeholder for actual satellite integration)
 * This will be expanded in future phases to connect with simulation state
 */
function simulateCommandExecution(commandName, payload) {
  // Basic simulation logic - returns result based on command type
  const validCommands = VALID_COMMAND_NAMES;
  
  if (!validCommands.includes(commandName)) {
    return {
      status: 'ERROR',
      message: `Unknown command: ${commandName}`
    };
  }

  // Simulate various outcomes
  const hasRequiredPayload = payload && Object.keys(payload).length > 0;
  
  // Commands that require payload
  const payloadRequiredCommands = [
    'SET_ORBIT_ALTITUDE',
    'SET_ORBIT_INCLINATION',
    'SET_POWER_MODE',
    'SET_POINTING_TARGET',
    'SET_THERMAL_MODE',
    'SET_THERMAL_SETPOINT',
    'SET_ATTITUDE_MODE',
    'SET_ANTENNA_MODE',
    'EXECUTE_BURN',
    'UPLINK_DATA'
  ];

  if (payloadRequiredCommands.includes(commandName) && !hasRequiredPayload) {
    return {
      status: 'ERROR',
      message: `Command ${commandName} requires payload parameters`
    };
  }

  // Commands that might have no effect
  const conditionalCommands = [
    'DEPLOY_SOLAR_ARRAYS',
    'RETRACT_SOLAR_ARRAYS',
    'ENABLE_BATTERY_CHARGING',
    'DISABLE_BATTERY_CHARGING',
    'ENABLE_HEATER',
    'DISABLE_HEATER',
    'ENABLE_TRANSMITTER',
    'DISABLE_TRANSMITTER'
  ];

  if (conditionalCommands.includes(commandName)) {
    // Simulate 10% chance of no effect (already in desired state)
    if (Math.random() < 0.1) {
      return {
        status: 'NO_EFFECT',
        message: `${commandName}: System already in requested state`
      };
    }
  }

  // Success response
  return {
    status: 'OK',
    message: `${commandName} executed successfully`,
    simulatedAt: new Date().toISOString()
  };
}

module.exports = {
  list: handlers.getAll,
  getOne: handlers.getOne,
  create: handlers.create,
  update: handlers.update,
  patch: handlers.patch,
  remove: handlers.delete,
  execute,
  getHistory,
  getBySession,
  getRegistry
};
