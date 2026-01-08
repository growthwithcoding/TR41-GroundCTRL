/**
 * Scenario Step Controller
 * 
 * Generates CRUD handlers using the crudFactory pattern
 */

const scenarioStepRepository = require('../repositories/scenarioStepRepository');
const { createCrudHandlers } = require('../factories/crudFactory');
const logger = require('../utils/logger');
const {
  createScenarioStepSchema,
  updateScenarioStepSchema,
  patchScenarioStepSchema
} = require('../schemas/scenarioStepSchemas');

const hooks = {
  /**
   * Ownership scoping hook
   * Non-admins can only see steps they created
   */
  ownershipScope: async (req, operation, options) => {
    if (req.user?.isAdmin) {
      return options;
    }
    return { ...options, createdBy: req.user?.id };
  },

  beforeCreate: async (req, data) => {
    logger.debug('Step pre-create validation', {
      scenario_id: data.scenario_id,
      userId: req.user?.id
    });
  },

  afterCreate: async (req, doc) => {
    logger.info('Step created', {
      stepId: doc.id,
      scenario_id: doc.scenario_id,
      userId: req.user?.id
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
  scenarioStepRepository,
  'scenarioStep',
  {
    create: createScenarioStepSchema.shape.body,
    update: updateScenarioStepSchema.shape.body,
    patch: patchScenarioStepSchema.shape.body
  },
  hooks
);

module.exports = {
  list: handlers.getAll,
  getOne: handlers.getOne,
  create: handlers.create,
  update: handlers.update,
  patch: handlers.patch,
  remove: handlers.delete
};