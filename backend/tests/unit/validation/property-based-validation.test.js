/**
 * Property Based Validation Unit Tests
 * Tests: VAL-003 to VAL-005
 * Uses fast-check for randomized testing of Zod schemas
 */

const fc = require('fast-check');
const { z } = require('zod');
const { loginSchema, registerSchema } = require('../../../src/schemas/authSchemas');
const { createUserSchema } = require('../../../src/schemas/userSchemas');

describe('Property Based Validation Tests', () => {
  describe('VAL-003: Randomized Valid/Invalid Payloads', () => {
    it('loginSchema correctly handles random inputs', () => {
      fc.assert(
        fc.property(
          fc.record({
            email: fc.string(),
            password: fc.string(),
            extraField: fc.string() // Should be rejected due to .strict()
          }),
          (input) => {
            const result = loginSchema.safeParse(input);
            
            // If it succeeds, it should only have email and password
            if (result.success) {
              expect(typeof result.data.email).toBe('string');
              expect(typeof result.data.password).toBe('string');
              expect(result.data).not.toHaveProperty('extraField');
            }
            // If it fails, it should be due to validation errors
            else {
              expect(result.error).toBeDefined();
            }
          }
        )
      );
    });

    it('registerSchema correctly handles random inputs', () => {
      fc.assert(
        fc.property(
          fc.record({
            email: fc.string(),
            password: fc.string(),
            callSign: fc.option(fc.string()),
            displayName: fc.option(fc.string()),
            extraField: fc.string()
          }),
          (input) => {
            const result = registerSchema.safeParse(input);
            
            if (result.success) {
              expect(typeof result.data.email).toBe('string');
              expect(typeof result.data.password).toBe('string');
              if (result.data.callSign) {
                expect(typeof result.data.callSign).toBe('string');
              }
              if (result.data.displayName) {
                expect(typeof result.data.displayName).toBe('string');
              }
              expect(result.data).not.toHaveProperty('extraField');
            } else {
              expect(result.error).toBeDefined();
            }
          }
        )
      );
    });

    it('createUserSchema correctly handles random inputs', () => {
      fc.assert(
        fc.property(
          fc.record({
            email: fc.string(),
            callSign: fc.string(),
            displayName: fc.option(fc.string()),
            role: fc.constantFrom('operator', 'admin', 'viewer'),
            isActive: fc.boolean(),
            isAdmin: fc.boolean(),
            password: fc.option(fc.string()),
            extraField: fc.string()
          }),
          (input) => {
            const result = createUserSchema.safeParse(input);
            
            if (result.success) {
              expect(typeof result.data.email).toBe('string');
              expect(typeof result.data.callSign).toBe('string');
              expect(['operator', 'admin', 'viewer']).toContain(result.data.role);
              expect(typeof result.data.isActive).toBe('boolean');
              expect(typeof result.data.isAdmin).toBe('boolean');
              expect(result.data).not.toHaveProperty('extraField');
            } else {
              expect(result.error).toBeDefined();
            }
          }
        )
      );
    });
  });

  describe('VAL-004: Deterministic Error Shapes', () => {
    it('all rejections have deterministic error shape', () => {
      fc.assert(
        fc.property(
          fc.record({
            email: fc.string(),
            password: fc.string(),
            extra: fc.string()
          }),
          (input) => {
            const result = loginSchema.safeParse(input);
            
            if (!result.success) {
              expect(result.error).toHaveProperty('issues');
              expect(Array.isArray(result.error.issues)).toBe(true);
              result.error.issues.forEach(issue => {
                expect(issue).toHaveProperty('code');
                expect(issue).toHaveProperty('message');
                expect(issue).toHaveProperty('path');
              });
            }
          }
        )
      );
    });
  });
});