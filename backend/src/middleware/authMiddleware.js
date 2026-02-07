/**
 * Authentication Middleware
 * Validates JWT tokens, extracts user information, and enforces permissions
 */

const jwtUtil = require('../utils/jwt');
const tokenBlacklistRepository = require('../repositories/tokenBlacklistRepository');
const { AuthError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Authentication middleware
 * Validates JWT token and attaches user info to request
 */
async function authMiddleware(req, res, next) {
  try {
    // Skip authentication for CORS preflight requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('Missing or invalid Authorization header', 401);
    }
    
    const token = authHeader.slice(7); // Remove "Bearer " prefix
    
    if (!token) {
      throw new AuthError('No token provided', 401);
    }
    
    // Check if token is blacklisted
    const isBlacklisted = await tokenBlacklistRepository.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new AuthError('Token has been revoked', 401);
    }
    
    // Verify token
    const decoded = jwtUtil.verifyToken(token);
    
    // Validate token type
    if (decoded.type !== 'access') {
      throw new AuthError('Invalid token type. Access token required', 401);
    }
    
    // Validate required fields
    if (!decoded.uid || !decoded.callSign) {
      throw new AuthError('Invalid token payload', 401);
    }
    
    // Attach user info to request
    req.user = {
      uid: decoded.uid,
      callSign: decoded.callSign,
      isAdmin: decoded.isAdmin || false
    };
    
    req.callSign = decoded.callSign;
    req.isAdmin = decoded.isAdmin || false;
    
    logger.debug('User authenticated', {
      uid: decoded.uid,
      callSign: decoded.callSign,
      isAdmin: decoded.isAdmin
    });
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Require admin middleware
 * Ensures the authenticated user has admin privileges
 */
function requireAdmin(req, res, next) {
  try {
    if (!req.user) {
      throw new AuthError('Authentication required', 401);
    }
    
    if (!req.isAdmin) {
      logger.warn('Admin access denied', {
        uid: req.user.uid,
        callSign: req.callSign,
        path: req.path
      });
      throw new ForbiddenError('Admin privileges required');
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional auth middleware
 * Attaches user info if token is present, but doesn't require it
 */
async function optionalAuth(req, res, next) {
  try {
    // Skip authentication for CORS preflight requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.slice(7);
    
    if (!token) {
      return next();
    }
    
    // Check blacklist
    const isBlacklisted = await tokenBlacklistRepository.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return next();
    }
    
    // Try to verify token
    try {
      const decoded = jwtUtil.verifyToken(token);
      
      if (decoded.type === 'access' && decoded.uid && decoded.callSign) {
        req.user = {
          uid: decoded.uid,
          callSign: decoded.callSign,
          isAdmin: decoded.isAdmin || false
        };
        req.callSign = decoded.callSign;
        req.isAdmin = decoded.isAdmin || false;
      }
    } catch (error) {
      // Silently fail for optional auth
      logger.debug('Optional auth failed', { error: error.message });
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authMiddleware,
  requireAdmin,
  optionalAuth
};
