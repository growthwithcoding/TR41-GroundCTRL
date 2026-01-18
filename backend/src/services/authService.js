/**
 * Auth Service
 * Handles authentication business logic
 */

const httpClient = require('../utils/httpClient');
const { getAuth, getFirestore } = require('../config/firebase');
const jwtUtil = require('../utils/jwt');
const tokenBlacklistRepository = require('../repositories/tokenBlacklistRepository');
const { validatePassword } = require('../utils/passwordValidation');
const { AuthError, ValidationError, ConflictError } = require('../utils/errors');
const lockoutService = require('./lockoutService');
const auditRepository = require('../repositories/auditRepository');
const auditFactory = require('../factories/auditFactory');
const logger = require('../utils/logger');


/**
 * Verify password using Firebase Identity Toolkit REST API
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<string>} Firebase UID
 */
async function verifyPassword(email, password) {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  
  if (!apiKey) {
    throw new Error('FIREBASE_WEB_API_KEY not configured');
  }
  
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
  
  try {
    const response = await httpClient.post(url, {
      email,
      password,
      returnSecureToken: true
    });
    return response.data.localId; // Returns Firebase UID
  } catch (error) {
    if (error.response?.data?.error?.message === 'INVALID_PASSWORD' || 
        error.response?.data?.error?.message === 'EMAIL_NOT_FOUND' ||
        error.response?.data?.error?.message === 'INVALID_LOGIN_CREDENTIALS') {
      throw new AuthError('Invalid email or password', 401);
    }
    logger.error('Password verification error', { error: error.message });
    throw error;
  }
}


/**
 * Register new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} callSign - User's call sign
 * @param {string} displayName - User's display name (optional)
 * @returns {Promise<object>} Created user with tokens
 */
async function register(email, password, callSign = null, displayName = null) {
  const db = getFirestore();


  try {
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.success) {
      throw new ValidationError('Password validation failed', passwordValidation.errors);
    }
    
    // Create Firebase Auth user first to get the uid
    const auth = getAuth();
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || callSign || `Pilot-${email.split('@')[0]}`
    });
    
    const uid = userRecord.uid;
    const finalCallSign = callSign || `Pilot-${uid}`;
    
    logger.info('Firebase user created', { uid, email });
    
    // Create user document in Firestore
    const userData = {
      uid,
      email,
      callSign: finalCallSign,
      displayName: displayName || finalCallSign,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
      isActive: true
    };
    
    await db.collection('users').doc(uid).set(userData);
    
    logger.info('User registered', { uid, callSign: finalCallSign });
    
    // ✅ NEW: Create audit log entry
    const auditEntry = auditFactory.createAuditEntry(
      'REGISTER_SUCCESS',
      'auth',
      uid,
      finalCallSign,
      'success',
      'INFO',
      { email, method: 'self_registration' }
    );
    await auditRepository.logAudit(auditEntry);
    
    // Generate tokens
    const accessToken = jwtUtil.createAccessToken(uid, finalCallSign, false);
    const refreshToken = jwtUtil.createRefreshToken(uid);
    
    // Return raw data - envelope middleware will wrap it
    return {
      user: {
        uid,
        email,
        callSign: finalCallSign,
        displayName: displayName || finalCallSign,
        isAdmin: false
      },
      accessToken,
      refreshToken
    };
  } catch (error) {
    // CREATE FAILED REGISTRATION AUDIT LOG
    if (error.code === 'auth/email-already-exists') {
      await auditRepository.logAudit({
        userId: 'ANONYMOUS',
        action: 'REGISTER_FAILURE',
        resource: 'auth',
        outcome: 'failure',
        severity: 'WARNING',
        callSign: 'ANONYMOUS',
        actor: 'ANONYMOUS',
        timestamp: new Date(),
        details: { email, reason: 'Email already registered' }
      });
      
      throw new ConflictError('Email already in use');
    }
    throw error;
  }
}


/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} User with tokens
 */
async function login(email, password) {
  const db = getFirestore();
  let uid = null;
  let userData = null;
  
  try {
    // Verify password using Firebase Identity Toolkit
    uid = await verifyPassword(email, password);
    
    // Get user from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      throw new AuthError('Invalid email or password', 401);
    }
    
    userData = userDoc.data();
    
    // Check lockout BEFORE proceeding
    await lockoutService.checkAccountLockout(uid, userData.callSign);
    
    // Check if user is active
    if (userData.isActive === false) {
      const auditEntry = auditFactory.createAuditEntry(
        'LOGIN_ATTEMPT_DEACTIVATED',
        'auth',
        uid,
        userData.callSign,
        'failure',
        'WARNING',
        { email, reason: 'account_deactivated' }
      );
      await auditRepository.logAudit(auditEntry);
      throw new AuthError('Account is deactivated', 403);
    }
    
    // Update last login time
    await db.collection('users').doc(uid).update({
      lastLoginAt: new Date(),
      updatedAt: new Date()
    });
    
    // Generate tokens
    const accessToken = jwtUtil.createAccessToken(
      uid,
      userData.callSign,
      userData.isAdmin || false
    );
    const refreshToken = jwtUtil.createRefreshToken(uid);
    
    // Record successful login attempt
    await lockoutService.recordLoginAttempt(uid, userData.callSign, true, {
      email,
      method: 'password'
    });
    
    logger.info('User logged in successfully', {
      uid,
      email,
      callSign: userData.callSign
    });
    
    return {
      user: {
        uid,
        email: userData.email,
        callSign: userData.callSign,
        displayName: userData.displayName,
        isAdmin: userData.isAdmin || false
      },
      accessToken,
      refreshToken
    };
    
  } catch (error) {
    if (error instanceof AuthError) {
      if (uid && userData) {
        try {
          await lockoutService.recordLoginAttempt(uid, userData.callSign, false, {
            email,
            reason: error.message
          });
        } catch (err) {
          // ✅ FIXED: Changed 'auditError' to 'err' (not used, so renaming to avoid lint warning)
          logger.warn('Failed to record login attempt', {
            uid,
            error: err.message
          });
        }
      }
      throw error;
    }
    
    if (uid && userData) {
      try {
        await lockoutService.recordLoginAttempt(uid, userData.callSign, false, {
          email,
          reason: 'unexpected_error'
        });
      } catch (err) {
        // ✅ FIXED: Changed 'auditError' to 'err'
        logger.warn('Failed to record login attempt', { uid, error: err.message });
      }
    }
    
    throw new AuthError('Invalid email or password', 401);
  }
}


/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<object>} New tokens
 */
async function refreshAccessToken(refreshToken) {
  // Verify refresh token
  const decoded = jwtUtil.verifyToken(refreshToken);
  
  if (decoded.type !== 'refresh') {
    throw new AuthError('Invalid token type', 401);
  }
  
  // Check if token is blacklisted
  const isBlacklisted = await tokenBlacklistRepository.isTokenBlacklisted(refreshToken);
  if (isBlacklisted) {
    throw new AuthError('Token has been revoked', 401);
  }
  
  // Get user data
  const db = getFirestore();
  const userDoc = await db.collection('users').doc(decoded.uid).get();
  
  if (!userDoc.exists) {
    throw new AuthError('User not found', 401);
  }
  
  const userData = userDoc.data();
  
  if (userData.isActive === false) {
    throw new AuthError('Account is deactivated', 403);
  }
  
  // Generate new tokens
  const newAccessToken = jwtUtil.createAccessToken(
    decoded.uid,
    userData.callSign,
    userData.isAdmin || false
  );
  const newRefreshToken = jwtUtil.createRefreshToken(decoded.uid);
  
  // Blacklist old refresh token
  const expiry = jwtUtil.getTokenExpiry(refreshToken);
  await tokenBlacklistRepository.addToBlacklist(refreshToken, expiry, {
    userId: decoded.uid,
    callSign: userData.callSign,
    reason: 'token_refresh'
  });
  
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    callSign: userData.callSign
  };
}


/**
 * Logout user (revoke tokens)
 * @param {string} accessToken - Access token to revoke
 * @param {string} refreshToken - Refresh token to revoke (optional)
 * @returns {Promise<void>}
 */
async function logout(accessToken, refreshToken = null) {
  // Blacklist access token
  const accessExpiry = jwtUtil.getTokenExpiry(accessToken);
  const decoded = jwtUtil.verifyToken(accessToken);
  
  await tokenBlacklistRepository.addToBlacklist(accessToken, accessExpiry, {
    userId: decoded.uid,
    callSign: decoded.callSign,
    reason: 'logout'
  });
  
  // Blacklist refresh token if provided
  if (refreshToken) {
    const refreshExpiry = jwtUtil.getTokenExpiry(refreshToken);
    await tokenBlacklistRepository.addToBlacklist(refreshToken, refreshExpiry, {
      userId: decoded.uid,
      callSign: decoded.callSign,
      reason: 'logout'
    });
  }
  
  logger.info('User logged out', { uid: decoded.uid, callSign: decoded.callSign });
}


/**
 * Revoke token (admin operation)
 * @param {string} token - Token to revoke (optional)
 * @param {string} userId - User ID to revoke all tokens (optional)
 * @returns {Promise<object>} Revocation result
 */
async function revokeToken(token = null, userId = null) {
  if (token) {
    // Revoke specific token
    const expiry = jwtUtil.getTokenExpiry(token);
    const decoded = jwtUtil.decodeToken(token);
    
    await tokenBlacklistRepository.addToBlacklist(token, expiry, {
      userId: decoded?.uid,
      callSign: decoded?.callSign,
      reason: 'admin_revocation'
    });
    
    return {
      revoked: 1,
      type: 'token'
    };
  } else if (userId) {
    // Revoke all tokens for user
    const count = await tokenBlacklistRepository.revokeAllUserTokens(userId);
    
    return {
      revoked: count,
      type: 'user_tokens'
    };
  } else {
    throw new ValidationError('Either token or userId must be provided');
  }
}


module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  revokeToken
};
