/**
 * User Routes
 * Defines user management endpoints
 */

const express = require("express");
const router = express.Router();
const { z } = require("zod");
const userController = require("../controllers/userController");
const {
	authMiddleware,
	requireAdmin,
} = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");
const { validate } = require("../middleware/validate");
const {
	createUserSchema,
	updateUserSchema,
	patchUserSchema,
	userQuerySchema,
} = require("../schemas/userSchemas");

// Wrapper schemas for unified validation (body + query + params)
const getUsersValidation = z.object({
	body: z.object({}).strict(),
	query: userQuerySchema,
	params: z.object({}).strict(),
});

const getUserByIdValidation = z.object({
	body: z.object({}).strict(),
	query: z.object({}).strict(),
	params: z
		.object({
			uid: z.string().min(1, "User ID is required"),
		})
		.strict(),
});

const createUserValidation = z.object({
	body: createUserSchema,
	query: z.object({}).strict(),
	params: z.object({}).strict(),
});

const updateUserValidation = z.object({
	body: updateUserSchema,
	query: z.object({}).strict(),
	params: z
		.object({
			uid: z.string().min(1, "User ID is required"),
		})
		.strict(),
});

const patchUserValidation = z.object({
	body: patchUserSchema,
	query: z.object({}).strict(),
	params: z
		.object({
			uid: z.string().min(1, "User ID is required"),
		})
		.strict(),
});

const deleteUserValidation = z.object({
	body: z.object({}).strict(),
	query: z.object({}).strict(),
	params: z
		.object({
			uid: z.string().min(1, "User ID is required"),
		})
		.strict(),
});

const getUserAuditLogsValidation = z.object({
	body: z.object({}).strict(),
	query: z
		.object({
			page: z
				.string()
				.regex(/^\d+$/, "Page must be a number")
				.transform(Number)
				.refine((n) => n > 0, "Page must be greater than 0")
				.optional(),
			limit: z
				.string()
				.regex(/^\d+$/, "Limit must be a number")
				.transform(Number)
				.refine((n) => n > 0 && n <= 100, "Limit must be between 1 and 100")
				.optional(),
		})
		.strict(),
	params: z
		.object({
			uid: z.string().min(1, "User ID is required"),
		})
		.strict(),
});

/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     summary: List all users (Admin only)
 *     description: |
 *       Retrieves a paginated list of all users in the system.
 *       Supports filtering by active status and search by email/callSign.
 *       Admin access required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of users per page (max 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for email or call sign
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, email, callSign, lastLoginAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: GO - Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/MissionControlResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       type: object
 *                       properties:
 *                         data:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/User'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                             limit:
 *                               type: integer
 *                             total:
 *                               type: integer
 *                             pages:
 *                               type: integer
 *             example:
 *               status: GO
 *               code: 200
 *               brief: "Satellite uplink established. Telemetry nominal."
 *               payload:
 *                 data:
 *                   - uid: "abc123xyz456"
 *                     email: "maverick@topgun.navy.mil"
 *                     callSign: "MAVERICK"
 *                     displayName: "Pete Mitchell"
 *                     isAdmin: false
 *                     isActive: true
 *                     createdAt: "2025-01-01T00:00:00.000Z"
 *                     lastLoginAt: "2025-01-10T12:00:00.000Z"
 *                 pagination:
 *                   page: 1
 *                   limit: 20
 *                   total: 45
 *                   pages: 3
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "HOUSTON-ADMIN"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get(
	"/",
	authMiddleware,
	requireAdmin,
	validate(getUsersValidation),
	userController.getAllUsers,
);

/**
 * @swagger
 * /users/{uid}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by ID
 *     description: |
 *       Retrieves detailed information for a specific user.
 *       Users can view their own profile. Admins can view any user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Firebase UID of the user
 *         example: abc123xyz456
 *     responses:
 *       200:
 *         description: GO - User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/MissionControlResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       type: object
 *                       properties:
 *                         data:
 *                           $ref: '#/components/schemas/User'
 *             example:
 *               status: GO
 *               code: 200
 *               brief: "Satellite uplink established. Telemetry nominal."
 *               payload:
 *                 data:
 *                   uid: "abc123xyz456"
 *                   email: "maverick@topgun.navy.mil"
 *                   callSign: "MAVERICK"
 *                   displayName: "Pete Mitchell"
 *                   isAdmin: false
 *                   isActive: true
 *                   createdAt: "2025-01-01T00:00:00.000Z"
 *                   updatedAt: "2025-01-05T10:30:00.000Z"
 *                   lastLoginAt: "2025-01-10T12:00:00.000Z"
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "MAVERICK"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: NO-GO - User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: NO-GO
 *               code: 404
 *               brief: "Target not acquired. Resource does not exist."
 *               payload:
 *                 error:
 *                   code: "NOT_FOUND"
 *                   message: "User not found"
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "SYSTEM"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 */
router.get(
	"/:uid",
	authMiddleware,
	validate(getUserByIdValidation),
	userController.getUserById,
);

/**
 * @swagger
 * /users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create new user (Admin only)
 *     description: |
 *       Creates a new user account in the system.
 *       Admin access required. Rate limited.
 *       User will be created in both Firebase Auth and Firestore.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - callSign
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (must be unique)
 *                 example: goose@topgun.navy.mil
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Initial password (min 8 chars, must meet complexity requirements)
 *                 example: SecurePass123!
 *               callSign:
 *                 type: string
 *                 description: Operator call sign
 *                 example: GOOSE
 *               displayName:
 *                 type: string
 *                 description: Display name
 *                 example: Nick Bradshaw
 *               isAdmin:
 *                 type: boolean
 *                 description: Grant admin privileges
 *                 default: false
 *     responses:
 *       201:
 *         description: GO - User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/MissionControlResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       type: object
 *                       properties:
 *                         data:
 *                           $ref: '#/components/schemas/User'
 *             example:
 *               status: GO
 *               code: 201
 *               brief: "New asset deployed to orbit. All systems green."
 *               payload:
 *                 data:
 *                   uid: "def456ghi789"
 *                   email: "goose@topgun.navy.mil"
 *                   callSign: "GOOSE"
 *                   displayName: "Nick Bradshaw"
 *                   isAdmin: false
 *                   isActive: true
 *                   createdAt: "2025-01-10T15:30:00.000Z"
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "HOUSTON-ADMIN"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: NO-GO - Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: NO-GO
 *               code: 409
 *               brief: "Resource conflict detected. Operation aborted."
 *               payload:
 *                 error:
 *                   code: "CONFLICT"
 *                   message: "Email already in use"
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "HOUSTON-ADMIN"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post(
	"/",
	authMiddleware,
	requireAdmin,
	authLimiter,
	validate(createUserValidation),
	userController.createUser,
);

/**
 * @swagger
 * /users/{uid}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user (full replacement)
 *     description: |
 *       Replaces all user fields with provided data.
 *       Users can update their own profile (except isAdmin).
 *       Admins can update any user including admin status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Firebase UID of the user to update
 *         example: abc123xyz456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - callSign
 *               - displayName
 *             properties:
 *               callSign:
 *                 type: string
 *                 description: Updated call sign
 *                 example: MAVERICK-II
 *               displayName:
 *                 type: string
 *                 description: Updated display name
 *                 example: Pete Mitchell Jr.
 *               isActive:
 *                 type: boolean
 *                 description: Account active status (admin only)
 *               isAdmin:
 *                 type: boolean
 *                 description: Admin privileges (admin only)
 *     responses:
 *       200:
 *         description: GO - User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/MissionControlResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       type: object
 *                       properties:
 *                         data:
 *                           $ref: '#/components/schemas/User'
 *             example:
 *               status: GO
 *               code: 200
 *               brief: "Satellite uplink established. Telemetry nominal."
 *               payload:
 *                 data:
 *                   uid: "abc123xyz456"
 *                   email: "maverick@topgun.navy.mil"
 *                   callSign: "MAVERICK-II"
 *                   displayName: "Pete Mitchell Jr."
 *                   isAdmin: false
 *                   isActive: true
 *                   updatedAt: "2025-01-10T16:00:00.000Z"
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "MAVERICK"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put(
	"/:uid",
	authMiddleware,
	validate(updateUserValidation),
	userController.updateUser,
);

/**
 * @swagger
 * /users/{uid}:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Patch user (partial update)
 *     description: |
 *       Updates only the provided fields, leaving others unchanged.
 *       Users can patch their own profile (except isAdmin).
 *       Admins can patch any user including admin status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Firebase UID of the user to patch
 *         example: abc123xyz456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               callSign:
 *                 type: string
 *                 description: Updated call sign
 *                 example: MAVERICK-PRIME
 *               displayName:
 *                 type: string
 *                 description: Updated display name
 *                 example: Captain Mitchell
 *               isActive:
 *                 type: boolean
 *                 description: Account active status (admin only)
 *               isAdmin:
 *                 type: boolean
 *                 description: Admin privileges (admin only)
 *     responses:
 *       200:
 *         description: GO - User patched successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/MissionControlResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       type: object
 *                       properties:
 *                         data:
 *                           $ref: '#/components/schemas/User'
 *             example:
 *               status: GO
 *               code: 200
 *               brief: "Satellite uplink established. Telemetry nominal."
 *               payload:
 *                 data:
 *                   uid: "abc123xyz456"
 *                   email: "maverick@topgun.navy.mil"
 *                   callSign: "MAVERICK-PRIME"
 *                   displayName: "Captain Mitchell"
 *                   isAdmin: false
 *                   isActive: true
 *                   updatedAt: "2025-01-10T16:30:00.000Z"
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "MAVERICK"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch(
	"/:uid",
	authMiddleware,
	validate(patchUserValidation),
	userController.patchUser,
);

/**
 * @swagger
 * /users/{uid}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete user (Admin only)
 *     description: |
 *       Permanently deletes a user from the system.
 *       Removes user from both Firebase Auth and Firestore.
 *       This action cannot be undone. Admin access required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Firebase UID of the user to delete
 *         example: abc123xyz456
 *     responses:
 *       200:
 *         description: GO - User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MissionControlResponse'
 *             example:
 *               status: GO
 *               code: 200
 *               brief: "Satellite uplink established. Telemetry nominal."
 *               payload:
 *                 data:
 *                   message: "User deleted successfully"
 *                   uid: "abc123xyz456"
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "HOUSTON-ADMIN"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete(
	"/:uid",
	authMiddleware,
	requireAdmin,
	validate(deleteUserValidation),
	userController.deleteUser,
);

/**
 * @swagger
 * /users/{uid}/audit:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user audit logs
 *     description: |
 *       Retrieves audit log entries for a specific user.
 *       Users can view their own audit logs.
 *       Admins can view any user's audit logs.
 *       Supports pagination.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Firebase UID of the user
 *         example: abc123xyz456
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of entries per page (max 100)
 *     responses:
 *       200:
 *         description: GO - Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/MissionControlResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       type: object
 *                       properties:
 *                         data:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                               action:
 *                                 type: string
 *                               resource:
 *                                 type: string
 *                               result:
 *                                 type: string
 *                               severity:
 *                                 type: string
 *                               ipAddress:
 *                                 type: string
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                             limit:
 *                               type: integer
 *                             total:
 *                               type: integer
 *             example:
 *               status: GO
 *               code: 200
 *               brief: "Satellite uplink established. Telemetry nominal."
 *               payload:
 *                 data:
 *                   - id: "audit-001"
 *                     timestamp: "2025-01-10T12:00:00.000Z"
 *                     action: "LOGIN"
 *                     resource: "auth"
 *                     result: "success"
 *                     severity: "INFO"
 *                     ipAddress: "192.168.1.1"
 *                   - id: "audit-002"
 *                     timestamp: "2025-01-10T12:30:00.000Z"
 *                     action: "PASSWORD_CHANGE"
 *                     resource: "auth"
 *                     result: "success"
 *                     severity: "CRITICAL"
 *                     ipAddress: "192.168.1.1"
 *                 pagination:
 *                   page: 1
 *                   limit: 20
 *                   total: 50
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "MAVERICK"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
	"/:uid/audit",
	authMiddleware,
	validate(getUserAuditLogsValidation),
	userController.getUserAuditLogs,
);

module.exports = router;
