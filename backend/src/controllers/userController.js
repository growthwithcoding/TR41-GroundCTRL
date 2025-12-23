/**
 * User Controller
 * HTTP handlers for user management endpoints
 */

const userService = require('../services/userService');
const responseFactory = require('../factories/responseFactory');
const httpStatus = require('../constants/httpStatus');

/**
 * Get all users (admin only)
 * Wraps the service layer with permission checking
 */
async function getAllUsers(req, res, next) {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      role: req.query.role,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined
    };

    const result = await userService.getAllUsers(options, req.user);

    const response = responseFactory.createPaginatedResponse(
      result.data,
      {
        page: result.page,
        limit: result.limit,
        total: result.total
      },
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
 * Get user by ID
 * With permission checking for self or admin
 */
async function getUserById(req, res, next) {
  try {
    const { uid } = req.params;
    
    const user = await userService.getUserById(uid, req.user);

    const response = responseFactory.createSuccessResponse(user, {
      callSign: req.callSign,
      requestId: req.id
    });

    res.status(httpStatus.OK).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Create new user (admin only)
 */
async function createUser(req, res, next) {
  try {
    const user = await userService.createUser(req.body, req.user);

    const response = responseFactory.createSuccessResponse(user, {
      callSign: req.callSign,
      requestId: req.id,
      statusCode: httpStatus.CREATED
    });

    res.status(httpStatus.CREATED).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Update user (full replacement)
 */
async function updateUser(req, res, next) {
  try {
    const { uid } = req.params;
    
    const user = await userService.updateUser(uid, req.body, req.user);

    const response = responseFactory.createSuccessResponse(user, {
      callSign: req.callSign,
      requestId: req.id
    });

    res.status(httpStatus.OK).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Patch user (partial update)
 */
async function patchUser(req, res, next) {
  try {
    const { uid } = req.params;
    
    const user = await userService.patchUser(uid, req.body, req.user);

    const response = responseFactory.createSuccessResponse(user, {
      callSign: req.callSign,
      requestId: req.id
    });

    res.status(httpStatus.OK).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete user (admin only)
 */
async function deleteUser(req, res, next) {
  try {
    const { uid } = req.params;
    
    await userService.deleteUser(uid, req.user);

    const response = responseFactory.createSuccessResponse(
      {
        message: 'User deleted successfully',
        uid
      },
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
 * Get user audit logs
 */
async function getUserAuditLogs(req, res, next) {
  try {
    const { uid } = req.params;
    
    const options = {
      limit: parseInt(req.query.limit) || 50,
      startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate) : undefined
    };

    const audits = await userService.getUserAuditLogs(uid, req.user, options);

    const response = responseFactory.createSuccessResponse(
      { audits },
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
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  patchUser,
  deleteUser,
  getUserAuditLogs
};
