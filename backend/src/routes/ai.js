/**
 * AI Routes
 * NOVA AI tutoring system endpoints
 * 
 * Phase 10 Implementation - NOVA AI End-to-End Integration
 * 
 * @swagger
 * tags:
 *   name: AI
 *   description: NOVA AI tutoring system - conversation management and intelligent responses
 */

const express = require('express');
const router = express.Router();
const novaController = require('../controllers/novaController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { createRateLimiter } = require('../middleware/rateLimiter');
const { helpAiLimit } = require('../config/rateLimits');
const {
  listMessagesSchema,
  postUserMessageSchema,
  storeResponseSchema,
  askHelpQuestionSchema,
} = require('../schemas/novaSchemas');

/**
 * @swagger
 * components:
 *   schemas:
 *     AIMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique message identifier
 *           example: 'msg_abc123'
 *         session_id:
 *           type: string
 *           description: FK to scenario_sessions.id
 *           example: 'sess_xyz789'
 *         user_id:
 *           type: string
 *           description: User UID who sent/received the message
 *           example: 'uid_123'
 *         role:
 *           type: string
 *           enum: [user, assistant]
 *           description: Message sender role
 *           example: 'user'
 *         content:
 *           type: string
 *           description: Message text content
 *           example: 'How do I adjust the orbital altitude?'
 *         step_id:
 *           type: string
 *           nullable: true
 *           description: FK to scenario_steps.id (current step when message was sent)
 *           example: 'step_001'
 *         command_id:
 *           type: string
 *           nullable: true
 *           description: FK to user_commands.id (related command if applicable)
 *           example: 'cmd_456'
 *         hint_type:
 *           type: string
 *           nullable: true
 *           enum: [CONCEPTUAL, PROCEDURAL, TROUBLESHOOTING, CONTEXTUAL, FALLBACK]
 *           description: Type of hint provided (for assistant messages)
 *           example: 'PROCEDURAL'
 *         is_fallback:
 *           type: boolean
 *           description: Whether this is a fallback response (API failure)
 *           example: false
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Message creation timestamp
 *           example: '2026-01-10T20:00:00.000Z'
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Message update timestamp
 *           example: '2026-01-10T20:00:00.000Z'
 *     NOVAResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: object
 *           properties:
 *             role:
 *               type: string
 *               example: 'assistant'
 *             content:
 *               type: string
 *               example: 'To adjust orbital altitude, use the SET_ORBIT_ALTITUDE command...'
 *             hint_type:
 *               type: string
 *               nullable: true
 *               example: 'PROCEDURAL'
 *             is_fallback:
 *               type: boolean
 *               example: false
 *         session_id:
 *           type: string
 *           example: 'sess_xyz789'
 *     SessionContext:
 *       type: object
 *       properties:
 *         scenario:
 *           type: object
 *           nullable: true
 *           description: Current scenario details
 *         currentStep:
 *           type: object
 *           nullable: true
 *           description: Current step details including hint_suggestion
 *         recentCommands:
 *           type: array
 *           items:
 *             type: object
 *           description: Recent commands issued in the session
 *         sessionHistory:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AIMessage'
 *           description: Recent conversation messages
 *         sessionState:
 *           type: object
 *           nullable: true
 *           description: Current session state (status, score, hints_used, errors)
 *     ConversationStats:
 *       type: object
 *       properties:
 *         session_id:
 *           type: string
 *           example: 'sess_xyz789'
 *         message_count:
 *           type: integer
 *           description: Total messages in conversation
 *           example: 15
 *         hint_count:
 *           type: integer
 *           description: Total hints provided
 *           example: 3
 */

/**
 * @swagger
 * /ai/conversations/{session_id}:
 *   get:
 *     summary: List conversation messages
 *     description: Retrieve paginated messages for a session conversation, ordered by timestamp
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID to fetch messages for
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Messages per page (max 100)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order by timestamp
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Only return messages after this timestamp
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, assistant]
 *         description: Filter by message role
 *     responses:
 *       200:
 *         description: GO - Messages retrieved successfully
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
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/AIMessage'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                             limit:
 *                               type: integer
 *                             total:
 *                               type: integer
 *                             totalPages:
 *                               type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/conversations/:session_id',
  authMiddleware,
  validate(listMessagesSchema),
  novaController.listConversation
);

/**
 * @swagger
 * /ai/messages:
 *   post:
 *     summary: Send message to NOVA
 *     description: Store user message and trigger NOVA AI response. Both messages are persisted.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - session_id
 *               - content
 *             properties:
 *               session_id:
 *                 type: string
 *                 description: FK to scenario_sessions.id
 *                 example: 'sess_xyz789'
 *               content:
 *                 type: string
 *                 description: User's message or question
 *                 example: 'How do I deploy the solar arrays?'
 *               step_id:
 *                 type: string
 *                 description: Current step ID for context
 *                 example: 'step_001'
 *               command_id:
 *                 type: string
 *                 description: Related command ID if asking about a specific command
 *                 example: 'cmd_456'
 *               request_hint:
 *                 type: boolean
 *                 default: false
 *                 description: Explicitly request a hint (increments hints_used counter)
 *     responses:
 *       201:
 *         description: GO - Message sent and NOVA response generated
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
 *                           $ref: '#/components/schemas/NOVAResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/messages',
  authMiddleware,
  validate(postUserMessageSchema),
  novaController.postMessage
);

/**
 * @swagger
 * /ai/response/{session_id}:
 *   post:
 *     summary: Store assistant response
 *     description: Manually store a NOVA assistant response (for external/system-generated responses)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID for the conversation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: NOVA response content
 *                 example: 'To deploy solar arrays, execute the DEPLOY_SOLAR_ARRAYS command...'
 *               step_id:
 *                 type: string
 *                 description: Current step ID
 *               command_id:
 *                 type: string
 *                 description: Related command ID
 *               hint_type:
 *                 type: string
 *                 enum: [CONCEPTUAL, PROCEDURAL, TROUBLESHOOTING, CONTEXTUAL, FALLBACK]
 *                 description: Type of hint (if applicable)
 *               is_fallback:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this is a fallback response
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       201:
 *         description: GO - Response stored successfully
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
 *                             message:
 *                               $ref: '#/components/schemas/AIMessage'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/response/:session_id',
  authMiddleware,
  validate(storeResponseSchema),
  novaController.storeResponse
);

/**
 * @swagger
 * /ai/context/{session_id}:
 *   get:
 *     summary: Get session context
 *     description: Retrieve the current context for a session (scenario, step, commands, history). Useful for debugging.
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *       - in: query
 *         name: step_id
 *         schema:
 *           type: string
 *         description: Override current step ID for context
 *     responses:
 *       200:
 *         description: GO - Context retrieved successfully
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
 *                             context:
 *                               $ref: '#/components/schemas/SessionContext'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/context/:session_id',
  authMiddleware,
  novaController.getContext
);

/**
 * @swagger
 * /ai/stats/{session_id}:
 *   get:
 *     summary: Get conversation statistics
 *     description: Retrieve message and hint counts for a session
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: GO - Statistics retrieved successfully
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
 *                           $ref: '#/components/schemas/ConversationStats'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/stats/:session_id',
  authMiddleware,
  novaController.getStats
);

/**
 * @swagger
 * /ai/conversations/{session_id}:
 *   delete:
 *     summary: Delete conversation
 *     description: Delete all messages for a session (admin only)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: GO - Conversation deleted successfully
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
 *                             session_id:
 *                               type: string
 *                             deleted_count:
 *                               type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.delete(
  '/conversations/:session_id',
  authMiddleware,
  novaController.deleteConversation
);

/**
 * @swagger
 * /ai/help/ask:
 *   post:
 *     summary: Ask NOVA a help question (Public)
 *     description: Public endpoint for help queries. No authentication required. Generates anonymous user ID if not logged in. All conversations stored for training.
 *     tags: [AI]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: User's help question
 *                 example: 'How do I deploy solar arrays on a satellite?'
 *               context:
 *                 type: string
 *                 description: Optional help article slug for context
 *                 example: 'solar-array-deployment'
 *               conversationId:
 *                 type: string
 *                 description: Optional conversation ID for multi-turn chat (generated on first request)
 *                 example: 'help_sess_abc123'
 *     responses:
 *       201:
 *         description: GO - Help response generated
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
 *                             message:
 *                               type: object
 *                               properties:
 *                                 role:
 *                                   type: string
 *                                   example: 'assistant'
 *                                 content:
 *                                   type: string
 *                                   example: 'To deploy solar arrays...'
 *                                 is_fallback:
 *                                   type: boolean
 *                                   example: false
 *                             conversationId:
 *                               type: string
 *                               example: 'help_sess_xyz789'
 *                             userId:
 *                               type: string
 *                               example: 'anon_abc123'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       429:
 *         description: Too Many Requests - Rate limit exceeded
 */
router.post(
  '/help/ask',
  createRateLimiter(helpAiLimit),
  optionalAuth,
  validate(askHelpQuestionSchema),
  novaController.askHelpQuestion
);

module.exports = router;
