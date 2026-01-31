/**
 * Auth Controller
 * Handles HTTP requests for authentication operations
 */

const authService = require('../services/authService');
const lockoutService = require('../services/lockoutService');
const responseFactory = require('../factories/responseFactory');
const auditFactory = require('../factories/auditFactory');
const auditRepository = require('../repositories/auditRepository');
const userRepository = require('../repositories/userRepository');
const { loginSchema, registerSchema, refreshTokenSchema, revokeTokenSchema } = require('../schemas/authSchemas');
const { ValidationError, NotFoundError } = require('../utils/errors');
const httpStatus = require('../constants/httpStatus');
const logger = require('../utils/logger');

/**
 * Sync OAuth user profile (Google, etc.)
 * POST /auth/sync-oauth-profile
 * SECURITY: Must be called with authenticated user token
 * Uses authenticated user's UID from token, not from request body
 */
async function syncOAuthProfile(req, res, next) {
  try {
    // Validate required fields first (input validation, not security check)
    const { email, displayName, photoURL } = req.body;
    if (!email) {
      throw new ValidationError('email is required');
    }
    
    // SECURITY: Require authentication - get UID from verified token, not request body
    if (!req.user || !req.user.uid) {
      throw new ValidationError('Authentication required');
    }
    
    // SECURITY: Use authenticated user's UID from token, not from request body
    // This prevents users from manipulating other users' profiles
    const authenticatedUid = req.user.uid;
    
    // Create or update user profile in Firestore
    const result = await authService.syncOAuthProfile(authenticatedUid, email, displayName, photoURL);
    
    logger.info('OAuth profile synced', { uid: authenticatedUid, email });
    
    const response = responseFactory.createSuccessResponse(result, {
      callSign: result.user.callSign,
      requestId: req.id,
      statusCode: httpStatus.OK
    });
    
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Register new user
 * POST /auth/register
 */
async function register(req, res, next) {
  try {
    // Validate request body
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }
    
    const { email, password, callSign, displayName } = validation.data;
    
    // Register user
    const result = await authService.register(email, password, callSign, displayName);
    
    // Log audit
    const auditEntry = auditFactory.createRegisterAudit(
      result.user.uid,
      result.user.callSign,
      true,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    );
    await auditRepository.logAudit(auditEntry);
    
    logger.info('User registered successfully', { uid: result.user.uid, callSign: result.user.callSign });
    
    // SECURITY: Set refresh token as HttpOnly cookie
    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,        // Cannot be accessed by JavaScript
        secure: process.env.NODE_ENV === 'production',  // Only sent over HTTPS in production
        sameSite: 'strict',    // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days in milliseconds
        path: '/api/v1/auth'   // Only sent to auth endpoints
      });
    }
    
    // Remove refresh token from response payload (security best practice)
    const responsePayload = {
      user: result.user,
      tokens: {
        accessToken: result.accessToken
        // refreshToken is in HttpOnly cookie, NOT in JSON
      }
    };
    
    // Send response
    const response = responseFactory.createSuccessResponse(responsePayload, {
      callSign: result.user.callSign,
      requestId: req.id,
      statusCode: httpStatus.CREATED,
      flatten: true  // Flatten auth responses for direct token access
    });
    
    res.status(httpStatus.CREATED).json(response);
  } catch (error) {
    // Log failed registration
    if (req.body?.callSign) {
      const auditEntry = auditFactory.createRegisterAudit(
        'UNKNOWN',
        req.body.callSign,
        false,
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          errorMessage: error.message,
          statusCode: error.statusCode || 500
        }
      );
      await auditRepository.logAudit(auditEntry);
    }
    
    next(error);
  }
}

/**
 * Login user
 * POST /auth/login
 */
async function login(req, res, next) {
  try {
    // Validate request body
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }
    
    const { email, password } = validation.data;
    
    // Attempt login
    let result;
    let userId;
    let userCallSign;
    
    try {
      result = await authService.login(email, password);
      userId = result.user.uid;
      userCallSign = result.user.callSign;
      
      // Check lockout status BEFORE successful login
      await lockoutService.checkAccountLockout(userId, userCallSign);
      
      // Record successful login
      await lockoutService.recordLoginAttempt(userId, userCallSign, true, {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      logger.info('User logged in successfully', { uid: userId, callSign: userCallSign });
      
      // SECURITY: Set refresh token as HttpOnly cookie
      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,        // Cannot be accessed by JavaScript
          secure: process.env.NODE_ENV === 'production',  // Only sent over HTTPS in production
          sameSite: 'strict',    // CSRF protection
          maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days in milliseconds
          path: '/api/v1/auth'   // Only sent to auth endpoints
        });
      }
      
      // Remove refresh token from response payload (security best practice)
      const responsePayload = {
        user: result.user,
        tokens: {
          accessToken: result.accessToken
          // refreshToken is in HttpOnly cookie, NOT in JSON
        }
      };
      
      // Send response
      const response = responseFactory.createSuccessResponse(responsePayload, {
        callSign: userCallSign,
        requestId: req.id,
        flatten: true  // Flatten auth responses for direct token access
      });
      
      res.status(httpStatus.OK).json(response);
    } catch (loginError) {
      // If we got user info, record failed attempt
      if (loginError.statusCode === 401) {
        // Try to get user ID for failed login tracking
        try {
          const { getAuth } = require('../config/firebase');
          const auth = getAuth();
          const userRecord = await auth.getUserByEmail(email);
          
          if (userRecord) {
            const { getFirestore } = require('../config/firebase');
            const db = getFirestore();
            const userDoc = await db.collection('users').doc(userRecord.uid).get();
            
            if (userDoc.exists) {
              const userData = userDoc.data();
              userId = userRecord.uid;
              userCallSign = userData.callSign;
              
              // Record failed login
              await lockoutService.recordLoginAttempt(userId, userCallSign, false, {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                errorMessage: loginError.message
              });
              
              // Check if this triggers lockout
              await lockoutService.checkAccountLockout(userId, userCallSign);
            }
          }
        } catch {
          // User not found - don't reveal this information
          logger.debug('Failed login attempt for unknown user', { email });
        }
      }
      
      throw loginError;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh access token
 * POST /auth/refresh
 */
async function refreshToken(req, res, next) {
  try {
    // Validate request body
    const validation = refreshTokenSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }
    
    const { refreshToken } = validation.data;
    
    // Refresh token
    const result = await authService.refreshAccessToken(refreshToken);
    
    // Log audit
    const decoded = require('../utils/jwt').decodeToken(refreshToken);
    if (decoded) {
      const auditEntry = auditFactory.createAuditEntry(
        'TOKEN_REFRESH',
        'auth',
        decoded.uid,
        result.callSign || 'SYSTEM',
        'success',
        'INFO',
        {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      );
      await auditRepository.logAudit(auditEntry);
    }
    
    logger.info('Token refreshed successfully', { callSign: result.callSign });
    
    // Send response
    const response = responseFactory.createSuccessResponse(
      {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      },
      {
        callSign: result.callSign,
        requestId: req.id,
        flatten: true  // Flatten auth responses for direct token access
      }
    );
    
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Logout user
 * POST /auth/logout
 */
async function logout(req, res, next) {
  try {
    // Extract tokens
    const accessToken = req.headers.authorization?.split(' ')[1];
    const refreshToken = req.body.refreshToken;
    
    if (!accessToken) {
      throw new ValidationError('Access token required');
    }
    
    // Logout
    await authService.logout(accessToken, refreshToken);
    
    // Log audit
    const auditEntry = auditFactory.createLogoutAudit(
      req.user.uid,
      req.callSign,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    );
    await auditRepository.logAudit(auditEntry);
    
    logger.info('User logged out', { uid: req.user.uid, callSign: req.callSign });
    
    // SECURITY: Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth'
    });
    
    // Send response
    const response = responseFactory.createSuccessResponse(
      { message: 'Logout successful' },
      {
        callSign: req.callSign,
        requestId: req.id
      }
    );
    
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Revoke token (admin only)
 * POST /auth/revoke
 */
async function revokeToken(req, res, next) {
  try {
    // Validate request body
    const validation = revokeTokenSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Validation failed', validation.error.errors);
    }
    
    const { token, userId } = validation.data;
    
    // Revoke token
    const result = await authService.revokeToken(token, userId);
    
    // Log audit
    const auditEntry = auditFactory.createAuditEntry(
      'TOKEN_REVOKE',
      'auth',
      req.user.uid,
      req.callSign,
      'success',
      'CRITICAL',
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: `Revoked ${result.revoked} token(s) of type: ${result.type}`,
        targetUserId: userId
      }
    );
    await auditRepository.logAudit(auditEntry);
    
    logger.info('Token revoked by admin', {
      admin: req.callSign,
      revoked: result.revoked,
      type: result.type
    });
    
    // Send response
    const response = responseFactory.createSuccessResponse(result, {
      callSign: req.callSign,
      requestId: req.id
    });
    
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user info
 * GET /auth/me
 */
async function getCurrentUser(req, res, next) {
  try {
    // User ID comes from authMiddleware
    const userId = req.user.uid;
    
    // Fetch complete user info from Firestore
    const user = await userRepository.getById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    logger.info('Current user info retrieved', { uid: userId, callSign: req.callSign });
    
    // Send response
    const response = responseFactory.createSuccessResponse(
      { user },
      {
        callSign: req.callSign,
        requestId: req.id
      }
    );
    
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Bootstrap initial admin user (one-time use)
 * POST /auth/bootstrap-admin
 */
async function bootstrapAdmin(req, res, next) {
  try {
    const { email, password, callSign, displayName } = req.body;
    
    // Bootstrap admin user
    const result = await authService.bootstrapAdmin(email, password, callSign, displayName);
    
    logger.info('Admin user bootstrapped successfully', { uid: result.user.uid, callSign: result.user.callSign });
    
    // SECURITY: Set refresh token as HttpOnly cookie
    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/v1/auth'
      });
    }
    
    // Remove refresh token from response payload
    const responsePayload = {
      user: result.user,
      tokens: {
        accessToken: result.accessToken
      }
    };
    
    // Send response
    const response = responseFactory.createSuccessResponse(responsePayload, {
      callSign: result.user.callSign,
      requestId: req.id,
      statusCode: httpStatus.CREATED,
      flatten: true
    });
    
    res.status(httpStatus.CREATED).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Change password (authenticated user)
 * POST /auth/change-password
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.uid;
    const callSign = req.callSign;
    
    // Change password
    const result = await authService.changePassword(userId, currentPassword, newPassword, callSign);
    
    logger.info('Password changed successfully', { uid: userId, callSign });
    
    // Send response
    const response = responseFactory.createSuccessResponse(result, {
      callSign,
      requestId: req.id
    });
    
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Request password reset
 * POST /auth/forgot-password
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    
    // Request password reset
    const result = await authService.forgotPassword(email);
    
    logger.info('Password reset requested', { email });
    
    // Send response (always success for security)
    const response = responseFactory.createSuccessResponse(result, {
      callSign: 'SYSTEM',
      requestId: req.id
    });
    
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Reset password with token
 * POST /auth/reset-password
 */
async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    
    // Reset password
    const result = await authService.resetPassword(token, newPassword);
    
    logger.info('Password reset successfully', { userId: result.userId });
    
    // Send response
    const response = responseFactory.createSuccessResponse(result, {
      callSign: 'SYSTEM',
      requestId: req.id
    });
    
    res.status(httpStatus.OK).json(response);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  syncOAuthProfile,
  login,
  refreshToken,
  logout,
  revokeToken,
  getCurrentUser,
  bootstrapAdmin,
  changePassword,
  forgotPassword,
  resetPassword
};
