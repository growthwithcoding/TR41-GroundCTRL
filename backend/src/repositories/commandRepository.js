/**
 * Command Repository
 *
 * Handles persistence of user command data to Firebase Firestore
 */

const { getFirestore } = require("../config/firebase");
const logger = require("../utils/logger");

const COLLECTION_NAME = "user_commands";

/**
 * Get all commands with pagination, filtering, and sorting
 *
 * @param {object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @param {string} options.sortBy - Field to sort by
 * @param {string} options.sortOrder - Sort order (asc/desc)
 * @param {string} options.session_id - Filter by session (FK)
 * @param {string} options.scenario_step_id - Filter by step (FK)
 * @param {string} options.commandName - Filter by command name
 * @param {string} options.resultStatus - Filter by result status
 * @param {boolean} options.isValid - Filter by validity
 * @param {string} options.createdBy - Filter by creator (ownership scoping)
 * @returns {Promise} Paginated commands result
 */
async function getAll(options = {}) {
	try {
		const {
			page = 1,
			limit = 20,
			sortBy = "issuedAt",
			sortOrder = "desc",
			session_id,
			scenario_step_id,
			commandName,
			resultStatus,
			isValid,
			createdBy,
		} = options;

		const db = getFirestore();
		let query = db.collection(COLLECTION_NAME);

		// Apply filters (FKs use snake_case, other fields use camelCase)
		if (session_id) {
			query = query.where("session_id", "==", session_id);
		}
		if (scenario_step_id) {
			query = query.where("scenario_step_id", "==", scenario_step_id);
		}
		if (commandName) {
			query = query.where("commandName", "==", commandName);
		}
		if (resultStatus) {
			query = query.where("resultStatus", "==", resultStatus);
		}
		if (typeof isValid === "boolean") {
			query = query.where("isValid", "==", isValid);
		}
		if (createdBy) {
			query = query.where("createdBy", "==", createdBy);
		}

		// Apply sorting
		query = query.orderBy(sortBy, sortOrder);

		// Get all matching documents
		const snapshot = await query.get();
		let commands = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));

		// Calculate pagination
		const total = commands.length;
		const offset = (page - 1) * limit;
		const paginatedCommands = commands.slice(offset, offset + limit);

		// Sanitize data
		const sanitizedCommands = paginatedCommands.map(sanitizeCommand);

		return {
			data: sanitizedCommands,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	} catch (error) {
		logger.error("Failed to fetch all commands", { error: error.message });
		throw error;
	}
}

/**
 * Get command by ID
 */
async function getById(id, options = {}) {
	try {
		const db = getFirestore();
		const doc = await db.collection(COLLECTION_NAME).doc(id).get();

		if (!doc.exists) return null;

		const command = { id: doc.id, ...doc.data() };

		if (options.createdBy && command.createdBy !== options.createdBy) {
			return null;
		}

		return sanitizeCommand(command);
	} catch (error) {
		logger.error("Failed to fetch command by ID", { error: error.message, id });
		throw error;
	}
}

/**
 * Create new command
 */
async function create(data, metadata = {}) {
	try {
		const db = getFirestore();
		const now = new Date();
		const docData = {
			...data,
			issuedAt: data.issuedAt || now.toISOString(),
			createdAt: now,
			updatedAt: now,
			createdBy: metadata.createdBy || null,
			createdByCallSign: metadata.createdByCallSign || null,
		};

		const docRef = await db.collection(COLLECTION_NAME).add(docData);
		logger.info("Command created", {
			id: docRef.id,
			commandName: data.commandName,
			session_id: data.session_id,
		});

		return sanitizeCommand({ id: docRef.id, ...docData });
	} catch (error) {
		logger.error("Failed to create command", { error: error.message });
		throw error;
	}
}

/**
 * Update command (full replace)
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
		return sanitizeCommand({ id, ...docData });
	} catch (error) {
		logger.error("Failed to update command", { error: error.message, id });
		throw error;
	}
}

/**
 * Patch command (partial update)
 */
async function patch(id, updates, metadata = {}) {
	try {
		const db = getFirestore();
		const docData = {
			...updates,
			updatedAt: new Date(),
			updatedBy: metadata.updatedBy || null,
			updatedByCallSign: metadata.updatedByCallSign || null,
		};

		await db.collection(COLLECTION_NAME).doc(id).update(docData);
		const updated = await getById(id);
		return updated;
	} catch (error) {
		logger.error("Failed to patch command", { error: error.message, id });
		throw error;
	}
}

/**
 * Delete command
 */
async function deleteCommand(id, metadata = {}) {
	try {
		const db = getFirestore();
		await db.collection(COLLECTION_NAME).doc(id).delete();
		logger.info("Command deleted", { id, deletedBy: metadata.deletedBy });
	} catch (error) {
		logger.error("Failed to delete command", { error: error.message, id });
		throw error;
	}
}

/**
 * Get commands by session ID (for NOVA tutoring context)
 */
async function getBySessionId(sessionId, options = {}) {
	try {
		const db = getFirestore();
		let query = db
			.collection(COLLECTION_NAME)
			.where("session_id", "==", sessionId)
			.orderBy("issuedAt", "desc");

		if (options.limit) {
			query = query.limit(options.limit);
		}

		const snapshot = await query.get();
		const commands = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));

		return commands.map(sanitizeCommand);
	} catch (error) {
		logger.error("Failed to fetch commands by session", {
			error: error.message,
			sessionId,
		});
		throw error;
	}
}

/**
 * Get recent commands for user (for NOVA context)
 */
async function getRecentByUser(userId, limit = 10) {
	try {
		const db = getFirestore();
		const snapshot = await db
			.collection(COLLECTION_NAME)
			.where("createdBy", "==", userId)
			.orderBy("issuedAt", "desc")
			.limit(limit)
			.get();

		const commands = snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		}));

		return commands.map(sanitizeCommand);
	} catch (error) {
		logger.error("Failed to fetch recent commands for user", {
			error: error.message,
			userId,
		});
		throw error;
	}
}

function sanitizeCommand(command) {
	const sanitized = { ...command };
	if (sanitized.issuedAt?.toDate)
		sanitized.issuedAt = sanitized.issuedAt.toDate().toISOString();
	if (sanitized.createdAt?.toDate)
		sanitized.createdAt = sanitized.createdAt.toDate().toISOString();
	if (sanitized.updatedAt?.toDate)
		sanitized.updatedAt = sanitized.updatedAt.toDate().toISOString();
	return sanitized;
}

module.exports = {
	getAll,
	getById,
	create,
	update,
	patch,
	delete: deleteCommand,
	getBySessionId,
	getRecentByUser,
};
