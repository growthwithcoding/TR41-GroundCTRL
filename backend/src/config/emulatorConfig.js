/**
 * Firebase Emulator Configuration
 * Detects if emulators should be used and exports environment settings
 */

const config = {
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "groundctrl-prod",
  useEmulators:
    !!process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    !!process.env.FIRESTORE_EMULATOR_HOST,
  
  // Emulator host configurations
  authEmulatorHost: process.env.FIREBASE_AUTH_EMULATOR_HOST || "localhost:9099",
  firestoreEmulatorHost: process.env.FIRESTORE_EMULATOR_HOST || "localhost:8080"
};

module.exports = config;
