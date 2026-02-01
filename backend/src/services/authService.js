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
 * Sync OAuth user profile (Google, etc.)
 * Creates or updates user profile in Firestore for OAuth users
 * @param {string} uid - Firebase Auth UID (from verified token)
 * @param {object} profileData - Optional profile data {email, displayName, photoURL}
 * @returns {Promise<object>} User data with tokens
 */
async function syncOAuthProfile(uid, profileData = {}) {
  const db = getFirestore();
  const { email, displayName, photoURL } = profileData;
  
  try {
    // Check if user already exists in Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (userDoc.exists) {
      // User exists, update last login and return
      const userData = userDoc.data();
      
      await db.collection('users').doc(uid).update({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
        // Update photo URL if provided
        ...(photoURL && { photoURL })
      });
      
      logger.info('OAuth user profile updated', { uid, email });
      
      // Generate tokens
      const accessToken = jwtUtil.createAccessToken(uid, userData.callSign, userData.isAdmin || false);
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
    
    // New OAuth user - create Firestore document
    const finalCallSign = displayName || `Pilot-${uid.substring(0, 8)}`;
    
    const userData = {
      uid,
      email,
      callSign: finalCallSign,
      displayName: displayName || finalCallSign,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      isActive: true,
      ...(photoURL && { photoURL })
    };
    
    await db.collection('users').doc(uid).set(userData);
    
    logger.info('OAuth user profile created', { uid, email, callSign: finalCallSign });
    
    // Create audit log entry
    const auditEntry = auditFactory.createAuditEntry(
      'OAUTH_REGISTER_SUCCESS',
      'auth',
      uid,
      finalCallSign,
      'success',
      'INFO',
      { email, method: 'oauth_google' }
    );
    await auditRepository.logAudit(auditEntry);
    
    // Generate tokens
    const accessToken = jwtUtil.createAccessToken(uid, finalCallSign, false);
    const refreshToken = jwtUtil.createRefreshToken(uid);
    
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
    logger.error('OAuth profile sync error', { error: error.message, uid, email });
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


/**
 * Bootstrap initial admin user (one-time use)
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @param {string} callSign - Admin call sign
 * @param {string} displayName - Admin display name (optional)
 * @returns {Promise<object>} Created admin user with tokens
 */
async function bootstrapAdmin(email, password, callSign, displayName = null) {
  const db = getFirestore();
  
  try {
    // Check if any admin already exists
    const adminsQuery = await db.collection('users')
      .where('isAdmin', '==', true)
      .limit(1)
      .get();
    
    if (!adminsQuery.empty) {
      throw new ConflictError('Admin user already exists. Bootstrap is one-time only.');
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.success) {
      throw new ValidationError('Password validation failed', passwordValidation.errors);
    }
    
    // Create Firebase Auth user
    const auth = getAuth();
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || callSign || `Admin-${email.split('@')[0]}`
    });
    
    const uid = userRecord.uid;
    const finalCallSign = callSign || `Admin-${uid}`;
    
    logger.info('Firebase admin user created', { uid, email });
    
    // Create admin user document in Firestore
    const userData = {
      uid,
      email,
      callSign: finalCallSign,
      displayName: displayName || finalCallSign,
      isAdmin: true, // This is the admin flag
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
      isActive: true
    };
    
    await db.collection('users').doc(uid).set(userData);
    
    logger.info('Admin user bootstrapped', { uid, callSign: finalCallSign });
    
    // Create audit log entry
    const auditEntry = auditFactory.createAuditEntry(
      'BOOTSTRAP_ADMIN_SUCCESS',
      'auth',
      uid,
      finalCallSign,
      'success',
      'CRITICAL',
      { email, method: 'bootstrap' }
    );
    await auditRepository.logAudit(auditEntry);
    
    // Generate tokens
    const accessToken = jwtUtil.createAccessToken(uid, finalCallSign, true);
    const refreshToken = jwtUtil.createRefreshToken(uid);
    
    return {
      user: {
        uid,
        email,
        callSign: finalCallSign,
        displayName: displayName || finalCallSign,
        isAdmin: true
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
 * Change password for authenticated user
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password for verification
 * @param {string} newPassword - New password
 * @param {string} callSign - User's call sign
 * @returns {Promise<object>} Success message
 */
async function changePassword(userId, currentPassword, newPassword, callSign) {
  const db = getFirestore();
  
  try {
    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new AuthError('User not found', 404);
    }
    
    const userData = userDoc.data();
    
    // Verify current password using Firebase Identity Toolkit
    await verifyPassword(userData.email, currentPassword);
    
    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.success) {
      throw new ValidationError('Password validation failed', passwordValidation.errors);
    }
    
    // Update password in Firebase Auth
    const auth = getAuth();
    await auth.updateUser(userId, {
      password: newPassword
    });
    
    // Update timestamp in Firestore
    await db.collection('users').doc(userId).update({
      updatedAt: new Date()
    });
    
    // Revoke all existing tokens for security
    await tokenBlacklistRepository.revokeAllUserTokens(userId);
    
    logger.info('Password changed successfully', { uid: userId, callSign });
    
    // Create audit log entry
    const auditEntry = auditFactory.createAuditEntry(
      'PASSWORD_CHANGE_SUCCESS',
      'auth',
      userId,
      callSign,
      'success',
      'WARNING',
      { method: 'authenticated_change' }
    );
    await auditRepository.logAudit(auditEntry);
    
    return {
      message: 'Password changed successfully',
      userId
    };
  } catch (error) {
    if (error instanceof AuthError && error.statusCode === 401) {
      // Current password is incorrect
      const auditEntry = auditFactory.createAuditEntry(
        'PASSWORD_CHANGE_FAILURE',
        'auth',
        userId,
        callSign,
        'failure',
        'WARNING',
        { reason: 'incorrect_current_password' }
      );
      await auditRepository.logAudit(auditEntry);
      throw new AuthError('Current password is incorrect', 401);
    }
    throw error;
  }
}


/**
 * Request password reset (generates and stores reset token)
 * @param {string} email - User email
 * @returns {Promise<object>} Success message (always returns success for security)
 */
async function forgotPassword(email) {
  const db = getFirestore();
  
  try {
    // Try to find user by email
    const auth = getAuth();
    let userRecord;
    
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch {
      // User not found - return success anyway to prevent email enumeration
      // Error intentionally not used to prevent email enumeration attacks
      logger.debug('Password reset requested for non-existent email', { email });
      return {
        message: 'If an account exists with this email, a password reset link has been sent.'
      };
    }
    
    const userId = userRecord.uid;
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists || userDoc.data().isActive === false) {
      // User not in Firestore or inactive - return success anyway
      return {
        message: 'If an account exists with this email, a password reset link has been sent.'
      };
    }
    
    const userData = userDoc.data();
    
    // Generate reset token (JWT with short expiry)
    const resetToken = jwtUtil.createPasswordResetToken(userId, email);
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Store reset token in password_reset_tokens collection
    const passwordResetRepository = require('../repositories/passwordResetRepository');
    await passwordResetRepository.createResetToken(userId, resetToken, resetTokenExpiry);
    
    logger.info('Password reset token created', { uid: userId, email });
    
    // Create audit log entry
    const auditEntry = auditFactory.createAuditEntry(
      'PASSWORD_RESET_REQUESTED',
      'auth',
      userId,
      userData.callSign,
      'success',
      'INFO',
      { email, method: 'forgot_password' }
    );
    await auditRepository.logAudit(auditEntry);
    
    // TODO: Send email with reset link (requires email service)
    // For now, log the token (in production, this would be sent via email)
    logger.info('Password reset token (DEVELOPMENT ONLY)', { token: resetToken, email });
    
    // Always return success message (prevents email enumeration)
    return {
      message: 'If an account exists with this email, a password reset link has been sent.',
      // In development, include token in response
      ...(process.env.NODE_ENV !== 'production' && { resetToken })
    };
  } catch (error) {
    logger.error('Password reset error', { error: error.message, email });
    // Still return success to prevent email enumeration
    return {
      message: 'If an account exists with this email, a password reset link has been sent.'
    };
  }
}


/**
 * Reset password using reset token
 * @param {string} token - Password reset token
 * @param {string} newPassword - New password
 * @returns {Promise<object>} Success message
 */
async function resetPassword(token, newPassword) {
  const db = getFirestore();
  const passwordResetRepository = require('../repositories/passwordResetRepository');
  
  try {
    // Verify reset token
    const decoded = jwtUtil.verifyPasswordResetToken(token);
    
    if (!decoded || !decoded.uid || !decoded.email) {
      throw new AuthError('Invalid or expired reset token', 401);
    }
    
    // Check if token exists and is not used
    const resetTokenDoc = await passwordResetRepository.getResetToken(token);
    
    if (!resetTokenDoc || resetTokenDoc.used || resetTokenDoc.expiresAt < new Date()) {
      throw new AuthError('Invalid or expired reset token', 401);
    }
    
    const userId = decoded.uid;
    
    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.success) {
      throw new ValidationError('Password validation failed', passwordValidation.errors);
    }
    
    // Update password in Firebase Auth
    const auth = getAuth();
    await auth.updateUser(userId, {
      password: newPassword
    });
    
    // Mark token as used
    await passwordResetRepository.markTokenAsUsed(token);
    
    // Update timestamp in Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    await db.collection('users').doc(userId).update({
      updatedAt: new Date()
    });
    
    // Revoke all existing tokens for security
    await tokenBlacklistRepository.revokeAllUserTokens(userId);
    
    logger.info('Password reset successfully', { uid: userId });
    
    // Create audit log entry
    const auditEntry = auditFactory.createAuditEntry(
      'PASSWORD_RESET_SUCCESS',
      'auth',
      userId,
      userData.callSign,
      'success',
      'WARNING',
      { email: decoded.email, method: 'reset_token' }
    );
    await auditRepository.logAudit(auditEntry);
    
    return {
      message: 'Password has been reset successfully',
      userId
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      throw new AuthError('Invalid or expired reset token', 401);
    }
    throw error;
  }
}


module.exports = {
  register,
  syncOAuthProfile,
  login,
  refreshAccessToken,
  logout,
  revokeToken,
  bootstrapAdmin,
  changePassword,
  forgotPassword,
  resetPassword
};
