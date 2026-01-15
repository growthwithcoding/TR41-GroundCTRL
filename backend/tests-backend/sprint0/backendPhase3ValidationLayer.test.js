/**
 * Phase 3 – Validation Layer
 * Strict schemas, query caps, and input sanitization.
 */

const { z } = require('zod');
const { validate } = require('../../src/middleware/validate');
const { ValidationError } = require('../../src/utils/errors');

describe('Phase 3 – Validation Layer', () => {
  it('rejects unknown fields via Zod .strict() for bodies/params/query', () => {
    // Test auth schemas have .strict() mode
    const authSchemas = require('../../src/schemas/authSchemas');
    
    expect(authSchemas.registerSchema).toBeDefined();
    expect(authSchemas.loginSchema).toBeDefined();
    
    // Test that unknown fields are rejected
    const testData = {
      email: 'test@example.com',
      password: 'ValidPass123!',
      unknownField: 'should be rejected' // Extra field
    };
    
    const result = authSchemas.loginSchema.safeParse(testData);
    expect(result.success).toBe(false);
    
    if (!result.success) {
      // Verify error mentions unrecognized key
      const errorMessages = result.error.issues.map(i => i.message);
      expect(errorMessages.some(msg => 
        msg.toLowerCase().includes('unrecognized') || 
        msg.toLowerCase().includes('unknown')
      )).toBe(true);
    }
  });

  it('caps pagination limit to 100 and normalizes page/limit', async () => {
    const { MAX_PAGE_LIMIT } = require('../../src/factories/crudFactory');
    
    // Verify MAX_PAGE_LIMIT constant exists
    expect(MAX_PAGE_LIMIT).toBe(100);
    
    // Test with userRepository
    const userRepository = require('../../src/repositories/userRepository');
    
    // Test with excessive limit
    const result1 = await userRepository.getAll({ page: 1, limit: 500 });
    expect(result1.limit).toBeLessThanOrEqual(MAX_PAGE_LIMIT);
    
    // Test with negative page (should normalize to 1)
    const result2 = await userRepository.getAll({ page: -5, limit: 10 });
    expect(result2.page).toBeGreaterThanOrEqual(1);
    
    // Test with zero limit (should normalize to reasonable default)
    const result3 = await userRepository.getAll({ page: 1, limit: 0 });
    expect(result3.limit).toBeGreaterThan(0);
    expect(result3.limit).toBeLessThanOrEqual(MAX_PAGE_LIMIT);
    
    // Test with string values (should be parsed)
    const result4 = await userRepository.getAll({ page: '2', limit: '20' });
    expect(typeof result4.page).toBe('number');
    expect(typeof result4.limit).toBe('number');
    expect(result4.page).toBe(2);
    expect(result4.limit).toBe(20);
  });

  it('whitelists sortBy/query fields and rejects others', () => {
    // Test scenario schema which has sortBy whitelist
    const scenarioSchemas = require('../../src/schemas/scenarioSchemas');
    
    expect(scenarioSchemas.listScenariosSchema).toBeDefined();
    
    // Test valid sortBy field
    const validQuery = {
      body: {},
      query: { sortBy: 'createdAt', sortOrder: 'desc', page: '1', limit: '20' },
      params: {}
    };
    
    const validResult = scenarioSchemas.listScenariosSchema.safeParse(validQuery);
    expect(validResult.success).toBe(true);
    
    // Test invalid sortBy field (not in whitelist)
    const invalidQuery = {
      body: {},
      query: { sortBy: 'maliciousField', sortOrder: 'desc' },
      params: {}
    };
    
    const invalidResult = scenarioSchemas.listScenariosSchema.safeParse(invalidQuery);
    expect(invalidResult.success).toBe(false);
    
    if (!invalidResult.success) {
      const errorMessages = invalidResult.error.issues.map(i => i.message);
      expect(errorMessages.some(msg => 
        msg.toLowerCase().includes('invalid')
      )).toBe(true);
    }
  });

  it('returns consistent validation error payload shape', () => {
    const mockReq = {
      body: { email: 'invalid-email', password: '123' }, // Invalid data
      query: {},
      params: {}
    };
    
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    const mockNext = jest.fn();
    
    // Create a test schema
    const testSchema = z.object({
      body: z.object({
        email: z.string().email(),
        password: z.string().min(8)
      }).strict(),
      query: z.object({}).strict(),
      params: z.object({}).strict()
    });
    
    // Create validation middleware
    const validationMiddleware = validate(testSchema);
    
    // Execute middleware
    validationMiddleware(mockReq, mockRes, mockNext);
    
    // Verify error was passed to next() with ValidationError
    expect(mockNext).toHaveBeenCalled();
    const passedError = mockNext.mock.calls[0][0];
    expect(passedError).toBeInstanceOf(ValidationError);
    
    // Verify error has proper structure
    expect(passedError.message).toBe('Validation failed');
    expect(Array.isArray(passedError.details)).toBe(true);
    
    // Verify error details have field and message
    passedError.details.forEach(detail => {
      expect(detail).toHaveProperty('field');
      expect(detail).toHaveProperty('message');
      expect(typeof detail.field).toBe('string');
      expect(typeof detail.message).toBe('string');
    });
  });

  it('enforces strict mode on all schemas', () => {
    // Check key schemas have strict mode
    const authSchemas = require('../../src/schemas/authSchemas');
    const userSchemas = require('../../src/schemas/userSchemas');
    const satelliteSchemas = require('../../src/schemas/satelliteSchemas');
    
    // Test that adding unknown fields fails
    const testCases = [
      { schema: authSchemas.loginSchema, data: { email: 'test@test.com', password: 'Pass123!', extra: 'fail' } },
      { schema: userSchemas.updateUserSchema, data: { displayName: 'Test', extra: 'fail' } },
      { schema: satelliteSchemas.createSatelliteSchema, data: { name: 'Test', type: 'CUBESAT', extra: 'fail' } }
    ];
    
    testCases.forEach(({ schema, data }) => {
      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  it('validates query parameters with proper types and constraints', () => {
    const scenarioSchemas = require('../../src/schemas/scenarioSchemas');
    
    // Test page/limit are transformed to numbers
    const queryData = {
      body: {},
      query: { page: '2', limit: '50' },
      params: {}
    };
    
    const result = scenarioSchemas.listScenariosSchema.safeParse(queryData);
    
    if (result.success) {
      expect(typeof result.data.query.page).toBe('number');
      expect(typeof result.data.query.limit).toBe('number');
      expect(result.data.query.page).toBe(2);
      expect(result.data.query.limit).toBe(50);
    }
    
    // Test limit exceeding 100 is rejected
    const excessiveLimit = {
      body: {},
      query: { page: '1', limit: '150' },
      params: {}
    };
    
    const excessiveResult = scenarioSchemas.listScenariosSchema.safeParse(excessiveLimit);
    expect(excessiveResult.success).toBe(false);
  });
});
