/**
 * Satellite Routes
 * Complete CRUD operations for satellite management with ownership scoping
 */

const express = require('express');
const router = express.Router();
const { z } = require('zod');
const satelliteController = require('../controllers/satelliteController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const {
  createSatelliteSchema,
  updateSatelliteSchema,
  patchSatelliteSchema,
  listSatellitesSchema
} = require('../schemas/satelliteSchemas');

// Wrapper schemas for unified validation (body + query + params)
const createSatelliteValidation = z.object({
  body: createSatelliteSchema.shape.body,
  query: z.object({}).strict(),
  params: z.object({}).strict()
});

const updateSatelliteValidation = z.object({
  body: updateSatelliteSchema.shape.body,
  query: z.object({}).strict(),
  params: updateSatelliteSchema.shape.params
});

const patchSatelliteValidation = z.object({
  body: patchSatelliteSchema.shape.body,
  query: z.object({}).strict(),
  params: patchSatelliteSchema.shape.params
});

const listSatellitesValidation = z.object({
  body: z.object({}).strict(),
  query: listSatellitesSchema.shape.query,
  params: z.object({}).strict()
});

const getSatelliteValidation = z.object({
  body: z.object({}).strict(),
  query: z.object({}).strict(),
  params: z.object({
    id: z.string({
      required_error: 'Satellite ID is required',
      invalid_type_error: 'Satellite ID must be a string',
    }).min(1, 'Satellite ID is required'),
  }).strict()
});

const deleteSatelliteValidation = z.object({
  body: z.object({}).strict(),
  query: z.object({}).strict(),
  params: z.object({
    id: z.string({
      required_error: 'Satellite ID is required',
      invalid_type_error: 'Satellite ID must be a string',
    }).min(1, 'Satellite ID is required'),
  }).strict()
});

/**
 * @swagger
 * /satellites:
 *   get:
 *     tags:
 *       - Satellites
 *     summary: List satellites with ownership scoping
 *     description: |
 *       Retrieve a paginated list of satellites. Non-admin users can only see satellites they created.
 *       Admins can see all satellites. Supports filtering by status and sorting.
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
 *           enum: [createdAt, updatedAt, name, status]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED', 'TRAINING']
 *         description: Filter by satellite status
 *     responses:
 *       200:
 *         description: GO - Satellites retrieved successfully
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
 *                             satellites:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/Satellite'
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
 *               brief: "Satellite uplink established. Telemetry nominal."
 *               payload:
 *                 data:
 *                   satellites:
 *                     - id: "sat_123"
 *                       name: "TrainingSat-01"
 *                       description: "ISS-like satellite for training"
 *                       orbit:
 *                         altitude_km: 408
 *                         inclination_degrees: 51.6
 *                       power:
 *                         solarPower_watts: 2.5
 *                         batteryCapacity_wh: 20
 *                         baseDrawRate_watts: 0.5
 *                         currentCharge_percent: 85
 *                       attitude:
 *                         currentTarget: "NADIR"
 *                         error_degrees: 0.5
 *                       thermal:
 *                         currentTemp_celsius: 20
 *                         minSafe_celsius: -20
 *                         maxSafe_celsius: 50
 *                         heaterAvailable: true
 *                       propulsion:
 *                         propellantRemaining_kg: 0.5
 *                         maxDeltaV_ms: 50
 *                       payload:
 *                         type: "Camera"
 *                         isActive: false
 *                         powerDraw_watts: 5
 *                       status: "TRAINING"
 *                       capabilities: ["Power management", "Attitude control"]
 *                       designSource: "ISS-inspired"
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
router.get('/', authMiddleware, validate(listSatellitesValidation), satelliteController.list);

/**
 * @swagger
 * /satellites/{id}:
 *   get:
 *     tags:
 *       - Satellites
 *     summary: Get satellite by ID
 *     description: Retrieve a single satellite by its ID. Non-admin users can only access satellites they created.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique satellite identifier
 *         example: sat_123
 *     responses:
 *       200:
 *         description: GO - Satellite retrieved successfully
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
 *                             satellite:
 *                               $ref: '#/components/schemas/Satellite'
 *             example:
 *               status: GO
 *               code: 200
 *               brief: "Satellite uplink established. Telemetry nominal."
 *               payload:
 *                 data:
 *                   satellite:
 *                     id: "sat_123"
 *                     name: "TrainingSat-01"
 *                     description: "ISS-like satellite for training"
 *                     orbit:
 *                       altitude_km: 408
 *                       inclination_degrees: 51.6
 *                     power:
 *                       solarPower_watts: 2.5
 *                       batteryCapacity_wh: 20
 *                       baseDrawRate_watts: 0.5
 *                       currentCharge_percent: 85
 *                     attitude:
 *                       currentTarget: "NADIR"
 *                       error_degrees: 0.5
 *                     thermal:
 *                       currentTemp_celsius: 20
 *                       minSafe_celsius: -20
 *                       maxSafe_celsius: 50
 *                       heaterAvailable: true
 *                     propulsion:
 *                       propellantRemaining_kg: 0.5
 *                       maxDeltaV_ms: 50
 *                     payload:
 *                       type: "Camera"
 *                       isActive: false
 *                       powerDraw_watts: 5
 *                     status: "TRAINING"
 *                     capabilities: ["Power management", "Attitude control"]
 *                     designSource: "ISS-inspired"
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
 *         description: NO-GO - Satellite not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: NO-GO
 *               code: 404
 *               brief: "Satellite not found in constellation."
 *               payload:
 *                 error:
 *                   code: "NOT_FOUND"
 *                   message: "Satellite not found"
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
router.get('/:id', authMiddleware, validate(getSatelliteValidation), satelliteController.getOne);

/**
 * @swagger
 * /satellites:
 *   post:
 *     tags:
 *       - Satellites
 *     summary: Create new satellite
 *     description: Create a new satellite with complete subsystem configuration. The satellite will be owned by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - orbit
 *               - power
 *               - attitude
 *               - thermal
 *               - propulsion
 *               - payload
 *             properties:
 *               name:
 *                 type: string
 *                 description: Satellite name or designation
 *                 example: "TrainingSat-01"
 *               description:
 *                 type: string
 *                 description: Optional human-readable description
 *                 example: "ISS-like satellite for training"
 *               orbit:
 *                 type: object
 *                 required:
 *                   - altitude_km
 *                   - inclination_degrees
 *                 properties:
 *                   altitude_km:
 *                     type: number
 *                     description: Altitude above Earth mean sea level in kilometers (160-35786)
 *                     example: 408
 *                   inclination_degrees:
 *                     type: number
 *                     description: Orbital plane inclination in degrees (0-180)
 *                     example: 51.6
 *               power:
 *                 type: object
 *                 required:
 *                   - solarPower_watts
 *                   - batteryCapacity_wh
 *                   - baseDrawRate_watts
 *                   - currentCharge_percent
 *                 properties:
 *                   solarPower_watts:
 *                     type: number
 *                     description: Peak power from solar panels in Watts
 *                     example: 2.5
 *                   batteryCapacity_wh:
 *                     type: number
 *                     description: Usable battery energy in Watt-hours
 *                     example: 20
 *                   baseDrawRate_watts:
 *                     type: number
 *                     description: Always-on power draw in Watts
 *                     example: 0.5
 *                   currentCharge_percent:
 *                     type: number
 *                     description: Battery state of charge (0-100%)
 *                     example: 85
 *               attitude:
 *                 type: object
 *                 required:
 *                   - currentTarget
 *                   - error_degrees
 *                 properties:
 *                   currentTarget:
 *                     type: string
 *                     enum: ['NADIR', 'SUN', 'INERTIAL_EAST']
 *                     description: Current pointing target
 *                     example: "NADIR"
 *                   error_degrees:
 *                     type: number
 *                     description: Pointing error from desired target in degrees (0-180)
 *                     example: 0.5
 *               thermal:
 *                 type: object
 *                 required:
 *                   - currentTemp_celsius
 *                   - minSafe_celsius
 *                   - maxSafe_celsius
 *                 properties:
 *                   currentTemp_celsius:
 *                     type: number
 *                     description: Current average satellite temperature in Celsius
 *                     example: 20
 *                   minSafe_celsius:
 *                     type: number
 *                     description: Minimum safe operating temperature in Celsius
 *                     example: -20
 *                   maxSafe_celsius:
 *                     type: number
 *                     description: Maximum safe operating temperature in Celsius
 *                     example: 50
 *                   heaterAvailable:
 *                     type: boolean
 *                     description: Whether an active heater is available
 *                     example: true
 *               propulsion:
 *                 type: object
 *                 required:
 *                   - propellantRemaining_kg
 *                   - maxDeltaV_ms
 *                 properties:
 *                   propellantRemaining_kg:
 *                     type: number
 *                     description: Remaining propellant mass in kilograms
 *                     example: 0.5
 *                   maxDeltaV_ms:
 *                     type: number
 *                     description: Approximate available delta-V in meters per second
 *                     example: 50
 *               payload:
 *                 type: object
 *                 required:
 *                   - type
 *                   - powerDraw_watts
 *                 properties:
 *                   type:
 *                     type: string
 *                     description: Payload type (e.g., Camera, Spectrometer)
 *                     example: "Camera"
 *                   isActive:
 *                     type: boolean
 *                     description: Whether the payload is currently active
 *                     example: false
 *                   powerDraw_watts:
 *                     type: number
 *                     description: Payload power consumption when active in Watts
 *                     example: 5
 *               status:
 *                 type: string
 *                 enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED', 'TRAINING']
 *                 description: Operational/training status
 *                 example: "TRAINING"
 *               capabilities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Capabilities used for filtering
 *                 example: ["Power management", "Attitude control"]
 *               designSource:
 *                 type: string
 *                 description: Reference design source
 *                 example: "ISS-inspired"
 *     responses:
 *       201:
 *         description: GO - Satellite created successfully
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
 *                             satellite:
 *                               $ref: '#/components/schemas/Satellite'
 *             example:
 *               status: GO
 *               code: 201
 *               brief: "New asset deployed to orbit. All systems green."
 *               payload:
 *                 data:
 *                   satellite:
 *                     id: "sat_123"
 *                     name: "TrainingSat-01"
 *                     description: "ISS-like satellite for training"
 *                     orbit:
 *                       altitude_km: 408
 *                       inclination_degrees: 51.6
 *                     power:
 *                       solarPower_watts: 2.5
 *                       batteryCapacity_wh: 20
 *                       baseDrawRate_watts: 0.5
 *                       currentCharge_percent: 85
 *                     attitude:
 *                       currentTarget: "NADIR"
 *                       error_degrees: 0.5
 *                     thermal:
 *                       currentTemp_celsius: 20
 *                       minSafe_celsius: -20
 *                       maxSafe_celsius: 50
 *                       heaterAvailable: true
 *                     propulsion:
 *                       propellantRemaining_kg: 0.5
 *                       maxDeltaV_ms: 50
 *                     payload:
 *                       type: "Camera"
 *                       isActive: false
 *                       powerDraw_watts: 5
 *                     status: "TRAINING"
 *                     capabilities: ["Power management", "Attitude control"]
 *                     designSource: "ISS-inspired"
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
router.post('/', authMiddleware, validate(createSatelliteValidation), satelliteController.create);

/**
 * @swagger
 * /satellites/{id}:
 *   put:
 *     tags:
 *       - Satellites
 *     summary: Replace satellite (full update)
 *     description: Completely replace a satellite's configuration. Non-admin users can only update satellites they created. All fields are required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique satellite identifier
 *         example: sat_123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - orbit
 *               - power
 *               - attitude
 *               - thermal
 *               - propulsion
 *               - payload
 *             properties:
 *               name:
 *                 type: string
 *                 description: Satellite name or designation
 *                 example: "TrainingSat-01"
 *               description:
 *                 type: string
 *                 description: Optional human-readable description
 *                 example: "ISS-like satellite for training"
 *               orbit:
 *                 type: object
 *                 required:
 *                   - altitude_km
 *                   - inclination_degrees
 *                 properties:
 *                   altitude_km:
 *                     type: number
 *                     description: Altitude above Earth mean sea level in kilometers (160-35786)
 *                     example: 408
 *                   inclination_degrees:
 *                     type: number
 *                     description: Orbital plane inclination in degrees (0-180)
 *                     example: 51.6
 *               power:
 *                 type: object
 *                 required:
 *                   - solarPower_watts
 *                   - batteryCapacity_wh
 *                   - baseDrawRate_watts
 *                   - currentCharge_percent
 *                 properties:
 *                   solarPower_watts:
 *                     type: number
 *                     description: Peak power from solar panels in Watts
 *                     example: 2.5
 *                   batteryCapacity_wh:
 *                     type: number
 *                     description: Usable battery energy in Watt-hours
 *                     example: 20
 *                   baseDrawRate_watts:
 *                     type: number
 *                     description: Always-on power draw in Watts
 *                     example: 0.5
 *                   currentCharge_percent:
 *                     type: number
 *                     description: Battery state of charge (0-100%)
 *                     example: 85
 *               attitude:
 *                 type: object
 *                 required:
 *                   - currentTarget
 *                   - error_degrees
 *                 properties:
 *                   currentTarget:
 *                     type: string
 *                     enum: ['NADIR', 'SUN', 'INERTIAL_EAST']
 *                     description: Current pointing target
 *                     example: "NADIR"
 *                   error_degrees:
 *                     type: number
 *                     description: Pointing error from desired target in degrees (0-180)
 *                     example: 0.5
 *               thermal:
 *                 type: object
 *                 required:
 *                   - currentTemp_celsius
 *                   - minSafe_celsius
 *                   - maxSafe_celsius
 *                 properties:
 *                   currentTemp_celsius:
 *                     type: number
 *                     description: Current average satellite temperature in Celsius
 *                     example: 20
 *                   minSafe_celsius:
 *                     type: number
 *                     description: Minimum safe operating temperature in Celsius
 *                     example: -20
 *                   maxSafe_celsius:
 *                     type: number
 *                     description: Maximum safe operating temperature in Celsius
 *                     example: 50
 *                   heaterAvailable:
 *                     type: boolean
 *                     description: Whether an active heater is available
 *                     example: true
 *               propulsion:
 *                 type: object
 *                 required:
 *                   - propellantRemaining_kg
 *                   - maxDeltaV_ms
 *                 properties:
 *                   propellantRemaining_kg:
 *                     type: number
 *                     description: Remaining propellant mass in kilograms
 *                     example: 0.5
 *                   maxDeltaV_ms:
 *                     type: number
 *                     description: Approximate available delta-V in meters per second
 *                     example: 50
 *               payload:
 *                 type: object
 *                 required:
 *                   - type
 *                   - powerDraw_watts
 *                 properties:
 *                   type:
 *                     type: string
 *                     description: Payload type (e.g., Camera, Spectrometer)
 *                     example: "Camera"
 *                   isActive:
 *                     type: boolean
 *                     description: Whether the payload is currently active
 *                     example: false
 *                   powerDraw_watts:
 *                     type: number
 *                     description: Payload power consumption when active in Watts
 *                     example: 5
 *               status:
 *                 type: string
 *                 enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED', 'TRAINING']
 *                 description: Operational/training status
 *                 example: "TRAINING"
 *               capabilities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Capabilities used for filtering
 *                 example: ["Power management", "Attitude control"]
 *               designSource:
 *                 type: string
 *                 description: Reference design source
 *                 example: "ISS-inspired"
 *     responses:
 *       200:
 *         description: GO - Satellite updated successfully
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
 *                             satellite:
 *                               $ref: '#/components/schemas/Satellite'
 *             example:
 *               status: GO
 *               code: 200
 *               brief: "Satellite uplink established. Telemetry nominal."
 *               payload:
 *                 data:
 *                   satellite:
 *                     id: "sat_123"
 *                     name: "TrainingSat-01"
 *                     description: "ISS-like satellite for training"
 *                     orbit:
 *                       altitude_km: 408
 *                       inclination_degrees: 51.6
 *                     power:
 *                       solarPower_watts: 2.5
 *                       batteryCapacity_wh: 20
 *                       baseDrawRate_watts: 0.5
 *                       currentCharge_percent: 85
 *                     attitude:
 *                       currentTarget: "NADIR"
 *                       error_degrees: 0.5
 *                     thermal:
 *                       currentTemp_celsius: 20
 *                       minSafe_celsius: -20
 *                       maxSafe_celsius: 50
 *                       heaterAvailable: true
 *                     propulsion:
 *                       propellantRemaining_kg: 0.5
 *                       maxDeltaV_ms: 50
 *                     payload:
 *                       type: "Camera"
 *                       isActive: false
 *                       powerDraw_watts: 5
 *                     status: "TRAINING"
 *                     capabilities: ["Power management", "Attitude control"]
 *                     designSource: "ISS-inspired"
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
 *         description: NO-GO - Satellite not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: NO-GO
 *               code: 404
 *               brief: "Satellite not found in constellation."
 *               payload:
 *                 error:
 *                   code: "NOT_FOUND"
 *                   message: "Satellite not found"
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
router.put('/:id', authMiddleware, validate(updateSatelliteValidation), satelliteController.update);

/**
 * @swagger
 * /satellites/{id}:
 *   patch:
 *     tags:
 *       - Satellites
 *     summary: Update satellite (partial)
 *     description: Partially update a satellite's configuration. Non-admin users can only update satellites they created. At least one field must be provided.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique satellite identifier
 *         example: sat_123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Satellite name or designation
 *                 example: "TrainingSat-01"
 *               description:
 *                 type: string
 *                 description: Optional human-readable description
 *                 example: "ISS-like satellite for training"
 *               orbit:
 *                 type: object
 *                 properties:
 *                   altitude_km:
 *                     type: number
 *                     description: Altitude above Earth mean sea level in kilometers (160-35786)
 *                     example: 408
 *                   inclination_degrees:
 *                     type: number
 *                     description: Orbital plane inclination in degrees (0-180)
 *                     example: 51.6
 *               power:
 *                 type: object
 *                 properties:
 *                   solarPower_watts:
 *                     type: number
 *                     description: Peak power from solar panels in Watts
 *                     example: 2.5
 *                   batteryCapacity_wh:
 *                     type: number
 *                     description: Usable battery energy in Watt-hours
 *                     example: 20
 *                   baseDrawRate_watts:
 *                     type: number
 *                     description: Always-on power draw in Watts
 *                     example: 0.5
 *                   currentCharge_percent:
 *                     type: number
 *                     description: Battery state of charge (0-100%)
 *                     example: 85
 *               attitude:
 *                 type: object
 *                 properties:
 *                   currentTarget:
 *                     type: string
 *                     enum: ['NADIR', 'SUN', 'INERTIAL_EAST']
 *                     description: Current pointing target
 *                     example: "NADIR"
 *                   error_degrees:
 *                     type: number
 *                     description: Pointing error from desired target in degrees (0-180)
 *                     example: 0.5
 *               thermal:
 *                 type: object
 *                 properties:
 *                   currentTemp_celsius:
 *                     type: number
 *                     description: Current average satellite temperature in Celsius
 *                     example: 20
 *                   minSafe_celsius:
 *                     type: number
 *                     description: Minimum safe operating temperature in Celsius
 *                     example: -20
 *                   maxSafe_celsius:
 *                     type: number
 *                     description: Maximum safe operating temperature in Celsius
 *                     example: 50
 *                   heaterAvailable:
 *                     type: boolean
 *                     description: Whether an active heater is available
 *                     example: true
 *               propulsion:
 *                 type: object
 *                 properties:
 *                   propellantRemaining_kg:
 *                     type: number
 *                     description: Remaining propellant mass in kilograms
 *                     example: 0.5
 *                   maxDeltaV_ms:
 *                     type: number
 *                     description: Approximate available delta-V in meters per second
 *                     example: 50
 *               payload:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     description: Payload type (e.g., Camera, Spectrometer)
 *                     example: "Camera"
 *                   isActive:
 *                     type: boolean
 *                     description: Whether the payload is currently active
 *                     example: false
 *                   powerDraw_watts:
 *                     type: number
 *                     description: Payload power consumption when active in Watts
 *                     example: 5
 *               status:
 *                 type: string
 *                 enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED', 'TRAINING']
 *                 description: Operational/training status
 *                 example: "TRAINING"
 *               capabilities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Capabilities used for filtering
 *                 example: ["Power management", "Attitude control"]
 *               designSource:
 *                 type: string
 *                 description: Reference design source
 *                 example: "ISS-inspired"
 *     responses:
 *       200:
 *         description: GO - Satellite updated successfully
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
 *                             satellite:
 *                               $ref: '#/components/schemas/Satellite'
 *             example:
 *               status: GO
 *               code: 200
 *               brief: "Satellite uplink established. Telemetry nominal."
 *               payload:
 *                 data:
 *                   satellite:
 *                     id: "sat_123"
 *                     name: "TrainingSat-01"
 *                     description: "ISS-like satellite for training"
 *                     orbit:
 *                       altitude_km: 408
 *                       inclination_degrees: 51.6
 *                     power:
 *                       solarPower_watts: 2.5
 *                       batteryCapacity_wh: 20
 *                       baseDrawRate_watts: 0.5
 *                       currentCharge_percent: 85
 *                     attitude:
 *                       currentTarget: "NADIR"
 *                       error_degrees: 0.5
 *                     thermal:
 *                       currentTemp_celsius: 20
 *                       minSafe_celsius: -20
 *                       maxSafe_celsius: 50
 *                       heaterAvailable: true
 *                     propulsion:
 *                       propellantRemaining_kg: 0.5
 *                       maxDeltaV_ms: 50
 *                     payload:
 *                       type: "Camera"
 *                       isActive: false
 *                       powerDraw_watts: 5
 *                     status: "TRAINING"
 *                     capabilities: ["Power management", "Attitude control"]
 *                     designSource: "ISS-inspired"
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
 *         description: NO-GO - Satellite not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: NO-GO
 *               code: 404
 *               brief: "Satellite not found in constellation."
 *               payload:
 *                 error:
 *                   code: "NOT_FOUND"
 *                   message: "Satellite not found"
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
router.patch('/:id', authMiddleware, validate(patchSatelliteValidation), satelliteController.patch);

/**
 * @swagger
 * /satellites/{id}:
 *   delete:
 *     tags:
 *       - Satellites
 *     summary: Delete satellite
 *     description: Delete a satellite. Users can delete satellites they created, admins can delete any satellite.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique satellite identifier
 *         example: sat_123
 *     responses:
 *       200:
 *         description: GO - Satellite deleted successfully
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
 *                   message: "Satellite deleted successfully"
 *                   satelliteId: "sat_123"
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
 *         description: NO-GO - Satellite not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: NO-GO
 *               code: 404
 *               brief: "Satellite not found in constellation."
 *               payload:
 *                 error:
 *                   code: "NOT_FOUND"
 *                   message: "Satellite not found"
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
router.delete('/:id', authMiddleware, validate(deleteSatelliteValidation), satelliteController.remove);

module.exports = router;
