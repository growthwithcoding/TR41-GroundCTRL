/**
 * Authentication Schemas
 * Zod validation schemas for auth operations
 */

const { z } = require('zod');

/**
 * Login schema
 */
const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z.string()
    .min(1, 'Password is required')
}).strict();

/**
 * Register schema
 */
const registerSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
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
    .optional()
}).strict();

/**
 * Refresh token schema
 */
const refreshTokenSchema = z.object({
  refreshToken: z.string()
    .min(1, 'Refresh token is required')
}).strict();

/**
 * Revoke token schema
 */
const revokeTokenSchema = z.object({
  token: z.string()
    .min(1, 'Token is required')
    .optional(),
  userId: z.string()
    .min(1, 'User ID is required')
    .optional()
}).strict().refine(
  data => data.token || data.userId,
  {
    message: 'Either token or userId must be provided'
  }
);

module.exports = {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  revokeTokenSchema
};
