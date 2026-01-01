// src/schemas/satelliteSchemas.js
const { z } = require('zod');

// Shared enums
const statusEnum = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED', 'TRAINING']);

// ---------- Core nested objects ----------

// Orbital state (MVP: altitude + inclination only)
const orbitSchema = z.object({
  altitude_km: z
    .number({
      required_error: 'Orbit altitude is required',
      invalid_type_error: 'Orbit altitude must be a number',
    })
    .positive('Orbit altitude must be positive')
    .min(160, 'Orbit altitude must be at least 160 km (LEO minimum)')
    .max(35786, 'Orbit altitude must not exceed 35,786 km (GEO altitude)')
    .describe('Altitude above Earth mean sea level in kilometers'),
  inclination_degrees: z
    .number({
      required_error: 'Inclination is required',
      invalid_type_error: 'Inclination must be a number',
    })
    .min(0, 'Inclination must be between 0 and 180 degrees')
    .max(180, 'Inclination must be between 0 and 180 degrees')
    .describe('Orbital plane inclination in degrees'),
}).strict();

// Power subsystem (simplified)
const powerSchema = z
  .object({
    solarPower_watts: z
      .number({
        required_error: 'Solar array power is required',
        invalid_type_error: 'Solar array power must be a number',
      })
      .positive('Solar array power must be positive')
      .describe('Peak power from solar panels in Watts'),
    batteryCapacity_wh: z
      .number({
        required_error: 'Battery capacity is required',
        invalid_type_error: 'Battery capacity must be a number',
      })
      .positive('Battery capacity must be positive')
      .describe('Usable battery energy in Watt-hours'),
    baseDrawRate_watts: z
      .number({
        required_error: 'Base power draw is required',
        invalid_type_error: 'Base power draw must be a number',
      })
      .nonnegative('Base power draw must be 0 or greater')
      .describe('Always-on power draw in Watts'),
    currentCharge_percent: z
      .number({
        required_error: 'Current charge is required',
        invalid_type_error: 'Current charge must be a number',
      })
      .min(0, 'Current charge must be between 0 and 100 percent')
      .max(100, 'Current charge must be between 0 and 100 percent')
      .describe('Battery state of charge (0–100%)'),
  })
  .strict();

// Attitude
const attitudeSchema = z
  .object({
    currentTarget: z
      .enum(['NADIR', 'SUN', 'INERTIAL_EAST'], {
        required_error: 'Current pointing target is required',
      })
      .describe('Current pointing target (e.g., NADIR, SUN, INERTIAL_EAST)'),
    error_degrees: z
      .number({
        required_error: 'Attitude error is required',
        invalid_type_error: 'Attitude error must be a number',
      })
      .min(0, 'Attitude error must be 0 or greater')
      .max(180, 'Attitude error must be 180 degrees or less')
      .describe('Pointing error from desired target in degrees'),
  })
  .strict();

// Thermal
const thermalSchema = z
  .object({
    currentTemp_celsius: z
      .number({
        required_error: 'Current temperature is required',
        invalid_type_error: 'Current temperature must be a number',
      })
      .describe('Current average satellite temperature in Celsius'),
    minSafe_celsius: z
      .number({
        required_error: 'Minimum safe temperature is required',
        invalid_type_error: 'Minimum safe temperature must be a number',
      })
      .describe('Minimum safe operating temperature in Celsius'),
    maxSafe_celsius: z
      .number({
        required_error: 'Maximum safe temperature is required',
        invalid_type_error: 'Maximum safe temperature must be a number',
      })
      .describe('Maximum safe operating temperature in Celsius'),
    heaterAvailable: z
      .boolean({
        invalid_type_error: 'heaterAvailable must be a boolean',
      })
      .default(true)
      .describe('Whether an active heater is available'),
  })
  .strict();

// Propulsion
const propulsionSchema = z
  .object({
    propellantRemaining_kg: z
      .number({
        required_error: 'Propellant remaining is required',
        invalid_type_error: 'Propellant remaining must be a number',
      })
      .nonnegative('Propellant remaining must be 0 or greater')
      .describe('Remaining propellant mass in kilograms'),
    maxDeltaV_ms: z
      .number({
        required_error: 'Max delta-V is required',
        invalid_type_error: 'Max delta-V must be a number',
      })
      .nonnegative('Max delta-V must be 0 or greater')
      .describe('Approximate available delta-V in meters per second'),
  })
  .strict();

// Payload
const payloadSchema = z
  .object({
    type: z
      .string({
        required_error: 'Payload type is required',
        invalid_type_error: 'Payload type must be a string',
      })
      .min(1, 'Payload type is required')
      .max(100, 'Payload type must be 100 characters or fewer')
      .describe('Payload type (e.g., Camera, Spectrometer)'),
    isActive: z
      .boolean({
        invalid_type_error: 'isActive must be a boolean',
      })
      .default(false)
      .describe('Whether the payload is currently active'),
    powerDraw_watts: z
      .number({
        required_error: 'Payload power draw is required',
        invalid_type_error: 'Payload power draw must be a number',
      })
      .nonnegative('Payload power draw must be 0 or greater')
      .describe('Payload power consumption when active in Watts'),
  })
  .strict();

// ---------- CREATE schema ----------

const createSatelliteSchema = z
  .object({
    body: z
      .object({
        // Identification / metadata
        name: z
          .string({
            required_error: 'Name is required',
            invalid_type_error: 'Name must be a string',
          })
          .min(1, 'Name is required')
          .max(100, 'Name must be 100 characters or fewer')
          .trim()
          .describe('Satellite name or designation'),
        description: z
          .string({
            invalid_type_error: 'Description must be a string',
          })
          .max(500, 'Description must be 500 characters or fewer')
          .trim()
          .optional()
          .describe('Optional human-readable description'),

        // Core subsystems (all required for templates)
        orbit: orbitSchema,
        power: powerSchema,
        attitude: attitudeSchema,
        thermal: thermalSchema,
        propulsion: propulsionSchema,
        payload: payloadSchema,

        // Training/game metadata
        status: statusEnum
          .default('TRAINING')
          .describe('Operational/training status'),
        isPublic: z
          .boolean({
            invalid_type_error: 'isPublic must be a boolean',
          })
          .default(false)
          .describe('Whether satellite is publicly visible to all users'),
        capabilities: z
          .array(
            z
              .string({
                invalid_type_error: 'Capability must be a string',
              })
              .min(1, 'Capability entries cannot be empty')
          )
          .optional()
          .describe(
            'Capabilities used for filtering (e.g., \'Power management\', \'Attitude control\')'
          ),
        designSource: z
          .string({
            invalid_type_error: 'designSource must be a string',
          })
          .max(200, 'designSource must be 200 characters or fewer')
          .optional()
          .describe('Reference, e.g., \'Generic LEO trainer\' or \'ISS-inspired\''),
      })
      .strict(), // reject unknown body fields
  })
  .strict(); // reject unknown top-level keys

// ---------- UPDATE (full replace) schema ----------

const updateSatelliteSchema = z
  .object({
    params: z
      .object({
        id: z
          .string({
            required_error: 'Satellite ID is required',
            invalid_type_error: 'Satellite ID must be a string',
          })
          .min(1, 'Satellite ID is required'),
      })
      .strict(),
    body: createSatelliteSchema.shape.body, // same shape as create
  })
  .strict();

// ---------- PATCH (partial update) schema ----------

const patchSatelliteSchema = z
  .object({
    params: z
      .object({
        id: z
          .string({
            required_error: 'Satellite ID is required',
            invalid_type_error: 'Satellite ID must be a string',
          })
          .min(1, 'Satellite ID is required'),
      })
      .strict(),
    body: z
      .object({
        name: createSatelliteSchema.shape.body.shape.name.optional(),
        description: createSatelliteSchema.shape.body.shape.description,

        orbit: orbitSchema.partial().optional(),
        power: powerSchema.partial().optional(),
        attitude: attitudeSchema.partial().optional(),
        thermal: thermalSchema.partial().optional(),
        propulsion: propulsionSchema.partial().optional(),
        payload: payloadSchema.partial().optional(),

        status: statusEnum.optional(),
        isPublic: z
          .boolean({
            invalid_type_error: 'isPublic must be a boolean',
          })
          .optional()
          .describe('Whether satellite is publicly visible to all users'),
        capabilities: z
          .array(
            z
              .string({
                invalid_type_error: 'Capability must be a string',
              })
              .min(1, 'Capability entries cannot be empty')
          )
          .optional(),
        designSource: createSatelliteSchema.shape.body.shape.designSource,
      })
      .strict()
      .refine(
        (data) => Object.keys(data).length > 0,
        'At least one field must be provided for update'
      ),
  })
  .strict();

// ---------- LIST (query parameters) schema ----------

const listSatellitesSchema = z
  .object({
    query: z
      .object({
        page: z
          .string()
          .optional()
          .transform((val) => val ? parseInt(val, 10) : 1)
          .refine((val) => val >= 1, 'Page must be 1 or greater')
          .describe('Page number for pagination (default: 1)'),
        limit: z
          .string()
          .optional()
          .transform((val) => val ? parseInt(val, 10) : 20)
          .refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
          .describe('Number of items per page (default: 20, max: 100)'),
        sortBy: z
          .enum(['createdAt', 'updatedAt', 'name', 'status'])
          .optional()
          .default('createdAt')
          .describe('Field to sort by (default: createdAt)'),
        sortOrder: z
          .enum(['asc', 'desc'])
          .optional()
          .default('desc')
          .describe('Sort order (default: desc)'),
        status: statusEnum
          .optional()
          .describe('Filter by satellite status'),
        isPublic: z
          .string()
          .optional()
          .transform((val) => val === 'true')
          .describe('Filter by public visibility (true/false)'),
      })
      .strict(),
  })
  .strict();

module.exports = {
  createSatelliteSchema,
  updateSatelliteSchema,
  patchSatelliteSchema,
  listSatellitesSchema,
};
