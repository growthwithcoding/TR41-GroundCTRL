/**
 * Auth Routes
 * Defines authentication endpoints
 */

const express = require('express');
const router = express.Router();
const { z } = require('zod');
const authController = require('../controllers/authController');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');
const { 
  loginLimiter, 
  authLimiter,
  passwordChangeLimiter,
  passwordResetRequestLimiter,
  passwordResetLimiter
} = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  revokeTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../schemas/authSchemas');

// Wrapper schemas for unified validation (body + query + params)
const loginValidation = z.object({
  body: loginSchema,
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

const registerValidation = z.object({
  body: registerSchema,
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

const refreshTokenValidation = z.object({
  body: refreshTokenSchema,
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

const logoutValidation = z.object({
  body: refreshTokenSchema,
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

const revokeTokenValidation = z.object({
  body: revokeTokenSchema,
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

const changePasswordValidation = z.object({
  body: changePasswordSchema,
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

const forgotPasswordValidation = z.object({
  body: forgotPasswordSchema,
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

const resetPasswordValidation = z.object({
  body: resetPasswordSchema,
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

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
 *                 description: Operator email address (unique constraint for data integrity)
 *                 example: maverick@topgun.navy.mil
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Secure password (min 8 chars, must include uppercase, lowercase, number, special char)
 *                 example: SecurePass123!
 *               callSign:
 *                 type: string
 *                 description: Operator call sign (non-unique display label for context only)
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
router.post('/register', authLimiter, validate(registerValidation), authController.register);

/**
 * @swagger
 * /auth/sync-oauth-profile:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Sync OAuth user profile (Google, etc.)
 *     description: Creates or updates user profile in Firestore for OAuth-authenticated users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uid
 *               - email
 *             properties:
 *               uid:
 *                 type: string
 *                 description: Firebase Auth UID from OAuth provider
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email from OAuth provider
 *               displayName:
 *                 type: string
 *                 description: Display name from OAuth provider
 *               photoURL:
 *                 type: string
 *                 description: Profile photo URL from OAuth provider
 *     responses:
 *       200:
 *         description: GO - OAuth profile synced successfully
 */
router.post('/sync-oauth-profile', authLimiter, authController.syncOAuthProfile);

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
router.post('/login', loginLimiter, validate(loginValidation), authController.login);

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
router.post('/refresh', authLimiter, validate(refreshTokenValidation), authController.refreshToken);

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
router.post('/logout', authMiddleware, validate(logoutValidation), authController.logout);

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
 *                 description: Firebase UID (canonical identifier) of the user whose tokens should be revoked
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
router.post('/revoke', authMiddleware, requireAdmin, validate(revokeTokenValidation), authController.revokeToken);

/**
 * @swagger
 * /auth/bootstrap-admin:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Bootstrap initial admin user (one-time use)
 *     description: |
 *       Creates the first admin user in a fresh deployment. This endpoint only works if no admin exists.
 *       Returns 403 if an admin already exists. Use this after initial deployment to create the system admin.
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
 *                 description: Admin email address
 *                 example: admin@groundctrl.io
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Secure password (min 8 chars, must include uppercase, lowercase, number, special char)
 *                 example: SecureAdmin123!
 *               callSign:
 *                 type: string
 *                 description: Admin call sign
 *                 example: HOUSTON-ADMIN
 *               displayName:
 *                 type: string
 *                 description: Admin display name
 *                 example: System Administrator
 *     responses:
 *       201:
 *         description: GO - Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MissionControlResponse'
 *             example:
 *               status: GO
 *               code: 201
 *               brief: "Mission Control admin initialized. System ready."
 *               payload:
 *                 data:
 *                   user:
 *                     uid: "admin-uid"
 *                     email: "admin@groundctrl.io"
 *                     callSign: "HOUSTON-ADMIN"
 *                     isAdmin: true
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "SYSTEM"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       403:
 *         description: NO-GO - Admin already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: NO-GO
 *               code: 403
 *               brief: "Admin bootstrap rejected. Admin user already exists."
 *               payload:
 *                 error:
 *                   code: "FORBIDDEN"
 *                   message: "Admin user already exists. Bootstrap is one-time only."
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "SYSTEM"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/bootstrap-admin', authLimiter, validate(registerValidation), authController.bootstrapAdmin);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Change password (authenticated user)
 *     description: |
 *       Allows authenticated users to change their own password.
 *       Requires current password verification for security.
 *       Rate limited to 5 attempts per minute.
 *       All existing sessions are invalidated after password change.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password for verification
 *                 example: OldSecurePass123!
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password (min 8 chars, uppercase, lowercase, number, special char)
 *                 example: NewSecurePass456!@
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Confirm new password (must match newPassword)
 *                 example: NewSecurePass456!@
 *     responses:
 *       200:
 *         description: GO - Password changed successfully
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
 *                   message: "Password changed successfully"
 *                   userId: "abc123xyz456"
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "MAVERICK"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         description: NO-GO - Current password is incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: NO-GO
 *               code: 401
 *               brief: "Access denied. Authentication required."
 *               payload:
 *                 error:
 *                   code: "UNAUTHORIZED"
 *                   message: "Current password is incorrect"
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
router.post('/change-password', authMiddleware, passwordChangeLimiter, validate(changePasswordValidation), authController.changePassword);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Request password reset
 *     description: |
 *       Initiates password reset flow by generating a reset token (Note: Email sending not yet implemented).
 *       Always returns 200 OK regardless of whether email exists (prevents email enumeration).
 *       Rate limited to 3 requests per hour.
 *       Reset tokens expire after 15 minutes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address associated with account
 *                 example: maverick@topgun.navy.mil
 *     responses:
 *       200:
 *         description: GO - Reset email sent (if account exists)
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
 *                   message: "If an account exists with this email, a password reset link has been sent."
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
router.post('/forgot-password', passwordResetRequestLimiter, validate(forgotPasswordValidation), authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Reset password with token
 *     description: |
 *       Completes password reset using reset token.
 *       Token must be valid and not expired (15 minute expiry).
 *       All existing sessions are invalidated after password reset.
 *       Rate limited to 5 attempts per 15 minutes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset token from email link
 *                 example: "a1b2c3d4e5f6..."
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password (min 8 chars, uppercase, lowercase, number, special char)
 *                 example: NewSecurePass456!@
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Confirm new password (must match newPassword)
 *                 example: NewSecurePass456!@
 *     responses:
 *       200:
 *         description: GO - Password reset successfully
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
 *                   message: "Password has been reset successfully"
 *                   userId: "abc123xyz456"
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "SYSTEM"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         description: NO-GO - Invalid or expired reset token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: NO-GO
 *               code: 401
 *               brief: "Access denied. Authentication required."
 *               payload:
 *                 error:
 *                   code: "UNAUTHORIZED"
 *                   message: "Invalid or expired reset token"
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
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordValidation), authController.resetPassword);

module.exports = router;
