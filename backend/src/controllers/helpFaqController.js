/**
 * Help FAQ Controller
 * Handles HTTP requests for FAQ operations
 * Uses CRUD factory for standardized operations + custom search
 */

const { createCrudHandlers } = require('../factories/crudFactory');
const helpFaqRepository = require('../repositories/helpFaqRepository');
const responseFactory = require('../factories/responseFactory');
const { NotFoundError } = require('../utils/errors');
const httpStatus = require('../constants/httpStatus');
const logger = require('../utils/logger');
const {
  createFaqSchema,
  updateFaqSchema,
  patchFaqSchema
} = require('../schemas/helpSchemas');

// Create base CRUD handlers using factory
const crudHandlers = createCrudHandlers(
  helpFaqRepository,
  'help_faq',
  {
    create: { safeParse: (body) => createFaqSchema.safeParse({ body }) },
    update: { safeParse: (body) => updateFaqSchema.safeParse({ body, params: { id: body.id } }) },
    patch: { safeParse: (body) => patchFaqSchema.safeParse({ body, params: { id: body.id } }) }
  },
  {
    // Skip automatic audit logging for LIST operations (public browsing)
    skipAuditOperations: ['LIST'],
    
    // Custom audit metadata
    auditMetadata: async (req, operation, result) => {
      return {
        question: result?.question?.substring(0, 100),
        categoryId: result?.category_id
      };
    }
  }
);

/**
 * Search FAQs (custom method not in CRUD factory)
 * GET /help/faqs/search
 */
async function searchFaqs(req, res, next) {
  try {
    const { q: searchTerm } = req.query;

    if (!searchTerm) {
      throw new NotFoundError('Search query parameter "q" is required');
    }

    const filters = {
      category_id: req.query.category_id
    };

    const limit = parseInt(req.query.limit) || 10;

    const faqs = await helpFaqRepository.search(searchTerm, filters, limit);

    logger.info('Help FAQs searched', { searchTerm, resultsCount: faqs.length });

    const response = responseFactory.createSuccessResponse(
      { faqs, searchTerm },
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

module.exports = {
  getAllFaqs: crudHandlers.getAll,
  getFaqById: crudHandlers.getOne,
  createFaq: crudHandlers.create,
  updateFaq: crudHandlers.update,
  deleteFaq: crudHandlers.delete,
  searchFaqs // Custom method
};
