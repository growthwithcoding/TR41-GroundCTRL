/**
 * Scenario Steps Schemas
 * 
 * Zod validation schemas for scenario step CRUD operations
 * Steps are ordered sequences within scenarios with objectives and hints
 */

const { z } = require('zod');

// ---------- CREATE schema ----------

const createScenarioStepSchema = z.object({
  body: z.object({
    // Identification & ordering
    scenario_id: z.string()
      .min(1, 'Scenario ID is required')
      .describe('FK to scenarios.id'),
    
    stepOrder: z.number()
      .int('Step order must be an integer')
      .positive('Step order must be positive')
      .describe('Step sequence (1, 2, 3, ...)'),
    
    title: z.string()
      .min(1, 'Title is required')
      .max(200, 'Title must be 200 characters or fewer')
      .trim()
      .describe('Step title (e.g., "Check Current Attitude")'),
    
    instructions: z.string()
      .min(1, 'Instructions are required')
      .max(2000, 'Instructions must be 2000 characters or fewer')
      .trim()
      .describe('What user is asked to do at this step'),
    
    objective: z.string()
      .min(1, 'Objective is required')
      .max(1000, 'Objective must be 1000 characters or fewer')
      .trim()
      .describe('What counts as "success" for this step'),
    
    completionCondition: z.string()
      .min(1, 'Completion condition is required')
      .max(1000, 'Completion condition must be 1000 characters or fewer')
      .trim()
      .describe('How backend knows step is complete (logic description)'),
    
    // Metadata
    isCheckpoint: z.boolean()
      .default(false)
      .describe('true for key milestones (useful for resuming)'),
    
    expectedDurationSeconds: z.number()
      .int('Duration must be in seconds')
      .positive('Duration must be positive')
      .describe('Estimated step duration in seconds'),
    
    hint_suggestion: z.string()
      .min(1, 'Hint is required')
      .max(500, 'Hint must be 500 characters or fewer')
      .trim()
      .describe('Default hint text the AI tutor can use'),
    
  }).strict(),
}).strict();

// ---------- UPDATE (full replace) schema ----------

const updateScenarioStepSchema = z.object({
  params: z.object({
    id: z.string()
      .min(1, 'Step ID is required')
      .describe('Scenario step document ID'),
  }).strict(),
  body: createScenarioStepSchema.shape.body,
}).strict();

// ---------- PATCH (partial update) schema ----------

const patchScenarioStepSchema = z.object({
  params: z.object({
    id: z.string()
      .min(1, 'Step ID is required')
      .describe('Scenario step document ID'),
  }).strict(),
  body: createScenarioStepSchema.shape.body.partial().strict()
    .refine(
      (data) => Object.keys(data).length > 0,
      'At least one field must be provided for update'
    ),
}).strict();

// ---------- LIST (query parameters) schema ----------

const listScenarioStepsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
    sortBy: z.enum(['stepOrder', 'createdAt', 'updatedAt', 'title']).optional().default('stepOrder'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
    scenario_id: z.string().optional().describe('Filter by scenario ID'),
  }).strict(),
}).strict();

module.exports = {
  createScenarioStepSchema,
  updateScenarioStepSchema,
  patchScenarioStepSchema,
  listScenarioStepsSchema,
};