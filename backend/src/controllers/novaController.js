/**
 * NOVA Controller
 * 
 * Handles HTTP requests for NOVA AI tutoring system
 * Implements endpoints for conversations, messages, and hints
 * 
 * Phase 10 Implementation - NOVA AI End-to-End Integration
 */

const novaService = require('../services/novaService');
const aiMessagesRepository = require('../repositories/aiMessagesRepository');
const responseFactory = require('../factories/responseFactory');
const httpStatus = require('../constants/httpStatus');
const logger = require('../utils/logger');

/**
 * GET /ai/conversations/:session_id
 * List messages for a session conversation
 */
async function listConversation(req, res, next) {
  try {
    const { session_id } = req.params;
    const { page, limit, sortOrder, since, role } = req.query;

    const result = await aiMessagesRepository.getMessagesBySession(session_id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      sortOrder: sortOrder || 'asc',
      since,
      role,
    });

    const response = responseFactory.createPaginatedResponse(
      result.data,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
      {
        callSign: req.callSign || 'SYSTEM',
        requestId: req.id,
      }
    );

    res.status(httpStatus.OK).json(response);
  } catch (error) {
    logger.error('Failed to list conversation', {
      error: error.message,
      session_id: req.params.session_id,
    });
    next(error);
  }
}

/**
 * POST /ai/messages
 * Store user message and trigger NOVA response
 */
async function postMessage(req, res, next) {
  try {
    const { session_id, content, step_id, command_id, request_hint } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      const response = responseFactory.createErrorResponse(
        {
          statusCode: httpStatus.UNAUTHORIZED,
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        {
          callSign: req.callSign || 'SYSTEM',
          requestId: req.id,
        }
      );
      return res.status(httpStatus.UNAUTHORIZED).json(response);
    }

    // Generate NOVA response (this also stores both user message and assistant response)
    const novaResponse = await novaService.generateNovaResponse(
      session_id,
      userId,
      content,
      {
        step_id,
        command_id,
        request_hint: request_hint || false,
      }
    );

    const response = responseFactory.createSuccessResponse(
      {
        message: {
          role: 'assistant',
          content: novaResponse.content,
          hint_type: novaResponse.hint_type,
          is_fallback: novaResponse.is_fallback,
        },
        session_id,
      },
      {
        callSign: req.callSign || 'SYSTEM',
        requestId: req.id,
        statusCode: httpStatus.CREATED,
      }
    );

    res.status(httpStatus.CREATED).json(response);
  } catch (error) {
    logger.error('Failed to post message', {
      error: error.message,
      session_id: req.body?.session_id,
    });
    next(error);
  }
}

/**
 * POST /ai/response/:session_id
 * Store assistant reply (for manual/external responses)
 */
async function storeResponse(req, res, next) {
  try {
    const { session_id } = req.params;
    const { content, step_id, command_id, hint_type, is_fallback, metadata } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      const response = responseFactory.createErrorResponse(
        {
          statusCode: httpStatus.UNAUTHORIZED,
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        {
          callSign: req.callSign || 'SYSTEM',
          requestId: req.id,
        }
      );
      return res.status(httpStatus.UNAUTHORIZED).json(response);
    }

    // Store assistant message directly
    const message = await aiMessagesRepository.addMessage(
      session_id,
      userId,
      'assistant',
      content,
      {
        step_id,
        command_id,
        hint_type,
        is_fallback: is_fallback || false,
        extra: metadata || {},
      }
    );

    // Increment hints if this was a hint
    if (hint_type) {
      await novaService.incrementSessionHints(session_id);
    }

    const response = responseFactory.createSuccessResponse(
      { message },
      {
        callSign: req.callSign || 'SYSTEM',
        requestId: req.id,
        statusCode: httpStatus.CREATED,
      }
    );

    res.status(httpStatus.CREATED).json(response);
  } catch (error) {
    logger.error('Failed to store response', {
      error: error.message,
      session_id: req.params.session_id,
    });
    next(error);
  }
}

/**
 * GET /ai/context/:session_id
 * Get current context for a session (debugging/admin)
 */
async function getContext(req, res, next) {
  try {
    const { session_id } = req.params;
    const { step_id } = req.query;

    const context = await novaService.fetchContext(session_id, step_id);

    const response = responseFactory.createSuccessResponse(
      { context },
      {
        callSign: req.callSign || 'SYSTEM',
        requestId: req.id,
      }
    );

    res.status(httpStatus.OK).json(response);
  } catch (error) {
    logger.error('Failed to get context', {
      error: error.message,
      session_id: req.params.session_id,
    });
    next(error);
  }
}

/**
 * GET /ai/stats/:session_id
 * Get conversation statistics for a session
 */
async function getStats(req, res, next) {
  try {
    const { session_id } = req.params;

    const [messageCount, hintCount] = await Promise.all([
      aiMessagesRepository.countBySession(session_id),
      aiMessagesRepository.countHintsBySession(session_id),
    ]);

    const response = responseFactory.createSuccessResponse(
      {
        session_id,
        message_count: messageCount,
        hint_count: hintCount,
      },
      {
        callSign: req.callSign || 'SYSTEM',
        requestId: req.id,
      }
    );

    res.status(httpStatus.OK).json(response);
  } catch (error) {
    logger.error('Failed to get stats', {
      error: error.message,
      session_id: req.params.session_id,
    });
    next(error);
  }
}

/**
 * DELETE /ai/conversations/:session_id
 * Delete all messages for a session (admin only)
 */
async function deleteConversation(req, res, next) {
  try {
    const { session_id } = req.params;
    const userId = req.user?.uid;

    // Check admin permission
    if (!req.user?.isAdmin) {
      const response = responseFactory.createErrorResponse(
        {
          statusCode: httpStatus.FORBIDDEN,
          code: 'FORBIDDEN',
          message: 'Admin privileges required',
        },
        {
          callSign: req.callSign || 'SYSTEM',
          requestId: req.id,
        }
      );
      return res.status(httpStatus.FORBIDDEN).json(response);
    }

    const deletedCount = await aiMessagesRepository.deleteBySession(session_id, {
      deletedBy: userId,
    });

    const response = responseFactory.createSuccessResponse(
      {
        session_id,
        deleted_count: deletedCount,
      },
      {
        callSign: req.callSign || 'SYSTEM',
        requestId: req.id,
      }
    );

    res.status(httpStatus.OK).json(response);
  } catch (error) {
    logger.error('Failed to delete conversation', {
      error: error.message,
      session_id: req.params.session_id,
    });
    next(error);
  }
}

/**
 * POST /ai/help/ask
 * Ask NOVA a help question (public endpoint, no authentication required)
 */
async function askHelpQuestion(req, res, next) {
  try {
    const { content, context, conversationId } = req.body;
    const userId = req.user?.uid; // Optional - will be null for anonymous users

    // Generate help response
    const novaResponse = await novaService.generateHelpResponse(content, {
      userId,
      context,
      conversationId,
    });

    const response = responseFactory.createSuccessResponse(
      {
        message: {
          role: 'assistant',
          content: novaResponse.content,
          is_fallback: novaResponse.is_fallback,
        },
        conversationId: novaResponse.conversationId,
        userId: novaResponse.userId,
      },
      {
        callSign: req.callSign || 'GUEST',
        requestId: req.id,
        statusCode: httpStatus.CREATED,
      }
    );

    res.status(httpStatus.CREATED).json(response);
  } catch (error) {
    logger.error('Failed to process help question', {
      error: error.message,
      content: req.body?.content,
    });
    next(error);
  }
}

module.exports = {
  listConversation,
  postMessage,
  storeResponse,
  getContext,
  getStats,
  deleteConversation,
  askHelpQuestion,
};
