/**
 * CRUD Factory
 * Generates standardized CRUD handlers for any resource
 */

const responseFactory = require('./responseFactory');
const auditFactory = require('./auditFactory');
const auditRepository = require('../repositories/auditRepository');
const { NotFoundError, ValidationError } = require('../utils/errors');
const httpStatus = require('../constants/httpStatus');

/**
 * Create CRUD handlers for a resource
 * @param {object} repository - Repository instance for database operations
 * @param {string} resourceName - Name of the resource (e.g., 'user', 'satellite')
 * @param {object} schemas - Zod schemas for validation
 * @returns {object} CRUD handler functions
 */
function createCrudHandlers(repository, resourceName, schemas = {}) {
  return {
    /**
     * Get all resources with pagination
     * GET /:resource
     */
    getAll: async (req, res, next) => {
      try {
        const { page = 1, limit = 10, search, sortBy, sortOrder = 'desc' } = req.query;
        
        const options = {
          page: parseInt(page),
          limit: parseInt(limit),
          search,
          sortBy,
          sortOrder
        };
        
        const result = await repository.getAll(options);
        
        // Log audit
        const auditEntry = auditFactory.createCrudAudit(
          'LIST',
          resourceName,
          req.user?.uid || 'ANONYMOUS',
          req.callSign || 'SYSTEM',
          true,
          { resultCount: result.data?.length || 0 }
        );
        await auditRepository.logAudit(auditEntry);
        
        // Send paginated response
        const response = responseFactory.createPaginatedResponse(
          result.data,
          {
            page: options.page,
            limit: options.limit,
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
     */
    getOne: async (req, res, next) => {
      try {
        const { id } = req.params;
        
        const data = await repository.getById(id);
        
        if (!data) {
          throw new NotFoundError(`${resourceName} not found`, resourceName);
        }
        
        // Log audit
        const auditEntry = auditFactory.createCrudAudit(
          'GET',
          resourceName,
          req.user?.uid || 'ANONYMOUS',
          req.callSign || 'SYSTEM',
          true,
          { resourceId: id }
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
     * Create new resource
     * POST /:resource
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
        
        const data = await repository.create(req.body, {
          createdBy: req.user?.uid,
          createdByCallSign: req.callSign
        });
        
        // Log audit
        const auditEntry = auditFactory.createCrudAudit(
          'CREATE',
          resourceName,
          req.user?.uid,
          req.callSign,
          true,
          {
            resourceId: data.id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          }
        );
        await auditRepository.logAudit(auditEntry);
        
        const response = responseFactory.createSuccessResponse(data, {
          callSign: req.callSign,
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
        
        // Check if exists
        const existing = await repository.getById(id);
        if (!existing) {
          throw new NotFoundError(`${resourceName} not found`, resourceName);
        }
        
        const data = await repository.update(id, req.body, {
          updatedBy: req.user?.uid,
          updatedByCallSign: req.callSign
        });
        
        // Log audit with changes
        const auditEntry = auditFactory.createCrudAudit(
          'UPDATE',
          resourceName,
          req.user?.uid,
          req.callSign,
          true,
          {
            resourceId: id,
            changes: req.body,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          }
        );
        await auditRepository.logAudit(auditEntry);
        
        const response = responseFactory.createSuccessResponse(data, {
          callSign: req.callSign,
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
        
        // Check if exists
        const existing = await repository.getById(id);
        if (!existing) {
          throw new NotFoundError(`${resourceName} not found`, resourceName);
        }
        
        const data = await repository.patch(id, req.body, {
          updatedBy: req.user?.uid,
          updatedByCallSign: req.callSign
        });
        
        // Log audit with changes
        const auditEntry = auditFactory.createCrudAudit(
          'PATCH',
          resourceName,
          req.user?.uid,
          req.callSign,
          true,
          {
            resourceId: id,
            changes: req.body,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          }
        );
        await auditRepository.logAudit(auditEntry);
        
        const response = responseFactory.createSuccessResponse(data, {
          callSign: req.callSign,
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
     */
    delete: async (req, res, next) => {
      try {
        const { id } = req.params;
        
        // Check if exists
        const existing = await repository.getById(id);
        if (!existing) {
          throw new NotFoundError(`${resourceName} not found`, resourceName);
        }
        
        await repository.delete(id, {
          deletedBy: req.user?.uid,
          deletedByCallSign: req.callSign
        });
        
        // Log audit (CRITICAL severity for deletions)
        const auditEntry = auditFactory.createCrudAudit(
          'DELETE',
          resourceName,
          req.user?.uid,
          req.callSign,
          true,
          {
            resourceId: id,
            deletedData: existing,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          }
        );
        await auditRepository.logAudit(auditEntry);
        
        const response = responseFactory.createSuccessResponse(
          { message: `${resourceName} deleted successfully`, id },
          {
            callSign: req.callSign,
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
  createCrudHandlers
};
