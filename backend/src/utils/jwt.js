/**
 * JWT Utility
 * Handles JWT token creation, verification, and extraction
 */

const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwtConfig');
const { AuthError } = require('./errors');

/**
 * Create access token
 * @param {string} uid - User ID
 * @param {string} callSign - User's call sign
 * @param {boolean} isAdmin - Admin flag
 * @returns {string} JWT access token
 */
function createAccessToken(uid, callSign, isAdmin = false) {
  const payload = {
    uid,
    callSign,
    isAdmin,
    type: 'access'
  };

  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.accessTokenExpiry,
    algorithm: jwtConfig.algorithm,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  });
}

/**
 * Create refresh token
 * @param {string} uid - User ID
 * @returns {string} JWT refresh token
 */
function createRefreshToken(uid) {
  const payload = {
    uid,
    type: 'refresh'
  };

  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.refreshTokenExpiry,
    algorithm: jwtConfig.algorithm,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 * @throws {AuthError} If token is invalid or expired
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthError('Token expired', 401);
    } else if (error.name === 'JsonWebTokenError') {
      throw new AuthError('Invalid token', 401);
    } else if (error.name === 'NotBeforeError') {
      throw new AuthError('Token not yet valid', 401);
    }
    throw new AuthError('Token verification failed', 401);
  }
}

/**
 * Decode token without verification (for inspection)
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null if invalid
 */
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}

/**
 * Extract token expiry date
 * @param {string} token - JWT token
 * @returns {Date|null} Expiry date or null
 */
function getTokenExpiry(token) {
  const decoded = decodeToken(token);
  if (decoded && decoded.exp) {
    return new Date(decoded.exp * 1000);
  }
  return null;
}

/**
 * Create password reset token
 * @param {string} uid - User ID
 * @param {string} email - User email
 * @returns {string} JWT password reset token
 */
function createPasswordResetToken(uid, email) {
  const payload = {
    uid,
    email,
    type: 'password_reset'
  };

  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: '15m', // 15 minutes expiry for password reset
    algorithm: jwtConfig.algorithm,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
  });
}

/**
 * Verify password reset token
 * @param {string} token - Password reset token to verify
 * @returns {object} Decoded token payload
 * @throws {AuthError} If token is invalid or expired
 */
function verifyPasswordResetToken(token) {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    });
    
    if (decoded.type !== 'password_reset') {
      throw new AuthError('Invalid token type', 401);
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthError('Password reset token expired', 401);
    } else if (error.name === 'JsonWebTokenError') {
      throw new AuthError('Invalid password reset token', 401);
    } else if (error.name === 'NotBeforeError') {
      throw new AuthError('Token not yet valid', 401);
    }
    throw new AuthError('Token verification failed', 401);
  }
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyToken,
  decodeToken,
  getTokenExpiry,
  createPasswordResetToken,
  verifyPasswordResetToken
};
