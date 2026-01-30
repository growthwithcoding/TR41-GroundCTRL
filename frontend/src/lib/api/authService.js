/**
 * Auth API Service
 * Handles user authentication and profile operations via backend API
 */

import api from './httpClient'

/**
 * Exchange Firebase token for backend JWT
 * @param {string} firebaseToken - Firebase ID token
 * @returns {Promise<object>} Backend JWT tokens
 */
export async function loginWithFirebaseToken(firebaseToken) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firebaseToken}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to login with backend')
    }
    
    const data = await response.json()
    return data.payload || data
  } catch (error) {
    console.error('Failed to exchange Firebase token:', error)
    throw new Error(error.message || 'Failed to authenticate with backend')
  }
}

/**
 * Register a new user via backend API
 * @param {object} userData - User registration data
 * @returns {Promise<object>} User data
 */
export async function registerUser(userData) {
  try {
    const response = await api.post('/auth/register', userData, {}) // Uses standard API client configuration
    return response.payload || response.user
  } catch (error) {
    console.error('Failed to register user:', error)
    throw new Error(error.message || 'Failed to register user')
  }
}

/**
 * Create/update user profile after Google sign-in
 * @param {object} profileData - User profile data from Google
 * @returns {Promise<object>} User data
 */
export async function syncGoogleProfile(profileData) {
  try {
    // Register Google user via backend (no password for OAuth users)
    const response = await api.post('/auth/register', profileData)
    return response.payload || response.user
  } catch (error) {
    console.error('Failed to sync Google profile:', error)
    throw new Error(error.message || 'Failed to sync user profile')
  }
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {object} updates - Profile updates
 * @returns {Promise<object>} Updated user data
 */
export async function updateUserProfile(userId, updates) {
  try {
    const response = await api.patch(`/users/${userId}`, updates)
    return response.payload || response.user
  } catch (error) {
    console.error('Failed to update user profile:', error)
    throw new Error(error.message || 'Failed to update profile')
  }
}

/**
 * Get current user profile
 * @returns {Promise<object>} User data
 */
export async function getCurrentUser() {
  try {
    const response = await api.get('/auth/me')
    return response.payload || response.user
  } catch (error) {
    console.error('Failed to get current user:', error)
    throw new Error(error.message || 'Failed to retrieve user data')
  }
}
