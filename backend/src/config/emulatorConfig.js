/**
 * Firebase Emulator Configuration
 * Detects if emulators should be used and exports environment settings
 */

// Require Firebase Project ID - never default to production
if (!process.env.FIREBASE_PROJECT_ID) {
  throw new Error(
    'FIREBASE_PROJECT_ID environment variable must be set. Refusing to default to a production project ID.'
  );
}

const config = {
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  useEmulators:
    !!process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    !!process.env.FIRESTORE_EMULATOR_HOST,
  
  // Emulator host configurations
  authEmulatorHost: process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099',
  firestoreEmulatorHost: process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080'
};

module.exports = config;
