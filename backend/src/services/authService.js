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
    
    logger.info('Firebase user created', { uid: userRecord.uid, email });
    
    // Set default call sign if not provided: Pilot-{uuid}
    const finalCallSign = callSign || `Pilot-${userRecord.uid}`;
    
    // Create user document in Firestore
    const db = getFirestore();
    const userData = {
      uid: userRecord.uid,
      email,
      callSign: finalCallSign,
      displayName: displayName || finalCallSign,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
      isActive: true
    };
    
    await db.collection('users').doc(userRecord.uid).set(userData);
    
    logger.info('User registered', { uid: userRecord.uid, callSign: finalCallSign });
    
    // Generate tokens
    const accessToken = jwtUtil.createAccessToken(userRecord.uid, finalCallSign, false);
    const refreshToken = jwtUtil.createRefreshToken(userRecord.uid);
    
    return {
      user: {
        uid: userRecord.uid,
        email,
        callSign: finalCallSign,
        displayName: displayName || finalCallSign,
        isAdmin: false
      },
      accessToken,
      refreshToken
    };
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
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
  // Verify password using Firebase Identity Toolkit
  const uid = await verifyPassword(email, password);
  
  // Get user from Firestore
  const db = getFirestore();
  const userDoc = await db.collection('users').doc(uid).get();
  
  if (!userDoc.exists) {
    throw new AuthError('User not found', 401);
  }
  
  const userData = userDoc.data();
  
  // Check if user is active
  if (userData.isActive === false) {
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
