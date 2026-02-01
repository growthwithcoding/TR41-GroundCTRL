/**
 * Firebase Authentication Middleware
 * Validates Firebase ID tokens for OAuth sync endpoint
 * 
 * Security Model:
 * 1. Extract and validate Authorization header format
 * 2. Sanitize and validate token string
 * 3. Verify token cryptographically via Firebase Admin SDK
 * 4. Validate decoded token payload contains required fields
 * 5. Only proceed if ALL validation steps pass
 * 
 * This middleware ensures no authentication bypass is possible by:
 * - Rejecting requests at multiple validation checkpoints
 * - Always verifying tokens cryptographically before granting access
 * - Explicitly checking all required fields after verification
 */

const { getAuth } = require('../config/firebase');
const { AuthError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Validates the Authorization header format
 * @param {string} authHeader - The Authorization header value
 * @returns {string|null} The extracted token or null if invalid
 */
function extractBearerToken(authHeader) {
  // Explicit validation: header must exist and start with "Bearer "
  if (typeof authHeader !== 'string') {
    return null;
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7); // Remove "Bearer " prefix
  
  // Explicit validation: token must be non-empty after extraction
  if (!token || token.trim().length === 0) {
    return null;
  }
  
  // Sanitize: ensure token only contains valid characters (base64url + dots for JWT)
  // Firebase ID tokens are JWTs with format: header.payload.signature
  const validTokenPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
  if (!validTokenPattern.test(token)) {
    return null;
  }
  
  return token;
}

/**
 * Validates decoded token payload contains required fields
 * @param {object} decodedToken - The decoded Firebase token
 * @returns {boolean} True if valid, false otherwise
 */
function isValidTokenPayload(decodedToken) {
  // Explicit validation of required fields
  if (!decodedToken || typeof decodedToken !== 'object') {
    return false;
  }
  
  // UID is required and must be a non-empty string
  if (!decodedToken.uid || typeof decodedToken.uid !== 'string' || decodedToken.uid.trim().length === 0) {
    return false;
  }
  
  // Email is required and must be a non-empty string
  if (!decodedToken.email || typeof decodedToken.email !== 'string' || decodedToken.email.trim().length === 0) {
    return false;
  }
  
  return true;
}

/**
 * Firebase auth middleware
 * Validates Firebase ID token and attaches user info to request
 * Used for OAuth profile sync where users have Firebase tokens but not yet backend JWTs
 * 
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
async function firebaseAuthMiddleware(req, res, next) {
  try {
    // Step 1: Extract and validate Authorization header
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);
    
    // Reject if token extraction failed
    if (!token) {
      logger.warn('Firebase auth failed: Invalid or missing Authorization header', {
        hasHeader: !!authHeader,
        headerStart: authHeader ? authHeader.substring(0, 10) + '...' : 'none'
      });
      throw new AuthError('Missing or invalid Authorization header', 401);
    }
    
    // Step 2: Verify token cryptographically via Firebase Admin SDK
    // This is the critical security checkpoint - token must be valid and signed by Firebase
    const auth = getAuth();
    let decodedToken;
    
    try {
      decodedToken = await auth.verifyIdToken(token, true); // checkRevoked = true
    } catch (verifyError) {
      // Handle specific Firebase verification errors
      logger.warn('Firebase token verification failed', {
        errorCode: verifyError.code,
        errorMessage: verifyError.message
      });
      
      if (verifyError.code === 'auth/id-token-expired') {
        throw new AuthError('Firebase token expired', 401);
      }
      if (verifyError.code === 'auth/id-token-revoked') {
        throw new AuthError('Firebase token revoked', 401);
      }
      if (verifyError.code === 'auth/invalid-id-token') {
        throw new AuthError('Invalid Firebase token', 401);
      }
      if (verifyError.code === 'auth/argument-error') {
        throw new AuthError('Malformed Firebase token', 401);
      }
      
      // Generic verification failure
      throw new AuthError('Token verification failed', 401);
    }
    
    // Step 3: Validate decoded token payload
    if (!isValidTokenPayload(decodedToken)) {
      logger.warn('Firebase auth failed: Invalid token payload', {
        hasUid: !!decodedToken?.uid,
        hasEmail: !!decodedToken?.email
      });
      throw new AuthError('Invalid token payload - missing required fields', 401);
    }
    
    // Step 4: All validations passed - attach user info to request
    // Only reached if token is cryptographically valid AND payload is valid
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false
    };
    
    // Also add to top-level for compatibility
    req.uid = decodedToken.uid;
    req.email = decodedToken.email;
    
    logger.debug('Firebase user authenticated successfully', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false
    });
    
    // Proceed to next middleware
    next();
    
  } catch (error) {
    // Pass through AuthError as-is
    if (error instanceof AuthError) {
      return next(error);
    }
    
    // Log unexpected errors
    logger.error('Firebase auth unexpected error:', {
      error: error.message,
      stack: error.stack
    });
    
    // Return generic auth error for unexpected failures
    return next(new AuthError('Authentication failed', 401));
  }
}

module.exports = {
  firebaseAuthMiddleware
};
