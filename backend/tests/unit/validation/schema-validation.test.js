/**
 * Schema Validation Unit Tests
 * Tests: VAL-001 to VAL-008
 * Migrated from: sprint0/backendPhase3ValidationLayer.test.js
 */

const { z } = require('zod');
const { validate } = require('../../../src/middleware/validate');
const { ValidationError } = require('../../../src/utils/errors');

describe('Schema Validation Tests', () => {
  describe('VAL-002: Strict Mode - Unknown Fields', () => {
    it('rejects unknown fields via Zod .strict() for bodies/params/query', () => {
      const authSchemas = require('../../../src/schemas/authSchemas');
      
      expect(authSchemas.registerSchema).toBeDefined();
      expect(authSchemas.loginSchema).toBeDefined();
      
      const testData = {
        email: 'test@example.com',
        password: 'ValidPass123!',
        unknownField: 'should be rejected'
      };
      
      const result = authSchemas.loginSchema.safeParse(testData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const errorMessages = result.error.issues.map(i => i.message);
        expect(errorMessages.some(msg => 
          msg.toLowerCase().includes('unrecognized') || 
          msg.toLowerCase().includes('unknown')
        )).toBe(true);
      }
    });

    it('enforces strict mode on all schemas', () => {
      const authSchemas = require('../../../src/schemas/authSchemas');
      const userSchemas = require('../../../src/schemas/userSchemas');
      const satelliteSchemas = require('../../../src/schemas/satelliteSchemas');
      
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
  });

  describe('VAL-003, VAL-004: Pagination and Query Limits', () => {
    it('caps pagination limit to 100 and normalizes page/limit', () => {
      const { MAX_PAGE_LIMIT } = require('../../../src/factories/crudFactory');
      expect(MAX_PAGE_LIMIT).toBe(100);
      
      const scenarioSchemas = require('../../../src/schemas/scenarioSchemas');
      
      const validQuery = { query: { page: '1', limit: '50' } };
      const validResult = scenarioSchemas.listScenariosSchema.safeParse(validQuery);
      expect(validResult.success).toBe(true);
      if (validResult.success) {
        expect(validResult.data.query.limit).toBe(50);
      }
      
      const excessiveQuery = { query: { page: '1', limit: '150' } };
      const excessiveResult = scenarioSchemas.listScenariosSchema.safeParse(excessiveQuery);
      expect(excessiveResult.success).toBe(false);
      
      const stringQuery = { query: { page: '2', limit: '20' } };
      const stringResult = scenarioSchemas.listScenariosSchema.safeParse(stringQuery);
      expect(stringResult.success).toBe(true);
      if (stringResult.success) {
        expect(typeof stringResult.data.query.page).toBe('number');
        expect(typeof stringResult.data.query.limit).toBe('number');
        expect(stringResult.data.query.page).toBe(2);
        expect(stringResult.data.query.limit).toBe(20);
      }
    });

    it('whitelists sortBy/query fields and rejects others', () => {
      const scenarioSchemas = require('../../../src/schemas/scenarioSchemas');
      expect(scenarioSchemas.listScenariosSchema).toBeDefined();
      
      const validQuery = {
        query: { sortBy: 'createdAt', sortOrder: 'desc', page: '1', limit: '20' }
      };
      
      const validResult = scenarioSchemas.listScenariosSchema.safeParse(validQuery);
      expect(validResult.success).toBe(true);
      
      const invalidQuery = {
        query: { sortBy: 'maliciousField', sortOrder: 'desc' }
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

    it('validates query parameters with proper types and constraints', () => {
      const scenarioSchemas = require('../../../src/schemas/scenarioSchemas');
      
      const queryData = { query: { page: '2', limit: '50' } };
      const result = scenarioSchemas.listScenariosSchema.safeParse(queryData);
      
      if (result.success) {
        expect(typeof result.data.query.page).toBe('number');
        expect(typeof result.data.query.limit).toBe('number');
        expect(result.data.query.page).toBe(2);
        expect(result.data.query.limit).toBe(50);
      }
      
      const excessiveLimit = { query: { page: '1', limit: '150' } };
      const excessiveResult = scenarioSchemas.listScenariosSchema.safeParse(excessiveLimit);
      expect(excessiveResult.success).toBe(false);
    });
  });

  describe('VAL-006: Validation Error Structure', () => {
    it('returns consistent validation error payload shape', () => {
      const mockReq = {
        body: { email: 'invalid-email', password: '123' },
        query: {},
        params: {}
      };
      
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      const mockNext = jest.fn();
      
      const testSchema = z.object({
        body: z.object({
          email: z.string().email(),
          password: z.string().min(8)
        }).strict(),
        query: z.object({}).strict(),
        params: z.object({}).strict()
      });
      
      const validationMiddleware = validate(testSchema);
      validationMiddleware(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      const passedError = mockNext.mock.calls[0][0];
      expect(passedError).toBeInstanceOf(ValidationError);
      expect(passedError.message).toBe('Validation failed');
      expect(Array.isArray(passedError.details)).toBe(true);
      
      passedError.details.forEach(detail => {
        expect(detail).toHaveProperty('field');
        expect(detail).toHaveProperty('message');
        expect(typeof detail.field).toBe('string');
        expect(typeof detail.message).toBe('string');
      });
    });
  });
});
