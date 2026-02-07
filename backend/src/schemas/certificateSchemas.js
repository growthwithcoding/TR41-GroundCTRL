/**
 * Certificate Schemas
 * 
 * Zod validation schemas for certificate CRUD operations
 * Certificates are generated when users complete missions
 * 
 * Features:
 * - Mission completion certificates
 * - Achievement badges
 * - Performance summaries
 * - Shareable public URLs
 * - PDF download capability
 */

const { z } = require('zod');

// ---------- Certificate types ----------
const CERTIFICATE_TYPES = ['mission_completion', 'achievement', 'milestone'];

// ---------- Performance tiers ----------
const PERFORMANCE_TIERS = ['EXCELLENT', 'GOOD', 'SATISFACTORY', 'INCOMPLETE'];

// ---------- CREATE schema ----------
const createCertificateSchema = z.object({
  body: z.object({
    // User information
    userId: z.string()
      .min(1, 'User ID is required')
      .describe('User who earned the certificate'),
    
    userName: z.string()
      .min(1, 'User name is required')
      .max(100, 'User name must be 100 characters or fewer')
      .describe('Display name for certificate'),
    
    // Certificate type
    type: z.enum(CERTIFICATE_TYPES, {
      errorMap: () => ({ message: `Type must be one of: ${CERTIFICATE_TYPES.join(', ')}` })
    }).describe('Certificate type'),
    
    template: z.string()
      .optional()
      .describe('Certificate template identifier'),
    
    // Mission details (for mission_completion type)
    mission: z.object({
      name: z.string().min(1, 'Mission name is required'),
      description: z.string().optional(),
      difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
      sessionId: z.string().min(1, 'Session ID is required')
    }).optional(),
    
    // Performance data
    performance: z.object({
      overallScore: z.number().min(0).max(100),
      tier: z.object({
        name: z.enum(PERFORMANCE_TIERS),
        label: z.string(),
        badge: z.string()
      }),
      duration: z.string(),
      commandsIssued: z.number().min(0),
      stepsCompleted: z.string(),
      achievements: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        badge: z.string().optional()
      }))
    }).optional(),
    
    // Shareable data
    shareableText: z.string().optional(),
    shareableUrl: z.string().url().nullable().optional(),
    
    // Metadata
    completionDate: z.string().datetime().optional(),
    isPublic: z.boolean().default(true).describe('Whether certificate can be publicly viewed'),
    
  }).strict(),
}).strict();

// ---------- UPDATE (full replace) schema ----------
const updateCertificateSchema = z.object({
  params: z.object({
    id: z.string()
      .min(1, 'Certificate ID is required')
      .describe('Certificate document ID'),
  }).strict(),
  body: createCertificateSchema.shape.body,
}).strict();

// ---------- PATCH (partial update) schema ----------
const patchCertificateSchema = z.object({
  params: z.object({
    id: z.string()
      .min(1, 'Certificate ID is required')
      .describe('Certificate document ID'),
  }).strict(),
  body: createCertificateSchema.shape.body.partial().strict()
    .refine(
      (data) => Object.keys(data).length > 0,
      'At least one field must be provided for update'
    ),
}).strict();

// ---------- LIST (query parameters) schema ----------
const listCertificatesSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
    cursor: z.string().optional().describe('Cursor for pagination'),
    sortBy: z.enum(['completionDate', 'createdAt', 'overallScore', 'type']).optional().default('completionDate'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    userId: z.string().optional().describe('Filter by user ID'),
    type: z.enum(CERTIFICATE_TYPES).optional().describe('Filter by certificate type'),
    tier: z.enum(PERFORMANCE_TIERS).optional().describe('Filter by performance tier'),
    isPublic: z.string().optional().transform(val => val === 'true').describe('Filter by public visibility'),
  }).strict(),
}).strict();

// ---------- GET by session ID schema ----------
const getCertificateBySessionSchema = z.object({
  params: z.object({
    sessionId: z.string()
      .min(1, 'Session ID is required')
      .describe('Scenario session ID'),
  }).strict(),
}).strict();

// ---------- VERIFY certificate schema ----------
const verifyCertificateSchema = z.object({
  params: z.object({
    certificateId: z.string()
      .min(1, 'Certificate ID is required')
      .describe('Certificate ID to verify'),
  }).strict(),
}).strict();

// ---------- DOWNLOAD PDF schema ----------
const downloadPdfSchema = z.object({
  params: z.object({
    id: z.string()
      .min(1, 'Certificate ID is required')
      .describe('Certificate document ID'),
  }).strict(),
  query: z.object({
    format: z.enum(['pdf', 'png']).optional().default('pdf'),
  }).strict(),
}).strict();

// ---------- SHARE settings schema ----------
const updateShareSettingsSchema = z.object({
  params: z.object({
    id: z.string()
      .min(1, 'Certificate ID is required')
      .describe('Certificate document ID'),
  }).strict(),
  body: z.object({
    isPublic: z.boolean().describe('Whether certificate is publicly viewable'),
  }).strict(),
}).strict();

module.exports = {
  createCertificateSchema,
  updateCertificateSchema,
  patchCertificateSchema,
  listCertificatesSchema,
  getCertificateBySessionSchema,
  verifyCertificateSchema,
  downloadPdfSchema,
  updateShareSettingsSchema,
  CERTIFICATE_TYPES,
  PERFORMANCE_TIERS,
};
