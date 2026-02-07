/**
 * Health Check Routes
 * Simple health check endpoints to verify API and database are operational
 * Uses Mission Control GO/HOLD terminology
 *
 * Best Practices Implemented:
 * - Liveness probes (is the service running?)
 * - Readiness probes (is the service ready to accept traffic?)
 * - Database connectivity checks with latency measurement
 * - Kubernetes/Docker container orchestration compatible
 *
 * @swagger
 * tags:
 *   name: Health
 *   description: System health and status monitoring endpoints. These endpoints are public and do not require authentication.
 *
 * @swagger
 * components:
 *   schemas:
 *     HealthStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [GO, NO-GO, HOLD, ABORT]
 *           description: Overall health status
 *           example: GO
 *         statusDetail:
 *           type: string
 *           description: Detailed status description
 *           example: All systems operational
 *         service:
 *           type: string
 *           description: Service name
 *           example: GroundCTRL API
 *         version:
 *           type: string
 *           description: Service version
 *           example: "1.4.0"
 *         station:
 *           type: string
 *           description: Ground station identifier
 *           example: GROUNDCTRL-01
 *         uptime:
 *           type: integer
 *           description: Service uptime in seconds
 *           example: 3600
 *         uptimeFormatted:
 *           type: string
 *           description: Human-readable uptime
 *           example: "1h 0m 0s"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Health check timestamp
 *           example: "2026-01-10T20:00:00.000Z"
 *         environment:
 *           type: string
 *           description: Deployment environment
 *           example: development
 *     DatabaseHealthStatus:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [GO, NO-GO, HOLD, ABORT]
 *           description: Database health status
 *           example: GO
 *         statusDetail:
 *           type: string
 *           description: Detailed database status
 *           example: Database responding normally
 *         database:
 *           type: string
 *           description: Database type
 *           example: Firebase Firestore
 *         service:
 *           type: string
 *           description: Service name
 *           example: GroundCTRL API
 *         station:
 *           type: string
 *           description: Ground station identifier
 *           example: GROUNDCTRL-01
 *         latency:
 *           type: object
 *           properties:
 *             ms:
 *               type: integer
 *               description: Response latency in milliseconds
 *               example: 45
 *             threshold:
 *               type: integer
 *               description: Acceptable latency threshold in milliseconds
 *               example: 100
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Database health check timestamp
 *           example: "2026-01-10T20:00:00.000Z"
 */

const express = require("express");
const router = express.Router();
const responseFactory = require("../factories/responseFactory");
const missionControl = require("../config/missionControl");

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Basic health check
 *     description: |
 *       Returns basic health status of the API service.
 *       This endpoint is public and does not require authentication.
 *
 *       **Use Cases:**
 *       - Load balancer health checks
 *       - Basic uptime monitoring
 *       - Service discovery health verification
 *     operationId: getHealth
 *     responses:
 *       200:
 *         description: GO - Service is operational
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
 *                           $ref: '#/components/schemas/HealthStatus'
 *             example:
 *               status: GO
 *               code: 200
 *               brief: Mission systems nominal. All stations report GO.
 *               payload:
 *                 data:
 *                   status: GO
 *                   statusDetail: All systems operational
 *                   service: GroundCTRL API
 *                   version: "1.4.0"
 *                   station: GROUNDCTRL-01
 *                   uptime: 3600
 *                   uptimeFormatted: "1h 0m 0s"
 *                   timestamp: "2026-01-10T20:00:00.000Z"
 *                   environment: development
 *               telemetry:
 *                 missionTime: "2026-01-10T20:00:00.000Z"
 *                 operatorCallSign: SYSTEM
 *                 stationId: GROUNDCTRL-01
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 */
router.get("/", (req, res) => {
	// Set security headers directly
	res.setHeader("X-Content-Type-Options", "nosniff");
	res.setHeader("X-Frame-Options", "DENY");
	res.setHeader("X-XSS-Protection", "1; mode=block");
	res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
	// Check Firebase initialization status from app.locals
	const firebaseInitialized = req.app.locals.firebaseInitialized !== false;

	const healthData = {
		status: "GO",
		statusDetail: firebaseInitialized
			? "All systems operational"
			: "Running in degraded mode (Firebase unavailable)",
		service: "GroundCTRL API",
		version: missionControl.version,
		station: missionControl.stationId,
		uptime: process.uptime(),
		uptimeFormatted: formatUptime(process.uptime()),
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV || "development",
		firebase: {
			initialized: firebaseInitialized,
			status: firebaseInitialized ? "connected" : "failed",
		},
	};

	const response = responseFactory.createSuccessResponse(healthData, {
		callSign: "SYSTEM",
		requestId: req.id,
	});

	res.status(200).json(response);
});

/**
 * @swagger
 * /health/db:
 *   get:
 *     tags:
 *       - Health
 *     summary: Database health check
 *     description: |
 *       Checks database connectivity and measures response latency.
 *       This endpoint is public and does not require authentication.
 *
 *       **Status Codes:**
 *       - **GO**: Database responding normally (< 500ms)
 *       - **HOLD**: Database responding slowly (> 1000ms)
 *       - **NO-GO**: Database connection failed
 *
 *       **Latency Thresholds:**
 *       - Optimal: < 500ms
 *       - Acceptable: 500-1000ms
 *       - Degraded: > 1000ms
 *     operationId: getDbHealth
 *     responses:
 *       200:
 *         description: GO - Database is connected and responsive
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
 *                           $ref: '#/components/schemas/DatabaseHealthStatus'
 *             example:
 *               status: GO
 *               code: 200
 *               brief: Database telemetry nominal. Connection established.
 *               payload:
 *                 data:
 *                   status: GO
 *                   statusDetail: Database responding normally
 *                   database: Firebase Firestore
 *                   service: GroundCTRL API
 *                   station: GROUNDCTRL-01
 *                   latency:
 *                     ms: 45
 *                     threshold:
 *                       optimal: "< 500ms"
 *                       acceptable: "500-1000ms"
 *                       degraded: "> 1000ms"
 *                   timestamp: "2026-01-10T20:00:00.000Z"
 *               telemetry:
 *                 missionTime: "2026-01-10T20:00:00.000Z"
 *                 operatorCallSign: SYSTEM
 *                 stationId: GROUNDCTRL-01
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       503:
 *         description: NO-GO - Database connection failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: NO-GO
 *               code: 503
 *               brief: Database telemetry lost. Connection failed.
 *               payload:
 *                 error:
 *                   code: DATABASE_CONNECTION_ERROR
 *                   message: Database health check failed
 *                   details:
 *                     status: NO-GO
 *                     statusDetail: Database connection failed
 *                     database: Firebase Firestore
 *                     error:
 *                       message: Connection timeout
 *                       code: TIMEOUT
 *               telemetry:
 *                 missionTime: "2026-01-10T20:00:00.000Z"
 *                 operatorCallSign: SYSTEM
 *                 stationId: GROUNDCTRL-01
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 */
router.get("/db", async (req, res) => {
	const startTime = Date.now();

	try {
		// Check Firebase connection
		const admin = require("firebase-admin");
		const db = admin.firestore();

		// Simple connectivity test with timing
		await db.collection("_health_check").limit(1).get();

		const latencyMs = Date.now() - startTime;

		// Determine status based on latency
		let status = "GO";
		let statusDetail = "Database responding normally";

		if (latencyMs > 1000) {
			status = "HOLD";
			statusDetail = "Database responding slowly";
		} else if (latencyMs > 500) {
			status = "GO";
			statusDetail = "Database responding (elevated latency)";
		}

		const dbHealthData = {
			status,
			statusDetail,
			database: "Firebase Firestore",
			service: "GroundCTRL API",
			station: missionControl.stationId,
			latency: {
				ms: latencyMs,
				threshold: {
					optimal: "< 500ms",
					acceptable: "500-1000ms",
					degraded: "> 1000ms",
				},
			},
			timestamp: new Date().toISOString(),
		};

		const response = responseFactory.createSuccessResponse(dbHealthData, {
			callSign: "SYSTEM",
			requestId: req.id,
		});

		res.status(200).json(response);
	} catch (error) {
		const latencyMs = Date.now() - startTime;

		const errorData = {
			status: "NO-GO",
			statusDetail: "Database connection failed",
			database: "Firebase Firestore",
			error: {
				message: error.message,
				code: error.code || "UNKNOWN",
			},
			latency: {
				ms: latencyMs,
				note: "Time until failure",
			},
			timestamp: new Date().toISOString(),
		};

		const response = responseFactory.createErrorResponse(
			{
				statusCode: 503,
				code: "DATABASE_CONNECTION_ERROR",
				message: "Database health check failed",
				details: errorData,
			},
			{
				callSign: "SYSTEM",
				requestId: req.id,
			},
		);

		res.status(503).json(response);
	}
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     tags:
 *       - Health
 *     summary: Readiness probe
 *     description: |
 *       Checks if the service is ready to accept traffic.
 *       This endpoint is designed for Kubernetes/Docker container orchestration.
 *
 *       **Checks Performed:**
 *       - API responsiveness
 *       - Database connectivity
 *
 *       **Use Cases:**
 *       - Kubernetes readinessProbe
 *       - Load balancer backend health
 *       - Service mesh health checks
 *       - Rolling deployment validation
 *
 *       Returns 200 only when ALL checks pass.
 *       Returns 503 if any check fails.
 *     operationId: getReadiness
 *     responses:
 *       200:
 *         description: GO - All systems ready to accept traffic
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
 *                           $ref: '#/components/schemas/ReadinessStatus'
 *             example:
 *               status: GO
 *               code: 200
 *               brief: All systems GO. Ready for operations.
 *               payload:
 *                 data:
 *                   status: GO
 *                   statusDetail: All systems ready
 *                   checks:
 *                     api:
 *                       status: GO
 *                       latencyMs: 0
 *                     database:
 *                       status: GO
 *                       latencyMs: 42
 *                   service: GroundCTRL API
 *                   station: GROUNDCTRL-01
 *                   timestamp: "2026-01-10T20:00:00.000Z"
 *               telemetry:
 *                 missionTime: "2026-01-10T20:00:00.000Z"
 *                 operatorCallSign: SYSTEM
 *                 stationId: GROUNDCTRL-01
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 *       503:
 *         description: NO-GO - One or more systems not ready
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
 *                           $ref: '#/components/schemas/ReadinessStatus'
 *             example:
 *               status: GO
 *               code: 200
 *               brief: Systems check failed. Not ready for operations.
 *               payload:
 *                 data:
 *                   status: NO-GO
 *                   statusDetail: Some systems unavailable
 *                   checks:
 *                     api:
 *                       status: GO
 *                       latencyMs: 0
 *                     database:
 *                       status: NO-GO
 *                       latencyMs: 5000
 *                       error: Connection timeout
 *                   service: GroundCTRL API
 *                   station: GROUNDCTRL-01
 *                   timestamp: "2026-01-10T20:00:00.000Z"
 *               telemetry:
 *                 missionTime: "2026-01-10T20:00:00.000Z"
 *                 operatorCallSign: SYSTEM
 *                 stationId: GROUNDCTRL-01
 *                 requestId: "123e4567-e89b-12d3-a456-426614174000"
 *               timestamp: 1704067200000
 */
router.get("/ready", async (req, res) => {
	const checks = {
		api: { status: "GO", latencyMs: 0 },
		database: { status: "CHECKING", latencyMs: null },
	};

	// Check database
	const dbStart = Date.now();
	try {
		const admin = require("firebase-admin");
		const db = admin.firestore();
		await db.collection("_health_check").limit(1).get();
		checks.database = {
			status: "GO",
			latencyMs: Date.now() - dbStart,
		};
	} catch (error) {
		checks.database = {
			status: "NO-GO",
			latencyMs: Date.now() - dbStart,
			error: error.message,
		};
	}

	// Determine overall status
	const allGo = Object.values(checks).every((c) => c.status === "GO");
	const overallStatus = allGo ? "GO" : "NO-GO";

	const readyData = {
		status: overallStatus,
		statusDetail: allGo ? "All systems ready" : "Some systems unavailable",
		checks,
		service: "GroundCTRL API",
		station: missionControl.stationId,
		timestamp: new Date().toISOString(),
	};

	const statusCode = allGo ? 200 : 503;

	const response = responseFactory.createSuccessResponse(readyData, {
		callSign: "SYSTEM",
		requestId: req.id,
	});

	res.status(statusCode).json(response);
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     tags:
 *       - Health
 *     summary: Liveness probe
 *     description: |
 *       Simple check that the service process is running.
 *       This endpoint is designed for Kubernetes/Docker container orchestration.
 *
 *       **Characteristics:**
 *       - Minimal processing (fast response)
 *       - No external dependencies checked
 *       - Returns 200 if the Node.js process is responsive
 *
 *       **Use Cases:**
 *       - Kubernetes livenessProbe
 *       - Container restart decisions
 *       - Process health verification
 *
 *       If this endpoint fails to respond, the container should be restarted.
 *     operationId: getLiveness
 *     responses:
 *       200:
 *         description: GO - Service process is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [GO]
 *                   example: GO
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-01-10T20:00:00.000Z"
 *             example:
 *               status: GO
 *               timestamp: "2026-01-10T20:00:00.000Z"
 */
router.get("/live", (req, res) => {
	res.status(200).json({
		status: "GO",
		timestamp: new Date().toISOString(),
	});
});

/**
 * Format uptime in human-readable format
 * @param {number} uptimeSeconds - Uptime in seconds
 * @returns {string} Formatted uptime string
 */
function formatUptime(uptimeSeconds) {
	const days = Math.floor(uptimeSeconds / 86400);
	const hours = Math.floor((uptimeSeconds % 86400) / 3600);
	const minutes = Math.floor((uptimeSeconds % 3600) / 60);
	const seconds = Math.floor(uptimeSeconds % 60);

	const parts = [];
	if (days > 0) parts.push(`${days}d`);
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	parts.push(`${seconds}s`);

	return parts.join(" ");
}

module.exports = router;
