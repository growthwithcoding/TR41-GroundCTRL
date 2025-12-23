/**
 * Auth Routes
 * Defines authentication endpoints
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');
const { loginLimiter, authLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register new operator
 *     description: Creates a new operator account in the GroundCTRL system with call sign assignment
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
 *               - displayName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Operator email address
 *                 example: maverick@topgun.navy.mil
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Secure password (min 8 chars, must include uppercase, lowercase, number, special char)
 *                 example: SecurePass123!
 *               callSign:
 *                 type: string
 *                 description: Unique operator call sign identifier
 *                 example: MAVERICK
 *               displayName:
 *                 type: string
 *                 description: Operator display name
 *                 example: Pete Mitchell
 *     responses:
 *       201:
 *         description: GO - Operator registered successfully
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
 *                           type: object
 *                           properties:
 *                             user:
 *                               $ref: '#/components/schemas/User'
 *                             tokens:
 *                               $ref: '#/components/schemas/Tokens'
 *             example:
 *               status: GO
 *               code: 201
 *               brief: "New asset deployed to orbit. All systems green."
 *               payload:
 *                 data:
 *                   user:
 *                     uid: "abc123xyz456"
 *                     email: "maverick@topgun.navy.mil"
 *                     callSign: "MAVERICK"
 *                     displayName: "Pete Mitchell"
 *                     isAdmin: false
 *                   tokens:
 *                     accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "MAVERICK"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/register', authLimiter, authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Operator authentication
 *     description: Authenticates an operator and provides access/refresh tokens. Rate limited to 5 attempts per 15 minutes. Failed attempts tracked for account lockout (5 failures = 15 min lockout).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Operator email address
 *                 example: maverick@topgun.navy.mil
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Operator password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: GO - Authentication successful
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
 *                           type: object
 *                           properties:
 *                             user:
 *                               $ref: '#/components/schemas/User'
 *                             tokens:
 *                               $ref: '#/components/schemas/Tokens'
 *             example:
 *               status: GO
 *               code: 200
 *               brief: "Satellite uplink established. Telemetry nominal."
 *               payload:
 *                 data:
 *                   user:
 *                     uid: "abc123xyz456"
 *                     email: "maverick@topgun.navy.mil"
 *                     callSign: "MAVERICK"
 *                     displayName: "Pete Mitchell"
 *                     isAdmin: false
 *                   tokens:
 *                     accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "MAVERICK"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: NO-GO - Account locked due to too many failed attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: NO-GO
 *               code: 403
 *               brief: "Clearance insufficient. Contact Mission Control for access."
 *               payload:
 *                 error:
 *                   code: "ACCOUNT_LOCKED"
 *                   message: "Account temporarily locked due to multiple failed login attempts"
 *                   details:
 *                     lockoutUntil: "2025-01-01T00:15:00.000Z"
 *                     attemptsRemaining: 0
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "SYSTEM"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/login', loginLimiter, authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Generates a new access token using a valid refresh token. Access tokens expire after 15 minutes, refresh tokens after 7 days.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token from login/register
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: GO - New access token generated
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
 *                           type: object
 *                           properties:
 *                             accessToken:
 *                               type: string
 *                               description: New JWT access token
 *             example:
 *               status: GO
 *               code: 200
 *               brief: "Satellite uplink established. Telemetry nominal."
 *               payload:
 *                 data:
 *                   accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "MAVERICK"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/refresh', authLimiter, authController.refreshToken);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user information
 *     description: Returns complete profile information for the currently authenticated user from Firestore
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: GO - Current user information retrieved
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
 *                           type: object
 *                           properties:
 *                             user:
 *                               $ref: '#/components/schemas/User'
 *             example:
 *               status: GO
 *               code: 200
 *               brief: "Satellite uplink established. Telemetry nominal."
 *               payload:
 *                 data:
 *                   user:
 *                     uid: "abc123xyz456"
 *                     email: "maverick@topgun.navy.mil"
 *                     callSign: "MAVERICK"
 *                     displayName: "Pete Mitchell"
 *                     role: "operator"
 *                     isActive: true
 *                     isAdmin: false
 *                     createdAt: "2025-01-01T00:00:00.000Z"
 *                     updatedAt: "2025-01-01T00:00:00.000Z"
 *                     lastLoginAt: "2025-01-01T12:30:45.123Z"
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "MAVERICK"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Operator session termination
 *     description: Logs out the operator by revoking both access and refresh tokens. Tokens are blacklisted immediately.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token to revoke
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: GO - Logout successful, tokens revoked
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
 *                   message: "Logout successful"
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "MAVERICK"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @swagger
 * /auth/revoke:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Revoke user tokens (Admin only)
 *     description: Allows administrators to revoke all tokens for a specific user. Used for security incidents or forced logout.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Firebase UID of the user whose tokens should be revoked
 *                 example: abc123xyz456
 *     responses:
 *       200:
 *         description: GO - User tokens revoked successfully
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
 *                   message: "User tokens revoked successfully"
 *                   userId: "abc123xyz456"
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "MISSION-CTRL"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/revoke', authMiddleware, requireAdmin, authController.revokeToken);

module.exports = router;
