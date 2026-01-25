"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthChange, signIn, signUp, signOut, resetPassword, signInWithGoogle } from "@/lib/firebase/auth"

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user)
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
