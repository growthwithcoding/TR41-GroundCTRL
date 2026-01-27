/**
 * Ground Station Schema
 * 
 * Zod validation schemas for ground station data
 * Map-ready, future-safe schema for real ground station networks
 * 
 * Supports:
 * - NASA Deep Space Network (DSN)
 * - ESA ESTRACK
 * - KSAT/SSC Polar Networks
 * - Future expansion for other operators
 */

const { z } = require('zod');

const GroundStationSchema = z.object({
  stationId: z.string(),              // stable ID, never shown to user
  displayName: z.string(),             // human-readable label
  operator: z.enum([
    'NASA',
    'ESA',
    'KSAT',
    'SSC'
  ]),

  network: z.string().optional(),      // DSN, ESTRACK, KSAT PGN, etc

  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    elevationMeters: z.number().optional()
  }),

  country: z.string().optional(),

  capabilities: z.object({
    frequencyBands: z.array(z.string()).optional(), // S, X, Ka
    deepSpace: z.boolean().optional(),
    leoSupport: z.boolean().optional(),
    polarCoverage: z.boolean().optional()
  }).optional(),

  visualization: z.object({
    mapIcon: z.string().optional(),     // future: custom SVG
    color: z.string().optional()        // future: operator color
  }).optional(),

  scenarioOverrides: z.record(z.any()).optional(), // future toggles

  metadata: z.record(z.any()).optional() // future realism hooks
});

const GroundStationArraySchema = z.array(GroundStationSchema);

module.exports = {
  GroundStationSchema,
  GroundStationArraySchema
};
