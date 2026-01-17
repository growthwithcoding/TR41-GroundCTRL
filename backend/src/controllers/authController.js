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
    
    // Log audit (non-blocking)
    const auditEntry = auditFactory.createRegisterAudit(
      result.user.uid,
      result.user.callSign,
      true,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    );
    auditRepository.logAudit(auditEntry).catch(auditError => {
      logger.error('Failed to log registration success audit', { auditError: auditError.message });
    });
    
    logger.info('User registered successfully', { uid: result.user.uid, callSign: result.user.callSign });
    
    // Send response
    const response = responseFactory.createSuccessResponse(result, {
      callSign: result.user.callSign,
      requestId: req.id,
      statusCode: httpStatus.CREATED,
      flatten: true  // Flatten auth responses for direct token access
    });
    
    res.status(httpStatus.CREATED).json(response);
  } catch (error) {
    // Log failed registration (non-blocking)
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
      auditRepository.logAudit(auditEntry).catch(auditError => {
        logger.error('Failed to log registration failure audit', { auditError: auditError.message });
      });
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
      
      // Send response
      const response = responseFactory.createSuccessResponse(result, {
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
    
    // Log audit (non-blocking)
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
      auditRepository.logAudit(auditEntry).catch(auditError => {
        logger.error('Failed to log token refresh audit', { auditError: auditError.message });
      });
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
    
    // Log audit (non-blocking)
    const auditEntry = auditFactory.createLogoutAudit(
      req.user.uid,
      req.callSign,
      {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    );
    auditRepository.logAudit(auditEntry).catch(auditError => {
      logger.error('Failed to log logout audit', { auditError: auditError.message });
    });
    
    logger.info('User logged out', { uid: req.user.uid, callSign: req.callSign });
    
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
    
    // Log audit (non-blocking)
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
    auditRepository.logAudit(auditEntry).catch(auditError => {
      logger.error('Failed to log token revocation audit', { auditError: auditError.message });
    });
    
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

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  revokeToken,
  getCurrentUser
};
