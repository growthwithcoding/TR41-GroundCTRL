/**
 * Scenario Session Repository
 *
 * Handles persistence of scenario session data to Firebase Firestore
 * Tracks operator progress through training scenarios
 */

const { getFirestore } = require("../config/firebase");
const logger = require("../utils/logger");

const COLLECTION_NAME = "scenario_sessions";

/**
 * Get all scenario sessions with pagination, filtering, and sorting
 *
 * @param {object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @param {string} options.sortBy - Field to sort by
 * @param {string} options.sortOrder - Sort order (asc/desc)
 * @param {string} options.scenario_id - Filter by scenario
 * @param {string} options.user_id - Filter by user
 * @param {string} options.status - Filter by session status
 * @param {string} options.createdBy - Filter by creator (ownership scoping)
 * @returns {Promise} Paginated sessions result
 */
async function getAll(options = {}) {
	try {
		const {
			page = 1,
			limit = 20,
			sortBy = "createdAt",
			sortOrder = "desc",
			scenario_id,
			user_id,
			status,
			createdBy,
		} = options;

		const db = getFirestore();
		let query = db.collection(COLLECTION_NAME);

		// Apply filters
		if (scenario_id) {
			query = query.where("scenario_id", "==", scenario_id);
		}
		if (user_id) {
			query = query.where("user_id", "==", user_id);
		}
		if (status) {
			query = query.where("status", "==", status);
		}
		if (createdBy) {
			query = query.where("createdBy", "==", createdBy);
		}

		// Apply sorting
		query = query.orderBy(sortBy, sortOrder);

		// Get all matching documents
		const snapshot = await query.get();
		let sessions = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));

		// Calculate pagination
		const total = sessions.length;
		const offset = (page - 1) * limit;
		const paginatedSessions = sessions.slice(offset, offset + limit);

		// Sanitize data
		const sanitizedSessions = paginatedSessions.map(sanitizeSession);

		return {
			data: sanitizedSessions,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	} catch (error) {
		logger.error("Failed to fetch all scenario sessions", {
			error: error.message,
		});
		throw error;
	}
}

/**
 * Get session by ID
 */
async function getById(id, options = {}) {
	try {
		const db = getFirestore();
		const doc = await db.collection(COLLECTION_NAME).doc(id).get();

		if (!doc.exists) return null;

		const session = { id: doc.id, ...doc.data() };

		if (options.createdBy && session.createdBy !== options.createdBy) {
			return null;
		}

		return sanitizeSession(session);
	} catch (error) {
		logger.error("Failed to fetch session by ID", { error: error.message, id });
		throw error;
	}
}

/**
 * Create new session
 */
async function create(data, metadata = {}) {
	try {
		const db = getFirestore();
		const docData = {
			...data,
			createdAt: new Date(),
			updatedAt: new Date(),
			createdBy: metadata.createdBy || null,
			createdByCallSign: metadata.createdByCallSign || null,
		};

		const docRef = await db.collection(COLLECTION_NAME).add(docData);
		logger.info("Scenario session created", {
			id: docRef.id,
			scenario_id: data.scenario_id,
		});

		return sanitizeSession({ id: docRef.id, ...docData });
	} catch (error) {
		logger.error("Failed to create scenario session", { error: error.message });
		throw error;
	}
}

/**
 * Update session (full replace)
 */
async function update(id, data, metadata = {}) {
	try {
		const db = getFirestore();
		const docData = {
			...data,
			updatedAt: new Date(),
			updatedBy: metadata.updatedBy || null,
			updatedByCallSign: metadata.updatedByCallSign || null,
		};

		await db.collection(COLLECTION_NAME).doc(id).update(docData);
		return sanitizeSession({ id, ...docData });
	} catch (error) {
		logger.error("Failed to update scenario session", {
			error: error.message,
			id,
		});
		throw error;
	}
}

/**
 * Patch session (partial) with optimistic locking
 * @param {string} id - Session ID
 * @param {object} updates - Fields to update
 * @param {object} metadata - Update metadata
 * @param {number} [expectedVersion] - Expected version for optimistic locking (optional)
 * @returns {Promise} Updated session
 * @throws {Error} 409 Conflict if version mismatch
 */
async function patch(id, updates, metadata = {}, expectedVersion = null) {
	try {
		const db = getFirestore();
		const docRef = db.collection(COLLECTION_NAME).doc(id);

		// If version checking is requested
		if (expectedVersion !== null) {
			const doc = await docRef.get();
			if (!doc.exists) {
				throw new Error("Session not found");
			}

			const currentVersion = doc.data().version || 1;
			if (currentVersion !== expectedVersion) {
				const error = new Error("Session was modified. Refresh and retry.");
				error.statusCode = 409;
				error.code = "VERSION_CONFLICT";
				throw error;
			}

			// Increment version on successful update
			updates.version = currentVersion + 1;
		}

		const docData = {
			...updates,
			updatedAt: new Date(),
			updatedBy: metadata.updatedBy || null,
			updatedByCallSign: metadata.updatedByCallSign || null,
		};

		await docRef.update(docData);
		const updated = await getById(id);
		return updated;
	} catch (error) {
		logger.error("Failed to patch scenario session", {
			error: error.message,
			id,
		});
		throw error;
	}
}

/**
 * Delete session
 */
async function deleteSession(id, metadata = {}) {
	try {
		const db = getFirestore();
		await db.collection(COLLECTION_NAME).doc(id).delete();
		logger.info("Scenario session deleted", {
			id,
			deletedBy: metadata.deletedBy,
		});
	} catch (error) {
		logger.error("Failed to delete scenario session", {
			error: error.message,
			id,
		});
		throw error;
	}
}

function sanitizeSession(session) {
	const sanitized = { ...session };
	if (sanitized.createdAt?.toDate)
		sanitized.createdAt = sanitized.createdAt.toDate().toISOString();
	if (sanitized.updatedAt?.toDate)
		sanitized.updatedAt = sanitized.updatedAt.toDate().toISOString();
	if (sanitized.startedAt?.toDate)
		sanitized.startedAt = sanitized.startedAt.toDate().toISOString();
	if (sanitized.completedAt?.toDate)
		sanitized.completedAt = sanitized.completedAt.toDate().toISOString();
	return sanitized;
}

module.exports = {
	getAll,
	getById,
	create,
	update,
	patch,
	delete: deleteSession,
};
