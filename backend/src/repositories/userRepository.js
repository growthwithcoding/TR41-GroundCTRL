/**
 * User Repository
 * Handles persistence of user data to Firebase Firestore
 */

const { getFirestore, getAuth } = require('../config/firebase');
const logger = require('../utils/logger');

const COLLECTION_NAME = 'users';

/**
 * Get all users with pagination, filtering, and sorting
 * @param {object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {string} options.search - Search term for email/callSign/displayName
 * @param {string} options.sortBy - Field to sort by
 * @param {string} options.sortOrder - Sort order (asc/desc)
 * @param {string} options.role - Filter by role
 * @param {boolean} options.isActive - Filter by active status
 * @returns {Promise<object>} Paginated users result
 */
async function getAll(options = {}) {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      role,
      isActive
    } = options;

    const db = getFirestore();
    let query = db.collection(COLLECTION_NAME);

    // Apply filters
    if (role) {
      query = query.where('role', '==', role);
    }

    if (typeof isActive === 'boolean') {
      query = query.where('isActive', '==', isActive);
    }

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    // Get all matching documents for search filtering
    const snapshot = await query.get();
    let users = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    // Apply search filter (client-side for multi-field search)
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user =>
        user.email?.toLowerCase().includes(searchLower) ||
        user.callSign?.toLowerCase().includes(searchLower) ||
        user.displayName?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const total = users.length;
    const offset = (page - 1) * limit;
    const paginatedUsers = users.slice(offset, offset + limit);

    // Remove sensitive fields
    const sanitizedUsers = paginatedUsers.map(sanitizeUser);

    return {
      data: sanitizedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    logger.error('Failed to fetch all users', { error: error.message });
    throw error;
  }
}

/**
 * Get user by ID
 * @param {string} uid - User ID
 * @returns {Promise<object|null>} User data or null if not found
 */
async function getById(uid) {
  try {
    const db = getFirestore();
    const doc = await db.collection(COLLECTION_NAME).doc(uid).get();

    if (!doc.exists) {
      return null;
    }

    const user = {
      uid: doc.id,
      ...doc.data()
    };

    return sanitizeUser(user);
  } catch (error) {
    logger.error('Failed to fetch user by ID', { error: error.message, uid });
    throw error;
  }
}

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<object|null>} User data or null if not found
 */
async function getByEmail(email) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTION_NAME)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      uid: doc.id,
      ...doc.data()
    };
  } catch (error) {
    logger.error('Failed to fetch user by email', { error: error.message, email });
    throw error;
  }
}

/**
 * Get user by call sign
 * @param {string} callSign - User call sign
 * @returns {Promise<object|null>} User data or null if not found
 */
async function getByCallSign(callSign) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTION_NAME)
      .where('callSign', '==', callSign)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      uid: doc.id,
      ...doc.data()
    };
  } catch (error) {
    logger.error('Failed to fetch user by call sign', { error: error.message, callSign });
    throw error;
  }
}

/**
 * Create new user
 * @param {object} userData - User data
 * @param {object} metadata - Creation metadata
 * @returns {Promise<object>} Created user data
 */
async function create(userData, metadata = {}) {
  try {
    const auth = getAuth();
    const db = getFirestore();

    // Create Firebase Auth user first to get the uid
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName || userData.callSign || `Pilot-${userData.email.split('@')[0]}`,
      disabled: !userData.isActive
    });

    // Set default call sign if not provided: Pilot-{uuid}
    const finalCallSign = userData.callSign || `Pilot-${userRecord.uid}`;

    // Prepare Firestore document
    const userDoc = {
      email: userData.email,
      callSign: finalCallSign,
      displayName: userData.displayName || null,
      role: userData.role || 'operator',
      isActive: userData.isActive !== false,
      isAdmin: userData.isAdmin || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: metadata.createdBy || null,
      createdByCallSign: metadata.createdByCallSign || null
    };

    // Save to Firestore
    await db.collection(COLLECTION_NAME).doc(userRecord.uid).set(userDoc);

    logger.info('User created successfully', { uid: userRecord.uid, email: userData.email });

    return sanitizeUser({
      uid: userRecord.uid,
      ...userDoc
    });
  } catch (error) {
    logger.error('Failed to create user', { error: error.message });
    throw error;
  }
}

/**
 * Update user (full replacement)
 * @param {string} uid - User ID
 * @param {object} userData - Updated user data
 * @param {object} metadata - Update metadata
 * @returns {Promise<object>} Updated user data
 */
async function update(uid, userData, metadata = {}) {
  try {
    const auth = getAuth();
    const db = getFirestore();

    // Update Firebase Auth user
    const authUpdate = {
      email: userData.email,
      displayName: userData.displayName || userData.callSign,
      disabled: !userData.isActive
    };

    await auth.updateUser(uid, authUpdate);

    // Prepare Firestore update
    const userDoc = {
      email: userData.email,
      callSign: userData.callSign,
      displayName: userData.displayName || null,
      role: userData.role,
      isActive: userData.isActive,
      isAdmin: userData.isAdmin,
      updatedAt: new Date(),
      updatedBy: metadata.updatedBy || null,
      updatedByCallSign: metadata.updatedByCallSign || null
    };

    // Update Firestore document
    await db.collection(COLLECTION_NAME).doc(uid).update(userDoc);

    logger.info('User updated successfully', { uid, email: userData.email });

    return sanitizeUser({
      uid,
      ...userDoc
    });
  } catch (error) {
    logger.error('Failed to update user', { error: error.message, uid });
    throw error;
  }
}

/**
 * Patch user (partial update)
 * @param {string} uid - User ID
 * @param {object} updates - Partial user data updates
 * @param {object} metadata - Update metadata
 * @returns {Promise<object>} Updated user data
 */
async function patch(uid, updates, metadata = {}) {
  try {
    const auth = getAuth();
    const db = getFirestore();

    // Build Firebase Auth update
    const authUpdate = {};
    if (updates.email) authUpdate.email = updates.email;
    if (updates.displayName !== undefined) {
      authUpdate.displayName = updates.displayName || updates.callSign;
    }
    if (updates.isActive !== undefined) authUpdate.disabled = !updates.isActive;

    // Update Firebase Auth if needed
    if (Object.keys(authUpdate).length > 0) {
      await auth.updateUser(uid, authUpdate);
    }

    // Handle password update separately
    if (updates.password) {
      await auth.updateUser(uid, { password: updates.password });
      delete updates.password; // Don't store in Firestore
    }

    // Prepare Firestore update
    const userDoc = {
      ...updates,
      updatedAt: new Date(),
      updatedBy: metadata.updatedBy || null,
      updatedByCallSign: metadata.updatedByCallSign || null
    };

    // Update Firestore document
    await db.collection(COLLECTION_NAME).doc(uid).update(userDoc);

    // Fetch updated user
    const updatedUser = await getById(uid);

    logger.info('User patched successfully', { uid });

    return updatedUser;
  } catch (error) {
    logger.error('Failed to patch user', { error: error.message, uid });
    throw error;
  }
}

/**
 * Delete user
 * @param {string} uid - User ID
 * @param {object} metadata - Deletion metadata
 * @returns {Promise<void>}
 */
async function deleteUser(uid, metadata = {}) {
  try {
    const auth = getAuth();
    const db = getFirestore();

    // Delete from Firebase Auth
    await auth.deleteUser(uid);

    // Delete from Firestore (or mark as deleted)
    await db.collection(COLLECTION_NAME).doc(uid).delete();

    logger.info('User deleted successfully', { uid, deletedBy: metadata.deletedBy });
  } catch (error) {
    logger.error('Failed to delete user', { error: error.message, uid });
    throw error;
  }
}

/**
 * Remove sensitive fields from user object
 * @param {object} user - User object
 * @returns {object} Sanitized user object
 */
function sanitizeUser(user) {
  const sanitized = { ...user };
  
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.passwordHash;
  
  // Convert Firestore timestamps to ISO strings
  if (sanitized.createdAt?.toDate) {
    sanitized.createdAt = sanitized.createdAt.toDate().toISOString();
  }
  if (sanitized.updatedAt?.toDate) {
    sanitized.updatedAt = sanitized.updatedAt.toDate().toISOString();
  }
  if (sanitized.lastLoginAt?.toDate) {
    sanitized.lastLoginAt = sanitized.lastLoginAt.toDate().toISOString();
  }
  
  return sanitized;
}

module.exports = {
  getAll,
  getById,
  getByEmail,
  getByCallSign,
  create,
  update,
  patch,
  delete: deleteUser
};
