/**
 * Leaderboard Repository
 *
 * Handles Firestore queries for leaderboard data aggregation
 * Provides efficient queries for rankings and statistics
 */

const { db } = require("../config/firebase");
const logger = require("../utils/logger");

/**
 * Validate Firebase emulator configuration in test/CI environments
 */
function validateEmulatorConfig() {
	if (process.env.NODE_ENV === "test" || process.env.CI) {
		if (!process.env.FIRESTORE_EMULATOR_HOST) {
			logger.warn("FIRESTORE_EMULATOR_HOST not set in test/CI environment");
		}
		if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
			logger.warn("FIREBASE_AUTH_EMULATOR_HOST not set in test/CI environment");
		}
	}
}

// Validate on module load
validateEmulatorConfig();

/**
 * Get top operators by average performance score
 *
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of results (default: 100)
 * @param {string} options.period - Time period filter ('today', 'week', 'month', 'all-time')
 * @returns {Promise<Array>} Array of operator data with rankings
 */
async function getTopOperators(options = {}) {
	const { limit = 100, period = "all-time" } = options;

	try {
		logger.debug("Fetching top operators", { limit, period });

		// Validate inputs
		if (typeof limit !== "number" || limit < 1) {
			logger.warn("Invalid limit provided, using default", { limit });
			return [];
		}

		// Calculate date threshold based on period
		const dateThreshold = getDateThreshold(period);

		// Query scenario sessions for completed missions
		let query = db
			.collection("scenarioSessions")
			.where("status", "==", "completed");

		if (dateThreshold) {
			query = query.where("endTime", ">=", dateThreshold.toISOString());
		}

		const snapshot = await query.get();

		// Handle empty results gracefully
		if (snapshot.empty) {
			logger.info("No completed sessions found for leaderboard", { period });
			return [];
		}

		// Aggregate scores by user
		const userStats = {};

		snapshot.forEach((doc) => {
			const session = doc.data();
			const userId = session.userId;

			if (!userId) return;

			if (!userStats[userId]) {
				userStats[userId] = {
					userId,
					callSign: session.userCallSign || "Operator",
					totalScore: 0,
					totalMissions: 0,
					scores: [],
				};
			}

			const score = session.performance?.overallScore || 0;
			userStats[userId].totalScore += score;
			userStats[userId].totalMissions += 1;
			userStats[userId].scores.push(score);
		});

		// Calculate averages and sort
		const operators = Object.values(userStats)
			.map((user) => ({
				id: user.userId,
				callSign: user.callSign,
				score: Math.round(user.totalScore / user.totalMissions),
				missionsCompleted: user.totalMissions,
				bestScore: Math.max(...user.scores),
				worstScore: Math.min(...user.scores),
			}))
			.sort((a, b) => b.score - a.score)
			.slice(0, limit)
			.map((operator, index) => ({
				...operator,
				rank: index + 1,
			}));

		logger.info(`Retrieved ${operators.length} operators for leaderboard`);
		return operators;
	} catch (error) {
		logger.error("Error fetching top operators", {
			error: error.message,
			stack: error.stack,
			limit,
			period,
		});
		// Return empty array instead of throwing to prevent cascade failures
		return [];
	}
}

/**
 * Get user's rank and statistics
 *
 * @param {string} userId - User ID
 * @param {string} period - Time period filter
 * @returns {Promise<Object>} User rank data
 */
async function getUserRank(userId, period = "all-time") {
	try {
		logger.debug("Fetching user rank", { userId, period });

		// Get all operators to calculate rank
		const allOperators = await getTopOperators({ limit: 10000, period });

		// Find user in the list
		const userIndex = allOperators.findIndex((op) => op.id === userId);

		if (userIndex === -1) {
			// User has no completed missions
			return null;
		}

		const userRank = allOperators[userIndex];
		const totalOperators = allOperators.length;
		const percentile = Math.round((userRank.rank / totalOperators) * 100);

		return {
			...userRank,
			percentile,
			totalOperators,
			rankChange: 0, // TODO: Compare with previous period
		};
	} catch (error) {
		logger.error("Error fetching user rank", {
			error: error.message,
			stack: error.stack,
			userId,
			period,
		});
		// Return null instead of throwing
		return null;
	}
}

/**
 * Get leaderboard for specific scenario
 *
 * @param {string} scenarioId - Scenario ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of operator rankings for the scenario
 */
async function getScenarioLeaderboard(scenarioId, options = {}) {
	const { limit = 100 } = options;

	try {
		logger.debug("Fetching scenario leaderboard", { scenarioId, limit });

		// Query sessions for specific scenario
		const snapshot = await db
			.collection("scenarioSessions")
			.where("scenarioId", "==", scenarioId)
			.where("status", "==", "completed")
			.get();

		// Aggregate best scores by user
		const userBestScores = {};

		snapshot.forEach((doc) => {
			const session = doc.data();
			const userId = session.userId;

			if (!userId) return;

			const score = session.performance?.overallScore || 0;

			if (!userBestScores[userId] || score > userBestScores[userId].score) {
				userBestScores[userId] = {
					userId,
					callSign: session.userCallSign || "Operator",
					score,
					completionTime: session.endTime,
					duration: session.performance?.duration || "N/A",
				};
			}
		});

		// Sort by score and assign ranks
		const operators = Object.values(userBestScores)
			.sort((a, b) => b.score - a.score)
			.slice(0, limit)
			.map((operator, index) => ({
				...operator,
				rank: index + 1,
			}));

		logger.info(
			`Retrieved ${operators.length} operators for scenario ${scenarioId}`,
		);
		return operators;
	} catch (error) {
		logger.error("Error fetching scenario leaderboard", {
			error: error.message,
			stack: error.stack,
			scenarioId,
			limit,
		});
		// Return empty array instead of throwing
		return [];
	}
}

/**
 * Get nearby operators (operators ranked close to user)
 *
 * @param {string} userId - User ID
 * @param {number} range - Number of operators above and below (default: 5)
 * @param {string} period - Time period filter
 * @returns {Promise<Array>} Array of nearby operators
 */
async function getNearbyOperators(userId, range = 5, period = "all-time") {
	try {
		// Get all operators
		const allOperators = await getTopOperators({ limit: 10000, period });

		// Find user's position
		const userIndex = allOperators.findIndex((op) => op.id === userId);

		if (userIndex === -1) {
			return [];
		}

		// Get operators in range
		const startIndex = Math.max(0, userIndex - range);
		const endIndex = Math.min(allOperators.length, userIndex + range + 1);

		return allOperators.slice(startIndex, endIndex);
	} catch (error) {
		logger.error("Error fetching nearby operators", {
			error: error.message,
			stack: error.stack,
			userId,
			range,
			period,
		});
		// Return empty array instead of throwing
		return [];
	}
}

/**
 * Calculate date threshold based on period
 *
 * @param {string} period - Time period ('today', 'week', 'month', 'all-time')
 * @returns {Date|null} Date threshold or null for all-time
 */
function getDateThreshold(period) {
	const now = new Date();

	switch (period) {
		case "today":
			return new Date(now.getFullYear(), now.getMonth(), now.getDate());
		case "week": {
			const weekAgo = new Date(now);
			weekAgo.setDate(weekAgo.getDate() - 7);
			return weekAgo;
		}
		case "month": {
			const monthAgo = new Date(now);
			monthAgo.setMonth(monthAgo.getMonth() - 1);
			return monthAgo;
		}
		case "all-time":
		default:
			return null;
	}
}

module.exports = {
	getTopOperators,
	getUserRank,
	getScenarioLeaderboard,
	getNearbyOperators,
};
