/**
 * Scenario Session Routes
 *
 * CRUD endpoints for scenario sessions
 * Tracks operator progress through training scenarios
 *
 * @swagger
 * tags:
 *   name: Scenario Sessions
 *   description: Operator training session tracking - progress, scoring, hints used, and completion status
 */

const express = require("express");
const router = express.Router();
const { validate } = require("../middleware/validate");
const { authMiddleware } = require("../middleware/authMiddleware");
const controller = require("../controllers/scenarioSessionController");
const {
	createScenarioSessionSchema,
	updateScenarioSessionSchema,
	patchScenarioSessionSchema,
	listScenarioSessionsSchema,
} = require("../schemas/scenarioSessionSchemas");
const { z } = require("zod");

router.use(authMiddleware);

/**
 * @swagger
 * /scenario-sessions:
 *   get:
 *     tags:
 *       - Scenario Sessions
 *     summary: List scenario sessions
 *     description: Returns paginated list of sessions. Non-admin users only see their own sessions.
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
 *           enum: [createdAt, updatedAt, started_at, completed_at, status, score]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: scenario_id
 *         schema:
 *           type: string
 *         description: Filter by scenario ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NOT_STARTED, IN_PROGRESS, PAUSED, COMPLETED, FAILED, ABANDONED]
 *         description: Filter by session status
 *     responses:
 *       200:
 *         description: GO - Sessions retrieved successfully
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
 *                             $ref: '#/components/schemas/ScenarioSession'
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
	"/",
	validate(
		z.object({
			body: z.object({}).strict(),
			query: listScenarioSessionsSchema.shape.query,
			params: z.object({}).strict(),
		}),
	),
	controller.list,
);

/**
 * @swagger
 * /scenario-sessions:
 *   post:
 *     tags:
 *       - Scenario Sessions
 *     summary: Create a new scenario session
 *     description: Start tracking a new training session for a scenario. User ID is set from authentication token.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScenarioSessionInput'
 *           examples:
 *             startNew:
 *               summary: Start a new session
 *               value:
 *                 scenario_id: 'scen_123'
 *             withState:
 *               summary: Start with initial state
 *               value:
 *                 scenario_id: 'scen_123'
 *                 status: 'IN_PROGRESS'
 *                 current_step_id: 'step_001'
 *                 currentStepOrder: 1
 *     responses:
 *       201:
 *         description: GO - Session created successfully
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
 *                           $ref: '#/components/schemas/ScenarioSession'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
	"/",
	validate(
		z.object({
			body: createScenarioSessionSchema.shape.body,
			query: z.object({}).strict(),
			params: z.object({}).strict(),
		}),
	),
	controller.create,
);

/**
 * @swagger
 * /scenario-sessions/{id}:
 *   get:
 *     tags:
 *       - Scenario Sessions
 *     summary: Get session by ID
 *     description: Returns a single session. Non-admin users can only access their own sessions.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: GO - Session retrieved successfully
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
 *                           $ref: '#/components/schemas/ScenarioSession'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
	"/:id",
	validate(
		z.object({
			body: z.object({}).strict(),
			query: z.object({}).strict(),
			params: z
				.object({
					id: z.string().min(1, "Session ID is required"),
				})
				.strict(),
		}),
	),
	controller.getOne,
);

/**
 * @swagger
 * /scenario-sessions/{id}:
 *   put:
 *     tags:
 *       - Scenario Sessions
 *     summary: Update session (full replace)
 *     description: Fully replaces a session record. User can only update their own sessions.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScenarioSessionInput'
 *     responses:
 *       200:
 *         description: GO - Session updated successfully
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
 *                           $ref: '#/components/schemas/ScenarioSession'
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
	"/:id",
	validate(
		z.object({
			body: updateScenarioSessionSchema.shape.body,
			query: z.object({}).strict(),
			params: updateScenarioSessionSchema.shape.params,
		}),
	),
	controller.update,
);

/**
 * @swagger
 * /scenario-sessions/{id}:
 *   patch:
 *     tags:
 *       - Scenario Sessions
 *     summary: Partially update session
 *     description: Updates specific fields of a session. User can only update their own sessions. Useful for updating progress, score, or state.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [NOT_STARTED, IN_PROGRESS, PAUSED, COMPLETED, FAILED, ABANDONED]
 *               current_step_id:
 *                 type: string
 *                 nullable: true
 *               currentStepOrder:
 *                 type: integer
 *               completedSteps:
 *                 type: array
 *                 items:
 *                   type: string
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               total_hints_used:
 *                 type: integer
 *               total_errors:
 *                 type: integer
 *               state:
 *                 type: object
 *               notes:
 *                 type: string
 *           examples:
 *             advanceStep:
 *               summary: Advance to next step
 *               value:
 *                 status: 'IN_PROGRESS'
 *                 current_step_id: 'step_002'
 *                 currentStepOrder: 2
 *                 completedSteps: ['step_001']
 *             updateScore:
 *               summary: Update score and hints
 *               value:
 *                 score: 85
 *                 total_hints_used: 2
 *             complete:
 *               summary: Complete session
 *               value:
 *                 status: 'COMPLETED'
 *                 score: 95
 *     responses:
 *       200:
 *         description: GO - Session patched successfully
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
 *                           $ref: '#/components/schemas/ScenarioSession'
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
	"/:id",
	validate(
		z.object({
			body: patchScenarioSessionSchema.shape.body,
			query: z.object({}).strict(),
			params: patchScenarioSessionSchema.shape.params,
		}),
	),
	controller.patch,
);

/**
 * @swagger
 * /scenario-sessions/{id}:
 *   delete:
 *     tags:
 *       - Scenario Sessions
 *     summary: Delete session
 *     description: Deletes a session record. User can only delete their own sessions (or admin can delete any).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: GO - Session deleted successfully
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
 *                             id:
 *                               type: string
 *                               description: Deleted session ID
 *                             deleted:
 *                               type: boolean
 *                               example: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete("/:id", controller.remove);

module.exports = router;
