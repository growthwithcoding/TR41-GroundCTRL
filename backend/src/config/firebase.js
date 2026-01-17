/**
 * Firebase Admin SDK Configuration
 * Initializes Firebase Admin for Firestore and Auth operations
 * Supports Firebase emulators for local testing
 */

const admin = require('firebase-admin');
const emulatorConfig = require('./emulatorConfig');
const logger = require('../utils/logger');

let isInitialized = false;
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Initialize Firebase Admin SDK with service account credentials
 * Automatically connects to emulators if environment variables are set
 * @returns {admin} Firebase Admin instance
 */
function initializeFirebase() {
  if (isInitialized) {
    return admin;
  }

  // Log emulator configuration if enabled (env vars should be set before app starts)
  if (emulatorConfig.useEmulators && !isProduction) {
    logger.info('🧪 Using Firebase emulators:', {
      auth: process.env.FIREBASE_AUTH_EMULATOR_HOST,
      firestore: process.env.FIRESTORE_EMULATOR_HOST
    });
  }

  // Sanitize API Key if it has quotes (common .env mistake)
  if (process.env.FIREBASE_API_KEY) {
    process.env.FIREBASE_API_KEY = process.env.FIREBASE_API_KEY.replace(/^"|"$/g, '');
  }

  try {
    // Use emulator-friendly initialization when using emulators
    if (emulatorConfig.useEmulators) {
      admin.initializeApp({
        projectId: emulatorConfig.firebaseProjectId
      });
    } else {
      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || undefined,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/^"|"$/g, ''),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID || undefined,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        universe_domain: 'googleapis.com'
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    // Configure Firestore to ignore undefined properties
    const db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true });
    
    isInitialized = true;
    
    if (!isProduction) {
      logger.info('🔥 Firebase Admin SDK initialized successfully');
    }
    
    return admin;
  } catch (error) {
    logger.error('❌ Firebase initialization failed:', { error: error.message });
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
}

/**
 * Get Firebase Admin instance
 * @returns {admin} Firebase Admin instance
 */
function getFirebaseAdmin() {
  if (!isInitialized) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return admin;
}

/**
 * Get Firestore database instance
 * @returns {admin.firestore.Firestore} Firestore instance
 */
function getFirestore() {
  return getFirebaseAdmin().firestore();
}

/**
 * Get Firebase Auth instance
 * @returns {admin.auth.Auth} Auth instance
 */
function getAuth() {
  return getFirebaseAdmin().auth();
}

module.exports = {
  initializeFirebase,
  getFirebaseAdmin,
  getFirestore,
  getAuth
};
