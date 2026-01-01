/**
 * Scenario Repository
 * 
 * Handles persistence of scenario data to Firebase Firestore
 */

const { getFirestore } = require('../config/firebase');
const logger = require('../utils/logger');

const COLLECTION_NAME = 'scenarios';

/**
 * Get all scenarios with pagination, filtering, and sorting
 * 
 * @param {object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @param {string} options.sortBy - Field to sort by
 * @param {string} options.sortOrder - Sort order (asc/desc)
 * @param {string} options.difficulty - Filter by difficulty
 * @param {string} options.tier - Filter by tier
 * @param {string} options.type - Filter by type
 * @param {string} options.status - Filter by status
 * @param {boolean} options.isActive - Filter by active status
 * @param {string} options.satellite_id - Filter by satellite
 * @returns {Promise} Paginated scenarios result
 */
async function getAll(options = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      difficulty,
      tier,
      type,
      status,
      isActive,
      isPublic,
      satellite_id,
      createdBy // Ownership scoping
    } = options;

    const db = getFirestore();
    let query = db.collection(COLLECTION_NAME);

    // Apply filters
    if (difficulty) {
      query = query.where('difficulty', '==', difficulty);
    }
    if (tier) {
      query = query.where('tier', '==', tier);
    }
    if (type) {
      query = query.where('type', '==', type);
    }
    if (status) {
      query = query.where('status', '==', status);
    }
    if (isActive !== undefined) {
      query = query.where('isActive', '==', isActive);
    }
    if (isPublic !== undefined) {
      query = query.where('isPublic', '==', isPublic);
    }
    if (satellite_id) {
      query = query.where('satellite_id', '==', satellite_id);
    }
    if (createdBy) {
      query = query.where('createdBy', '==', createdBy);
    }

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    // Get all matching documents
    const snapshot = await query.get();
    let scenarios = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate pagination
    const total = scenarios.length;
    const offset = (page - 1) * limit;
    const paginatedScenarios = scenarios.slice(offset, offset + limit);

    // Sanitize data
    const sanitizedScenarios = paginatedScenarios.map(sanitizeScenario);

    return {
      data: sanitizedScenarios,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };

  } catch (error) {
    logger.error('Failed to fetch all scenarios', { error: error.message });
    throw error;
  }
}

/**
 * Get scenario by ID
 * 
 * @param {string} id - Scenario ID
 * @param {object} options - Query options for ownership scoping
 * @param {string} options.createdBy - Filter by creator (ownership scoping)
 * @returns {Promise} Scenario data or null if not found
 */
async function getById(id, options = {}) {
  try {
    const db = getFirestore();
    const doc = await db.collection(COLLECTION_NAME).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const scenario = {
      id: doc.id,
      ...doc.data()
    };

    // Apply ownership scoping if specified
    if (options.createdBy && scenario.createdBy !== options.createdBy) {
      return null; // User doesn't own this scenario
    }

    return sanitizeScenario(scenario);

  } catch (error) {
    logger.error('Failed to fetch scenario by ID', { error: error.message, id });
    throw error;
  }
}

/**
 * Create new scenario
 * 
 * @param {object} scenarioData - Scenario data
 * @param {object} metadata - Creation metadata
 * @returns {Promise} Created scenario data
 */
async function create(scenarioData, metadata = {}) {
  try {
    const db = getFirestore();

    // Prepare Firestore document
    const scenarioDoc = {
      ...scenarioData,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: metadata.createdBy || null,
      createdByCallSign: metadata.createdByCallSign || null
    };

    // Add to Firestore
    const docRef = await db.collection(COLLECTION_NAME).add(scenarioDoc);

    logger.info('Scenario created successfully', { id: docRef.id, title: scenarioData.title });

    return sanitizeScenario({
      id: docRef.id,
      ...scenarioDoc
    });

  } catch (error) {
    logger.error('Failed to create scenario', { error: error.message });
    throw error;
  }
}

/**
 * Update scenario (full replacement)
 * 
 * @param {string} id - Scenario ID
 * @param {object} scenarioData - Updated scenario data
 * @param {object} metadata - Update metadata
 * @returns {Promise} Updated scenario data
 */
async function update(id, scenarioData, metadata = {}) {
  try {
    const db = getFirestore();

    // Prepare Firestore update
    const scenarioDoc = {
      ...scenarioData,
      updatedAt: new Date(),
      updatedBy: metadata.updatedBy || null,
      updatedByCallSign: metadata.updatedByCallSign || null
    };

    // Update Firestore document
    await db.collection(COLLECTION_NAME).doc(id).update(scenarioDoc);

    logger.info('Scenario updated successfully', { id, title: scenarioData.title });

    return sanitizeScenario({
      id,
      ...scenarioDoc
    });

  } catch (error) {
    logger.error('Failed to update scenario', { error: error.message, id });
    throw error;
  }
}

/**
 * Patch scenario (partial update)
 * 
 * @param {string} id - Scenario ID
 * @param {object} updates - Partial scenario data updates
 * @param {object} metadata - Update metadata
 * @returns {Promise} Updated scenario data
 */
async function patch(id, updates, metadata = {}) {
  try {
    const db = getFirestore();

    // Prepare Firestore update
    const scenarioDoc = {
      ...updates,
      updatedAt: new Date(),
      updatedBy: metadata.updatedBy || null,
      updatedByCallSign: metadata.updatedByCallSign || null
    };

    // Update Firestore document
    await db.collection(COLLECTION_NAME).doc(id).update(scenarioDoc);

    // Fetch updated scenario
    const updatedScenario = await getById(id);

    logger.info('Scenario patched successfully', { id });

    return updatedScenario;

  } catch (error) {
    logger.error('Failed to patch scenario', { error: error.message, id });
    throw error;
  }
}

/**
 * Delete scenario
 * 
 * @param {string} id - Scenario ID
 * @param {object} metadata - Deletion metadata
 * @returns {Promise}
 */
async function deleteSce(id, metadata = {}) {
  try {
    const db = getFirestore();

    // Delete from Firestore
    await db.collection(COLLECTION_NAME).doc(id).delete();

    logger.info('Scenario deleted successfully', { id, deletedBy: metadata.deletedBy });

  } catch (error) {
    logger.error('Failed to delete scenario', { error: error.message, id });
    throw error;
  }
}

/**
 * Remove sensitive fields and convert timestamps from scenario object
 * 
 * @param {object} scenario - Scenario object
 * @returns {object} Sanitized scenario object
 */
function sanitizeScenario(scenario) {
  const sanitized = { ...scenario };

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
  delete: deleteSce
};
