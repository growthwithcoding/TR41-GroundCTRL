/**
 * Firebase Client SDK Configuration
 * Initializes Firebase for frontend React application
 */
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate required Firebase environment variables before initialization
const requiredFirebaseConfigKeys = ["apiKey", "authDomain", "appId", "projectId"];
const firebaseConfigKeyToEnvVar = {
  apiKey: "VITE_FIREBASE_API_KEY",
  authDomain: "VITE_FIREBASE_AUTH_DOMAIN",
  appId: "VITE_FIREBASE_APP_ID",
  projectId: "VITE_FIREBASE_PROJECT_ID",
};

const missingFirebaseEnvVars = requiredFirebaseConfigKeys
  .filter((key) => !firebaseConfig[key])
  .map((key) => firebaseConfigKeyToEnvVar[key]);

if (missingFirebaseEnvVars.length > 0) {
  throw new Error(
    `Missing Firebase environment variables: ${missingFirebaseEnvVars.join(
      ", "
    )}. Please define them in your Vite environment file (e.g. .env.local), using the .env.example file in the repository as a reference for the required variables.`
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
