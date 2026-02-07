/**
 * Command Routes
 *
 * API endpoints for mission command operations
 * Commands are persisted and validated for NOVA tutoring feedback
 */

const express = require("express");
const router = express.Router();
const commandController = require("../controllers/commandController");
const {
	authMiddleware,
	requireAdmin,
} = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validate");
const {
	createCommandSchema,
	updateCommandSchema,
	patchCommandSchema,
	listCommandsSchema,
	executeCommandSchema,
} = require("../schemas/commandSchemas");

/**
 * @swagger
 * components:
 *   schemas:
 *     Command:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique command identifier
 *         session_id:
 *           type: string
 *           nullable: true
 *           description: FK to user_scenario_sessions.id (nullable until Phase 9)
 *         scenario_step_id:
 *           type: string
 *           nullable: true
 *           description: FK to scenario_steps.id (nullable until Phase 9)
 *         command_name:
 *           type: string
 *           enum: [SET_ORBIT_ALTITUDE, SET_ORBIT_INCLINATION, EXECUTE_ORBITAL_MANEUVER, STATION_KEEPING, DEPLOY_SOLAR_ARRAYS, RETRACT_SOLAR_ARRAYS, SET_POWER_MODE, ENABLE_BATTERY_CHARGING, DISABLE_BATTERY_CHARGING, SET_ATTITUDE_MODE, SET_POINTING_TARGET, EXECUTE_ATTITUDE_MANEUVER, CALIBRATE_GYROSCOPE, SET_THERMAL_MODE, ENABLE_HEATER, DISABLE_HEATER, SET_THERMAL_SETPOINT, ARM_PROPULSION, DISARM_PROPULSION, EXECUTE_BURN, ABORT_BURN, ENABLE_TRANSMITTER, DISABLE_TRANSMITTER, SET_ANTENNA_MODE, UPLINK_DATA, DOWNLINK_DATA, SYSTEM_RESET, SAFE_MODE, NOMINAL_MODE, RUN_DIAGNOSTICS]
 *           description: Command type from valid command registry
 *         command_payload:
 *           type: object
 *           description: Command parameters as JSON (structure varies by command_name)
 *         result_status:
 *           type: string
 *           enum: [OK, ERROR, NO_EFFECT]
 *           description: Command execution result status
 *         result_message:
 *           type: string
 *           description: Detailed result/error message
 *         is_valid:
 *           type: boolean
 *           description: Whether command passed validation
 *         issued_at:
 *           type: string
 *           format: date-time
 *           description: When the command was issued
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: string
 *           description: UID of operator who created the command
 *     CommandInput:
 *       type: object
 *       required:
 *         - command_name
 *       properties:
 *         session_id:
 *           type: string
 *           nullable: true
 *         scenario_step_id:
 *           type: string
 *           nullable: true
 *         command_name:
 *           type: string
 *           enum: [SET_ORBIT_ALTITUDE, SET_ORBIT_INCLINATION, EXECUTE_ORBITAL_MANEUVER, STATION_KEEPING, DEPLOY_SOLAR_ARRAYS, RETRACT_SOLAR_ARRAYS, SET_POWER_MODE, ENABLE_BATTERY_CHARGING, DISABLE_BATTERY_CHARGING, SET_ATTITUDE_MODE, SET_POINTING_TARGET, EXECUTE_ATTITUDE_MANEUVER, CALIBRATE_GYROSCOPE, SET_THERMAL_MODE, ENABLE_HEATER, DISABLE_HEATER, SET_THERMAL_SETPOINT, ARM_PROPULSION, DISARM_PROPULSION, EXECUTE_BURN, ABORT_BURN, ENABLE_TRANSMITTER, DISABLE_TRANSMITTER, SET_ANTENNA_MODE, UPLINK_DATA, DOWNLINK_DATA, SYSTEM_RESET, SAFE_MODE, NOMINAL_MODE, RUN_DIAGNOSTICS]
 *         command_payload:
 *           type: object
 *         result_status:
 *           type: string
 *           enum: [OK, ERROR, NO_EFFECT]
 *         result_message:
 *           type: string
 *         is_valid:
 *           type: boolean
 *     ExecuteCommandInput:
 *       type: object
 *       required:
 *         - command_name
 *       properties:
 *         session_id:
 *           type: string
 *           nullable: true
 *         scenario_step_id:
 *           type: string
 *           nullable: true
 *         command_name:
 *           type: string
 *           enum: [SET_ORBIT_ALTITUDE, SET_ORBIT_INCLINATION, EXECUTE_ORBITAL_MANEUVER, STATION_KEEPING, DEPLOY_SOLAR_ARRAYS, RETRACT_SOLAR_ARRAYS, SET_POWER_MODE, ENABLE_BATTERY_CHARGING, DISABLE_BATTERY_CHARGING, SET_ATTITUDE_MODE, SET_POINTING_TARGET, EXECUTE_ATTITUDE_MANEUVER, CALIBRATE_GYROSCOPE, SET_THERMAL_MODE, ENABLE_HEATER, DISABLE_HEATER, SET_THERMAL_SETPOINT, ARM_PROPULSION, DISARM_PROPULSION, EXECUTE_BURN, ABORT_BURN, ENABLE_TRANSMITTER, DISABLE_TRANSMITTER, SET_ANTENNA_MODE, UPLINK_DATA, DOWNLINK_DATA, SYSTEM_RESET, SAFE_MODE, NOMINAL_MODE, RUN_DIAGNOSTICS]
 *         command_payload:
 *           type: object
 *     CommandRegistry:
 *       type: object
 *       properties:
 *         registry:
 *           type: object
 *           properties:
 *             orbit:
 *               type: array
 *               items:
 *                 type: string
 *             power:
 *               type: array
 *               items:
 *                 type: string
 *             attitude:
 *               type: array
 *               items:
 *                 type: string
 *             thermal:
 *               type: array
 *               items:
 *                 type: string
 *             propulsion:
 *               type: array
 *               items:
 *                 type: string
 *             communication:
 *               type: array
 *               items:
 *                 type: string
 *             system:
 *               type: array
 *               items:
 *                 type: string
 *         totalCommands:
 *           type: integer
 */

/**
 * @swagger
 * /commands:
 *   get:
 *     tags:
 *       - Commands
 *     summary: List all commands
 *     description: Returns paginated list of commands. Non-admin users only see their own commands.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [issued_at, createdAt, updatedAt, command_name, result_status]
 *           default: issued_at
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: session_id
 *         schema:
 *           type: string
 *         description: Filter by session ID
 *       - in: query
 *         name: scenario_step_id
 *         schema:
 *           type: string
 *         description: Filter by scenario step ID
 *       - in: query
 *         name: command_name
 *         schema:
 *           type: string
 *         description: Filter by command name
 *       - in: query
 *         name: result_status
 *         schema:
 *           type: string
 *           enum: [OK, ERROR, NO_EFFECT]
 *         description: Filter by result status
 *       - in: query
 *         name: is_valid
 *         schema:
 *           type: boolean
 *         description: Filter by validity
 *     responses:
 *       200:
 *         description: GO - Commands retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: GO
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 payload:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Command'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: NO-GO - Unauthorized
 */
router.get(
	"/",
	authMiddleware,
	validate(listCommandsSchema),
	commandController.list,
);

/**
 * @swagger
 * /commands/registry:
 *   get:
 *     tags:
 *       - Commands
 *     summary: Get valid command registry
 *     description: Returns the list of all valid command names organized by subsystem
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: GO - Command registry retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: GO
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 payload:
 *                   $ref: '#/components/schemas/CommandRegistry'
 *       401:
 *         description: NO-GO - Unauthorized
 */
router.get("/registry", authMiddleware, commandController.getRegistry);

/**
 * @swagger
 * /commands/history:
 *   get:
 *     tags:
 *       - Commands
 *     summary: Get command history for current user
 *     description: Returns recent commands issued by the authenticated operator
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of commands to return
 *     responses:
 *       200:
 *         description: GO - Command history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: GO
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 payload:
 *                   type: object
 *                   properties:
 *                     commands:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Command'
 *                     total:
 *                       type: integer
 *       401:
 *         description: NO-GO - Unauthorized
 */
router.get("/history", authMiddleware, commandController.getHistory);

/**
 * @swagger
 * /commands/session/{sessionId}:
 *   get:
 *     tags:
 *       - Commands
 *     summary: Get commands by session
 *     description: Returns commands issued during a specific training session (for NOVA context)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID to filter by
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of commands to return
 *     responses:
 *       200:
 *         description: GO - Session commands retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: GO
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 payload:
 *                   type: object
 *                   properties:
 *                     commands:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Command'
 *                     total:
 *                       type: integer
 *                     session_id:
 *                       type: string
 *       401:
 *         description: NO-GO - Unauthorized
 *       404:
 *         description: NO-GO - Session not found
 */
router.get(
	"/session/:sessionId",
	authMiddleware,
	commandController.getBySession,
);

/**
 * @swagger
 * /commands/{id}:
 *   get:
 *     tags:
 *       - Commands
 *     summary: Get command by ID
 *     description: Returns a single command by its ID. Non-admin users can only access their own commands.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Command ID
 *     responses:
 *       200:
 *         description: GO - Command retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: GO
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 payload:
 *                   $ref: '#/components/schemas/Command'
 *       401:
 *         description: NO-GO - Unauthorized
 *       404:
 *         description: NO-GO - Command not found
 */
router.get("/:id", authMiddleware, commandController.getOne);

/**
 * @swagger
 * /commands/execute:
 *   post:
 *     tags:
 *       - Commands
 *     summary: Execute a satellite command
 *     description: Validates and executes a command, storing the result for NOVA tutoring feedback
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExecuteCommandInput'
 *           examples:
 *             deployArrays:
 *               summary: Deploy solar arrays
 *               value:
 *                 command_name: DEPLOY_SOLAR_ARRAYS
 *                 command_payload: {}
 *             setAltitude:
 *               summary: Set orbit altitude
 *               value:
 *                 command_name: SET_ORBIT_ALTITUDE
 *                 command_payload:
 *                   altitude_km: 400
 *                   delta_v: 0.5
 *     responses:
 *       201:
 *         description: GO - Command executed and stored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: GO
 *                 code:
 *                   type: integer
 *                   example: 201
 *                 payload:
 *                   type: object
 *                   properties:
 *                     command:
 *                       $ref: '#/components/schemas/Command'
 *                     execution:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [OK, ERROR, NO_EFFECT]
 *                         message:
 *                           type: string
 *       400:
 *         description: NO-GO - Validation error
 *       401:
 *         description: NO-GO - Unauthorized
 */
router.post(
	"/execute",
	authMiddleware,
	validate(executeCommandSchema),
	commandController.execute,
);

/**
 * @swagger
 * /commands:
 *   post:
 *     tags:
 *       - Commands
 *     summary: Create a command record
 *     description: Creates a command record directly (admin/system use). Use /execute for normal command submission.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommandInput'
 *     responses:
 *       201:
 *         description: GO - Command created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: GO
 *                 code:
 *                   type: integer
 *                   example: 201
 *                 payload:
 *                   $ref: '#/components/schemas/Command'
 *       400:
 *         description: NO-GO - Validation error
 *       401:
 *         description: NO-GO - Unauthorized
 */
router.post(
	"/",
	authMiddleware,
	validate(createCommandSchema),
	commandController.create,
);

/**
 * @swagger
 * /commands/{id}:
 *   put:
 *     tags:
 *       - Commands
 *     summary: Update command (full replace)
 *     description: Fully replaces a command record. Admin only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Command ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommandInput'
 *     responses:
 *       200:
 *         description: GO - Command updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: GO
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 payload:
 *                   $ref: '#/components/schemas/Command'
 *       400:
 *         description: NO-GO - Validation error
 *       401:
 *         description: NO-GO - Unauthorized
 *       403:
 *         description: NO-GO - Forbidden (admin only)
 *       404:
 *         description: NO-GO - Command not found
 */
router.put(
	"/:id",
	authMiddleware,
	requireAdmin,
	validate(updateCommandSchema),
	commandController.update,
);

/**
 * @swagger
 * /commands/{id}:
 *   patch:
 *     tags:
 *       - Commands
 *     summary: Partially update command
 *     description: Updates specific fields of a command. Admin only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Command ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               result_status:
 *                 type: string
 *                 enum: [OK, ERROR, NO_EFFECT]
 *               result_message:
 *                 type: string
 *               is_valid:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: GO - Command patched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: GO
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 payload:
 *                   $ref: '#/components/schemas/Command'
 *       400:
 *         description: NO-GO - Validation error
 *       401:
 *         description: NO-GO - Unauthorized
 *       403:
 *         description: NO-GO - Forbidden (admin only)
 *       404:
 *         description: NO-GO - Command not found
 */
router.patch(
	"/:id",
	authMiddleware,
	requireAdmin,
	validate(patchCommandSchema),
	commandController.patch,
);

/**
 * @swagger
 * /commands/{id}:
 *   delete:
 *     tags:
 *       - Commands
 *     summary: Delete command
 *     description: Deletes a command record. Admin only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Command ID
 *     responses:
 *       200:
 *         description: GO - Command deleted successfully
 *       401:
 *         description: NO-GO - Unauthorized
 *       403:
 *         description: NO-GO - Forbidden (admin only)
 *       404:
 *         description: NO-GO - Command not found
 */
router.delete("/:id", authMiddleware, requireAdmin, commandController.remove);

module.exports = router;
