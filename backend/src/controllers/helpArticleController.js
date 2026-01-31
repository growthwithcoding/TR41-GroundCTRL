/**
 * Help Article Controller
 * Handles HTTP requests for help article operations
 * Uses CRUD factory for standardized operations + custom methods
 */

const { createCrudHandlers } = require('../factories/crudFactory');
const helpArticleRepository = require('../repositories/helpArticleRepository');
const responseFactory = require('../factories/responseFactory');
const auditFactory = require('../factories/auditFactory');
const auditRepository = require('../repositories/auditRepository');
const auditEvents = require('../constants/auditEvents');
const auditSeverity = require('../constants/auditSeverity');
const { NotFoundError, ConflictError } = require('../utils/errors');
const httpStatus = require('../constants/httpStatus');
const logger = require('../utils/logger');
const {
  createArticleSchema,
  updateArticleSchema,
  patchArticleSchema
} = require('../schemas/helpSchemas');

// Create base CRUD handlers using factory
const crudHandlers = createCrudHandlers(
  helpArticleRepository,
  'help_article',
  {
    create: { safeParse: (body) => createArticleSchema.safeParse({ body }) },
    update: { safeParse: (body) => updateArticleSchema.safeParse({ body, params: { id: body.id } }) },
    patch: { safeParse: (body) => patchArticleSchema.safeParse({ body, params: { id: body.id } }) }
  },
  {
    // Skip automatic audit logging for LIST operations
    // Audit logging is handled manually for authenticated users viewing specific articles
    skipAuditOperations: ['LIST'],
    
    // Before create hook - check for duplicate slug
    beforeCreate: async (req, data) => {
      const slugExists = await helpArticleRepository.existsBySlug(data.slug);
      if (slugExists) {
        throw new ConflictError(`Article with slug '${data.slug}' already exists`);
      }
    },

    // Before update hook - check for duplicate slug
    beforeUpdate: async (req, updates) => {
      const { id } = req.params;
      const existing = await helpArticleRepository.getById(id);
      
      if (updates.slug && updates.slug !== existing.slug) {
        const slugExists = await helpArticleRepository.existsBySlug(updates.slug, id);
        if (slugExists) {
          throw new ConflictError(`Article with slug '${updates.slug}' already exists`);
        }
      }
    },

    // Before patch hook - check for duplicate slug
    beforePatch: async (req, updates) => {
      const { id } = req.params;
      const existing = await helpArticleRepository.getById(id);
      
      if (updates.slug && updates.slug !== existing.slug) {
        const slugExists = await helpArticleRepository.existsBySlug(updates.slug, id);
        if (slugExists) {
          throw new ConflictError(`Article with slug '${updates.slug}' already exists`);
        }
      }
    },

    // After read hook - audit logging for authenticated users viewing individual articles
    // This applies to getOne operation (viewing article by ID)
    // Does NOT apply to getAll (list operations)
    afterRead: async (req, docs) => {
      // Only audit authenticated users viewing individual articles (getOne returns 1 doc)
      // Skip for list operations (getAll returns multiple docs)
      if (req.user && req.user.uid && req.user.uid !== 'ANONYMOUS' && docs.length === 1) {
        const article = docs[0];
        const auditEntry = auditFactory.createAuditEntry(
          auditEvents.READ_HELP_ARTICLE,
          'help_article',
          req.user.uid,
          req.callSign,
          'success',
          auditSeverity.INFO,
          {
            resourceId: article.id,
            articleSlug: article.slug,
            articleTitle: article.title,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          }
        );
        
        // Log asynchronously to avoid blocking response
        await auditRepository.logAudit(auditEntry).catch(err => {
          logger.error('Failed to log article view audit', { 
            error: err.message,
            articleId: article.id 
          });
        });
      }
    },

    // Custom audit metadata (for create/update/delete operations)
    auditMetadata: async (req, operation, result) => {
      return {
        articleSlug: result?.slug,
        articleTitle: result?.title,
        categoryId: result?.category_id,
        status: result?.status
      };
    }
  }
);

/**
 * Get article by slug (custom method)
 * GET /help/articles/:slug
 * 
 * Audit Policy: Logs only when authenticated users view articles
 */
async function getArticleBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    const article = await helpArticleRepository.getBySlug(slug);

    if (!article) {
      throw new NotFoundError('Article not found');
    }

    // Increment view count asynchronously (don't await)
    helpArticleRepository.incrementViews(article.id).catch(err => {
      logger.error('Failed to increment article views', { id: article.id, error: err.message });
    });

    // Audit logging: Only for authenticated users (not anonymous)
    if (req.user && req.user.uid && req.user.uid !== 'ANONYMOUS') {
      const auditEntry = auditFactory.createAuditEntry(
        auditEvents.READ_HELP_ARTICLE,
        'help_article',
        req.user.uid,
        req.callSign,
        'success',
        auditSeverity.INFO,
        {
          resourceId: article.id,
          articleSlug: article.slug,
          articleTitle: article.title,
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      );
      
      // Log asynchronously to avoid blocking response
      auditRepository.logAudit(auditEntry).catch(err => {
        logger.error('Failed to log article view audit', { 
          error: err.message,
          articleId: article.id 
        });
      });
    }

    logger.info('Help article retrieved by slug', { 
      slug,
      authenticated: !!req.user,
      userId: req.user?.uid 
    });

    const response = responseFactory.createSuccessResponse(
      { article },
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

/**
 * Search articles (custom method)
 * GET /help/articles/search
 */
async function searchArticles(req, res, next) {
  try {
    const { q: searchTerm } = req.query;

    if (!searchTerm) {
      throw new NotFoundError('Search query parameter "q" is required');
    }

    const filters = {
      category_id: req.query.category_id
    };

    const limit = parseInt(req.query.limit) || 10;

    const articles = await helpArticleRepository.search(searchTerm, filters, limit);

    logger.info('Help articles searched', { searchTerm, resultsCount: articles.length });

    const response = responseFactory.createSuccessResponse(
      { articles, searchTerm },
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

/**
 * Increment article views (custom method)
 * POST /help/articles/:id/views
 */
async function incrementViews(req, res, next) {
  try {
    const { id } = req.params;

    const article = await helpArticleRepository.incrementViews(id);

    if (!article) {
      throw new NotFoundError('Article not found');
    }

    logger.info('Help article views incremented', { id, views: article.views });

    const response = responseFactory.createSuccessResponse(
      { article },
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

/**
 * Submit article feedback (custom method)
 * POST /help/articles/:id/feedback
 */
async function submitFeedback(req, res, next) {
  try {
    const { id } = req.params;
    const { isHelpful } = req.body;

    if (typeof isHelpful !== 'boolean') {
      throw new NotFoundError('isHelpful must be a boolean value');
    }

    const article = await helpArticleRepository.updateFeedback(id, isHelpful);

    if (!article) {
      throw new NotFoundError('Article not found');
    }

    logger.info('Help article feedback submitted', { id, isHelpful });

    const response = responseFactory.createSuccessResponse(
      { article },
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

/**
 * Get popular articles (custom method)
 * GET /help/articles/popular
 */
async function getPopularArticles(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 4;

    const articles = await helpArticleRepository.getPopular(limit);

    logger.info('Popular help articles retrieved', { count: articles.length, limit });

    const response = responseFactory.createSuccessResponse(
      { articles },
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
  // CRUD factory handlers
  getAllArticles: crudHandlers.getAll,
  getArticleById: crudHandlers.getOne,
  createArticle: crudHandlers.create,
  updateArticle: crudHandlers.update,
  deleteArticle: crudHandlers.delete,
  
  // Custom methods
  getArticleBySlug,
  searchArticles,
  incrementViews,
  submitFeedback,
  getPopularArticles
};
