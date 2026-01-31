/**
 * Help Routes
 * Endpoints for help documentation (categories, articles, FAQs)
 */

const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/authMiddleware');
const helpCategoryController = require('../controllers/helpCategoryController');
const helpArticleController = require('../controllers/helpArticleController');
const helpFaqController = require('../controllers/helpFaqController');

// Apply optional authentication to capture user info if present
// This enables audit logging for authenticated users without blocking anonymous access
router.use(optionalAuth);

/**
 * @swagger
 * /help/categories:
 *   get:
 *     tags:
 *       - Help Articles
 *     summary: List all help categories
 *     description: Get all help categories ordered by orderIndex
 *     responses:
 *       200:
 *         description: GO - Categories retrieved successfully
 */
router.get('/categories', helpCategoryController.getAllCategories);

/**
 * @swagger
 * /help/articles:
 *   get:
 *     tags:
 *       - Help Articles
 *     summary: List help articles
 *     description: Get help articles with filtering and pagination
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for articles
 *     responses:
 *       200:
 *         description: GO - Articles retrieved successfully
 */
router.get('/articles', helpArticleController.getAllArticles);

/**
 * @swagger
 * /help/articles/popular:
 *   get:
 *     tags:
 *       - Help Articles
 *     summary: Get popular articles
 *     description: Get top articles sorted by view count with fallback to newest
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *         description: Number of popular articles to return
 *     responses:
 *       200:
 *         description: GO - Popular articles retrieved successfully
 */
router.get('/articles/popular', helpArticleController.getPopularArticles);

/**
 * @swagger
 * /help/articles/{slug}:
 *   get:
 *     tags:
 *       - Help Articles
 *     summary: Get article by slug
 *     description: Retrieve a specific help article by its slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Article slug
 *     responses:
 *       200:
 *         description: GO - Article retrieved successfully
 *       404:
 *         description: NO-GO - Article not found
 */
router.get('/articles/:slug', helpArticleController.getArticleBySlug);

/**
 * @swagger
 * /help/faqs:
 *   get:
 *     tags:
 *       - Help Articles
 *     summary: List FAQs
 *     description: Get frequently asked questions
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for FAQs
 *     responses:
 *       200:
 *         description: GO - FAQs retrieved successfully
 */
router.get('/faqs', helpFaqController.getAllFaqs);

/**
 * @swagger
 * /help/search:
 *   get:
 *     tags:
 *       - Help Articles
 *     summary: Search help content
 *     description: Search across articles and FAQs
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: GO - Search results retrieved
 */
router.get('/search', helpArticleController.searchArticles);

module.exports = router;
