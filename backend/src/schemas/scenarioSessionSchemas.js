/**
 * Scenario Session Schemas
 * 
 * Zod validation schemas for scenario session CRUD operations
 * Sessions track operator progress through training scenarios
 * 
 * Aligned with Phase 9 IMPLEMENTATION_PLAN:
 * - user_id (uid) is set by controller from req.user.uid, NOT from request body
 * - All required fields per Phase 9 spec included
 */

const { z } = require('zod');

// Session status enum - aligned with Phase 9
const SessionStatus = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'PAUSED',
  'COMPLETED',
  'FAILED',
  'ABANDONED'
]);

// ---------- CREATE schema ----------
// Note: user_id is NOT in body - it's set from req.user.uid in controller

const createScenarioSessionSchema = z.object({
  body: z.object({
    // Foreign key - scenario being played
    scenario_id: z.string()
      .min(1, 'Scenario ID is required')
      .describe('FK to scenarios.id'),
    
    // Session state - defaults to NOT_STARTED
    status: SessionStatus
      .default('NOT_STARTED')
      .describe('Current session status'),
    
    // Current step tracking
    current_step_id: z.string()
      .min(1, 'Step ID must not be empty if provided')
      .nullable()
      .optional()
      .describe('FK to scenario_steps.id - current step'),
    
    currentStepOrder: z.number()
      .int('Step order must be an integer')
      .min(0, 'Step order must be non-negative')
      .default(0)
      .describe('Current step order the operator is on'),
    
    // Progress tracking
    completedSteps: z.array(z.string())
      .default([])
      .describe('Array of completed step IDs'),
    
    // Scoring
    score: z.number()
      .min(0, 'Score must be non-negative')
      .max(100, 'Score cannot exceed 100')
      .optional()
      .describe('Session score (0-100)'),
    
    // Metrics tracking - aligned with Phase 9
    total_hints_used: z.number()
      .int('Total hints used must be an integer')
      .min(0, 'Total hints used must be non-negative')
      .default(0)
      .describe('Number of hints requested during session'),
    
    total_errors: z.number()
      .int('Total errors must be an integer')
      .min(0, 'Total errors must be non-negative')
      .default(0)
      .describe('Number of errors made during session'),
    
    // Timing - these are set by the system, not the client
    // started_at, completed_at, last_activity_at managed by controller
    
    // Runtime state - JSON blob for simulation state
    state: z.object({})
      .passthrough()
      .optional()
      .default({})
      .describe('Runtime simulation state (JSON)'),
    
    // Ground station configuration (future: scenario-specific)
    enabledGroundStations: z.array(z.string())
      .optional()
      .describe('Array of enabled ground station IDs for this session'),
    
    // Session metadata
    attemptNumber: z.number()
      .int('Attempt number must be an integer')
      .positive('Attempt number must be positive')
      .default(1)
      .describe('Which attempt this is for the operator'),
    
    notes: z.string()
      .max(2000, 'Notes must be 2000 characters or fewer')
      .optional()
      .describe('Session notes or feedback'),
    
    // Optimistic locking version
    version: z.number()
      .int('Version must be an integer')
      .positive('Version must be positive')
      .default(1)
      .describe('Version number for optimistic locking'),
    
  }).strict(),
}).strict();

// ---------- UPDATE (full replace) schema ----------

const updateScenarioSessionSchema = z.object({
  params: z.object({
    id: z.string()
      .min(1, 'Session ID is required')
      .describe('Scenario session document ID'),
  }).strict(),
  body: createScenarioSessionSchema.shape.body,
}).strict();

// ---------- PATCH (partial update) schema ----------

const patchScenarioSessionSchema = z.object({
  params: z.object({
    id: z.string()
      .min(1, 'Session ID is required')
      .describe('Scenario session document ID'),
  }).strict(),
  body: createScenarioSessionSchema.shape.body.partial().strict()
    .refine(
      (data) => Object.keys(data).length > 0,
      'At least one field must be provided for update'
    ),
}).strict();

// ---------- LIST (query parameters) schema ----------

const listScenarioSessionsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
    cursor: z.string().optional().describe('Cursor for pagination'),
    sortBy: z.enum(['createdAt', 'updatedAt', 'started_at', 'completed_at', 'status', 'score']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    scenario_id: z.string().optional().describe('Filter by scenario ID'),
    // Note: user_id filter should be applied from req.user.uid in controller for non-admins
    status: SessionStatus.optional().describe('Filter by session status'),
  }).strict(),
}).strict();

// ---------- START SESSION schema ----------
// Used when starting a new session for a scenario

const startSessionSchema = z.object({
  body: z.object({
    scenario_id: z.string()
      .min(1, 'Scenario ID is required')
      .describe('FK to scenarios.id'),
  }).strict(),
}).strict();

// ---------- ADVANCE STEP schema ----------
// Used when advancing to the next step in a session

const advanceStepSchema = z.object({
  params: z.object({
    id: z.string()
      .min(1, 'Session ID is required')
      .describe('Scenario session document ID'),
  }).strict(),
  body: z.object({
    completed_step_id: z.string()
      .min(1, 'Completed step ID is required')
      .describe('The step that was completed'),
    next_step_id: z.string()
      .min(1, 'Next step ID must not be empty if provided')
      .nullable()
      .optional()
      .describe('The next step to advance to (null if completing)'),
    score_delta: z.number()
      .optional()
      .describe('Score change from this step'),
  }).strict(),
}).strict();

// ---------- UPDATE STATE schema ----------
// Used for updating session state without changing step

const updateStateSchema = z.object({
  params: z.object({
    id: z.string()
      .min(1, 'Session ID is required')
      .describe('Scenario session document ID'),
  }).strict(),
  body: z.object({
    state: z.object({})
      .passthrough()
      .describe('Updated simulation state'),
    hints_used: z.number()
      .int()
      .min(0)
      .optional()
      .describe('Increment hints used count'),
    errors: z.number()
      .int()
      .min(0)
      .optional()
      .describe('Increment errors count'),
  }).strict(),
}).strict();

// ---------- COMPLETE SESSION schema ----------

const completeSessionSchema = z.object({
  params: z.object({
    id: z.string()
      .min(1, 'Session ID is required')
      .describe('Scenario session document ID'),
  }).strict(),
  body: z.object({
    status: z.enum(['COMPLETED', 'FAILED', 'ABANDONED'])
      .describe('Final session status'),
    final_score: z.number()
      .min(0)
      .max(100)
      .optional()
      .describe('Final session score'),
    notes: z.string()
      .max(2000)
      .optional()
      .describe('Completion notes'),
  }).strict(),
}).strict();

module.exports = {
  createScenarioSessionSchema,
  updateScenarioSessionSchema,
  patchScenarioSessionSchema,
  listScenarioSessionsSchema,
  startSessionSchema,
  advanceStepSchema,
  updateStateSchema,
  completeSessionSchema,
  SessionStatus,
};
