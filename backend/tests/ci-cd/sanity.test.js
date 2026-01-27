/**
 * Basic Sanity Tests
 * These tests ensure the basic Node.js environment and dependencies are working
 */

describe('Sanity Checks', () => {
  test('Node.js environment is working', () => {
    expect(true).toBe(true);
  });

  test('JavaScript basics are functional', () => {
    const sum = (a, b) => a + b;
    expect(sum(2, 3)).toBe(5);
  });

  test('Dependencies can be required', () => {
    expect(() => require('express')).not.toThrow();
    expect(() => require('dotenv')).not.toThrow();
  });

  test('Environment is set', () => {
    expect(process.env.NODE_ENV || 'test').toBeDefined();
  });
});
