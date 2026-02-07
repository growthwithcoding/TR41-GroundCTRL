/**
 * Certificate Repository
 * 
 * Handles persistence of certificate data to Firebase Firestore
 * Certificates are generated when users complete missions
 */

const { getFirestore } = require('../config/firebase');
const logger = require('../utils/logger');

const COLLECTION_NAME = 'certificates';

/**
 * Get all certificates with pagination, filtering, and sorting
 * 
 * @param {object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @param {string} options.sortBy - Field to sort by
 * @param {string} options.sortOrder - Sort order (asc/desc)
 * @param {string} options.userId - Filter by user ID
 * @param {string} options.type - Filter by certificate type
 * @param {string} options.tier - Filter by performance tier
 * @param {boolean} options.isPublic - Filter by public visibility
 * @returns {Promise} Paginated certificates result
 */
async function getAll(options = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'completionDate',
      sortOrder = 'desc',
      userId,
      type,
      tier,
      isPublic
    } = options;

    const db = getFirestore();
    let query = db.collection(COLLECTION_NAME);

    // Apply filters
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    if (type) {
      query = query.where('type', '==', type);
    }
    if (tier) {
      query = query.where('performance.tier.name', '==', tier);
    }
    if (typeof isPublic === 'boolean') {
      query = query.where('isPublic', '==', isPublic);
    }

    // Apply sorting
    query = query.orderBy(sortBy, sortOrder);

    // Get all matching documents
    const snapshot = await query.get();
    let certificates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate pagination
    const total = certificates.length;
    const offset = (page - 1) * limit;
    const paginatedCertificates = certificates.slice(offset, offset + limit);

    // Sanitize data
    const sanitizedCertificates = paginatedCertificates.map(sanitizeCertificate);

    return {
      data: sanitizedCertificates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };

  } catch (error) {
    logger.error('Failed to fetch all certificates', { error: error.message });
    throw error;
  }
}

/**
 * Get certificate by ID
 */
async function getById(id) {
  try {
    const db = getFirestore();
    const doc = await db.collection(COLLECTION_NAME).doc(id).get();

    if (!doc.exists) return null;

    const certificate = { id: doc.id, ...doc.data() };
    return sanitizeCertificate(certificate);
  } catch (error) {
    logger.error('Failed to fetch certificate by ID', { error: error.message, id });
    throw error;
  }
}

/**
 * Get certificate by certificate ID (the unique CERT-xxx-xxx ID)
 */
async function getByCertificateId(certificateId) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTION_NAME)
      .where('certificateId', '==', certificateId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const certificate = { id: doc.id, ...doc.data() };
    return sanitizeCertificate(certificate);
  } catch (error) {
    logger.error('Failed to fetch certificate by certificate ID', { error: error.message, certificateId });
    throw error;
  }
}

/**
 * Get certificate by session ID
 */
async function getBySessionId(sessionId) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTION_NAME)
      .where('mission.sessionId', '==', sessionId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const certificate = { id: doc.id, ...doc.data() };
    return sanitizeCertificate(certificate);
  } catch (error) {
    logger.error('Failed to fetch certificate by session ID', { error: error.message, sessionId });
    throw error;
  }
}

/**
 * Get certificates by user ID
 */
async function getByUserId(userId, options = {}) {
  try {
    const db = getFirestore();
    let query = db.collection(COLLECTION_NAME)
      .where('userId', '==', userId)
      .orderBy('completionDate', 'desc');

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    const certificates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return certificates.map(sanitizeCertificate);
  } catch (error) {
    logger.error('Failed to fetch certificates by user ID', { error: error.message, userId });
    throw error;
  }
}

/**
 * Create new certificate
 */
async function create(data, metadata = {}) {
  try {
    const db = getFirestore();
    const now = new Date();
    
    const docData = {
      ...data,
      certificateId: data.id, // Store the CERT-xxx-xxx ID
      completionDate: data.completionDate || now.toISOString(),
      generatedAt: data.generatedAt || Date.now(),
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
      createdAt: now,
      updatedAt: now,
      createdBy: metadata.createdBy || data.userId,
    };

    // Remove the 'id' field from data (it's the CERT-xxx ID, not the doc ID)
    const { id, ...docDataWithoutId } = docData;

    const docRef = await db.collection(COLLECTION_NAME).add(docDataWithoutId);
    
    logger.info('Certificate created', { 
      docId: docRef.id,
      certificateId: docData.certificateId,
      userId: data.userId,
      type: data.type
    });

    return sanitizeCertificate({ id: docRef.id, ...docDataWithoutId });
  } catch (error) {
    logger.error('Failed to create certificate', { error: error.message });
    throw error;
  }
}

/**
 * Update certificate (full replace)
 */
async function update(id, data, metadata = {}) {
  try {
    const db = getFirestore();
    const docData = {
      ...data,
      updatedAt: new Date(),
      updatedBy: metadata.updatedBy || null,
    };

    await db.collection(COLLECTION_NAME).doc(id).update(docData);
    return sanitizeCertificate({ id, ...docData });
  } catch (error) {
    logger.error('Failed to update certificate', { error: error.message, id });
    throw error;
  }
}

/**
 * Patch certificate (partial update)
 */
async function patch(id, updates, metadata = {}) {
  try {
    const db = getFirestore();
    const docData = {
      ...updates,
      updatedAt: new Date(),
      updatedBy: metadata.updatedBy || null,
    };

    await db.collection(COLLECTION_NAME).doc(id).update(docData);
    const updated = await getById(id);
    return updated;
  } catch (error) {
    logger.error('Failed to patch certificate', { error: error.message, id });
    throw error;
  }
}

/**
 * Delete certificate
 */
async function deleteCertificate(id, metadata = {}) {
  try {
    const db = getFirestore();
    await db.collection(COLLECTION_NAME).doc(id).delete();
    logger.info('Certificate deleted', { id, deletedBy: metadata.deletedBy });
  } catch (error) {
    logger.error('Failed to delete certificate', { error: error.message, id });
    throw error;
  }
}

/**
 * Update certificate share settings
 */
async function updateShareSettings(id, isPublic) {
  try {
    const db = getFirestore();
    await db.collection(COLLECTION_NAME).doc(id).update({
      isPublic,
      updatedAt: new Date()
    });

    return await getById(id);
  } catch (error) {
    logger.error('Failed to update share settings', { error: error.message, id });
    throw error;
  }
}

/**
 * Get public certificate (for sharing)
 */
async function getPublicCertificate(certificateId) {
  try {
    const certificate = await getByCertificateId(certificateId);
    
    if (!certificate) return null;
    if (!certificate.isPublic) return null;
    
    return certificate;
  } catch (error) {
    logger.error('Failed to fetch public certificate', { error: error.message, certificateId });
    throw error;
  }
}

/**
 * Get certificate statistics for user
 */
async function getUserStats(userId) {
  try {
    const certificates = await getByUserId(userId);
    
    const stats = {
      total: certificates.length,
      byType: {},
      byTier: {},
      totalScore: 0,
      averageScore: 0,
      achievements: []
    };

    certificates.forEach(cert => {
      // Count by type
      stats.byType[cert.type] = (stats.byType[cert.type] || 0) + 1;
      
      // Count by tier
      if (cert.performance?.tier?.name) {
        const tier = cert.performance.tier.name;
        stats.byTier[tier] = (stats.byTier[tier] || 0) + 1;
      }
      
      // Calculate scores
      if (cert.performance?.overallScore) {
        stats.totalScore += cert.performance.overallScore;
      }
      
      // Collect achievements
      if (cert.performance?.achievements) {
        cert.performance.achievements.forEach(achievement => {
          if (!stats.achievements.find(a => a.id === achievement.id)) {
            stats.achievements.push(achievement);
          }
        });
      }
    });

    if (certificates.length > 0) {
      stats.averageScore = Math.round(stats.totalScore / certificates.length);
    }

    return stats;
  } catch (error) {
    logger.error('Failed to get user certificate stats', { error: error.message, userId });
    throw error;
  }
}

/**
 * Sanitize certificate data (convert Firestore timestamps)
 */
function sanitizeCertificate(certificate) {
  const sanitized = { ...certificate };
  if (sanitized.createdAt?.toDate) sanitized.createdAt = sanitized.createdAt.toDate().toISOString();
  if (sanitized.updatedAt?.toDate) sanitized.updatedAt = sanitized.updatedAt.toDate().toISOString();
  return sanitized;
}

module.exports = {
  getAll,
  getById,
  getByCertificateId,
  getBySessionId,
  getByUserId,
  create,
  update,
  patch,
  delete: deleteCertificate,
  updateShareSettings,
  getPublicCertificate,
  getUserStats
};
