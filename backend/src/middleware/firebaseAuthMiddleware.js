/**
 * Firebase Authentication Middleware
 * Validates Firebase ID tokens for OAuth sync endpoint
 */

const { getAuth } = require('../config/firebase');
const { AuthError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Firebase auth middleware
 * Validates Firebase ID token and attaches user info to request
 * Used for OAuth profile sync where users have Firebase tokens but not yet backend JWTs
 */
async function firebaseAuthMiddleware(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('Missing or invalid Authorization header', 401);
    }
    
    const idToken = authHeader.slice(7); // Remove "Bearer " prefix
    
    if (!idToken) {
      throw new AuthError('No token provided', 401);
    }
    
    // Verify Firebase ID token
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Validate required fields
    if (!decodedToken.uid || !decodedToken.email) {
      throw new AuthError('Invalid Firebase token payload', 401);
    }
    
    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false
    };
    
    // Also add to top-level for compatibility
    req.uid = decodedToken.uid;
    req.email = decodedToken.email;
    
    logger.debug('Firebase user authenticated', {
      uid: decodedToken.uid,
      email: decodedToken.email
    });
    
    next();
  } catch (error) {
    // Handle Firebase-specific errors
    if (error.code === 'auth/id-token-expired') {
      return next(new AuthError('Firebase token expired', 401));
    }
    if (error.code === 'auth/id-token-revoked') {
      return next(new AuthError('Firebase token revoked', 401));
    }
    if (error.code === 'auth/invalid-id-token') {
      return next(new AuthError('Invalid Firebase token', 401));
    }
    
    // Pass through AuthError as-is
    if (error instanceof AuthError) {
      return next(error);
    }
    
    // Other errors
    logger.error('Firebase auth error:', error);
    next(new AuthError('Authentication failed', 401));
  }
}

module.exports = {
  firebaseAuthMiddleware
};
