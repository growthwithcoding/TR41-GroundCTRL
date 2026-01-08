/**
 * Scenario Step Repository
 * 
 * Handles persistence of scenario step data to Firebase Firestore
 */

const { getFirestore } = require('../config/firebase');
const logger = require('../utils/logger');

const COLLECTION_NAME = 'scenario_steps';

/**
 * Get all scenario steps with pagination, filtering, and sorting
 * 
 * @param {object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @param {string} options.sortBy - Field to sort by
 * @param {string} options.sortOrder - Sort order (asc/desc)
 * @param {string} options.scenario_id - Filter by scenario
 * @param {string} options.createdBy - Filter by creator (ownership scoping)
 * @returns {Promise} Paginated steps result
 */
async function getAll(options = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'stepOrder',
      sortOrder = 'asc',
      scenario_id,
      createdBy
    } = options;

    const db = getFirestore();
    let query = db.collection(COLLECTION_NAME);

    // Apply filters
    if (scenario_id) {
      query = query.where('scenario_id', '==', scenario_id);
    }
    if (createdBy) {
      query = query.where('createdBy', '==', createdBy);
    }

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    // Get all matching documents
    const snapshot = await query.get();
    let steps = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate pagination
    const total = steps.length;
    const offset = (page - 1) * limit;
    const paginatedSteps = steps.slice(offset, offset + limit);

    // Sanitize data
    const sanitizedSteps = paginatedSteps.map(sanitizeStep);

    return {
      data: sanitizedSteps,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };

  } catch (error) {
    logger.error('Failed to fetch all scenario steps', { error: error.message });
    throw error;
  }
}

/**
 * Get step by ID
 */
async function getById(id, options = {}) {
  try {
    const db = getFirestore();
    const doc = await db.collection(COLLECTION_NAME).doc(id).get();

    if (!doc.exists) return null;

    const step = { id: doc.id, ...doc.data() };

    if (options.createdBy && step.createdBy !== options.createdBy) {
      return null;
    }

    return sanitizeStep(step);
  } catch (error) {
    logger.error('Failed to fetch step by ID', { error: error.message, id });
    throw error;
  }
}

/**
 * Create new step
 */
async function create(data, metadata = {}) {
  try {
    const db = getFirestore();
    const docData = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: metadata.createdBy || null,
      createdByCallSign: metadata.createdByCallSign || null
    };

    const docRef = await db.collection(COLLECTION_NAME).add(docData);
    logger.info('Scenario step created', { id: docRef.id, scenario_id: data.scenario_id });

    return sanitizeStep({ id: docRef.id, ...docData });
  } catch (error) {
    logger.error('Failed to create scenario step', { error: error.message });
    throw error;
  }
}

/**
 * Update step (full replace)
 */
async function update(id, data, metadata = {}) {
  try {
    const db = getFirestore();
    const docData = {
      ...data,
      updatedAt: new Date(),
      updatedBy: metadata.updatedBy || null,
      updatedByCallSign: metadata.updatedByCallSign || null
    };

    await db.collection(COLLECTION_NAME).doc(id).update(docData);
    return sanitizeStep({ id, ...docData });
  } catch (error) {
    logger.error('Failed to update scenario step', { error: error.message, id });
    throw error;
  }
}

/**
 * Patch step (partial)
 */
async function patch(id, updates, metadata = {}) {
  try {
    const db = getFirestore();
    const docData = {
      ...updates,
      updatedAt: new Date(),
      updatedBy: metadata.updatedBy || null,
      updatedByCallSign: metadata.updatedByCallSign || null
    };

    await db.collection(COLLECTION_NAME).doc(id).update(docData);
    const updated = await getById(id);
    return updated;
  } catch (error) {
    logger.error('Failed to patch scenario step', { error: error.message, id });
    throw error;
  }
}

/**
 * Delete step
 */
async function deleteStep(id, metadata = {}) {
  try {
    const db = getFirestore();
    await db.collection(COLLECTION_NAME).doc(id).delete();
    logger.info('Scenario step deleted', { id, deletedBy: metadata.deletedBy });
  } catch (error) {
    logger.error('Failed to delete scenario step', { error: error.message, id });
    throw error;
  }
}

function sanitizeStep(step) {
  const sanitized = { ...step };
  if (sanitized.createdAt?.toDate) sanitized.createdAt = sanitized.createdAt.toDate().toISOString();
  if (sanitized.updatedAt?.toDate) sanitized.updatedAt = sanitized.updatedAt.toDate().toISOString();
  return sanitized;
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  patch,
  delete: deleteStep
};