"use client"

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
  // Step 1: Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  
  // Step 2: Update display name if provided
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName })
  }
  
  // Step 3: Create user profile via backend API (includes validation & audit logging)
  if (userCredential.user) {
    try {
      await apiAuthService.registerUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: displayName || "",
        callSign: callSign || ""
      })
    } catch (error) {
      // If backend profile creation fails, we should clean up the Firebase Auth user
      console.error('Failed to create user profile:', error)
      // Note: In production, you might want to delete the auth user here
      throw new Error(`Registration failed: ${error.message}`)
    }
  }
  
  return userCredential.user
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
      await apiAuthService.syncGoogleProfile({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || "",
        photoURL: userCredential.user.photoURL || null
      })
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
