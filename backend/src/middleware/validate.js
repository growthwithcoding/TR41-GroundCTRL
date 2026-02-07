/**
 * Validation Middleware
 * Provides Zod-based request validation for body, params, and query
 */

const { ValidationError } = require("../utils/errors");

/**
 * Validation middleware factory
 * Creates middleware that validates request data against a Zod schema
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 *
 * @example
 * // In route file:
 * const schema = z.object({
 *   body: loginSchema.strict(),
 *   query: z.object({}).strict(),
 *   params: z.object({}).strict()
 * });
 * router.post('/login', validate(schema), controller.login);
 */
const validate = (schema) => {
	return (req, res, next) => {
		try {
			// Unified parsing: validate body, query, and params together
			const result = schema.safeParse({
				body: req.body || {},
				query: req.query || {},
				params: req.params || {},
			});

			if (!result.success) {
				// Flatten Zod errors into a user-friendly format
				const errors = flattenZodErrors(result.error);

				// Throw ValidationError which will be caught by error handler
				throw new ValidationError("Validation failed", errors);
			}

			// Validation passed - continue to next middleware/controller
			next();
		} catch (error) {
			// Pass error to error handling middleware
			next(error);
		}
	};
};

/**
 * Flatten Zod errors into a cleaner structure
 * Transforms Zod's nested error format into a flat array of field-level errors
 *
 * @param {import('zod').ZodError} zodError - Zod validation error object
 * @returns {Array} Array of error objects with field and message
 *
 * @example
 * // Input: ZodError with nested issues
 * // Output: [
 * //   { field: 'body.email', message: 'Invalid email format' },
 * //   { field: 'query.limit', message: 'Limit must be between 1 and 100' }
 * // ]
 */
function flattenZodErrors(zodError) {
	return zodError.issues.map((issue) => ({
		field: issue.path.join("."),
		message: issue.message,
	}));
}

module.exports = {
	validate,
};
