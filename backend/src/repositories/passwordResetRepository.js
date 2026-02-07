/**
 * Password Reset Repository
 * Handles password reset token persistence
 */

const { getFirestore } = require("../config/firebase");
const logger = require("../utils/logger");

const COLLECTION_NAME = "password_reset_tokens";

/**
 * Create password reset token
 * @param {string} userId - User ID
 * @param {string} token - Reset token
 * @param {Date} expiresAt - Token expiry date
 * @returns {Promise<string>} Token document ID
 */
async function createResetToken(userId, token, expiresAt) {
	try {
		const db = getFirestore();
		const docData = {
			userId,
			token,
			expiresAt,
			used: false,
			createdAt: new Date(),
		};

		const docRef = await db.collection(COLLECTION_NAME).add(docData);
		logger.info("Password reset token created", { userId, tokenId: docRef.id });

		return docRef.id;
	} catch (error) {
		logger.error("Failed to create password reset token", {
			error: error.message,
			userId,
		});
		throw error;
	}
}

/**
 * Get password reset token by token string
 * @param {string} token - Reset token
 * @returns {Promise<object|null>} Token document or null
 */
async function getResetToken(token) {
	try {
		const db = getFirestore();
		const snapshot = await db
			.collection(COLLECTION_NAME)
			.where("token", "==", token)
			.limit(1)
			.get();

		if (snapshot.empty) {
			return null;
		}

		const doc = snapshot.docs[0];
		const data = doc.data();

		// Convert Firestore Timestamp to Date
		return {
			id: doc.id,
			...data,
			expiresAt: data.expiresAt.toDate
				? data.expiresAt.toDate()
				: data.expiresAt,
			createdAt: data.createdAt.toDate
				? data.createdAt.toDate()
				: data.createdAt,
		};
	} catch (error) {
		logger.error("Failed to get password reset token", {
			error: error.message,
		});
		throw error;
	}
}

/**
 * Mark password reset token as used
 * @param {string} token - Reset token
 * @returns {Promise<void>}
 */
async function markTokenAsUsed(token) {
	try {
		const db = getFirestore();
		const snapshot = await db
			.collection(COLLECTION_NAME)
			.where("token", "==", token)
			.limit(1)
			.get();

		if (snapshot.empty) {
			throw new Error("Token not found");
		}

		const doc = snapshot.docs[0];
		await db.collection(COLLECTION_NAME).doc(doc.id).update({
			used: true,
			usedAt: new Date(),
		});

		logger.info("Password reset token marked as used", { tokenId: doc.id });
	} catch (error) {
		logger.error("Failed to mark token as used", { error: error.message });
		throw error;
	}
}

/**
 * Delete expired reset tokens (cleanup)
 * @returns {Promise<number>} Number of tokens deleted
 */
async function deleteExpiredTokens() {
	try {
		const db = getFirestore();
		const now = new Date();

		const snapshot = await db
			.collection(COLLECTION_NAME)
			.where("expiresAt", "<", now)
			.get();

		const batch = db.batch();
		snapshot.docs.forEach((doc) => {
			batch.delete(doc.ref);
		});

		await batch.commit();

		logger.info("Expired password reset tokens deleted", {
			count: snapshot.size,
		});
		return snapshot.size;
	} catch (error) {
		logger.error("Failed to delete expired tokens", { error: error.message });
		throw error;
	}
}

module.exports = {
	createResetToken,
	getResetToken,
	markTokenAsUsed,
	deleteExpiredTokens,
};
