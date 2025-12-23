/**
 * Token Blacklist Repository
 * Handles persistence of revoked JWT tokens to Firebase Firestore
 */

const crypto = require('crypto');
const { getFirestore } = require('../config/firebase');
const logger = require('../utils/logger');

const COLLECTION_NAME = 'token_blacklist';

/**
 * Hash token for storage
 * @param {string} token - JWT token
 * @returns {string} SHA-256 hash of token
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Add token to blacklist
 * @param {string} token - JWT token to blacklist
 * @param {Date} expiresAt - Token expiry date
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} Blacklist entry
 */
async function addToBlacklist(token, expiresAt, metadata = {}) {
  try {
    const db = getFirestore();
    const tokenHash = hashToken(token);
    
    const entry = {
      tokenHash,
      expiresAt,
      revokedAt: new Date(),
      userId: metadata.userId || null,
      callSign: metadata.callSign || null,
      reason: metadata.reason || 'manual_revocation'
    };
    
    await db.collection(COLLECTION_NAME).doc(tokenHash).set(entry);
    
    logger.info('Token added to blacklist', { tokenHash, userId: metadata.userId });
    
    return entry;
  } catch (error) {
    logger.error('Failed to add token to blacklist', { error: error.message });
    throw error;
  }
}

/**
 * Check if token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {Promise<boolean>} True if token is blacklisted
 */
async function isTokenBlacklisted(token) {
  try {
    const db = getFirestore();
    const tokenHash = hashToken(token);
    
    const doc = await db.collection(COLLECTION_NAME).doc(tokenHash).get();
    
    if (!doc.exists) {
      return false;
    }
    
    // Check if token has expired (can be cleaned up)
    const data = doc.data();
    if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
      // Token expired, can be removed from blacklist
      await db.collection(COLLECTION_NAME).doc(tokenHash).delete();
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Failed to check token blacklist', { error: error.message });
    // Fail closed - if we can't check, treat as blacklisted
    return true;
  }
}

/**
 * Remove token from blacklist (usually for expired tokens)
 * @param {string} token - JWT token to remove
 * @returns {Promise<void>}
 */
async function removeFromBlacklist(token) {
  try {
    const db = getFirestore();
    const tokenHash = hashToken(token);
    
    await db.collection(COLLECTION_NAME).doc(tokenHash).delete();
    
    logger.debug('Token removed from blacklist', { tokenHash });
  } catch (error) {
    logger.error('Failed to remove token from blacklist', { error: error.message });
    throw error;
  }
}

/**
 * Revoke all tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of tokens revoked
 */
async function revokeAllUserTokens(userId) {
  try {
    const db = getFirestore();
    
    const snapshot = await db.collection(COLLECTION_NAME)
      .where('userId', '==', userId)
      .get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    logger.info('All user tokens revoked', { userId, count: snapshot.size });
    
    return snapshot.size;
  } catch (error) {
    logger.error('Failed to revoke all user tokens', { error: error.message, userId });
    throw error;
  }
}

/**
 * Clean up expired tokens from blacklist
 * @returns {Promise<number>} Number of tokens cleaned up
 */
async function cleanupExpiredTokens() {
  try {
    const db = getFirestore();
    const now = new Date();
    
    const snapshot = await db.collection(COLLECTION_NAME)
      .where('expiresAt', '<', now)
      .get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    logger.info('Expired tokens cleaned up', { count: snapshot.size });
    
    return snapshot.size;
  } catch (error) {
    logger.error('Failed to cleanup expired tokens', { error: error.message });
    throw error;
  }
}

/**
 * Get blacklisted tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<array>} Array of blacklisted tokens
 */
async function getBlacklistedTokensByUser(userId) {
  try {
    const db = getFirestore();
    
    const snapshot = await db.collection(COLLECTION_NAME)
      .where('userId', '==', userId)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    logger.error('Failed to fetch blacklisted tokens', { error: error.message, userId });
    throw error;
  }
}

module.exports = {
  addToBlacklist,
  isTokenBlacklisted,
  removeFromBlacklist,
  revokeAllUserTokens,
  cleanupExpiredTokens,
  getBlacklistedTokensByUser
};
