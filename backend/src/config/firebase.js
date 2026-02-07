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
    const isTest = process.env.NODE_ENV === 'test';
    const hasEmulators = !!(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST);

    // Test mode with emulators: No credentials needed, emulators handle everything
    if (isTest && hasEmulators) {
      logger.info('Using Firebase emulators for testing (no credentials required)', {
        projectId: process.env.FIREBASE_PROJECT_ID || 'test-project',
        firestoreEmulator: process.env.FIRESTORE_EMULATOR_HOST,
        authEmulator: process.env.FIREBASE_AUTH_EMULATOR_HOST,
      });
      
    // Test mode without emulators: Skip Firebase initialization entirely
    if (isTest && !hasEmulators) {
      logger.warn('Skipping Firebase initialization in test environment (no emulators, no credentials)', {
        nodeEnv: process.env.NODE_ENV,
        hasEmulators,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      });
      
      // Mark as initialized to prevent repeated attempts
      isInitialized = true;
      
      // Return admin object with mock methods to prevent crashes
      return {
        ...admin,
        initializeApp: () => {}, // No-op
        firestore: () => ({
          collection: () => ({
            doc: () => ({
              get: () => Promise.resolve({ exists: false, data: () => null }),
              set: () => Promise.resolve(),
              update: () => Promise.resolve(),
              delete: () => Promise.resolve(),
            }),
            where: () => ({
              get: () => Promise.resolve({ empty: true, docs: [] }),
            }),
            get: () => Promise.resolve({ empty: true, docs: [] }),
            add: () => Promise.resolve({ id: 'mock-doc-id' }),
          }),
        }),
        auth: () => ({
          verifyIdToken: () => Promise.reject(new Error('Firebase auth not available in test mode')),
          createCustomToken: () => Promise.reject(new Error('Firebase auth not available in test mode')),
        }),
      };
    }
    
    // Production mode: Always use Application Default Credentials
    // Firebase App Hosting / Cloud Run provides credentials automatically
    else if (isProduction) {
      logger.info('Using Application Default Credentials for Firebase Admin (production)', {
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
    // Development mode: Use explicit service account credentials
    else {
      // Development mode: use explicit service account credentials
      // Validate required credentials before attempting initialization
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY
          .replace(/\\n/g, '\n')
          .replace(/^"|"$/g, '')
        : null;

      if (!privateKey || typeof privateKey !== 'string' || privateKey.trim() === '') {
        const errorMsg = [
          '❌ Firebase Service Account Credentials Missing or Invalid',
          '',
          'FIREBASE_PRIVATE_KEY is required but not properly set.',
          '',
          'Please ensure:',
          ' 1. FIREBASE_PRIVATE_KEY is set in your environment',
          ' 2. The private key is properly formatted (including \\n for newlines)',
          ' 3. The key is enclosed in quotes if it contains special characters',
          '',
          'For production deployment, consider using Application Default Credentials',
          'by NOT setting FIREBASE_PRIVATE_KEY in production environment.',
          '',
          'See FIREBASE_SETUP.md for configuration instructions.',
        ].join('\n');
        
        logger.error('Firebase private key validation failed', {
          hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
          privateKeyType: typeof privateKey,
          isEmpty: privateKey ? privateKey.trim() === '' : true,
        });
        
        throw new Error(errorMsg);
      }

      if (!process.env.FIREBASE_CLIENT_EMAIL) {
        throw new Error('FIREBASE_CLIENT_EMAIL is required for service account authentication');
      }

      if (!process.env.FIREBASE_PROJECT_ID) {
        throw new Error('FIREBASE_PROJECT_ID is required for Firebase initialization');
      }

      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || undefined,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID || undefined,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url:
          'https://www.googleapis.com/oauth2/v1/certs',
        universe_domain: 'googleapis.com',
      };

      logger.info('Using service account credentials for Firebase Admin', {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
      });

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
