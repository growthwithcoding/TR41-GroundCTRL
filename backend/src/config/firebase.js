/**
 * Firebase Admin SDK Configuration
 * Initializes Firebase Admin for Firestore and Auth operations
 */

const admin = require('firebase-admin');
const logger = require('../utils/logger');

let isInitialized = false;

/**
 * Validates that emulator environment variables are not set in production.
 * Also logs emulator config in non-production.
 * @throws {Error} If emulator variables are set when NODE_ENV is 'production'
 */
function validateEmulatorConfiguration() {
  const isProduction = process.env.NODE_ENV === 'production';
  const hasAuthEmulator = !!process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const hasFirestoreEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

  if (isProduction && (hasAuthEmulator || hasFirestoreEmulator)) {
    const emulatorVars = [];
    if (hasAuthEmulator) {
      emulatorVars.push(
        `FIREBASE_AUTH_EMULATOR_HOST=${process.env.FIREBASE_AUTH_EMULATOR_HOST}`,
      );
    }
    if (hasFirestoreEmulator) {
      emulatorVars.push(
        `FIRESTORE_EMULATOR_HOST=${process.env.FIRESTORE_EMULATOR_HOST}`,
      );
    }

    const errorMessage = [
      '🚨 PRODUCTION DEPLOYMENT BLOCKED: Firebase Emulator Variables Detected',
      '',
      'The following emulator environment variables are set:',
      ...emulatorVars.map((v) => ` • ${v}`),
      '',
      'These variables MUST NOT be set in production as they would route',
      'all Firebase traffic to non-existent local emulators.',
      '',
      'To fix this:',
      ' 1. Remove FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST from your production environment',
      ' 2. Ensure these variables are NOT in backend/apphosting.yaml',
      ' 3. These variables should ONLY be set in your local .env file for development',
      '',
      'See PRODUCTION_DEPLOYMENT.md for deployment guidelines.',
    ].join('\n');

    logger.error('Firebase emulator configuration error in production', {
      environment: process.env.NODE_ENV,
      emulatorVars,
    });

    throw new Error(errorMessage);
  }

  // Log emulator status for development environments
  if (!isProduction && (hasAuthEmulator || hasFirestoreEmulator)) {
    logger.info('🔧 Firebase Emulators Configured', {
      authEmulator: process.env.FIREBASE_AUTH_EMULATOR_HOST || 'not set',
      firestoreEmulator: process.env.FIRESTORE_EMULATOR_HOST || 'not set',
    });
  }
}

/**
 * Initialize Firebase Admin SDK with service account credentials.
 * Uses Application Default Credentials in Firebase App Hosting/Cloud Run.
 * @returns {typeof admin} Firebase Admin instance
 */
function initializeFirebase() {
  if (isInitialized) {
    return admin;
  }

  // Validate emulator configuration before initializing
  validateEmulatorConfiguration();

  // Sanitize API Key if it has quotes (common .env mistake)
  if (process.env.FIREBASE_API_KEY) {
    process.env.FIREBASE_API_KEY = process
      .env
      .FIREBASE_API_KEY
      .replace(/^"|"$/g, '');
  }

  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;

    // In production (Firebase App Hosting/Cloud Run), use Application Default Credentials
    // In development, use service account credentials from environment variables
    if (isProduction && !hasPrivateKey) {
      // Firebase App Hosting provides credentials automatically via ADC
      logger.info('Using Application Default Credentials for Firebase Admin');
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      // Development mode: use explicit service account credentials
      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || undefined,
        private_key: process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY
            .replace(/\\n/g, '\n')
            .replace(/^"|"$/g, '')
          : undefined,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID || undefined,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url:
          'https://www.googleapis.com/oauth2/v1/certs',
        universe_domain: 'googleapis.com',
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    // Point Admin SDK at emulators when variables are set
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
      admin.firestore().settings({
        host: `${host}:${port}`,
        ssl: false,
      });
    }

    if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      // Admin SDK uses env var for Auth emulator; no extra code required,
      // but keep this branch for explicit logging if needed later.
      logger.info('Auth emulator host detected for Admin SDK', {
        host: process.env.FIREBASE_AUTH_EMULATOR_HOST,
      });
    }

    isInitialized = true;
    console.log('🔥 Firebase Admin SDK initialized successfully');

    return admin;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
}

/**
 * Get Firebase Admin instance.
 * @returns {typeof admin} Firebase Admin instance
 */
function getFirebaseAdmin() {
  if (!isInitialized) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return admin;
}

/**
 * Get Firestore database instance.
 * @returns {import('firebase-admin').firestore.Firestore} Firestore instance
 */
function getFirestore() {
  return getFirebaseAdmin().firestore();
}

/**
 * Get Firebase Auth instance.
 * @returns {import('firebase-admin').auth.Auth} Auth instance
 */
function getAuth() {
  return getFirebaseAdmin().auth();
}

module.exports = {
  initializeFirebase,
  getFirebaseAdmin,
  getFirestore,
  getAuth,
};
