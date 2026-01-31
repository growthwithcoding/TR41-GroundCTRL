/**
 * CRUD Factory
 * Generates standardized CRUD handlers for any resource with lifecycle hooks
 * 
 * Phase 4: Hardened with hooks system, pagination enforcement, and ownership scoping
 */

const responseFactory = require('./responseFactory');
const auditFactory = require('./auditFactory');
const auditRepository = require('../repositories/auditRepository');
const { NotFoundError, ValidationError } = require('../utils/errors');
const httpStatus = require('../constants/httpStatus');

// Pagination constants
const MAX_PAGE_LIMIT = 100;

/**
 * Create CRUD handlers for a resource
 * 
 * @param {Object} repository - Database repository instance with standard methods
 * @param {string} resourceName - Resource name (e.g., 'user', 'satellite', 'scenario')
 * @param {Object} schemas - Zod validation schemas { create, update, patch }
 * @param {Object} hooks - Lifecycle hooks (REQUIRED parameter, but individual hooks are optional)
 * @param {Function} [hooks.ownershipScope] - Filter builder for ownership scoping
 *   - Signature: async (req, operation, options) => options
 *   - Example: (req, op, opts) => ({ ...opts, createdBy: req.user.uid })
 * @param {Function} [hooks.beforeCreate] - Pre-create hook
 *   - Signature: async (req, data) => void
 *   - Use for: validation, data enrichment, side effects
 * @param {Function} [hooks.afterCreate] - Post-create hook
 *   - Signature: async (req, doc) => void
 *   - Use for: notifications, integrations, async operations
 * @param {Function} [hooks.beforeUpdate] - Pre-update hook
 *   - Signature: async (req, updates) => void
 * @param {Function} [hooks.afterUpdate] - Post-update hook
 *   - Signature: async (req, doc) => void
 * @param {Function} [hooks.beforePatch] - Pre-patch hook
 *   - Signature: async (req, updates) => void
 * @param {Function} [hooks.afterPatch] - Post-patch hook
 *   - Signature: async (req, doc) => void
 * @param {Function} [hooks.beforeDelete] - Pre-delete hook
 *   - Signature: async (req, id) => void
 * @param {Function} [hooks.afterDelete] - Post-delete hook
 *   - Signature: async (req, doc) => void
 * @param {Function} [hooks.afterRead] - Post-read hook (applies to getAll and getOne)
 *   - Signature: async (req, docs) => void
 *   - docs will be array for getAll, single-item array for getOne
 * @param {Function} [hooks.auditMetadata] - Custom audit metadata builder
 *   - Signature: async (req, operation, result) => object
 *   - Merged into audit log entry
 * @param {Array<string>} [hooks.skipAuditOperations] - Operations to skip audit logging
 *   - Example: ['LIST', 'GET'] - Skip audit logs for list and get operations
 *   - Use for: Public resources where audit logging adds no security value
 * 
 * @returns {Object} CRUD handler functions { getAll, getOne, create, update, patch, delete }
 * 
 * @example
 * // Basic usage with minimal hooks
 * const handlers = createCrudHandlers(repo, 'satellite', schemas, {
 *   beforeCreate: async (req, data) => {
 *     data.createdBy = req.user.uid;
 *   }
 * });
 * 
 * @example
 * // Advanced usage with ownership scoping
 * const handlers = createCrudHandlers(repo, 'scenario', schemas, {
 *   ownershipScope: async (req, op, opts) => {
 *     // Non-admins see only their own scenarios
 *     if (!req.isAdmin) {
 *       return { ...opts, createdBy: req.user.uid };
 *     }
 *     return opts;
 *   },
 *   beforeCreate: async (req, data) => {
 *     data.status = 'draft';
 *   },
 *   afterCreate: async (req, doc) => {
 *     // Send notification
 *     await notificationService.notify(req.user, 'scenario_created', doc);
 *   },
 *   auditMetadata: async (req, op, result) => {
 *     return { source: 'api', version: '1.0' };
 *   }
 * });
 */
function createCrudHandlers(repository, resourceName, schemas, hooks) {
  // Destructure hooks (all optional except the hooks object itself)
  const {
    ownershipScope,
    beforeCreate,
    afterCreate,
    beforeUpdate,
    afterUpdate,
    beforePatch,
    afterPatch,
    beforeDelete,
    afterDelete,
    afterRead,
    auditMetadata,
    skipAuditOperations
  } = hooks;
  
  // Helper function to check if audit should be skipped
  const shouldSkipAudit = (operation) => {
    return skipAuditOperations && skipAuditOperations.includes(operation);
  };

  return {
    /**
     * Get all resources with pagination
     * GET /:resource
     * 
     * Features:
     * - Enforces MAX_PAGE_LIMIT = 100
     * - Auto-normalizes page/limit values
     * - Applies ownership scoping
     * - Supports search, sorting
     * - Audit logging with result count
     */
    getAll: async (req, res, next) => {
      try {
        // Normalize and enforce pagination limits
        let page = Math.max(1, parseInt(req.query.page) || 1);
        let limit = Math.min(
          Math.max(1, parseInt(req.query.limit) || 20),
          MAX_PAGE_LIMIT
        );
        
        // Build base options with pagination
        const options = {
          page,
          limit,
          sortOrder: req.query.sortOrder || 'desc'
        };
        
        // Pass through known filter params (avoiding string/number conflicts)
        const filterParams = ['category_id', 'search', 'sortBy', 'type', 'difficulty', 'status', 'isActive', 'isFeatured', 'parentCategoryId'];
        filterParams.forEach(param => {
          if (req.query[param] !== undefined) {
            // Convert boolean strings to actual booleans
            if (param === 'isActive' || param === 'isFeatured') {
              options[param] = req.query[param] === 'true';
            } else {
              options[param] = req.query[param];
            }
          }
        });
        
        // Apply ownership scope hook (filter builder pattern)
        const finalOptions = ownershipScope 
          ? await ownershipScope(req, 'list', options)
          : options;
        
        // Fetch from repository
        const result = await repository.getAll(finalOptions);
        
        // Call after-read hook
        if (afterRead) {
          await afterRead(req, result.data || []);
        }
        
        // Log audit (skip if configured)
        if (!shouldSkipAudit('LIST')) {
          const customAuditMeta = auditMetadata 
            ? await auditMetadata(req, 'LIST', result)
            : {};
          
          const auditEntry = auditFactory.createCrudAudit(
            'LIST',
            resourceName,
            req.user?.uid || 'ANONYMOUS',
            req.callSign || 'SYSTEM',
            true,
            { 
              resultCount: result.data?.length || 0,
              ...customAuditMeta
            }
          );
          await auditRepository.logAudit(auditEntry);
        }
        
        // Send paginated response (Mission Control format)
        const response = responseFactory.createPaginatedResponse(
          result.data,
          {
            page: finalOptions.page,
            limit: finalOptions.limit,
            total: result.total
          },
          {
            callSign: req.callSign || 'SYSTEM',
            requestId: req.id
          }
        );
        
        res.status(httpStatus.OK).json(response);
      } catch (error) {
        next(error);
      }
    },
    
    /**
     * Get single resource by ID
     * GET /:resource/:id
     * 
     * Features:
     * - Applies ownership scoping
     * - Returns 404 if not found
     * - No audit logging (read operations)
     */
    getOne: async (req, res, next) => {
      try {
        const { id } = req.params;
        
        // Build options for ownership scope
        const options = {};
        const finalOptions = ownershipScope 
          ? await ownershipScope(req, 'read', options)
          : options;
        
        // Fetch from repository
        const data = await repository.getById(id, finalOptions);
        
        if (!data) {
          throw new NotFoundError(`${resourceName} not found`, resourceName);
        }
        
        // Call after-read hook (single item as array)
        if (afterRead) {
          await afterRead(req, [data]);
        }
        
        // No audit logging for read operations
        
        const response = responseFactory.createSuccessResponse(data, {
          callSign: req.callSign || 'SYSTEM',
          requestId: req.id
        });
        
        res.status(httpStatus.OK).json(response);
      } catch (error) {
        next(error);
      }
    },
    
    /**
     * Create new resource
     * POST /:resource
     * 
     * Features:
     * - Schema validation
     * - Before/after create hooks
     * - Auto-adds createdBy metadata
     * - Audit logging with custom metadata
     */
    create: async (req, res, next) => {
      try {
        // Validate input if schema provided
        if (schemas.create) {
          const validation = schemas.create.safeParse(req.body);
          if (!validation.success) {
            throw new ValidationError('Validation failed', validation.error.errors);
          }
        }
        
        const data = req.body;
        
        // Before create hook
        if (beforeCreate) {
          await beforeCreate(req, data);
        }
        
        // Create document with metadata
        const doc = await repository.create(data, {
          createdBy: req.user?.uid,
          createdByCallSign: req.callSign
        });
        
        // After create hook
        if (afterCreate) {
          await afterCreate(req, doc);
        }
        
        // Custom audit metadata
        const customAuditMeta = auditMetadata 
          ? await auditMetadata(req, 'CREATE', doc)
          : {};
        
        // Log audit
        const auditEntry = auditFactory.createCrudAudit(
          'CREATE',
          resourceName,
          req.user?.uid || 'ANONYMOUS',
          req.callSign || 'SYSTEM',
          true,
          {
            resourceId: doc.uid || doc.id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            ...customAuditMeta
          }
        );
        await auditRepository.logAudit(auditEntry);
        
        const response = responseFactory.createSuccessResponse(doc, {
          callSign: req.callSign || 'SYSTEM',
          requestId: req.id,
          statusCode: httpStatus.CREATED
        });
        
        res.status(httpStatus.CREATED).json(response);
      } catch (error) {
        next(error);
      }
    },
    
    /**
     * Update resource (full replacement)
     * PUT /:resource/:id
     * 
     * Features:
     * - Schema validation
     * - Before/after update hooks
     * - Ownership scoping
     * - Auto-adds updatedBy metadata
     * - Audit logging with changes tracked
     */
    update: async (req, res, next) => {
      try {
        const { id } = req.params;
        
        // Validate input if schema provided
        if (schemas.update) {
          const validation = schemas.update.safeParse(req.body);
          if (!validation.success) {
            throw new ValidationError('Validation failed', validation.error.errors);
          }
        }
        
        const updates = req.body;
        
        // Before update hook
        if (beforeUpdate) {
          await beforeUpdate(req, updates);
        }
        
        // Build options for ownership scope
        const options = {};
        const finalOptions = ownershipScope 
          ? await ownershipScope(req, 'update', options)
          : options;
        
        // Check if exists
        const existing = await repository.getById(id, finalOptions);
        if (!existing) {
          throw new NotFoundError(`${resourceName} not found`, resourceName);
        }
        
        // Update document with metadata
        const data = await repository.update(id, updates, {
          updatedBy: req.user?.uid,
          updatedByCallSign: req.callSign
        });
        
        // After update hook
        if (afterUpdate) {
          await afterUpdate(req, data);
        }
        
        // Custom audit metadata
        const customAuditMeta = auditMetadata 
          ? await auditMetadata(req, 'UPDATE', data)
          : {};
        
        // Log audit with changes
        const auditEntry = auditFactory.createCrudAudit(
          'UPDATE',
          resourceName,
          req.user?.uid || 'ANONYMOUS',
          req.callSign || 'SYSTEM',
          true,
          {
            resourceId: data.uid || data.id || id,
            changes: updates,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            ...customAuditMeta
          }
        );
        await auditRepository.logAudit(auditEntry);
        
        const response = responseFactory.createSuccessResponse(data, {
          callSign: req.callSign || 'SYSTEM',
          requestId: req.id
        });
        
        res.status(httpStatus.OK).json(response);
      } catch (error) {
        next(error);
      }
    },
    
    /**
     * Patch resource (partial update)
     * PATCH /:resource/:id
     * 
     * Features:
     * - Schema validation
     * - Before/after patch hooks
     * - Ownership scoping
     * - Auto-adds updatedBy metadata
     * - Audit logging with changes tracked
     */
    patch: async (req, res, next) => {
      try {
        const { id } = req.params;
        
        // Validate input if schema provided
        if (schemas.patch) {
          const validation = schemas.patch.safeParse(req.body);
          if (!validation.success) {
            throw new ValidationError('Validation failed', validation.error.errors);
          }
        }
        
        const updates = req.body;
        
        // Before patch hook
        if (beforePatch) {
          await beforePatch(req, updates);
        }
        
        // Build options for ownership scope
        const options = {};
        const finalOptions = ownershipScope 
          ? await ownershipScope(req, 'patch', options)
          : options;
        
        // Check if exists
        const existing = await repository.getById(id, finalOptions);
        if (!existing) {
          throw new NotFoundError(`${resourceName} not found`, resourceName);
        }
        
        // Patch document with metadata
        const data = await repository.patch(id, updates, {
          updatedBy: req.user?.uid,
          updatedByCallSign: req.callSign
        });
        
        // After patch hook
        if (afterPatch) {
          await afterPatch(req, data);
        }
        
        // Custom audit metadata
        const customAuditMeta = auditMetadata 
          ? await auditMetadata(req, 'PATCH', data)
          : {};
        
        // Log audit with changes
        const auditEntry = auditFactory.createCrudAudit(
          'PATCH',
          resourceName,
          req.user?.uid || 'ANONYMOUS',
          req.callSign || 'SYSTEM',
          true,
          {
            resourceId: data.uid || data.id || id,
            changes: updates,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            ...customAuditMeta
          }
        );
        await auditRepository.logAudit(auditEntry);
        
        const response = responseFactory.createSuccessResponse(data, {
          callSign: req.callSign || 'SYSTEM',
          requestId: req.id
        });
        
        res.status(httpStatus.OK).json(response);
      } catch (error) {
        next(error);
      }
    },
    
    /**
     * Delete resource
     * DELETE /:resource/:id
     * 
     * Features:
     * - Before/after delete hooks
     * - Ownership scoping
     * - Auto-adds deletedBy metadata
     * - Audit logging (CRITICAL severity)
     */
    delete: async (req, res, next) => {
      try {
        const { id } = req.params;
        
        // Before delete hook
        if (beforeDelete) {
          await beforeDelete(req, id);
        }
        
        // Build options for ownership scope
        const options = {};
        const finalOptions = ownershipScope 
          ? await ownershipScope(req, 'delete', options)
          : options;
        
        // Check if exists
        const existing = await repository.getById(id, finalOptions);
        if (!existing) {
          throw new NotFoundError(`${resourceName} not found`, resourceName);
        }
        
        // Delete document
        await repository.delete(id, {
          deletedBy: req.user?.uid,
          deletedByCallSign: req.callSign
        });
        
        // After delete hook
        if (afterDelete) {
          await afterDelete(req, existing);
        }
        
        // Custom audit metadata
        const customAuditMeta = auditMetadata 
          ? await auditMetadata(req, 'DELETE', existing)
          : {};
        
        // Log audit (CRITICAL severity for deletions)
        const auditEntry = auditFactory.createCrudAudit(
          'DELETE',
          resourceName,
          req.user?.uid || 'ANONYMOUS',
          req.callSign || 'SYSTEM',
          true,
          {
            resourceId: existing.uid || existing.id || id,
            deletedData: existing,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            ...customAuditMeta
          }
        );
        await auditRepository.logAudit(auditEntry);
        
        const response = responseFactory.createSuccessResponse(
          { message: `${resourceName} deleted successfully`, id },
          {
            callSign: req.callSign || 'SYSTEM',
            requestId: req.id
          }
        );
        
        res.status(httpStatus.OK).json(response);
      } catch (error) {
        next(error);
      }
    }
  };
}

module.exports = {
  createCrudHandlers,
  MAX_PAGE_LIMIT
};
