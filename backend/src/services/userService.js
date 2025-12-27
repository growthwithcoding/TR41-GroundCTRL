/**
 * User Service
 * Handles user management business logic
 */

const userRepository = require('../repositories/userRepository');
const auditRepository = require('../repositories/auditRepository');
const { ForbiddenError, ConflictError, ValidationError } = require('../utils/errors');
const { validatePassword } = require('../utils/passwordValidation');
const logger = require('../utils/logger');

/**
 * Get all users (admin only)
 * @param {object} options - Query options
 * @param {object} requestingUser - User making the request
 * @returns {Promise<object>} Paginated users
 */
async function getAllUsers(options, requestingUser) {
  // Only admins can list all users
  if (!requestingUser.isAdmin) {
    throw new ForbiddenError('Admin access required to list all users');
  }

  return await userRepository.getAll(options);
}

/**
 * Get user by ID
 * @param {string} uid - User ID
 * @param {object} requestingUser - User making the request
 * @returns {Promise<object>} User data
 */
async function getUserById(uid, requestingUser) {
  // Users can view their own profile or admins can view any profile
  if (uid !== requestingUser.uid && !requestingUser.isAdmin) {
    throw new ForbiddenError('You can only view your own profile');
  }

  const user = await userRepository.getById(uid);
  
  if (!user) {
    throw new ValidationError('User not found');
  }

  return user;
}

/**
 * Create new user (admin only)
 * @param {object} userData - User data
 * @param {object} requestingUser - User making the request
 * @returns {Promise<object>} Created user
 */
async function createUser(userData, requestingUser) {
  // Only admins can create users
  if (!requestingUser.isAdmin) {
    throw new ForbiddenError('Admin access required to create users');
  }

  // Validate password if provided
  if (userData.password) {
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.success) {
      throw new ValidationError('Password validation failed', passwordValidation.errors);
    }
  }

  // Check if email already exists
  const existingEmail = await userRepository.getByEmail(userData.email);
  if (existingEmail) {
    throw new ConflictError('Email already in use');
  }

  // Note: callSign is non-unique and no longer checked for conflicts

  // Create user
  const user = await userRepository.create(userData, {
    createdBy: requestingUser.uid,
    createdByCallSign: requestingUser.callSign
  });

  logger.info('User created via admin', {
    uid: user.uid,
    createdBy: requestingUser.uid,
    callSign: user.callSign
  });

  return user;
}

/**
 * Update user (full replacement)
 * @param {string} uid - User ID
 * @param {object} userData - Updated user data
 * @param {object} requestingUser - User making the request
 * @returns {Promise<object>} Updated user
 */
async function updateUser(uid, userData, requestingUser) {
  // Users can update their own profile or admins can update any profile
  if (uid !== requestingUser.uid && !requestingUser.isAdmin) {
    throw new ForbiddenError('You can only update your own profile');
  }

  // Non-admins cannot modify admin status or role
  if (!requestingUser.isAdmin) {
    if (userData.isAdmin !== undefined || userData.role !== undefined) {
      throw new ForbiddenError('You cannot modify admin status or role');
    }
  }

  // Check if new email conflicts with existing user
  if (userData.email) {
    const existingUser = await userRepository.getByEmail(userData.email);
    if (existingUser && existingUser.uid !== uid) {
      throw new ConflictError('Email already in use by another user');
    }
  }

  // Note: callSign is non-unique and no longer checked for conflicts

  // Update user
  const user = await userRepository.update(uid, userData, {
    updatedBy: requestingUser.uid,
    updatedByCallSign: requestingUser.callSign
  });

  logger.info('User updated', {
    uid,
    updatedBy: requestingUser.uid
  });

  return user;
}

/**
 * Patch user (partial update)
 * @param {string} uid - User ID
 * @param {object} updates - Partial user data updates
 * @param {object} requestingUser - User making the request
 * @returns {Promise<object>} Updated user
 */
async function patchUser(uid, updates, requestingUser) {
  // Users can patch their own profile or admins can patch any profile
  if (uid !== requestingUser.uid && !requestingUser.isAdmin) {
    throw new ForbiddenError('You can only update your own profile');
  }

  // Non-admins cannot modify admin status or role
  if (!requestingUser.isAdmin) {
    if (updates.isAdmin !== undefined || updates.role !== undefined) {
      throw new ForbiddenError('You cannot modify admin status or role');
    }
  }

  // Validate password if provided
  if (updates.password) {
    const passwordValidation = validatePassword(updates.password);
    if (!passwordValidation.success) {
      throw new ValidationError('Password validation failed', passwordValidation.errors);
    }
  }

  // Check if new email conflicts with existing user
  if (updates.email) {
    const existingUser = await userRepository.getByEmail(updates.email);
    if (existingUser && existingUser.uid !== uid) {
      throw new ConflictError('Email already in use by another user');
    }
  }

  // Note: callSign is non-unique and no longer checked for conflicts

  // Patch user
  const user = await userRepository.patch(uid, updates, {
    updatedBy: requestingUser.uid,
    updatedByCallSign: requestingUser.callSign
  });

  logger.info('User patched', {
    uid,
    updatedBy: requestingUser.uid,
    fields: Object.keys(updates)
  });

  return user;
}

/**
 * Delete user (admin only)
 * @param {string} uid - User ID
 * @param {object} requestingUser - User making the request
 * @returns {Promise<void>}
 */
async function deleteUser(uid, requestingUser) {
  // Only admins can delete users
  if (!requestingUser.isAdmin) {
    throw new ForbiddenError('Admin access required to delete users');
  }

  // Prevent self-deletion
  if (uid === requestingUser.uid) {
    throw new ForbiddenError('You cannot delete your own account');
  }

  await userRepository.delete(uid, {
    deletedBy: requestingUser.uid,
    deletedByCallSign: requestingUser.callSign
  });

  logger.info('User deleted', {
    uid,
    deletedBy: requestingUser.uid
  });
}

/**
 * Get user audit logs
 * @param {string} uid - User ID
 * @param {object} requestingUser - User making the request
 * @param {object} options - Query options
 * @returns {Promise<array>} Audit logs
 */
async function getUserAuditLogs(uid, requestingUser, options = {}) {
  // Users can view their own audit logs or admins can view any user's logs
  if (uid !== requestingUser.uid && !requestingUser.isAdmin) {
    throw new ForbiddenError('You can only view your own audit logs');
  }

  const audits = await auditRepository.getAuditsByUserId(uid, options);

  logger.debug('User audit logs retrieved', {
    uid,
    requestedBy: requestingUser.uid,
    count: audits.length
  });

  return audits;
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
