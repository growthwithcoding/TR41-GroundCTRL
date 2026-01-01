/**
 * Scenario Routes
 * 
 * CRUD endpoints for scenario management with ownership scoping
 * All routes protected by authentication
 * Ownership scoping enforced by controller hooks
 */

const express = require('express');
const router = express.Router();
const { validate } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');
const scenarioController = require('../controllers/scenarioController');
const {
  createScenarioSchema,
  updateScenarioSchema,
  patchScenarioSchema,
  listScenariosSchema
} = require('../schemas/scenarioSchemas');
const { z } = require('zod');

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/v1/scenarios
 * List all scenarios owned by user (paginated)
 * 
 * Query parameters:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - sortBy: 'createdAt' | 'updatedAt' | 'title' | 'difficulty' | 'tier' (default: createdAt)
 * - sortOrder: 'asc' | 'desc' (default: desc)
 * - difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' (optional filter)
 * - tier: 'ROOKIE_PILOT' | 'MISSION_SPECIALIST' | 'MISSION_COMMANDER' (optional filter)
 * - type: 'GUIDED' | 'SANDBOX' (optional filter)
 * - status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' (optional filter)
 * - isActive: 'true' | 'false' (optional filter)
 * - satellite_id: string (optional filter)
 * 
 * Response: 200 OK
 * {
 *   "status": "success",
 *   "data": {...},
 *   "pagination": { page, limit, total, totalPages, hasNextPage }
 * }
 */

/**
 * @swagger
 * /scenarios:
 *   get:
 *     tags:
 *       - Scenarios
 *     summary: List scenarios with ownership scoping
 *     description: |
 *       Retrieve a paginated list of scenarios. Non-admin users can only see scenarios they created.
 *       Admins can see all scenarios. Supports filtering by difficulty, tier, type, status, and satellite.
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
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, title, difficulty, tier]
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
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
 *         description: Filter by difficulty level
 *       - in: query
 *         name: tier
 *         schema:
 *           type: string
 *           enum: ['ROOKIE_PILOT', 'MISSION_SPECIALIST', 'MISSION_COMMANDER']
 *         description: Filter by pilot tier
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: ['GUIDED', 'SANDBOX']
 *         description: Filter by scenario type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED']
 *         description: Filter by publishing status
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Filter by active status
 *       - in: query
 *         name: satellite_id
 *         schema:
 *           type: string
 *         description: Filter by satellite ID
 *     responses:
 *       200:
 *         description: GO - Scenarios retrieved successfully
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
 *                             scenarios:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/Scenario'
 *                             pagination:
 *                               type: object
 *                               properties:
 *                                 page:
 *                                   type: integer
 *                                   example: 1
 *                                 limit:
 *                                   type: integer
 *                                   example: 20
 *                                 total:
 *                                   type: integer
 *                                   example: 150
 *                                 totalPages:
 *                                   type: integer
 *                                   example: 8
 *             example:
 *               status: GO
 *               code: 200
 *               brief: "Mission scenarios loaded. Ready for launch."
 *               payload:
 *                 data:
 *                   scenarios:
 *                     - id: "scen_123"
 *                       code: "ROOKIE_ORBIT_101"
 *                       title: "Orbit Orientation"
 *                       description: "Learn the basics of orbital mechanics and satellite positioning"
 *                       difficulty: "BEGINNER"
 *                       tier: "ROOKIE_PILOT"
 *                       type: "GUIDED"
 *                       estimatedDurationMinutes: 15
 *                       status: "PUBLISHED"
 *                       isActive: true
 *                       isCore: true
 *                       satellite_id: "sat_123"
 *                       initialState:
 *                         orbit:
 *                           altitude_km: 408
 *                           inclination_degrees: 51.6
 *                         power:
 *                           currentCharge_percent: 100
 *                         attitude:
 *                           currentTarget: "NADIR"
 *                           error_degrees: 0.5
 *                         thermal:
 *                           currentTemp_celsius: 20
 *                       consoleLayout:
 *                         panels: ["power", "attitude", "thermal"]
 *                         widgets: ["telemetry", "commands"]
 *                       tags: ["orbit", "basics"]
 *                       objectives: ["Understand orbital mechanics", "Practice attitude control"]
 *                       prerequisites: []
 *                       createdBy: "abc123xyz456"
 *                       createdAt: "2025-01-01T00:00:00.000Z"
 *                       updatedAt: "2025-01-01T00:00:00.000Z"
 *                   pagination:
 *                     page: 1
 *                     limit: 20
 *                     total: 1
 *                     totalPages: 1
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "APOLLO-11"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  '/',
  validate(z.object({
    body: z.object({}).strict(),
    query: listScenariosSchema.shape.query,
    params: z.object({}).strict()
  })),
  scenarioController.list
);

/**
 * POST /api/v1/scenarios
 * Create new scenario
 * 
 * Body:
 * {
 *   "code": "ROOKIE_ORBIT_101",
 *   "title": "Orbit Orientation",
 *   "description": "Learn the basics of orbital mechanics...",
 *   "difficulty": "BEGINNER",
 *   "tier": "ROOKIE_PILOT",
 *   "type": "GUIDED",
 *   "estimatedDurationMinutes": 15,
 *   "satellite_id": "sat_123",
 *   "initialState": { ... },
 *   "consoleLayout": { ... },
 *   "status": "DRAFT",
 *   "isActive": true,
 *   "isCore": true
 * }
 * 
 * Response: 201 CREATED
 * {
 *   "status": "success",
 *   "data": { "id": "scen_123", "title": "Orbit Orientation", ... }
 * }
 */

/**
 * @swagger
 * /scenarios:
 *   post:
 *     tags:
 *       - Scenarios
 *     summary: Create new scenario
 *     description: Create a new mission scenario with complete configuration including satellite reference and initial simulation state. The scenario will be owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - title
 *               - description
 *               - difficulty
 *               - tier
 *               - estimatedDurationMinutes
 *               - satellite_id
 *               - consoleLayout
 *             properties:
 *               code:
 *                 type: string
 *                 description: Unique scenario code (uppercase alphanumeric with underscores)
 *                 example: "ROOKIE_ORBIT_101"
 *               title:
 *                 type: string
 *                 description: Human-readable scenario title
 *                 example: "Orbit Orientation"
 *               description:
 *                 type: string
 *                 description: Detailed mission description and learning objectives
 *                 example: "Learn the basics of orbital mechanics and satellite positioning"
 *               difficulty:
 *                 type: string
 *                 enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
 *                 description: Difficulty level for learning path
 *                 example: "BEGINNER"
 *               tier:
 *                 type: string
 *                 enum: ['ROOKIE_PILOT', 'MISSION_SPECIALIST', 'MISSION_COMMANDER']
 *                 description: Pilot tier required
 *                 example: "ROOKIE_PILOT"
 *               type:
 *                 type: string
 *                 enum: ['GUIDED', 'SANDBOX']
 *                 description: GUIDED (step-by-step) or SANDBOX (free-play)
 *                 example: "GUIDED"
 *               estimatedDurationMinutes:
 *                 type: number
 *                 description: Expected playtime in minutes
 *                 example: 15
 *               status:
 *                 type: string
 *                 enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED']
 *                 description: Publishing status
 *                 example: "DRAFT"
 *               isActive:
 *                 type: boolean
 *                 description: Whether scenario is available for users
 *                 example: true
 *               isCore:
 *                 type: boolean
 *                 description: true for core training scenarios
 *                 example: true
 *               satellite_id:
 *                 type: string
 *                 description: FK to satellites.id
 *                 example: "sat_123"
 *               initialState:
 *                 type: object
 *                 description: Seed state for simulation (orbit, power, attitude, etc.)
 *                 properties:
 *                   orbit:
 *                     type: object
 *                     properties:
 *                       altitude_km:
 *                         type: number
 *                         description: Initial altitude in kilometers
 *                         example: 408
 *                       inclination_degrees:
 *                         type: number
 *                         description: Initial inclination in degrees
 *                         example: 51.6
 *                   power:
 *                     type: object
 *                     properties:
 *                       currentCharge_percent:
 *                         type: number
 *                         description: Initial battery charge percentage
 *                         example: 100
 *                   attitude:
 *                     type: object
 *                     properties:
 *                       currentTarget:
 *                         type: string
 *                         enum: ['NADIR', 'SUN', 'INERTIAL_EAST']
 *                         description: Initial pointing target
 *                         example: "NADIR"
 *                       error_degrees:
 *                         type: number
 *                         description: Initial pointing error in degrees
 *                         example: 0.5
 *                   thermal:
 *                     type: object
 *                     properties:
 *                       currentTemp_celsius:
 *                         type: number
 *                         description: Initial temperature in Celsius
 *                         example: 20
 *               consoleLayout:
 *                 type: object
 *                 description: Which panels/widgets appear in mission console
 *                 properties:
 *                   panels:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Which panels appear in mission console
 *                     example: ["power", "attitude", "thermal"]
 *                   widgets:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Which widgets appear in mission console
 *                     example: ["telemetry", "commands"]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tags for filtering
 *                 example: ["orbit", "basics"]
 *               objectives:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Learning objectives for this scenario
 *                 example: ["Understand orbital mechanics", "Practice attitude control"]
 *               prerequisites:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Scenario IDs that should be completed first
 *                 example: ["scen_122"]
 *     responses:
 *       201:
 *         description: GO - Scenario created successfully
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
 *                             scenario:
 *                               $ref: '#/components/schemas/Scenario'
 *             example:
 *               status: GO
 *               code: 201
 *               brief: "New mission scenario programmed. Ready for training."
 *               payload:
 *                 data:
 *                   scenario:
 *                     id: "scen_123"
 *                     code: "ROOKIE_ORBIT_101"
 *                     title: "Orbit Orientation"
 *                     description: "Learn the basics of orbital mechanics and satellite positioning"
 *                     difficulty: "BEGINNER"
 *                     tier: "ROOKIE_PILOT"
 *                     type: "GUIDED"
 *                     estimatedDurationMinutes: 15
 *                     status: "DRAFT"
 *                     isActive: true
 *                     isCore: true
 *                     satellite_id: "sat_123"
 *                     initialState:
 *                       orbit:
 *                         altitude_km: 408
 *                         inclination_degrees: 51.6
 *                       power:
 *                         currentCharge_percent: 100
 *                       attitude:
 *                         currentTarget: "NADIR"
 *                         error_degrees: 0.5
 *                       thermal:
 *                         currentTemp_celsius: 20
 *                     consoleLayout:
 *                       panels: ["power", "attitude", "thermal"]
 *                       widgets: ["telemetry", "commands"]
 *                     tags: ["orbit", "basics"]
 *                     objectives: ["Understand orbital mechanics", "Practice attitude control"]
 *                     prerequisites: []
 *                     createdBy: "abc123xyz456"
 *                     createdAt: "2025-01-01T00:00:00.000Z"
 *                     updatedAt: "2025-01-01T00:00:00.000Z"
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "APOLLO-11"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/',
  validate(z.object({
    body: createScenarioSchema.shape.body,
    query: z.object({}).strict(),
    params: z.object({}).strict()
  })),
  scenarioController.create
);

/**
 * GET /api/v1/scenarios/:id
 * Get single scenario by ID
 * Only owner or admin can view
 * 
 * Response: 200 OK
 * {
 *   "status": "success",
 *   "data": { "id": "scen_123", "title": "Orbit Orientation", ... }
 * }
 * 
 * Errors:
 * - 404 NOT_FOUND: Scenario doesn't exist
 * - 403 FORBIDDEN: User doesn't own scenario and is not admin
 */

/**
 * @swagger
 * /scenarios/{id}:
 *   get:
 *     tags:
 *       - Scenarios
 *     summary: Get scenario by ID
 *     description: Retrieve a single scenario by its ID. Non-admin users can only access scenarios they created.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique scenario identifier
 *         example: scen_123
 *     responses:
 *       200:
 *         description: GO - Scenario retrieved successfully
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
 *                             scenario:
 *                               $ref: '#/components/schemas/Scenario'
 *             example:
 *               status: GO
 *               code: 200
 *               brief: "Mission scenario loaded. Ready for launch."
 *               payload:
 *                 data:
 *                   scenario:
 *                     id: "scen_123"
 *                     code: "ROOKIE_ORBIT_101"
 *                     title: "Orbit Orientation"
 *                     description: "Learn the basics of orbital mechanics and satellite positioning"
 *                     difficulty: "BEGINNER"
 *                     tier: "ROOKIE_PILOT"
 *                     type: "GUIDED"
 *                     estimatedDurationMinutes: 15
 *                     status: "PUBLISHED"
 *                     isActive: true
 *                     isCore: true
 *                     satellite_id: "sat_123"
 *                     initialState:
 *                       orbit:
 *                         altitude_km: 408
 *                         inclination_degrees: 51.6
 *                       power:
 *                         currentCharge_percent: 100
 *                       attitude:
 *                         currentTarget: "NADIR"
 *                         error_degrees: 0.5
 *                       thermal:
 *                         currentTemp_celsius: 20
 *                     consoleLayout:
 *                       panels: ["power", "attitude", "thermal"]
 *                       widgets: ["telemetry", "commands"]
 *                     tags: ["orbit", "basics"]
 *                     objectives: ["Understand orbital mechanics", "Practice attitude control"]
 *                     prerequisites: []
 *                     createdBy: "abc123xyz456"
 *                     createdAt: "2025-01-01T00:00:00.000Z"
 *                     updatedAt: "2025-01-01T00:00:00.000Z"
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "APOLLO-11"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: NO-GO - Scenario not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: NO-GO
 *               code: 404
 *               brief: "Mission scenario not found in database."
 *               payload:
 *                 error:
 *                   code: "NOT_FOUND"
 *                   message: "Scenario not found"
 *                   details: null
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "APOLLO-11"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  '/:id',
  validate(z.object({
    body: z.object({}).strict(),
    query: z.object({}).strict(),
    params: z.object({
      id: z.string().min(1, 'Scenario ID is required')
    }).strict()
  })),
  scenarioController.getOne
);

/**
 * PUT /api/v1/scenarios/:id
 * Update scenario (full replacement)
 * Only owner or admin can update
 * 
 * Body: Same as POST (all fields required)
 * 
 * Response: 200 OK
 * {
 *   "status": "success",
 *   "data": { "id": "scen_123", ... }
 * }
 * 
 * Errors:
 * - 404 NOT_FOUND: Scenario doesn't exist
 * - 403 FORBIDDEN: User doesn't own scenario and is not admin
 * - 422 UNPROCESSABLE_ENTITY: Validation failed
 */

/**
 * @swagger
 * /scenarios/{id}:
 *   put:
 *     tags:
 *       - Scenarios
 *     summary: Replace scenario (full update)
 *     description: Completely replace a scenario's configuration. Non-admin users can only update scenarios they created. All fields are required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique scenario identifier
 *         example: scen_123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - title
 *               - description
 *               - difficulty
 *               - tier
 *               - estimatedDurationMinutes
 *               - satellite_id
 *               - consoleLayout
 *             properties:
 *               code:
 *                 type: string
 *                 description: Unique scenario code (uppercase alphanumeric with underscores)
 *                 example: "ROOKIE_ORBIT_101"
 *               title:
 *                 type: string
 *                 description: Human-readable scenario title
 *                 example: "Orbit Orientation"
 *               description:
 *                 type: string
 *                 description: Detailed mission description and learning objectives
 *                 example: "Learn the basics of orbital mechanics and satellite positioning"
 *               difficulty:
 *                 type: string
 *                 enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
 *                 description: Difficulty level for learning path
 *                 example: "BEGINNER"
 *               tier:
 *                 type: string
 *                 enum: ['ROOKIE_PILOT', 'MISSION_SPECIALIST', 'MISSION_COMMANDER']
 *                 description: Pilot tier required
 *                 example: "ROOKIE_PILOT"
 *               type:
 *                 type: string
 *                 enum: ['GUIDED', 'SANDBOX']
 *                 description: GUIDED (step-by-step) or SANDBOX (free-play)
 *                 example: "GUIDED"
 *               estimatedDurationMinutes:
 *                 type: number
 *                 description: Expected playtime in minutes
 *                 example: 15
 *               status:
 *                 type: string
 *                 enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED']
 *                 description: Publishing status
 *                 example: "PUBLISHED"
 *               isActive:
 *                 type: boolean
 *                 description: Whether scenario is available for users
 *                 example: true
 *               isCore:
 *                 type: boolean
 *                 description: true for core training scenarios
 *                 example: true
 *               satellite_id:
 *                 type: string
 *                 description: FK to satellites.id
 *                 example: "sat_123"
 *               initialState:
 *                 type: object
 *                 description: Seed state for simulation (orbit, power, attitude, etc.)
 *               consoleLayout:
 *                 type: object
 *                 description: Which panels/widgets appear in mission console
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tags for filtering
 *               objectives:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Learning objectives for this scenario
 *               prerequisites:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Scenario IDs that should be completed first
 *     responses:
 *       200:
 *         description: GO - Scenario updated successfully
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
 *                             scenario:
 *                               $ref: '#/components/schemas/Scenario'
 *             example:
 *               status: GO
 *               code: 200
 *               brief: "Mission scenario updated. Parameters confirmed."
 *               payload:
 *                 data:
 *                   scenario:
 *                     id: "scen_123"
 *                     code: "ROOKIE_ORBIT_101"
 *                     title: "Orbit Orientation"
 *                     description: "Learn the basics of orbital mechanics and satellite positioning"
 *                     difficulty: "BEGINNER"
 *                     tier: "ROOKIE_PILOT"
 *                     type: "GUIDED"
 *                     estimatedDurationMinutes: 15
 *                     status: "PUBLISHED"
 *                     isActive: true
 *                     isCore: true
 *                     satellite_id: "sat_123"
 *                     initialState:
 *                       orbit:
 *                         altitude_km: 408
 *                         inclination_degrees: 51.6
 *                       power:
 *                         currentCharge_percent: 100
 *                       attitude:
 *                         currentTarget: "NADIR"
 *                         error_degrees: 0.5
 *                       thermal:
 *                         currentTemp_celsius: 20
 *                     consoleLayout:
 *                       panels: ["power", "attitude", "thermal"]
 *                       widgets: ["telemetry", "commands"]
 *                     tags: ["orbit", "basics"]
 *                     objectives: ["Understand orbital mechanics", "Practice attitude control"]
 *                     prerequisites: []
 *                     createdBy: "abc123xyz456"
 *                     createdAt: "2025-01-01T00:00:00.000Z"
 *                     updatedAt: "2025-01-01T00:00:00.000Z"
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "APOLLO-11"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: NO-GO - Scenario not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: NO-GO
 *               code: 404
 *               brief: "Mission scenario not found in database."
 *               payload:
 *                 error:
 *                   code: "NOT_FOUND"
 *                   message: "Scenario not found"
 *                   details: null
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "APOLLO-11"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.put(
  '/:id',
  validate(z.object({
    body: updateScenarioSchema.shape.body,
    query: z.object({}).strict(),
    params: updateScenarioSchema.shape.params
  })),
  scenarioController.update
);

/**
 * PATCH /api/v1/scenarios/:id
 * Partially update scenario
 * Only owner or admin can patch
 * 
 * Body: Partial scenario data (at least one field required)
 * Example:
 * {
 *   "status": "PUBLISHED",
 *   "isActive": true
 * }
 * 
 * Response: 200 OK
 * {
 *   "status": "success",
 *   "data": { "id": "scen_123", ... }
 * }
 * 
 * Errors:
 * - 404 NOT_FOUND: Scenario doesn't exist
 * - 403 FORBIDDEN: User doesn't own scenario and is not admin
 * - 422 UNPROCESSABLE_ENTITY: Validation failed or no fields provided
 */

/**
 * @swagger
 * /scenarios/{id}:
 *   patch:
 *     tags:
 *       - Scenarios
 *     summary: Update scenario (partial)
 *     description: Partially update a scenario's configuration. Non-admin users can only update scenarios they created. At least one field must be provided.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique scenario identifier
 *         example: scen_123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Unique scenario code (uppercase alphanumeric with underscores)
 *                 example: "ROOKIE_ORBIT_101"
 *               title:
 *                 type: string
 *                 description: Human-readable scenario title
 *                 example: "Orbit Orientation"
 *               description:
 *                 type: string
 *                 description: Detailed mission description and learning objectives
 *                 example: "Learn the basics of orbital mechanics and satellite positioning"
 *               difficulty:
 *                 type: string
 *                 enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
 *                 description: Difficulty level for learning path
 *                 example: "BEGINNER"
 *               tier:
 *                 type: string
 *                 enum: ['ROOKIE_PILOT', 'MISSION_SPECIALIST', 'MISSION_COMMANDER']
 *                 description: Pilot tier required
 *                 example: "ROOKIE_PILOT"
 *               type:
 *                 type: string
 *                 enum: ['GUIDED', 'SANDBOX']
 *                 description: GUIDED (step-by-step) or SANDBOX (free-play)
 *                 example: "GUIDED"
 *               estimatedDurationMinutes:
 *                 type: number
 *                 description: Expected playtime in minutes
 *                 example: 15
 *               status:
 *                 type: string
 *                 enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED']
 *                 description: Publishing status
 *                 example: "PUBLISHED"
 *               isActive:
 *                 type: boolean
 *                 description: Whether scenario is available for users
 *                 example: true
 *               isCore:
 *                 type: boolean
 *                 description: true for core training scenarios
 *                 example: true
 *               satellite_id:
 *                 type: string
 *                 description: FK to satellites.id
 *                 example: "sat_123"
 *               initialState:
 *                 type: object
 *                 description: Seed state for simulation (orbit, power, attitude, etc.)
 *               consoleLayout:
 *                 type: object
 *                 description: Which panels/widgets appear in mission console
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tags for filtering
 *                 example: ["orbit", "basics"]
 *               objectives:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Learning objectives for this scenario
 *                 example: ["Understand orbital mechanics", "Practice attitude control"]
 *               prerequisites:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Scenario IDs that should be completed first
 *                 example: ["scen_122"]
 *     responses:
 *       200:
 *         description: GO - Scenario updated successfully
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
 *                             scenario:
 *                               $ref: '#/components/schemas/Scenario'
 *             example:
 *               status: GO
 *               code: 200
 *               brief: "Mission scenario updated. Parameters confirmed."
 *               payload:
 *                 data:
 *                   scenario:
 *                     id: "scen_123"
 *                     code: "ROOKIE_ORBIT_101"
 *                     title: "Orbit Orientation"
 *                     description: "Learn the basics of orbital mechanics and satellite positioning"
 *                     difficulty: "BEGINNER"
 *                     tier: "ROOKIE_PILOT"
 *                     type: "GUIDED"
 *                     estimatedDurationMinutes: 15
 *                     status: "PUBLISHED"
 *                     isActive: true
 *                     isCore: true
 *                     satellite_id: "sat_123"
 *                     initialState:
 *                       orbit:
 *                         altitude_km: 408
 *                         inclination_degrees: 51.6
 *                       power:
 *                         currentCharge_percent: 100
 *                       attitude:
 *                         currentTarget: "NADIR"
 *                         error_degrees: 0.5
 *                       thermal:
 *                         currentTemp_celsius: 20
 *                     consoleLayout:
 *                       panels: ["power", "attitude", "thermal"]
 *                       widgets: ["telemetry", "commands"]
 *                     tags: ["orbit", "basics"]
 *                     objectives: ["Understand orbital mechanics", "Practice attitude control"]
 *                     prerequisites: []
 *                     createdBy: "abc123xyz456"
 *                     createdAt: "2025-01-01T00:00:00.000Z"
 *                     updatedAt: "2025-01-01T00:00:00.000Z"
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "APOLLO-11"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: NO-GO - Scenario not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: NO-GO
 *               code: 404
 *               brief: "Mission scenario not found in database."
 *               payload:
 *                 error:
 *                   code: "NOT_FOUND"
 *                   message: "Scenario not found"
 *                   details: null
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "APOLLO-11"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch(
  '/:id',
  validate(z.object({
    body: patchScenarioSchema.shape.body,
    query: z.object({}).strict(),
    params: patchScenarioSchema.shape.params
  })),
  scenarioController.patch
);

/**
 * DELETE /api/v1/scenarios/:id
 * Delete scenario
 * Only owner or admin can delete
 * 
 * Response: 200 OK
 * {
 *   "status": "success",
 *   "message": "Scenario deleted successfully"
 * }
 * 
 * Errors:
 * - 404 NOT_FOUND: Scenario doesn't exist
 * - 403 FORBIDDEN: User doesn't own scenario and is not admin
 */

/**
 * @swagger
 * /scenarios/{id}:
 *   delete:
 *     tags:
 *       - Scenarios
 *     summary: Delete scenario
 *     description: Delete a scenario. Users can delete scenarios they created, admins can delete any scenario.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique scenario identifier
 *         example: scen_123
 *     responses:
 *       200:
 *         description: GO - Scenario deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MissionControlResponse'
 *             example:
 *               status: GO
 *               code: 200
 *               brief: "Mission scenario deleted. Records archived."
 *               payload:
 *                 data:
 *                   message: "Scenario deleted successfully"
 *                   scenarioId: "scen_123"
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "APOLLO-11"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: NO-GO - Scenario not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: NO-GO
 *               code: 404
 *               brief: "Mission scenario not found in database."
 *               payload:
 *                 error:
 *                   code: "NOT_FOUND"
 *                   message: "Scenario not found"
 *                   details: null
 *               telemetry:
 *                 missionTime: "2025-01-01T00:00:00.000Z"
 *                 operatorCallSign: "APOLLO-11"
 *                 stationId: "GROUNDCTRL-01"
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.delete(
  '/:id',
  validate(z.object({
    body: z.object({}).strict(),
    query: z.object({}).strict(),
    params: z.object({
      id: z.string().min(1, 'Scenario ID is required')
    }).strict()
  })),
  scenarioController.remove
);

module.exports = router;
