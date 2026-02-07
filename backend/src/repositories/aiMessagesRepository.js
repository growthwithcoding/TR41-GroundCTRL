/**
 * AI Messages Repository
 *
 * Handles persistence of AI conversation messages to Firebase Firestore
 * Supports NOVA AI tutoring system with step-aware tracking
 *
 * Phase 10 Implementation - NOVA AI End-to-End Integration
 */

const { getFirestore } = require("../config/firebase");
const logger = require("../utils/logger");

const COLLECTION_NAME = "ai_messages";

/**
 * Add a new message to the conversation
 *
 * @param {string} sessionId - Session ID (FK to scenario_sessions)
 * @param {string} userId - User ID (uid)
 * @param {string} role - Message role ('user' or 'assistant')
 * @param {string} content - Message content
 * @param {object} metadata - Optional metadata (step_id, command_id, hint_type, etc.)
 * @returns {Promise<object>} Created message document
 */
async function addMessage(sessionId, userId, role, content, metadata = {}) {
	try {
		const db = getFirestore();
		const now = new Date();

		const docData = {
			session_id: sessionId,
			user_id: userId,
			role,
			content,
			step_id: metadata.step_id || null,
			command_id: metadata.command_id || null,
			hint_type: metadata.hint_type || null,
			is_fallback: metadata.is_fallback || false,
			metadata: metadata.extra || {},
			created_at: now,
			updated_at: now,
		};

		const docRef = await db.collection(COLLECTION_NAME).add(docData);

		logger.info("AI message created", {
			id: docRef.id,
			session_id: sessionId,
			role,
			has_step_id: !!metadata.step_id,
		});

		return sanitizeMessage({ id: docRef.id, ...docData });
	} catch (error) {
		logger.error("Failed to create AI message", {
			error: error.message,
			sessionId,
		});
		throw error;
	}
}

/**
 * Get messages by session ID with pagination and filtering
 *
 * @param {string} sessionId - Session ID to fetch messages for
 * @param {object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 50, max: 100)
 * @param {string} options.sortOrder - Sort order (asc/desc, default: asc)
 * @param {string} options.since - ISO timestamp - only return messages after this time
 * @param {string} options.role - Filter by message role
 * @returns {Promise<object>} Paginated messages result
 */
async function getMessagesBySession(sessionId, options = {}) {
	try {
		const { page = 1, limit = 50, sortOrder = "asc", since, role } = options;

		// Cap limit at 100
		const cappedLimit = Math.min(limit, 100);

		const db = getFirestore();
		let query = db
			.collection(COLLECTION_NAME)
			.where("session_id", "==", sessionId);

		// Apply role filter if provided
		if (role) {
			query = query.where("role", "==", role);
		}

		// Apply timestamp filter if provided
		if (since) {
			const sinceDate = new Date(since);
			query = query.where("created_at", ">", sinceDate);
		}

		// Apply sorting
		query = query.orderBy("created_at", sortOrder);

		// Get all matching documents
		const snapshot = await query.get();
		let messages = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));

		// Calculate pagination
		const total = messages.length;
		const offset = (page - 1) * cappedLimit;
		const paginatedMessages = messages.slice(offset, offset + cappedLimit);

		// Sanitize data
		const sanitizedMessages = paginatedMessages.map(sanitizeMessage);

		return {
			data: sanitizedMessages,
			total,
			page,
			limit: cappedLimit,
			totalPages: Math.ceil(total / cappedLimit),
		};
	} catch (error) {
		logger.error("Failed to fetch messages by session", {
			error: error.message,
			sessionId,
		});
		throw error;
	}
}

/**
 * Get recent messages for session (for NOVA context building)
 *
 * @param {string} sessionId - Session ID
 * @param {number} limit - Number of recent messages to fetch (default: 10)
 * @returns {Promise<array>} Array of recent messages
 */
async function getRecentMessages(sessionId, limit = 10) {
	try {
		const db = getFirestore();
		const snapshot = await db
			.collection(COLLECTION_NAME)
			.where("session_id", "==", sessionId)
			.orderBy("created_at", "desc")
			.limit(limit)
			.get();

		const messages = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));

		// Return in chronological order (oldest first) for context building
		return messages.reverse().map(sanitizeMessage);
	} catch (error) {
		logger.error("Failed to fetch recent messages", {
			error: error.message,
			sessionId,
		});
		throw error;
	}
}

/**
 * Get message by ID
 *
 * @param {string} id - Message ID
 * @returns {Promise<object|null>} Message document or null if not found
 */
async function getById(id) {
	try {
		const db = getFirestore();
		const doc = await db.collection(COLLECTION_NAME).doc(id).get();

		if (!doc.exists) return null;

		return sanitizeMessage({ id: doc.id, ...doc.data() });
	} catch (error) {
		logger.error("Failed to fetch message by ID", { error: error.message, id });
		throw error;
	}
}

/**
 * Delete all messages for a session (for cleanup)
 *
 * @param {string} sessionId - Session ID
 * @param {object} metadata - Delete metadata
 * @returns {Promise<number>} Number of deleted messages
 */
async function deleteBySession(sessionId, metadata = {}) {
	try {
		const db = getFirestore();
		const snapshot = await db
			.collection(COLLECTION_NAME)
			.where("session_id", "==", sessionId)
			.get();

		const batch = db.batch();
		snapshot.docs.forEach((doc) => {
			batch.delete(doc.ref);
		});

		await batch.commit();

		logger.info("AI messages deleted for session", {
			sessionId,
			count: snapshot.size,
			deletedBy: metadata.deletedBy,
		});

		return snapshot.size;
	} catch (error) {
		logger.error("Failed to delete messages for session", {
			error: error.message,
			sessionId,
		});
		throw error;
	}
}

/**
 * Count messages in a session
 *
 * @param {string} sessionId - Session ID
 * @returns {Promise<number>} Message count
 */
async function countBySession(sessionId) {
	try {
		const db = getFirestore();
		const snapshot = await db
			.collection(COLLECTION_NAME)
			.where("session_id", "==", sessionId)
			.count()
			.get();

		return snapshot.data().count;
	} catch (error) {
		logger.error("Failed to count messages", {
			error: error.message,
			sessionId,
		});
		throw error;
	}
}

/**
 * Count hints provided in a session (messages with hint_type set)
 *
 * @param {string} sessionId - Session ID
 * @returns {Promise<number>} Hint count
 */
async function countHintsBySession(sessionId) {
	try {
		const db = getFirestore();
		const snapshot = await db
			.collection(COLLECTION_NAME)
			.where("session_id", "==", sessionId)
			.where("role", "==", "assistant")
			.where("hint_type", "!=", null)
			.count()
			.get();

		return snapshot.data().count;
	} catch (error) {
		logger.error("Failed to count hints", { error: error.message, sessionId });
		throw error;
	}
}

/**
 * Sanitize message document for API response
 * Converts Firestore timestamps to ISO strings
 */
function sanitizeMessage(message) {
	const sanitized = { ...message };

	if (sanitized.created_at?.toDate) {
		sanitized.created_at = sanitized.created_at.toDate().toISOString();
	}
	if (sanitized.updated_at?.toDate) {
		sanitized.updated_at = sanitized.updated_at.toDate().toISOString();
	}

	return sanitized;
}

module.exports = {
	addMessage,
	getMessagesBySession,
	getRecentMessages,
	getById,
	deleteBySession,
	countBySession,
	countHintsBySession,
};
