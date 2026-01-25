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
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "./config"

// Google Auth Provider
const googleProvider = new GoogleAuthProvider()

/**
 * Firebase Authentication Utilities
 */

// Sign up with email and password
export async function signUp(email, password, displayName, callSign) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  
  // Update display name if provided
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName })
  }
  
  // Store user profile in Firestore including callSign
  if (userCredential.user) {
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: userCredential.user.email,
      displayName: displayName || "",
      callSign: callSign || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      missionProgress: {},
      achievements: [],
      totalMissionPoints: 0
    })
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
  
  // Check if this is a new user and create profile if needed
  if (userCredential.user) {
    const userDoc = doc(db, "users", userCredential.user.uid)
    // Only create profile for new users (Google sign-in doesn't have additionalUserInfo easily accessible)
    // We'll use a simpler approach - try to set with merge
    await setDoc(userDoc, {
      email: userCredential.user.email,
      displayName: userCredential.user.displayName || "",
      callSign: "", // Users can set this later in their profile
      updatedAt: serverTimestamp(),
    }, { merge: true })
    
    // Set createdAt only if it doesn't exist (new user)
    await setDoc(userDoc, {
      createdAt: serverTimestamp(),
      missionProgress: {},
      achievements: [],
      totalMissionPoints: 0
    }, { merge: true, mergeFields: ["createdAt", "missionProgress", "achievements", "totalMissionPoints"] })
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
