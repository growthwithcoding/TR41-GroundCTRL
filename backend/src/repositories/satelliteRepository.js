/**
 * Satellite Repository
 * Handles persistence of satellite data to Firebase Firestore
 */

const { getFirestore } = require('../config/firebase');
const logger = require('../utils/logger');

const COLLECTION_NAME = 'satellites';

/**
 * Get all satellites with pagination, filtering, and sorting
 * @param {object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @param {string} options.sortBy - Field to sort by
 * @param {string} options.sortOrder - Sort order (asc/desc)
 * @param {string} options.status - Filter by status
 * @returns {Promise<object>} Paginated satellites result
 */
async function getAll(options = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      isPublic,
      createdBy // Ownership scoping
    } = options;

    const db = getFirestore();
    let query = db.collection(COLLECTION_NAME);

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }
    if (isPublic !== undefined) {
      query = query.where('isPublic', '==', isPublic);
    }
    if (createdBy) {
      query = query.where('createdBy', '==', createdBy);
    }

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    // Get all matching documents
    const snapshot = await query.get();
    let satellites = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate pagination
    const total = satellites.length;
    const offset = (page - 1) * limit;
    const paginatedSatellites = satellites.slice(offset, offset + limit);

    // Sanitize data
    const sanitizedSatellites = paginatedSatellites.map(sanitizeSatellite);

    return {
      data: sanitizedSatellites,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    logger.error('Failed to fetch all satellites', { error: error.message });
    throw error;
  }
}

/**
 * Get satellite by ID
 * @param {string} id - Satellite ID
 * @param {object} options - Query options for ownership scoping
 * @param {string} options.createdBy - Filter by creator (ownership scoping)
 * @returns {Promise<object|null>} Satellite data or null if not found
 */
async function getById(id, options = {}) {
  try {
    const db = getFirestore();
    const doc = await db.collection(COLLECTION_NAME).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const satellite = {
      id: doc.id,
      ...doc.data()
    };

    // Apply ownership scoping if specified
    if (options.createdBy && satellite.createdBy !== options.createdBy) {
      return null; // User doesn't own this satellite
    }

    return sanitizeSatellite(satellite);
  } catch (error) {
    logger.error('Failed to fetch satellite by ID', { error: error.message, id });
    throw error;
  }
}

/**
 * Create new satellite
 * @param {object} satelliteData - Satellite data
 * @param {object} metadata - Creation metadata
 * @returns {Promise<object>} Created satellite data
 */
async function create(satelliteData, metadata = {}) {
  try {
    const db = getFirestore();

    // Prepare Firestore document
    const satelliteDoc = {
      ...satelliteData,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: metadata.createdBy || null,
      createdByCallSign: metadata.createdByCallSign || null
    };

    // Add to Firestore
    const docRef = await db.collection(COLLECTION_NAME).add(satelliteDoc);

    logger.info('Satellite created successfully', { id: docRef.id, name: satelliteData.name });

    return sanitizeSatellite({
      id: docRef.id,
      ...satelliteDoc
    });
  } catch (error) {
    logger.error('Failed to create satellite', { error: error.message });
    throw error;
  }
}

/**
 * Update satellite (full replacement)
 * @param {string} id - Satellite ID
 * @param {object} satelliteData - Updated satellite data
 * @param {object} metadata - Update metadata
 * @returns {Promise<object>} Updated satellite data
 */
async function update(id, satelliteData, metadata = {}) {
  try {
    const db = getFirestore();

    // Prepare Firestore update
    const satelliteDoc = {
      ...satelliteData,
      updatedAt: new Date(),
      updatedBy: metadata.updatedBy || null,
      updatedByCallSign: metadata.updatedByCallSign || null
    };

    // Update Firestore document
    await db.collection(COLLECTION_NAME).doc(id).update(satelliteDoc);

    logger.info('Satellite updated successfully', { id, name: satelliteData.name });

    return sanitizeSatellite({
      id,
      ...satelliteDoc
    });
  } catch (error) {
    logger.error('Failed to update satellite', { error: error.message, id });
    throw error;
  }
}

/**
 * Patch satellite (partial update)
 * @param {string} id - Satellite ID
 * @param {object} updates - Partial satellite data updates
 * @param {object} metadata - Update metadata
 * @returns {Promise<object>} Updated satellite data
 */
async function patch(id, updates, metadata = {}) {
  try {
    const db = getFirestore();

    // Prepare Firestore update
    const satelliteDoc = {
      ...updates,
      updatedAt: new Date(),
      updatedBy: metadata.updatedBy || null,
      updatedByCallSign: metadata.updatedByCallSign || null
    };

    // Update Firestore document
    await db.collection(COLLECTION_NAME).doc(id).update(satelliteDoc);

    // Fetch updated satellite
    const updatedSatellite = await getById(id);

    logger.info('Satellite patched successfully', { id });

    return updatedSatellite;
  } catch (error) {
    logger.error('Failed to patch satellite', { error: error.message, id });
    throw error;
  }
}

/**
 * Delete satellite
 * @param {string} id - Satellite ID
 * @param {object} metadata - Deletion metadata
 * @returns {Promise<void>}
 */
async function deleteSatellite(id, metadata = {}) {
  try {
    const db = getFirestore();

    // Delete from Firestore
    await db.collection(COLLECTION_NAME).doc(id).delete();

    logger.info('Satellite deleted successfully', { id, deletedBy: metadata.deletedBy });
  } catch (error) {
    logger.error('Failed to delete satellite', { error: error.message, id });
    throw error;
  }
}

/**
 * Remove sensitive fields and convert timestamps from satellite object
 * @param {object} satellite - Satellite object
 * @returns {object} Sanitized satellite object
 */
function sanitizeSatellite(satellite) {
  const sanitized = { ...satellite };

  // Convert Firestore timestamps to ISO strings
  if (sanitized.createdAt?.toDate) {
    sanitized.createdAt = sanitized.createdAt.toDate().toISOString();
  }
  if (sanitized.updatedAt?.toDate) {
    sanitized.updatedAt = sanitized.updatedAt.toDate().toISOString();
  }

  return sanitized;
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  patch,
  delete: deleteSatellite
};
