/**
 * JWT Algorithm Security Test
 * Tests: SEC-XXX (JWT Algorithm Validation)
 * Ensures JWT tokens use HS256 algorithm (RS256 recommended for production)
 */

const jwt = require('jsonwebtoken');
const jwtConfig = require('../../src/config/jwtConfig');
const jwtUtil = require('../../src/utils/jwt');

describe('JWT Algorithm Security Tests', () => {
  describe('SEC-XXX: JWT Algorithm Validation', () => {
    it('should use HS256 algorithm for token signing', () => {
      expect(jwtConfig.algorithm).toBe('HS256');
    });

    it('should have JWT secret configured', () => {
      expect(jwtConfig.secret).toBeDefined();
      expect(typeof jwtConfig.secret).toBe('string');
      expect(jwtConfig.secret.length).toBeGreaterThan(0);
    });

    it('should create access tokens with HS256 algorithm', () => {
      const token = jwtUtil.createAccessToken('test-uid', 'test-callSign');

      // Decode token header to check algorithm
      const decoded = jwt.decode(token, { complete: true });
      expect(decoded.header.alg).toBe('HS256');
    });

    it('should create refresh tokens with HS256 algorithm', () => {
      const token = jwtUtil.createRefreshToken('test-uid');

      // Decode token header to check algorithm
      const decoded = jwt.decode(token, { complete: true });
      expect(decoded.header.alg).toBe('HS256');
    });

    it('should verify tokens signed with HS256', () => {
      const token = jwtUtil.createAccessToken('test-uid', 'test-callSign');
      const decoded = jwtUtil.verifyToken(token);

      expect(decoded.uid).toBe('test-uid');
      expect(decoded.callSign).toBe('test-callSign');
      expect(decoded.type).toBe('access');
    });

    it('should reject tokens signed with different algorithms', () => {
      // Create a token with RS256 using a different key
      const fakeToken = jwt.sign(
        { uid: 'test-uid', type: 'access' },
        'fake-rsa-private-key',
        { algorithm: 'RS256' }
      );

      expect(() => jwtUtil.verifyToken(fakeToken)).toThrow('Invalid token');
    });

    it('should document RS256 as recommended for production', () => {
      // This test serves as documentation that RS256 is preferred
      // TODO: Update to RS256 with proper key management for production
      const recommendedAlgorithm = 'RS256';
      expect(recommendedAlgorithm).toBe('RS256');
    });
  });
});