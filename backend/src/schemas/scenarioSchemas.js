/**
 * Scenario Schemas
 * 
 * Zod validation schemas for scenario CRUD operations
 * Covers: create, read, update, patch, and list operations
 */

const { z } = require('zod');

// Shared enums
const difficultyEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);
const tierEnum = z.enum(['ROOKIE_PILOT', 'MISSION_SPECIALIST', 'MISSION_COMMANDER']);
const typeEnum = z.enum(['GUIDED', 'SANDBOX']);
const statusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

// ---------- Core nested objects ----------

// Initial state for scenario (seed data)
const initialStateSchema = z.object({
  orbit: z.object({
    altitude_km: z.number().positive().min(160).max(35786),
    inclination_degrees: z.number().min(0).max(180),
    
    // Full Keplerian elements (optional for backward compatibility)
    eccentricity: z.number().min(0).max(0.99).default(0.0001).optional(),
    raan_degrees: z.number().min(0).max(360).default(0).optional(),
    argumentOfPerigee_degrees: z.number().min(0).max(360).default(0).optional(),
    trueAnomaly_degrees: z.number().min(0).max(360).default(0).optional(),
    epoch: z.number().optional(),
    
    // Computed fields
    perigee_km: z.number().positive().optional(),
    apogee_km: z.number().positive().optional(),
    period_minutes: z.number().positive().optional(),
    semiMajorAxis_km: z.number().positive().optional(),
  }).optional(),
  power: z.object({
    currentCharge_percent: z.number().min(0).max(100),
  }).optional(),
  attitude: z.object({
    currentTarget: z.enum(['NADIR', 'SUN', 'INERTIAL_EAST']).optional(),
    error_degrees: z.number().min(0).max(180).optional(),
  }).optional(),
  thermal: z.object({
    currentTemp_celsius: z.number().optional(),
  }).optional(),
  communications: z.object({
    groundPassWindows: z.array(z.object({
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
      elevation_degrees: z.number().min(0).max(90),
    })).optional(),
  }).optional(),
}).strict();

// Console layout configuration
const consoleLayoutSchema = z.object({
  panels: z.array(z.string()).optional().describe('Which panels appear in mission console'),
  widgets: z.array(z.string()).optional().describe('Which widgets appear in mission console'),
}).strict().optional();

// ---------- CREATE schema ----------

const createScenarioSchema = z.object({
  body: z.object({
    // Identification
    code: z.string()
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
    
    ground_station_id: z.string()
      .optional()
      .describe('FK to ground_stations.id (optional)'),
    
    // Simulation configuration
    initialState: initialStateSchema
      .optional()
      .describe('Seed state for simulation (orbit, power, attitude, etc.)'),
    
    consoleLayout: consoleLayoutSchema
      .describe('Which panels/widgets appear in mission console'),
    
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
  params: z.object({
    id: z.string()
      .min(1, 'Scenario ID is required')
      .describe('Scenario document ID'),
  }).strict(),
  body: createScenarioSchema.shape.body,
}).strict();

// ---------- PATCH (partial update) schema ----------

const patchScenarioSchema = z.object({
  params: z.object({
    id: z.string()
      .min(1, 'Scenario ID is required')
      .describe('Scenario document ID'),
  }).strict(),
  body: z.object({
    code: createScenarioSchema.shape.body.shape.code.optional(),
    title: createScenarioSchema.shape.body.shape.title.optional(),
    description: createScenarioSchema.shape.body.shape.description.optional(),
    difficulty: difficultyEnum.optional(),
    tier: tierEnum.optional(),
    type: typeEnum.optional(),
    estimatedDurationMinutes: createScenarioSchema.shape.body.shape.estimatedDurationMinutes.optional(),
    status: statusEnum.optional(),
    isActive: z.boolean().optional(),
    isCore: z.boolean().optional(),
    isPublic: z.boolean().optional(),
    satellite_id: z.string().min(1).optional(),
    initialState: initialStateSchema.optional(),
    consoleLayout: consoleLayoutSchema,
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
  query: z.object({
    page: z.string()
      .optional()
      .transform((val) => val ? parseInt(val, 10) : 1)
      .refine((val) => val >= 1, 'Page must be 1 or greater')
      .describe('Page number for pagination (default: 1)'),
    
    limit: z.string()
      .optional()
      .transform((val) => val ? parseInt(val, 10) : 20)
      .refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
      .describe('Number of items per page (default: 20, max: 100)'),
    
    sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'difficulty', 'tier'])
      .optional()
      .default('createdAt')
      .describe('Field to sort by (default: createdAt)'),
    
    sortOrder: z.enum(['asc', 'desc'])
      .optional()
      .default('desc')
      .describe('Sort order (default: desc)'),
    
    difficulty: difficultyEnum
      .optional()
      .describe('Filter by difficulty level'),
    
    tier: tierEnum
      .optional()
      .describe('Filter by pilot tier'),
    
    type: typeEnum
      .optional()
      .describe('Filter by scenario type (GUIDED or SANDBOX)'),
    
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
      .describe('Filter by public visibility (true/false)'),
    
    satellite_id: z.string()
      .optional()
      .describe('Filter by satellite ID'),
    
  }).strict(),
}).strict();

module.exports = {
  createScenarioSchema,
  updateScenarioSchema,
  patchScenarioSchema,
  listScenariosSchema,
};
