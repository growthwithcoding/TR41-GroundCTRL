import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth"
import { auth } from "./config"
import * as apiAuthService from '../api/authService'

// Google Auth Provider
const googleProvider = new GoogleAuthProvider()

/**
 * Firebase Authentication Utilities
 * 
 * SECURITY: User profile creation goes through backend API for:
 * - CallSign uniqueness validation
 * - Data validation
 * - Audit logging
 */

// Sign up with email and password
export async function signUp(email, password, displayName, callSign) {
  // Let backend handle everything: Firebase Auth user creation + Firestore document
  // This ensures atomic operation and proper validation
  try {
    await apiAuthService.registerUser({
      email,
      password,
      displayName: displayName || "",
      callSign: callSign || ""
    })
    
    // After backend creates user, sign in to get Firebase Auth session
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    
    return userCredential.user
  } catch (error) {
    console.error('Registration failed:', error)
    throw new Error(error.message || 'Registration failed')
  }
}

// Sign in with email and password
export async function signIn(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

// Sign in with Google
export async function signInWithGoogle() {
  const userCredential = await signInWithPopup(auth, googleProvider)
  
  // Sync user profile with backend (creates if new, updates if existing)
  if (userCredential.user) {
    try {
      // Get Firebase ID token to send with request
      const idToken = await userCredential.user.getIdToken()
      
      // SECURITY: Backend uses authenticated UID from token, not from request body
      await apiAuthService.syncGoogleProfile({
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || "",
        photoURL: userCredential.user.photoURL || null
      }, idToken)
    } catch (error) {
      // Log error but don't block sign-in
      console.error('Failed to sync Google profile with backend:', error)
      // User is still signed in with Firebase, just missing backend profile sync
    }
  }
  
  return userCredential.user
}

// Sign out
export async function signOut() {
  await firebaseSignOut(auth)
}

// Send password reset email
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email)
}

// Get current user
export function getCurrentUser() {
  return auth.currentUser
}

// Subscribe to auth state changes
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}
