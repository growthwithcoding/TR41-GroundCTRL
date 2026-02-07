/**
 * Scenario Step Routes
 *
 * CRUD endpoints for scenario steps
 * Steps are ordered sequences within scenarios with objectives and hints
 *
 * @swagger
 * tags:
 *   name: Scenario Steps
 *   description: Ordered step sequences within scenarios - objectives, instructions, and completion conditions
 */

const express = require("express");
const router = express.Router();
const { validate } = require("../middleware/validate");
const { authMiddleware } = require("../middleware/authMiddleware");
const controller = require("../controllers/scenarioStepController");
const {
	createScenarioStepSchema,
	updateScenarioStepSchema,
	patchScenarioStepSchema,
	listScenarioStepsSchema,
} = require("../schemas/scenarioStepSchemas");
const { z } = require("zod");

router.use(authMiddleware);

/**
 * @swagger
 * /scenario-steps:
 *   get:
 *     tags:
 *       - Scenario Steps
 *     summary: List scenario steps
 *     description: Returns paginated list of steps. Filter by scenario_id to get steps for a specific scenario.
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
 *           enum: [stepOrder, createdAt, updatedAt, title]
 *           default: stepOrder
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: scenario_id
 *         schema:
 *           type: string
 *         description: Filter by scenario ID (recommended)
 *     responses:
 *       200:
 *         description: GO - Steps retrieved successfully
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
 *                             $ref: '#/components/schemas/ScenarioStep'
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
			query: listScenarioStepsSchema.shape.query,
			params: z.object({}).strict(),
		}),
	),
	controller.list,
);

/**
 * @swagger
 * /scenario-steps:
 *   post:
 *     tags:
 *       - Scenario Steps
 *     summary: Create a new scenario step
 *     description: Creates a new step in a scenario. Steps define what the operator should do at each stage of training.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScenarioStepInput'
 *           examples:
 *             basicStep:
 *               summary: Basic training step
 *               value:
 *                 scenario_id: 'scen_123'
 *                 stepOrder: 1
 *                 title: 'Check Current Attitude'
 *                 instructions: 'Review the current attitude readings in the telemetry panel.'
 *                 objective: 'Identify current pointing target'
 *                 completionCondition: 'User views attitude panel'
 *                 expectedDurationSeconds: 60
 *                 hintSuggestion: 'Look at the attitude panel to see the current pointing target.'
 *             checkpointStep:
 *               summary: Checkpoint step (resume point)
 *               value:
 *                 scenario_id: 'scen_123'
 *                 stepOrder: 5
 *                 title: 'Execute Orbital Maneuver'
 *                 instructions: 'Use the SET_ORBIT_ALTITUDE command to adjust the satellite orbit to 420km.'
 *                 objective: 'Successfully change orbital altitude'
 *                 completionCondition: 'Altitude changed to 420km ± 5km'
 *                 isCheckpoint: true
 *                 expectedDurationSeconds: 180
 *                 hintSuggestion: 'Use SET_ORBIT_ALTITUDE command with altitude_km parameter set to 420.'
 *     responses:
 *       201:
 *         description: GO - Step created successfully
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
 *                           $ref: '#/components/schemas/ScenarioStep'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
	"/",
	validate(
		z.object({
			body: createScenarioStepSchema.shape.body,
			query: z.object({}).strict(),
			params: z.object({}).strict(),
		}),
	),
	controller.create,
);

/**
 * @swagger
 * /scenario-steps/{id}:
 *   get:
 *     tags:
 *       - Scenario Steps
 *     summary: Get step by ID
 *     description: Returns a single scenario step with all details including hint suggestion.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Step ID
 *     responses:
 *       200:
 *         description: GO - Step retrieved successfully
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
 *                           $ref: '#/components/schemas/ScenarioStep'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
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
					id: z.string().min(1, "Step ID is required"),
				})
				.strict(),
		}),
	),
	controller.getOne,
);

/**
 * @swagger
 * /scenario-steps/{id}:
 *   put:
 *     tags:
 *       - Scenario Steps
 *     summary: Update step (full replace)
 *     description: Fully replaces a step record. All required fields must be provided.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Step ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScenarioStepInput'
 *     responses:
 *       200:
 *         description: GO - Step updated successfully
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
 *                           $ref: '#/components/schemas/ScenarioStep'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put(
	"/:id",
	validate(
		z.object({
			body: updateScenarioStepSchema.shape.body,
			query: z.object({}).strict(),
			params: updateScenarioStepSchema.shape.params,
		}),
	),
	controller.update,
);

/**
 * @swagger
 * /scenario-steps/{id}:
 *   patch:
 *     tags:
 *       - Scenario Steps
 *     summary: Partially update step
 *     description: Updates specific fields of a step. Useful for updating instructions, hints, or reordering.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Step ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               stepOrder:
 *                 type: integer
 *                 minimum: 1
 *                 description: Step sequence number
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 description: Step title
 *               instructions:
 *                 type: string
 *                 maxLength: 2000
 *                 description: What user should do
 *               objective:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Success criteria
 *               completionCondition:
 *                 type: string
 *                 maxLength: 1000
 *                 description: How system knows step is complete
 *               isCheckpoint:
 *                 type: boolean
 *                 description: Key milestone flag
 *               expectedDurationSeconds:
 *                 type: integer
 *                 minimum: 1
 *                 description: Estimated duration in seconds
 *               hintSuggestion:
 *                 type: string
 *                 maxLength: 500
 *                 description: Default hint for NOVA AI
 *           examples:
 *             updateHint:
 *               summary: Update hint suggestion
 *               value:
 *                 hintSuggestion: 'Try looking at the power panel first, then check battery levels.'
 *             reorder:
 *               summary: Change step order
 *               value:
 *                 stepOrder: 3
 *             markCheckpoint:
 *               summary: Mark as checkpoint
 *               value:
 *                 isCheckpoint: true
 *     responses:
 *       200:
 *         description: GO - Step patched successfully
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
 *                           $ref: '#/components/schemas/ScenarioStep'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch(
	"/:id",
	validate(
		z.object({
			body: patchScenarioStepSchema.shape.body,
			query: z.object({}).strict(),
			params: patchScenarioStepSchema.shape.params,
		}),
	),
	controller.patch,
);

/**
 * @swagger
 * /scenario-steps/{id}:
 *   delete:
 *     tags:
 *       - Scenario Steps
 *     summary: Delete step
 *     description: Deletes a scenario step. Note that this may affect session progress tracking for operators currently on this step.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Step ID
 *     responses:
 *       200:
 *         description: GO - Step deleted successfully
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
 *                               description: Deleted step ID
 *                             deleted:
 *                               type: boolean
 *                               example: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete("/:id", controller.remove);

module.exports = router;
