/**
 * NOVA AI Message Schemas
 * 
 * Zod validation schemas for NOVA AI tutoring system
 * Defines ai_messages collection schema with step-aware tracking
 * 
 * Phase 10 Implementation - NOVA AI End-to-End Integration
 */

const { z } = require('zod');

// Message role enum
const MessageRole = z.enum(['user', 'assistant']);

// Hint type enum for tracking hint categories
const HintType = z.enum([
  'CONCEPTUAL',      // Explains underlying concepts
  'PROCEDURAL',      // Step-by-step guidance
  'TROUBLESHOOTING', // Error diagnosis help
  'CONTEXTUAL',      // Context-specific suggestions
  'FALLBACK'         // Static hint from step.hint_suggestion
]);

// ---------- CREATE MESSAGE schema ----------

const createMessageSchema = z.object({
  body: z.object({
    // Required fields per Phase 10 spec
    session_id: z.string()
      .min(1, 'Session ID is required')
      .describe('FK to scenario_sessions.id'),
    
    content: z.string()
      .min(1, 'Message content is required')
      .max(10000, 'Message content must be 10000 characters or fewer')
      .describe('Message text content'),
    
    // Optional step-aware tracking fields
    step_id: z.string()
      .min(1, 'Step ID must not be empty if provided')
      .optional()
      .describe('FK to scenario_steps.id - current step when message was sent'),
    
    command_id: z.string()
      .min(1, 'Command ID must not be empty if provided')
      .optional()
      .describe('FK to user_commands.id - related command if applicable'),
    
    hint_type: HintType
      .optional()
      .describe('Type of hint provided (for assistant messages)'),
    
    // Metadata
    metadata: z.object({})
      .passthrough()
      .optional()
      .default({})
      .describe('Additional metadata (e.g., model used, token count)'),
    
  }).strict(),
}).strict();

// ---------- STORE ASSISTANT RESPONSE schema ----------

const storeResponseSchema = z.object({
  params: z.object({
    session_id: z.string()
      .min(1, 'Session ID is required')
      .describe('Session ID for the conversation'),
  }).strict(),
  body: z.object({
    content: z.string()
      .min(1, 'Response content is required')
      .max(10000, 'Response content must be 10000 characters or fewer')
      .describe('NOVA response content'),
    
    step_id: z.string()
      .min(1, 'Step ID must not be empty if provided')
      .optional()
      .describe('FK to scenario_steps.id'),
    
    command_id: z.string()
      .min(1, 'Command ID must not be empty if provided')
      .optional()
      .describe('FK to user_commands.id'),
    
    hint_type: HintType
      .optional()
      .describe('Type of hint provided'),
    
    is_fallback: z.boolean()
      .default(false)
      .describe('Whether this is a fallback response (API failure)'),
    
    metadata: z.object({})
      .passthrough()
      .optional()
      .default({})
      .describe('Additional metadata'),
    
  }).strict(),
}).strict();

// ---------- LIST MESSAGES schema ----------

const listMessagesSchema = z.object({
  params: z.object({
    session_id: z.string()
      .min(1, 'Session ID is required')
      .describe('Session ID to fetch messages for'),
  }).strict(),
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => {
      const parsed = val ? parseInt(val, 10) : 50;
      return Math.min(parsed, 100); // Cap at 100
    }),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
    since: z.string()
      .optional()
      .describe('ISO timestamp - only return messages after this time'),
    role: MessageRole
      .optional()
      .describe('Filter by message role'),
  }).strict(),
}).strict();

// ---------- POST USER MESSAGE (triggers NOVA response) schema ----------

const postUserMessageSchema = z.object({
  body: z.object({
    session_id: z.string()
      .min(1, 'Session ID is required')
      .describe('FK to scenario_sessions.id'),
    
    content: z.string()
      .min(1, 'Message content is required')
      .max(5000, 'User message must be 5000 characters or fewer')
      .refine(
        (val) => !/<script\b[\s\S]*?>/i.test(val) && !/<\/script\b[\s\S]*?>/i.test(val),
        { message: 'Scripts not allowed in content' }
      )
      .refine(
        (val) => !/<iframe\b[\s\S]*?>/i.test(val) && !/<\/iframe\b[\s\S]*?>/i.test(val),
        { message: 'Iframes not allowed in content' }
      )
      .refine(
        (val) => !/on\w+\s*=/i.test(val),
        { message: 'Event handlers not allowed in content' }
      )
      .describe('User message/question'),
    
    // Context hints for better NOVA response
    step_id: z.string()
      .min(1, 'Step ID must not be empty if provided')
      .optional()
      .describe('Current step ID for context'),
    
    command_id: z.string()
      .min(1, 'Command ID must not be empty if provided')
      .optional()
      .describe('Related command ID if asking about a specific command'),
    
    request_hint: z.boolean()
      .default(false)
      .describe('Explicitly requesting a hint (increments hints_used)'),
    
  }).strict(),
}).strict();

// ---------- AI Message document shape (for repository) ----------

const aiMessageDocumentSchema = z.object({
  id: z.string().optional(),
  session_id: z.string(),
  user_id: z.string(),
  role: MessageRole,
  content: z.string(),
  
  // Step-aware tracking (optional)
  step_id: z.string().nullable().optional(),
  command_id: z.string().nullable().optional(),
  hint_type: HintType.nullable().optional(),
  
  // Metadata
  is_fallback: z.boolean().default(false),
  metadata: z.object({}).passthrough().default({}),
  
  // Timestamps
  created_at: z.date().or(z.string()),
  updated_at: z.date().or(z.string()),
});

// ---------- Session hints tracking schema ----------
// Used for updating total_hints_used at session level

const updateSessionHintsSchema = z.object({
  params: z.object({
    session_id: z.string()
      .min(1, 'Session ID is required'),
  }).strict(),
  body: z.object({
    increment_hints: z.number()
      .int()
      .min(1)
      .max(10)
      .default(1)
      .describe('Number of hints to add to session counter'),
  }).strict(),
}).strict();

// ---------- SUGGESTION SCHEMA ----------
// Smart action suggestions displayed as buttons in the chat UI

const novaSuggestionSchema = z.object({
  id: z.string()
    .min(1, 'Suggestion ID is required')
    .describe('Unique suggestion identifier (e.g., "modules", "recommend", "hint")'),
  
  label: z.string()
    .min(1, 'Label is required')
    .max(50, 'Label must be 50 characters or fewer')
    .describe('Button display text (e.g., "Show training modules")'),
  
  action: z.string()
    .min(1, 'Action is required')
    .max(500, 'Action must be 500 characters or fewer')
    .describe('Full message text to send when button is clicked'),
});

// ---------- ASK HELP QUESTION schema (Public NOVA endpoint) ----------
// For unauthenticated help queries

const askHelpQuestionSchema = z.object({
  body: z.object({
    content: z.string()
      .min(1, 'Question content is required')
      .max(1000, 'Question must be 1000 characters or fewer')
      .refine(
        (val) => !/<\s*script\b[^>]*>/i.test(val) && !/<\s*\/\s*script\b[^>]*>/i.test(val),
        { message: 'Scripts not allowed in content' }
      )
      .refine(
        (val) => !/<\s*iframe\b[^>]*>/i.test(val) && !/<\s*\/\s*iframe\b[^>]*>/i.test(val),
        { message: 'Iframes not allowed in content' }
      )
      .refine(
        (val) => !/on\w+\s*=/i.test(val),
        { message: 'Event handlers not allowed in content' }
      )
      .describe('User help question'),
    
    context: z.enum(['help', 'simulator'])
      .optional()
      .default('help')
      .describe('Context determines which suggestions are returned'),
    
    conversationId: z.string()
      .optional()
      .describe('Optional conversation ID for multi-turn chat (generated on first request)'),
    
    sessionId: z.string()
      .optional()
      .describe('Optional session ID for authenticated users in training mode'),
    
    stepId: z.string()
      .optional()
      .describe('Optional step ID for simulator context'),
    
  }).passthrough(), // Allow additional fields
}).passthrough(); // Allow additional fields at top level

module.exports = {
  // Schemas
  createMessageSchema,
  storeResponseSchema,
  listMessagesSchema,
  postUserMessageSchema,
  aiMessageDocumentSchema,
  updateSessionHintsSchema,
  askHelpQuestionSchema,
  novaSuggestionSchema,
  
  // Enums
  MessageRole,
  HintType,
};
