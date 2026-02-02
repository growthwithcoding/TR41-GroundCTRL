/**
 * Support Routes
 * Support ticket creation and management
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { createRateLimiter } = require('../middleware/rateLimiter');
const responseFactory = require('../factories/responseFactory');
const httpStatus = require('../constants/httpStatus');
const supportService = require('../services/supportService');
const logger = require('../utils/logger');

// Support ticket rate limiter: 10 tickets per 15 minutes
const supportTicketLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many support tickets created. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * POST /support/tickets
 * Create a support ticket (requires authentication)
 */
router.post(
  '/tickets',
  supportTicketLimiter,
  authMiddleware,
  async (req, res, next) => {
    try {
      const { subject, content, category, priority, conversationId } = req.body;
      const userId = req.user?.uid;
      const userEmail = req.user?.email;

      // Basic validation
      if (!subject || !subject.trim()) {
        const response = responseFactory.createErrorResponse(
          {
            statusCode: httpStatus.BAD_REQUEST,
            code: 'VALIDATION_ERROR',
            message: 'Subject is required',
          },
          {
            callSign: req.callSign || 'SYSTEM',
            requestId: req.id,
          }
        );
        return res.status(httpStatus.BAD_REQUEST).json(response);
      }

      if (!content || !content.trim()) {
        const response = responseFactory.createErrorResponse(
          {
            statusCode: httpStatus.BAD_REQUEST,
            code: 'VALIDATION_ERROR',
            message: 'Content/description is required',
          },
          {
            callSign: req.callSign || 'SYSTEM',
            requestId: req.id,
          }
        );
        return res.status(httpStatus.BAD_REQUEST).json(response);
      }

      if (!userId) {
        const response = responseFactory.createErrorResponse(
          {
            statusCode: httpStatus.UNAUTHORIZED,
            code: 'UNAUTHORIZED',
            message: 'Authentication required to create support tickets',
          },
          {
            callSign: req.callSign || 'SYSTEM',
            requestId: req.id,
          }
        );
        return res.status(httpStatus.UNAUTHORIZED).json(response);
      }

      // Create the ticket
      const ticket = await supportService.createSupportTicket({
        userId,
        userEmail,
        conversationId,
        subject,
        content,
        category: category || 'GENERAL',
        priority: priority || 'MEDIUM',
        conversationHistory: [], // TODO: Fetch actual conversation history if conversationId provided
      });

      const response = responseFactory.createSuccessResponse(
        { ticket },
        {
          callSign: req.callSign || 'SYSTEM',
          requestId: req.id,
          statusCode: httpStatus.CREATED,
        }
      );

      res.status(httpStatus.CREATED).json(response);
    } catch (error) {
      logger.error('Failed to create support ticket', {
        error: error.message,
        userId: req.user?.uid,
      });
      next(error);
    }
  }
);

module.exports = router;
