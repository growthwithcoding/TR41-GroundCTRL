/**
 * User Routes
 * Defines user management endpoints
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

/**
 * GET /api/v1/users
 * List all users (admin only)
 * Supports pagination, filtering, and search
 */
router.get('/', authMiddleware, requireAdmin, userController.getAllUsers);

/**
 * GET /api/v1/users/:uid
 * Get user by ID
 * Users can view their own profile, admins can view any profile
 */
router.get('/:uid', authMiddleware, userController.getUserById);

/**
 * POST /api/v1/users
 * Create new user (admin only)
 */
router.post('/', authMiddleware, requireAdmin, authLimiter, userController.createUser);

/**
 * PUT /api/v1/users/:uid
 * Update user (full replacement)
 * Users can update their own profile, admins can update any profile
 */
router.put('/:uid', authMiddleware, userController.updateUser);

/**
 * PATCH /api/v1/users/:uid
 * Patch user (partial update)
 * Users can patch their own profile, admins can patch any profile
 */
router.patch('/:uid', authMiddleware, userController.patchUser);

/**
 * DELETE /api/v1/users/:uid
 * Delete user (admin only)
 */
router.delete('/:uid', authMiddleware, requireAdmin, userController.deleteUser);

/**
 * GET /api/v1/users/:uid/audit
 * Get user audit logs
 * Users can view their own logs, admins can view any user's logs
 */
router.get('/:uid/audit', authMiddleware, userController.getUserAuditLogs);

module.exports = router;
