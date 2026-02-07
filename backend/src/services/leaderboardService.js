/**
 * Leaderboard Service
 *
 * Business logic for leaderboard operations
 * Handles caching and data transformation
 */

const leaderboardRepository = require("../repositories/leaderboardRepository");
const logger = require("../utils/logger");

// Simple in-memory cache (in production, use Redis)
const cache = {
	data: {},
	timestamps: {},
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get global leaderboard
 *
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum results
 * @param {string} options.period - Time period
 * @param {boolean} options.useCache - Whether to use cached data
 * @returns {Promise<Object>} Leaderboard data
 */
async function getGlobalLeaderboard(options = {}) {
	const { limit = 100, period = "all-time", useCache = true } = options;

	const cacheKey = `global_${period}_${limit}`;

	// Check cache
	if (useCache && isCacheValid(cacheKey)) {
		logger.debug("Returning cached leaderboard", { cacheKey });
		return cache.data[cacheKey];
	}

	try {
		// Fetch operators
		const operators = await leaderboardRepository.getTopOperators({
			limit,
			period,
		});

		// Get top 3 for podium
		const topThree = operators.slice(0, 3);

		const result = {
			operators,
			topThree,
			period,
			lastUpdated: new Date().toISOString(),
			totalOperators: operators.length,
		};

		// Cache result
		cache.data[cacheKey] = result;
		cache.timestamps[cacheKey] = Date.now();

		return result;
	} catch (error) {
		logger.error("Error getting global leaderboard", {
			error: error.message,
			stack: error.stack,
			limit,
			period,
		});
		// Return empty result instead of throwing
		return {
			operators: [],
			topThree: [],
			period,
			lastUpdated: new Date().toISOString(),
			totalOperators: 0,
			error: "Failed to fetch leaderboard",
		};
	}
}

/**
 * Get leaderboard with user's rank
 *
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Leaderboard with user rank
 */
async function getLeaderboardWithUserRank(userId, options = {}) {
	try {
		// Get global leaderboard
		const leaderboard = await getGlobalLeaderboard(options);

		// Get user's rank
		const userRank = await leaderboardRepository.getUserRank(
			userId,
			options.period,
		);

		// Get nearby operators
		const nearbyOperators = userRank
			? await leaderboardRepository.getNearbyOperators(
					userId,
					5,
					options.period,
				)
			: [];

		return {
			...leaderboard,
			userRank,
			nearbyOperators,
		};
	} catch (error) {
		logger.error("Error getting leaderboard with user rank", {
			error: error.message,
			stack: error.stack,
			userId,
			period: options.period,
		});
		// Return empty result instead of throwing
		return {
			operators: [],
			topThree: [],
			period: options.period || "all-time",
			lastUpdated: new Date().toISOString(),
			totalOperators: 0,
			userRank: null,
			nearbyOperators: [],
			error: "Failed to fetch leaderboard",
		};
	}
}

/**
 * Get scenario-specific leaderboard
 *
 * @param {string} scenarioId - Scenario ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Scenario leaderboard
 */
async function getScenarioLeaderboard(scenarioId, options = {}) {
	const { limit = 100, useCache = true } = options;

	const cacheKey = `scenario_${scenarioId}_${limit}`;

	// Check cache
	if (useCache && isCacheValid(cacheKey)) {
		logger.debug("Returning cached scenario leaderboard", { cacheKey });
		return cache.data[cacheKey];
	}

	try {
		const operators = await leaderboardRepository.getScenarioLeaderboard(
			scenarioId,
			{ limit },
		);

		const topThree = operators.slice(0, 3);

		const result = {
			scenarioId,
			operators,
			topThree,
			lastUpdated: new Date().toISOString(),
			totalOperators: operators.length,
		};

		// Cache result
		cache.data[cacheKey] = result;
		cache.timestamps[cacheKey] = Date.now();

		return result;
	} catch (error) {
		logger.error("Error getting scenario leaderboard", {
			error: error.message,
			stack: error.stack,
			scenarioId,
			limit,
		});
		// Return empty result instead of throwing
		return {
			scenarioId,
			operators: [],
			topThree: [],
			lastUpdated: new Date().toISOString(),
			totalOperators: 0,
			error: "Failed to fetch scenario leaderboard",
		};
	}
}

/**
 * Get user's rank across all time periods
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User ranks for different periods
 */
async function getUserRankSummary(userId) {
	try {
		const [allTime, month, week, today] = await Promise.all([
			leaderboardRepository.getUserRank(userId, "all-time"),
			leaderboardRepository.getUserRank(userId, "month"),
			leaderboardRepository.getUserRank(userId, "week"),
			leaderboardRepository.getUserRank(userId, "today"),
		]);

		return {
			allTime,
			month,
			week,
			today,
		};
	} catch (error) {
		logger.error("Error getting user rank summary", {
			error: error.message,
			stack: error.stack,
			userId,
		});
		// Return null for all periods instead of throwing
		return {
			allTime: null,
			month: null,
			week: null,
			today: null,
			error: "Failed to fetch user rank summary",
		};
	}
}

/**
 * Clear leaderboard cache
 *
 * @param {string} key - Specific key to clear, or null to clear all
 */
function clearCache(key = null) {
	if (key) {
		delete cache.data[key];
		delete cache.timestamps[key];
		logger.debug("Cleared cache key", { key });
	} else {
		cache.data = {};
		cache.timestamps = {};
		logger.debug("Cleared all leaderboard cache");
	}
}

/**
 * Check if cache is valid
 *
 * @param {string} key - Cache key
 * @returns {boolean} True if cache is valid
 */
function isCacheValid(key) {
	if (!cache.data[key] || !cache.timestamps[key]) {
		return false;
	}

	const age = Date.now() - cache.timestamps[key];
	return age < CACHE_TTL;
}

module.exports = {
	getGlobalLeaderboard,
	getLeaderboardWithUserRank,
	getScenarioLeaderboard,
	getUserRankSummary,
	clearCache,
};
