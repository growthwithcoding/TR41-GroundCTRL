/**
 * Scenario Controller
 * 
 * Generates CRUD handlers using the crudFactory pattern with lifecycle hooks
 * Enforces ownership scoping and audit logging
 * 
 * All input is pre-validated by the validate middleware before reaching these handlers
 * Validated data is available as req.body, req.query, req.params (standard Express)
 */

const scenarioRepository = require('../repositories/scenarioRepository');
const { createCrudHandlers } = require('../factories/crudFactory');
const logger = require('../utils/logger');
const {
  createScenarioSchema,
  updateScenarioSchema,
  patchScenarioSchema
} = require('../schemas/scenarioSchemas');

/**
 * Lifecycle hooks for scenario CRUD operations
 * 
 * These hooks are called by the crudFactory at key points in the request lifecycle
 * All hooks receive req with authenticated user data from authenticate middleware
 */
const scenarioHooks = {

  /**
   * Ownership scoping hook
   * Ensures non-admins only see their own scenarios or public scenarios
   * Admins see all scenarios
   * 
   * Called before getAll to filter results
   * 
   * Note: For non-admins, we need to handle ownership at the repository level
   * since Firestore doesn't support OR queries directly. We filter after fetching.
   */
  ownershipScope: async (req, operation, options) => {
    // Admins can see all
    if (req.user?.isAdmin) {
      return options;
    }

    // Non-admins: If not filtering by isPublic specifically,
    // they can only see their own scenarios OR public ones
    // This is handled by the repository layer through post-filtering
    if (!req.user?.isAdmin) {
      return { ...options, createdBy: req.user?.id };
    }

    return options;
  },

  /**
   * Pre-create hook
   * Enriches scenario data with user context
   */
  beforeCreate: async (req, data) => {
    // Data already validated by validate middleware
    logger.debug('Scenario pre-create validation', {
      scenarioTitle: data.title,
      userId: req.user?.id
    });
  },

  /**
   * Post-create hook
   * Logs successful creation
   * 
   * Note: The crudFactory will handle response formatting
   */
  afterCreate: async (req, doc) => {
    logger.info('Scenario created', {
      scenarioId: doc.id,
      scenarioTitle: doc.title,
      userId: req.user?.id
    });
  },

  /**
   * Pre-update hook
   * Validates update operation
   */
  beforeUpdate: async (req, data) => {
    logger.debug('Scenario pre-update validation', {
      scenarioTitle: data.title,
      userId: req.user?.id
    });
  },

  /**
   * Post-update hook
   * Logs successful update
   */
  afterUpdate: async (req, doc) => {
    logger.info('Scenario updated', {
      scenarioId: doc.id,
      scenarioTitle: doc.title,
      userId: req.user?.id
    });
  },

  /**
   * Pre-patch hook
   * Validates partial update
   */
  beforePatch: async (req, data) => {
    logger.debug('Scenario pre-patch validation', {
      fieldsUpdated: Object.keys(data),
      userId: req.user?.id
    });
  },

  /**
   * Post-patch hook
   * Logs successful patch
   */
  afterPatch: async (req, doc) => {
    logger.info('Scenario patched', {
      scenarioId: doc.id,
      userId: req.user?.id
    });
  },

  /**
   * Pre-delete hook
   * Validates deletion
   */
  beforeDelete: async (req, id) => {
    logger.debug('Scenario pre-delete validation', {
      scenarioId: id,
      userId: req.user?.id
    });
  },

  /**
   * Post-delete hook
   * Logs successful deletion
   */
  afterDelete: async (req, doc) => {
    logger.info('Scenario deleted', {
      scenarioId: doc.id,
      scenarioTitle: doc.title,
      userId: req.user?.id
    });
  },

  /**
   * Post-read hook
   * Applies to both getAll and getOne operations
   * Useful for enriching data or post-processing
   * 
   * @param {Array} docs - Always an array (single item for getOne, multiple for getAll)
   */
  afterRead: async (req, docs) => {
    logger.debug('Scenarios retrieved', {
      count: docs.length,
      userId: req.user?.id
    });
  },

  /**
   * Custom audit metadata builder
   * Enriches audit log with additional context
   * Merged into the audit log entry by the factory
   */
  auditMetadata: async (req, _operation, _result) => {
    return {
      source: 'api',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };
  }

};

/**
 * Generate CRUD handlers using the factory
 * 
 * The factory creates handlers that:
 * 1. Apply ownership scoping filter (if not admin)
 * 2. Call beforeX hook
 * 3. Execute repository operation
 * 4. Call afterX hook
 * 5. Format response via responseFactory
 * 6. Log to auditRepository
 * 
 * Returns: { getAll, getOne, create, update, patch, delete }
 */
const scenarioHandlers = createCrudHandlers(
  scenarioRepository,
  'scenario',
  {
    create: createScenarioSchema.shape.body,
    update: updateScenarioSchema.shape.body,
    patch: patchScenarioSchema.shape.body
  },
  scenarioHooks
);

/**
 * Export handlers with user-friendly names
 * Ready to be mounted in route definitions
 * 
 * The crudFactory handles:
 * - Request/response validation
 * - Error handling (404s, 403s, 422s)
 * - Pagination
 * - Audit logging
 * - Response formatting
 */
module.exports = {
  list: scenarioHandlers.getAll,
  getOne: scenarioHandlers.getOne,
  create: scenarioHandlers.create,
  update: scenarioHandlers.update,
  patch: scenarioHandlers.patch,
  remove: scenarioHandlers.delete
};
