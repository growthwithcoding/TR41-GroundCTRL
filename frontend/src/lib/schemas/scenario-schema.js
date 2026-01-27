/**
 * Scenario Schemas
 * 
 * Zod validation schem scenario CRUD operations
 * Covers: create, read, update, patch, and list operations
 */

import { z } from 'zod';

// Shared enums
const difficultyEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);
const tierEnum = z.enum(['ROOKIE_PILOT', 'MISSION_SPECIALIST', 'MISSION_COMMANDER']);
const typeEnum = z.enum(['GUIDED', 'SANDBOX']);
const statusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
const categoryEnum = z.enum([
  'FUNDAMENTALS',
  'ORBITAL_MECHANICS',
  'POWER_SYSTEMS',
  'ATTITUDE_CONTROL',
  'COMMUNICATIONS',
  'THERMAL_MANAGEMENT',
  'ANOMALY_RESPONSE',
  'ADVANCED_OPERATIONS'
]);

// ---------- Core nested objects ----------

// Initial state for scenario (seed data)
const initialStateSchema = z.object({
  orbit).positive().min(160).max(35786),
    inclination_degrees: z.number().min(0).max(180),
  }).optional(),
  power: z.object({
    currentCharge_percent).min(0).max(100),
  }).optional(),
  attitude: z.object({
    currentTarget, 'SUN', 'INERTIAL_EAST']).optional(),
    error_degrees: z.number().min(0).max(180).optional(),
  }).optional(),
  thermal: z.object({
    currentTemp_celsius).optional(),
  }).optional(),
  communications: z.object({
    groundPassWindows).datetime(),
      endTime: z.string().datetime(),
      elevation_degrees: z.number().min(0).max(90),
    })).optional(),
  }).optional(),
}).strict();

// Console layout configuration
const consoleLayoutSchema = z.object({
  panels)).optional().describe('Which panels appear in mission console'),
  widgets: z.array(z.string()).optional().describe('Which widgets appear in mission console'),
}).strict().optional();

// Rewards schema
const rewardsSchema = z.object({
  missionPoints)
    .int()
    .min(0)
    .max(10000)
    .describe('Base Mission Points (MP) awarded on completion'),
  
  bonusConditions: z.array(z.object({
    condition,
      'UNDER_PAR_TIME',
      'PERFECT_SCORE',
      'FIRST_ATTEMPT',
      'NO_FAILURES',
      'ALL_OPTIONAL_OBJECTIVES'
    ]).describe('Condition that triggers bonus'),
    
    bonusPoints: z.number()
      .int()
      .min(0)
      .max(5000)
      .describe('Additional MP awarded when condition is met'),
    
    description: z.string()
      .max(200)
      .optional()
      .describe('Human-readable description of bonus condition'),
  })).optional().describe('Bonus MP conditions'),
  
  badges: z.array(z.object({
    badgeId)
      .min(1)
      .describe('FK to badges collection'),
    
    condition: z.enum([
      'COMPLETION',
      'PERFECT_SCORE',
      'SPEED_RUN',
      'NO_HINTS',
      'FIRST_TRY'
    ]).default('COMPLETION')
      .describe('When badge is awarded'),
  })).optional().describe('Badges that can be earned'),
  
  unlocks: z.array(z.string())
    .optional()
    .describe('Scenario IDs unlocked upon completion'),
}).strict().optional();

// ---------- CREATE schema ----------

const createScenarioSchema = z.object({
  body)
      .min(1, 'Scenario code is required')
      .max(100, 'Scenario code must be 100 characters or fewer')
      .regex(/^[A-Z0-9_]+$/, 'Scenario code must be uppercase alphanumeric with underscores')
      .describe('Unique scenario code (e.g., ROOKIE_ORBIT_101)'),
    
    title: z.string()
      .min(1, 'Title is required')
      .max(200, 'Title must be 200 characters or fewer')
      .trim()
      .describe('Human-readable scenario title'),
    
    description: z.string()
      .min(1, 'Description is required')
      .max(2000, 'Description must be 2000 characters or fewer')
      .trim()
      .describe('Detailed mission description and learning objectives'),
    
    // Metadata
    difficulty: difficultyEnum
      .describe('Difficulty level for learning path'),
    
    tier: tierEnum
      .describe('Pilot tier required (ROOKIE_PILOT, MISSION_SPECIALIST, MISSION_COMMANDER)'),
    
    type: typeEnum
      .default('GUIDED')
      .describe('GUIDED (step-by-step) or SANDBOX (free-play)'),
    
    category: categoryEnum
      .describe('Category for UI filtering and grouping'),
    
    estimatedDurationMinutes: z.number()
      .positive('Estimated duration must be positive')
      .max(480, 'Estimated duration cannot exceed 480 minutes')
      .describe('Expected playtime in minutes'),
    
    // Status & Core
    status: statusEnum
      .default('DRAFT')
      .describe('Publishing status (DRAFT, PUBLISHED, ARCHIVED)'),
    
    isActive: z.boolean()
      .default(true)
      .describe('Whether scenario is available for users'),
    
    isCore: z.boolean()
      .default(false)
      .describe('true for core training scenarios'),
    
    isPublic: z.boolean()
      .default(false)
      .describe('Whether scenario is publicly visible to all users'),
    
    // Foreign keys
    satellite_id: z.string()
      .min(1, 'Satellite ID is required')
      .describe('FK to satellites.id'),
    
    // Simulation configuration
    initialState: initialStateSchema
      .optional()
      .describe('Seed state for simulation (orbit, power, attitude, etc.)'),
    
    consoleLayout: consoleLayoutSchema
      .describe('Which panels/widgets appear in mission console'),
    
    // Rewards
    rewards: rewardsSchema
      .describe('Mission Points, bonuses, badges, and unlocks'),
    
    // Optional metadata
    tags: z.array(z.string())
      .optional()
      .describe('Tags for filtering (e.g., power-management, attitude-control)'),
    
    objectives: z.array(z.string())
      .optional()
      .describe('Learning objectives for this scenario'),
    
    prerequisites: z.array(z.string())
      .optional()
      .describe('Scenario IDs that should be completed first'),
    
  }).strict(),
}).strict();

// ---------- UPDATE (full replace) schema ----------

const updateScenarioSchema = z.object({
  params)
      .min(1, 'Scenario ID is required')
      .describe('Scenario document ID'),
  }).strict(),
  body: createScenarioSchema.shape.body,
}).strict();

// ---------- PATCH (partial update) schema ----------

const patchScenarioSchema = z.object({
  params)
      .min(1, 'Scenario ID is required')
      .describe('Scenario document ID'),
  }).strict(),
  body: z.object({
    code),
    title: createScenarioSchema.shape.body.shape.title.optional(),
    description: createScenarioSchema.shape.body.shape.description.optional(),
    difficulty: difficultyEnum.optional(),
    tier: tierEnum.optional(),
    type: typeEnum.optional(),
    category: categoryEnum.optional(),
    estimatedDurationMinutes: createScenarioSchema.shape.body.shape.estimatedDurationMinutes.optional(),
    status: statusEnum.optional(),
    isActive: z.boolean().optional(),
    isCore: z.boolean().optional(),
    isPublic: z.boolean().optional(),
    satellite_id: z.string().min(1).optional(),
    initialState: initialStateSchema.optional(),
    consoleLayout: consoleLayoutSchema,
    rewards: rewardsSchema,
    tags: z.array(z.string()).optional(),
    objectives: z.array(z.string()).optional(),
    prerequisites: z.array(z.string()).optional(),
  }).strict()
    .refine(
      (data) => Object.keys(data).length > 0,
      'At least one field must be provided for update'
    ),
}).strict();

// ---------- LIST (query parameters) schema ----------

const listScenariosSchema = z.object({
  query)
      .optional()
      .transform((val) => val ? parseInt(val, 10) : 1)
      .refine((val) => val >= 1, 'Page must be 1 or greater')
      .describe('Page number for pagination (default)'),
    
    limit: z.string()
      .optional()
      .transform((val) => val ? parseInt(val, 10) : 20)
      .refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
      .describe('Number of items per page (default, max: 100)'),
    
    sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'difficulty', 'tier'])
      .optional()
      .default('createdAt')
      .describe('Field to sort by (default)'),
    
    sortOrder: z.enum(['asc', 'desc'])
      .optional()
      .default('desc')
      .describe('Sort order (default)'),
    
    difficulty: difficultyEnum
      .optional()
      .describe('Filter by difficulty level'),
    
    tier: tierEnum
      .optional()
      .describe('Filter by pilot tier'),
    
    type: typeEnum
      .optional()
      .describe('Filter by scenario type (GUIDED or SANDBOX)'),
    
    category: categoryEnum
      .optional()
      .describe('Filter by category'),
    
    status: statusEnum
      .optional()
      .describe('Filter by publishing status'),
    
    isActive: z.string()
      .optional()
      .transform((val) => val === 'true')
      .describe('Filter by active status (true/false)'),
    
    isCore: z.string()
      .optional()
      .transform((val) => val === 'true')
      .describe('Filter by core status (true/false)'),
    
    isPublic: z.string()
      .optional()
      .transform((val) => val === 'true')
      .describe('Filter by visibility (true/false)'),
    
    satellite_id: z.string()
      .optional()
      .describe('Filter by satellite ID'),
    
  }).strict(),
}).strict();

// ---------- Type exports ----------

export {
  difficultyEnum,
  tierEnum,
  typeEnum,
  statusEnum,
  categoryEnum,
  initialStateSchema,
  consoleLayoutSchema,
  rewardsSchema,
  createScenarioSchema,
  updateScenarioSchema,
  patchScenarioSchema,
  listScenariosSchema,
};
