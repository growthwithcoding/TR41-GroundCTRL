"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthChange, signIn, signUp, signOut, resetPassword, signInWithGoogle } from "@/lib/firebase/auth"
import { fetchUserProfile } from "@/lib/firebase/userProfile"
import { loginWithFirebaseToken } from "@/lib/api/authService"
import { setBackendTokens, clearBackendTokens } from "@/lib/api/httpClient"
import { auth } from "@/lib/firebase/config"

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore
          const profile = await fetchUserProfile(firebaseUser.uid)
          setUser({ 
            ...firebaseUser, 
            callSign: profile?.callSign || "",
            isAdmin: profile?.isAdmin || false
          })
          
          console.log('✅ Authenticated with Firebase', { isAdmin: profile?.isAdmin })
          
          // Exchange Firebase ID token for backend JWT tokens
          try {
            const firebaseIdToken = await firebaseUser.getIdToken()
            const backendResponse = await loginWithFirebaseToken(firebaseIdToken)
            
            // Extract tokens from response structure: { user: {...}, tokens: { accessToken, refreshToken } }
            const accessToken = backendResponse.tokens?.accessToken || backendResponse.accessToken
            const refreshToken = backendResponse.tokens?.refreshToken || backendResponse.refreshToken
            
            // Store backend JWT tokens
            if (accessToken && refreshToken) {
              setBackendTokens(accessToken, refreshToken)
              console.log('✅ Backend JWT tokens obtained and stored')
            } else {
              console.warn('⚠️ Backend login successful but no tokens received:', backendResponse)
            }
          } catch (tokenError) {
            console.error('❌ Failed to exchange Firebase token for backend JWT:', tokenError)
            // Don't throw - user is still authenticated with Firebase
            // They can still view pages, just API calls will fail until they refresh
          }
        } catch (e) {
          console.error('Failed to fetch profile:', e)
          setUser({ ...firebaseUser, callSign: "", isAdmin: false })
        }
      } else {
        setUser(null)
        clearBackendTokens()
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleSignIn = async (email, password) => {
    try {
      setError(null)
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in")
      throw err
    }
  }

  const handleSignUp = async (email, password, displayName, callSign) => {
    try {
      setError(null)
      await signUp(email, password, displayName, callSign)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up")
      throw err
    }
  }

  const handleSignInWithGoogle = async () => {
    try {
      setError(null)
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google")
      throw err
    }
  }

  const handleSignOut = async () => {
    try {
      setError(null)
      clearBackendTokens()
      await signOut()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign out")
      throw err
    }
  }

  const handleResetPassword = async (email) => {
    try {
      setError(null)
      await resetPassword(email)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email")
      throw err
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signInWithGoogle: handleSignInWithGoogle,
        signOut: handleSignOut,
        resetPassword: handleResetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
