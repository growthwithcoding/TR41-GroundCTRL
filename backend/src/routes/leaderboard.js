/**
 * Leaderboard Routes
 * 
 * API endpoints for leaderboard data
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { createRateLimiter } = require('../middleware/rateLimiter');
const leaderboardService = require('../services/leaderboardService');
const responseFactory = require('../factories/responseFactory');
const httpStatus = require('../constants/httpStatus');
const logger = require('../utils/logger');

// Rate limiter for leaderboard queries (more lenient than other endpoints)
const leaderboardLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many leaderboard requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * GET /api/leaderboard/global
 * Get global leaderboard
 * 
 * Query params:
 * - period: 'today' | 'week' | 'month' | 'all-time' (default: 'all-time')
 * - limit: number (default: 100, max: 500)
 * - includeUser: boolean (default: true) - include authenticated user's rank
 */
router.get(
  '/global',
  leaderboardLimiter,
  authMiddleware,
  async (req, res, next) => {
    try {
      const { period = 'all-time', limit = '100', includeUser = 'true' } = req.query;
      const userId = req.user?.uid;
      
      // Validate period
      const validPeriods = ['today', 'week', 'month', 'all-time'];
      if (!validPeriods.includes(period)) {
        const response = responseFactory.createErrorResponse(
          {
            statusCode: httpStatus.BAD_REQUEST,
            code: 'INVALID_PERIOD',
            message: `Invalid period. Must be one of: ${validPeriods.join(', ')}`
          },
          {
            callSign: req.callSign || 'SYSTEM',
            requestId: req.id
          }
        );
        return res.status(httpStatus.BAD_REQUEST).json(response);
      }
      
      // Validate and cap limit
      const limitNum = Math.min(Math.max(parseInt(limit) || 100, 1), 500);
      
      // Fetch leaderboard data
      let leaderboard;
      if (includeUser === 'true' && userId) {
        leaderboard = await leaderboardService.getLeaderboardWithUserRank(userId, {
          period,
          limit: limitNum
        });
      } else {
        leaderboard = await leaderboardService.getGlobalLeaderboard({
          period,
          limit: limitNum
        });
      }
      
      // Log audit event
      logger.audit('Leaderboard accessed', {
        userId: userId || 'anonymous',
        period,
        limit: limitNum,
        ipAddress: req.ip
      });
      
      const response = responseFactory.createSuccessResponse(
        leaderboard,
        {
          callSign: req.callSign || 'SYSTEM',
          requestId: req.id
        }
      );
      
      res.json(response);
      
    } catch (error) {
      logger.error('Error fetching global leaderboard', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.uid,
        period,
        limit: limitNum
      });
      
      // Return graceful error response instead of cascading
      const response = responseFactory.createErrorResponse(
        {
          statusCode: httpStatus.INTERNAL_SERVER_ERROR,
          code: 'LEADERBOARD_ERROR',
          message: 'Unable to fetch leaderboard data. Please try again later.'
        },
        {
          callSign: req.callSign || 'SYSTEM',
          requestId: req.id
        }
      );
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(response);
    }
  }
);

/**
 * GET /api/leaderboard/scenario/:scenarioId
 * Get leaderboard for specific scenario
 * 
 * Query params:
 * - limit: number (default: 100, max: 500)
 */
router.get(
  '/scenario/:scenarioId',
  leaderboardLimiter,
  authMiddleware,
  async (req, res, next) => {
    try {
      const { scenarioId } = req.params;
      const { limit = '100' } = req.query;
      
      // Validate and cap limit
      const limitNum = Math.min(Math.max(parseInt(limit) || 100, 1), 500);
      
      // Fetch scenario leaderboard
      const leaderboard = await leaderboardService.getScenarioLeaderboard(scenarioId, {
        limit: limitNum
      });
      
      // Log audit event
      logger.audit('Scenario leaderboard accessed', {
        userId: req.user?.uid || 'anonymous',
        scenarioId,
        limit: limitNum,
        ipAddress: req.ip
      });
      
      const response = responseFactory.createSuccessResponse(
        leaderboard,
        {
          callSign: req.callSign || 'SYSTEM',
          requestId: req.id
        }
      );
      
      res.json(response);
      
    } catch (error) {
      logger.error('Error fetching scenario leaderboard', {
        error: error.message,
        stack: error.stack,
        scenarioId: req.params.scenarioId,
        limit: limitNum
      });
      
      // Return graceful error response
      const response = responseFactory.createErrorResponse(
        {
          statusCode: httpStatus.INTERNAL_SERVER_ERROR,
          code: 'LEADERBOARD_ERROR',
          message: 'Unable to fetch scenario leaderboard. Please try again later.'
        },
        {
          callSign: req.callSign || 'SYSTEM',
          requestId: req.id
        }
      );
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(response);
    }
  }
);

/**
 * GET /api/leaderboard/user/rank
 * Get authenticated user's rank across all periods
 */
router.get(
  '/user/rank',
  leaderboardLimiter,
  authMiddleware,
  async (req, res, next) => {
    try {
      const userId = req.user?.uid;
      
      if (!userId) {
        const response = responseFactory.createErrorResponse(
          {
            statusCode: httpStatus.UNAUTHORIZED,
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          },
          {
            callSign: req.callSign || 'SYSTEM',
            requestId: req.id
          }
        );
        return res.status(httpStatus.UNAUTHORIZED).json(response);
      }
      
      // Fetch user rank summary
      const rankSummary = await leaderboardService.getUserRankSummary(userId);
      
      const response = responseFactory.createSuccessResponse(
        rankSummary,
        {
          callSign: req.callSign || 'SYSTEM',
          requestId: req.id
        }
      );
      
      res.json(response);
      
    } catch (error) {
      logger.error('Error fetching user rank', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.uid
      });
      
      // Return graceful error response
      const response = responseFactory.createErrorResponse(
        {
          statusCode: httpStatus.INTERNAL_SERVER_ERROR,
          code: 'LEADERBOARD_ERROR',
          message: 'Unable to fetch user rank. Please try again later.'
        },
        {
          callSign: req.callSign || 'SYSTEM',
          requestId: req.id
        }
      );
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(response);
    }
  }
);

/**
 * POST /api/leaderboard/cache/clear
 * Clear leaderboard cache (admin only)
 */
router.post(
  '/cache/clear',
  authMiddleware,
  async (req, res, next) => {
    try {
      // Check if user is admin
      if (!req.user?.isAdmin) {
        const response = responseFactory.createErrorResponse(
          {
            statusCode: httpStatus.FORBIDDEN,
            code: 'FORBIDDEN',
            message: 'Admin access required'
          },
          {
            callSign: req.callSign || 'SYSTEM',
            requestId: req.id
          }
        );
        return res.status(httpStatus.FORBIDDEN).json(response);
      }
      
      // Clear cache
      leaderboardService.clearCache();
      
      logger.audit('Leaderboard cache cleared', {
        userId: req.user.uid,
        ipAddress: req.ip
      });
      
      const response = responseFactory.createSuccessResponse(
        { message: 'Cache cleared successfully' },
        {
          callSign: req.callSign || 'SYSTEM',
          requestId: req.id
        }
      );
      
      res.json(response);
      
    } catch (error) {
      logger.error('Error clearing leaderboard cache', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.uid
      });
      
      // Return graceful error response
      const response = responseFactory.createErrorResponse(
        {
          statusCode: httpStatus.INTERNAL_SERVER_ERROR,
          code: 'CACHE_CLEAR_ERROR',
          message: 'Unable to clear cache. Please try again later.'
        },
        {
          callSign: req.callSign || 'SYSTEM',
          requestId: req.id
        }
      );
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(response);
    }
  }
);

module.exports = router;
