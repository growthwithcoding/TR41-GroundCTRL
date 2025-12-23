/**
 * User Schemas
 * Zod validation schemas for user CRUD operations
 */

const { z } = require('zod');

/**
 * Schema for creating a new user (admin only)
 */
const createUserSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[@$!%*?&#^()_+\-=[\]{}|;:,.<>/]/, 'Password must contain at least one special character'),
  callSign: z.string()
    .min(2, 'Call sign must be at least 2 characters')
    .max(30, 'Call sign must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Call sign can only contain letters, numbers, underscores, and hyphens')
    .optional(),
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must not exceed 50 characters')
    .optional(),
  role: z.enum(['operator', 'admin', 'viewer'])
    .default('operator'),
  isActive: z.boolean()
    .default(true),
  isAdmin: z.boolean()
    .default(false)
});

/**
 * Schema for full user update (PUT)
 */
const updateUserSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  callSign: z.string()
    .min(2, 'Call sign must be at least 2 characters')
    .max(30, 'Call sign must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Call sign can only contain letters, numbers, underscores, and hyphens'),
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must not exceed 50 characters')
    .optional(),
  role: z.enum(['operator', 'admin', 'viewer']),
  isActive: z.boolean(),
  isAdmin: z.boolean()
});

/**
 * Schema for partial user update (PATCH)
 */
const patchUserSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .optional(),
  callSign: z.string()
    .min(2, 'Call sign must be at least 2 characters')
    .max(30, 'Call sign must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Call sign can only contain letters, numbers, underscores, and hyphens')
    .optional(),
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must not exceed 50 characters')
    .optional(),
  role: z.enum(['operator', 'admin', 'viewer'])
    .optional(),
  isActive: z.boolean()
    .optional(),
  isAdmin: z.boolean()
    .optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[@$!%*?&#^()_+\-=[\]{}|;:,.<>/]/, 'Password must contain at least one special character')
    .optional()
}).refine(
  data => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided for update'
  }
);

/**
 * Schema for query parameters
 */
const userQuerySchema = z.object({
  page: z.string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(Number)
    .refine(n => n > 0, 'Page must be greater than 0')
    .optional(),
  limit: z.string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(Number)
    .refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100')
    .optional(),
  search: z.string()
    .optional(),
  sortBy: z.enum(['createdAt', 'email', 'callSign', 'displayName'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc'])
    .optional(),
  role: z.enum(['operator', 'admin', 'viewer'])
    .optional(),
  isActive: z.string()
    .transform(val => val === 'true')
    .optional()
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  patchUserSchema,
  userQuerySchema
};
