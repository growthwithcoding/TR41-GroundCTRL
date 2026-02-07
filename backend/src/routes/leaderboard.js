/**
 * Leaderboard Routes
 *
 * API endpoints for leaderboard data
 */

const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { createRateLimiter } = require("../middleware/rateLimiter");
const leaderboardService = require("../services/leaderboardService");
const responseFactory = require("../factories/responseFactory");
const httpStatus = require("../constants/httpStatus");
const logger = require("../utils/logger");

// Rate limiter for leaderboard queries (more lenient than other endpoints)
const leaderboardLimiter = createRateLimiter({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 30, // 30 requests per minute
	message: "Too many leaderboard requests. Please try again later.",
	standardHeaders: true,
	legacyHeaders: false,
});

/**
 * @swagger
 * /leaderboard/global:
 *   get:
 *     summary: Get global leaderboard rankings
 *     description: Retrieve operator rankings with optional time period filtering and user rank inclusion
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, all-time]
 *           default: all-time
 *         description: Time period for rankings
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 500
 *           default: 100
 *         description: Maximum number of operators to return
 *       - in: query
 *         name: includeUser
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include authenticated user's rank and nearby operators
 *     responses:
 *       200:
 *         description: GO - Leaderboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/MissionControlResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       $ref: '#/components/schemas/LeaderboardResponse'
 *       400:
 *         description: NO-GO - Invalid period parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         description: ABORT - Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
	"/global",
	leaderboardLimiter,
	authMiddleware,
	async (req, res, next) => {
		// Declare variables at function scope for catch block access
		let period = "all-time";
		let limitNum = 100;

		try {
			const {
				period: periodParam = "all-time",
				limit = "100",
				includeUser = "true",
			} = req.query;
			period = periodParam;
			const userId = req.user?.uid;

			// Log incoming request for debugging
			logger.debug("Global leaderboard request", {
				period,
				limit,
				includeUser,
				userId,
			});

			// Validate period
			const validPeriods = ["today", "week", "month", "all-time"];
			if (!validPeriods.includes(period)) {
				logger.warn("Invalid period provided", { period, validPeriods });
				const response = responseFactory.createErrorResponse(
					{
						statusCode: httpStatus.BAD_REQUEST,
						code: "INVALID_PERIOD",
						message: `Invalid period. Must be one of: ${validPeriods.join(", ")}`,
					},
					{
						callSign: req.callSign || "SYSTEM",
						requestId: req.id,
					},
				);
				return res.status(httpStatus.BAD_REQUEST).json(response);
			}

			// Validate and cap limit - ensure it's a valid number
			const parsedLimit = parseInt(limit);
			if (isNaN(parsedLimit)) {
				logger.warn("Invalid limit provided, using default", { limit });
				limitNum = 100;
			} else {
				limitNum = Math.min(Math.max(parsedLimit, 1), 500);
			}

			logger.debug("Validated parameters", { period, limitNum, includeUser });

			// Fetch leaderboard data
			let leaderboard;
			if (includeUser === "true" && userId) {
				leaderboard = await leaderboardService.getLeaderboardWithUserRank(
					userId,
					{
						period,
						limit: limitNum,
					},
				);
			} else {
				leaderboard = await leaderboardService.getGlobalLeaderboard({
					period,
					limit: limitNum,
				});
			}

			// Log audit event
			logger.audit("Leaderboard accessed", {
				userId: userId || "anonymous",
				period,
				limit: limitNum,
				ipAddress: req.ip,
			});

			const response = responseFactory.createSuccessResponse(leaderboard, {
				callSign: req.callSign || "SYSTEM",
				requestId: req.id,
			});

			res.json(response);
		} catch (error) {
			logger.error("Error fetching global leaderboard", {
				error: error.message,
				stack: error.stack,
				userId: req.user?.uid,
				period,
				limit: limitNum,
			});

			// Return graceful error response instead of cascading
			const response = responseFactory.createErrorResponse(
				{
					statusCode: httpStatus.INTERNAL_SERVER_ERROR,
					code: "LEADERBOARD_ERROR",
					message: "Unable to fetch leaderboard data. Please try again later.",
				},
				{
					callSign: req.callSign || "SYSTEM",
					requestId: req.id,
				},
			);
			return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(response);
		}
	},
);

/**
 * @swagger
 * /leaderboard/scenario/{scenarioId}:
 *   get:
 *     summary: Get scenario-specific leaderboard
 *     description: Retrieve operator rankings for a specific mission scenario
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scenarioId
 *         required: true
 *         schema:
 *           type: string
 *         description: Scenario identifier
 *         example: scen_123
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 500
 *           default: 100
 *         description: Maximum number of operators to return
 *     responses:
 *       200:
 *         description: GO - Scenario leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/MissionControlResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       $ref: '#/components/schemas/ScenarioLeaderboard'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         description: ABORT - Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
	"/scenario/:scenarioId",
	leaderboardLimiter,
	authMiddleware,
	async (req, res, next) => {
		// Declare variables at function scope for catch block access
		let limitNum = 100;

		try {
			const { scenarioId } = req.params;
			const { limit = "100" } = req.query;

			// Log incoming request for debugging
			logger.debug("Scenario leaderboard request", { scenarioId, limit });

			// Validate scenarioId
			if (!scenarioId || typeof scenarioId !== "string") {
				logger.warn("Invalid scenarioId provided", { scenarioId });
				const response = responseFactory.createErrorResponse(
					{
						statusCode: httpStatus.BAD_REQUEST,
						code: "INVALID_SCENARIO_ID",
						message: "Valid scenario ID required",
					},
					{
						callSign: req.callSign || "SYSTEM",
						requestId: req.id,
					},
				);
				return res.status(httpStatus.BAD_REQUEST).json(response);
			}

			// Validate and cap limit - ensure it's a valid number
			const parsedLimit = parseInt(limit);
			if (isNaN(parsedLimit)) {
				logger.warn("Invalid limit provided, using default", { limit });
				limitNum = 100;
			} else {
				limitNum = Math.min(Math.max(parsedLimit, 1), 500);
			}

			logger.debug("Validated parameters", { scenarioId, limitNum });

			// Fetch scenario leaderboard
			const leaderboard = await leaderboardService.getScenarioLeaderboard(
				scenarioId,
				{
					limit: limitNum,
				},
			);

			// Log audit event
			logger.audit("Scenario leaderboard accessed", {
				userId: req.user?.uid || "anonymous",
				scenarioId,
				limit: limitNum,
				ipAddress: req.ip,
			});

			const response = responseFactory.createSuccessResponse(leaderboard, {
				callSign: req.callSign || "SYSTEM",
				requestId: req.id,
			});

			res.json(response);
		} catch (error) {
			logger.error("Error fetching scenario leaderboard", {
				error: error.message,
				stack: error.stack,
				scenarioId: req.params.scenarioId,
				limit: limitNum,
			});

			// Return graceful error response
			const response = responseFactory.createErrorResponse(
				{
					statusCode: httpStatus.INTERNAL_SERVER_ERROR,
					code: "LEADERBOARD_ERROR",
					message:
						"Unable to fetch scenario leaderboard. Please try again later.",
				},
				{
					callSign: req.callSign || "SYSTEM",
					requestId: req.id,
				},
			);
			return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(response);
		}
	},
);

/**
 * @swagger
 * /leaderboard/user/rank:
 *   get:
 *     summary: Get user rank summary
 *     description: Retrieve authenticated user's ranking across all time periods (today, week, month, all-time)
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: GO - User rank summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/MissionControlResponse'
 *                 - type: object
 *                   properties:
 *                     payload:
 *                       $ref: '#/components/schemas/UserRankSummary'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         description: ABORT - Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
	"/user/rank",
	leaderboardLimiter,
	authMiddleware,
	async (req, res, next) => {
		try {
			const userId = req.user?.uid;

			if (!userId) {
				const response = responseFactory.createErrorResponse(
					{
						statusCode: httpStatus.UNAUTHORIZED,
						code: "UNAUTHORIZED",
						message: "Authentication required",
					},
					{
						callSign: req.callSign || "SYSTEM",
						requestId: req.id,
					},
				);
				return res.status(httpStatus.UNAUTHORIZED).json(response);
			}

			// Fetch user rank summary
			const rankSummary = await leaderboardService.getUserRankSummary(userId);

			const response = responseFactory.createSuccessResponse(rankSummary, {
				callSign: req.callSign || "SYSTEM",
				requestId: req.id,
			});

			res.json(response);
		} catch (error) {
			logger.error("Error fetching user rank", {
				error: error.message,
				stack: error.stack,
				userId: req.user?.uid,
			});

			// Return graceful error response
			const response = responseFactory.createErrorResponse(
				{
					statusCode: httpStatus.INTERNAL_SERVER_ERROR,
					code: "LEADERBOARD_ERROR",
					message: "Unable to fetch user rank. Please try again later.",
				},
				{
					callSign: req.callSign || "SYSTEM",
					requestId: req.id,
				},
			);
			return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(response);
		}
	},
);

/**
 * @swagger
 * /leaderboard/cache/clear:
 *   post:
 *     summary: Clear leaderboard cache (Admin only)
 *     description: Manually clear the in-memory leaderboard cache. Requires admin privileges.
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: GO - Cache cleared successfully
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
 *                         message:
 *                           type: string
 *                           example: Cache cleared successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: ABORT - Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/cache/clear", authMiddleware, async (req, res, next) => {
	try {
		// Check if user is admin
		if (!req.user?.isAdmin) {
			const response = responseFactory.createErrorResponse(
				{
					statusCode: httpStatus.FORBIDDEN,
					code: "FORBIDDEN",
					message: "Admin access required",
				},
				{
					callSign: req.callSign || "SYSTEM",
					requestId: req.id,
				},
			);
			return res.status(httpStatus.FORBIDDEN).json(response);
		}

		// Clear cache
		leaderboardService.clearCache();

		logger.audit("Leaderboard cache cleared", {
			userId: req.user.uid,
			ipAddress: req.ip,
		});

		const response = responseFactory.createSuccessResponse(
			{ message: "Cache cleared successfully" },
			{
				callSign: req.callSign || "SYSTEM",
				requestId: req.id,
			},
		);

		res.json(response);
	} catch (error) {
		logger.error("Error clearing leaderboard cache", {
			error: error.message,
			stack: error.stack,
			userId: req.user?.uid,
		});

		// Return graceful error response
		const response = responseFactory.createErrorResponse(
			{
				statusCode: httpStatus.INTERNAL_SERVER_ERROR,
				code: "CACHE_CLEAR_ERROR",
				message: "Unable to clear cache. Please try again later.",
			},
			{
				callSign: req.callSign || "SYSTEM",
				requestId: req.id,
			},
		);
		return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(response);
	}
});

module.exports = router;
