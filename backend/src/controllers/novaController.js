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
 * Enhanced with multi-bubble responses and smart suggestions
 */
async function askHelpQuestion(req, res, _next) {
  try {
    const { content, context, conversationId } = req.body;
    const userId = req.user?.uid; // Optional - will be null for anonymous users

    // Defensive: Ensure we have content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      const response = responseFactory.createErrorResponse(
        {
          statusCode: httpStatus.BAD_REQUEST,
          code: 'INVALID_INPUT',
          message: 'ABORT: Transmission content required for NOVA uplink',
        },
        {
          callSign: req.callSign || 'GUEST',
          requestId: req.id,
        }
      );
      return res.status(httpStatus.BAD_REQUEST).json(response);
    }

    // Generate help response with timeout protection
    const timeoutMs = 8000; // 8 second timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });

    const novaPromise = novaService.generateHelpResponse(content, {
      userId,
      context,
      conversationId,
    });

    let novaResponse;
    try {
      novaResponse = await Promise.race([novaPromise, timeoutPromise]);
    } catch {
      // Timeout occurred - return graceful fallback
      logger.warn('NOVA help request timed out', {
        content: content.substring(0, 100),
        userId,
      });
      
      const response = responseFactory.createSuccessResponse(
        {
          message: {
            role: 'assistant',
            content: '🛰️ STANDBY - NOVA uplink experiencing high traffic. Retry transmission in T-minus 30 seconds or access Mission Archives for immediate assistance.',
            paragraphs: ['🛰️ STANDBY - NOVA uplink experiencing high traffic. Retry transmission in T-minus 30 seconds or access Mission Archives for immediate assistance.'],
            is_fallback: true,
            hint_type: null,
          },
          suggestions: [],
          conversationId: conversationId || 'timeout',
          userId: userId || 'anonymous',
        },
        {
          callSign: req.callSign || 'GUEST',
          requestId: req.id,
          statusCode: httpStatus.CREATED,
        }
      );
      return res.status(httpStatus.CREATED).json(response);
    }

    // Format response with paragraphs and generate suggestions
    const formatted = novaService.formatNovaResponse(novaResponse.content, context || 'help');
    const suggestions = novaService.generateSuggestions(context || 'help', novaResponse.content);

    const response = responseFactory.createSuccessResponse(
      {
        message: {
          role: 'assistant',
          content: novaResponse.content,
          paragraphs: formatted.paragraphs,
          is_fallback: novaResponse.is_fallback,
          hint_type: null,
        },
        suggestions: suggestions,
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
      stack: error.stack,
      content: req.body?.content,
    });
    
    // Don't propagate as 500 - return graceful error response
    const response = responseFactory.createSuccessResponse(
      {
        message: {
          role: 'assistant',
          content: '⚠️ SYSTEM ANOMALY - NOVA experiencing signal interference. Reattempt transmission or contact Mission Control if the anomaly persists.',
          paragraphs: ['⚠️ SYSTEM ANOMALY - NOVA experiencing signal interference. Reattempt transmission or contact Mission Control if the anomaly persists.'],
          is_fallback: true,
          hint_type: null,
        },
        suggestions: [],
        conversationId: req.body?.conversationId || 'error',
        userId: req.user?.uid || 'anonymous',
      },
      {
        callSign: req.callSign || 'GUEST',
        requestId: req.id,
        statusCode: httpStatus.CREATED,
      }
    );
    res.status(httpStatus.CREATED).json(response);
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
