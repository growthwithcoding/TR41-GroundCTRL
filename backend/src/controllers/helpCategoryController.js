/**
 * Help Category Controller
 * Handles HTTP requests for help category operations
 * Uses CRUD factory for standardized operations
 */

const { createCrudHandlers } = require('../factories/crudFactory');
const helpCategoryRepository = require('../repositories/helpCategoryRepository');
const { ConflictError } = require('../utils/errors');
const {
  createCategorySchema,
  updateCategorySchema,
  patchCategorySchema
} = require('../schemas/helpSchemas');

// Create base CRUD handlers using factory
const crudHandlers = createCrudHandlers(
  helpCategoryRepository,
  'help_category',
  {
    create: { safeParse: (body) => createCategorySchema.safeParse({ body }) },
    update: { safeParse: (body) => updateCategorySchema.safeParse({ body, params: { id: body.id } }) },
    patch: { safeParse: (body) => patchCategorySchema.safeParse({ body, params: { id: body.id } }) }
  },
  {
    // Skip automatic audit logging for LIST operations (public browsing)
    skipAuditOperations: ['LIST'],
    
    // Before create hook - check for duplicate code
    beforeCreate: async (req, data) => {
      const codeExists = await helpCategoryRepository.existsByCode(data.code);
      if (codeExists) {
        throw new ConflictError(`Category with code '${data.code}' already exists`);
      }
    },

    // Before update hook - check for duplicate code
    beforeUpdate: async (req, updates) => {
      const { id } = req.params;
      const existing = await helpCategoryRepository.getById(id);
      
      if (updates.code && updates.code !== existing.code) {
        const codeExists = await helpCategoryRepository.existsByCode(updates.code, id);
        if (codeExists) {
          throw new ConflictError(`Category with code '${updates.code}' already exists`);
        }
      }
    },

    // Before patch hook - check for duplicate code
    beforePatch: async (req, updates) => {
      const { id } = req.params;
      const existing = await helpCategoryRepository.getById(id);
      
      if (updates.code && updates.code !== existing.code) {
        const codeExists = await helpCategoryRepository.existsByCode(updates.code, id);
        if (codeExists) {
          throw new ConflictError(`Category with code '${updates.code}' already exists`);
        }
      }
    },

    // Custom audit metadata
    auditMetadata: async (req, operation, result) => {
      return {
        categoryCode: result?.code,
        categoryName: result?.name
      };
    }
  }
);

module.exports = {
  getAllCategories: crudHandlers.getAll,
  getCategoryById: crudHandlers.getOne,
  createCategory: crudHandlers.create,
  updateCategory: crudHandlers.update,
  deleteCategory: crudHandlers.delete
};
