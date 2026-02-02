/**
 * Auth API Service
 * Handles user authentication and profile operations via backend API
 */

import api, { setBackendTokens } from './httpClient'

/**
 * Login with email and password via backend
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} Backend JWT tokens and user data
 */
export async function loginWithCredentials(email, password) {
  try {
    const response = await api.post('/auth/login', { email, password }, {}, false)
    console.log('Raw login response:', response)
    
    // Extract tokens from nested structure
    const payload = response.payload || response
    const tokens = payload.tokens || {}
    const user = payload.user || {}
    
    return {
      ...payload,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user
    }
  } catch (error) {
    console.error('Failed to login:', error)
    throw new Error(error.message || 'Failed to authenticate')
  }
}

/**
 * Exchange Firebase token for backend JWT
 * @param {string} firebaseToken - Firebase ID token
 * @returns {Promise<object>} Backend JWT tokens
 */
export async function loginWithFirebaseToken(firebaseToken) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'}/auth/exchange-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firebaseToken}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.brief || error.message || 'Failed to exchange token with backend')
    }
    
    const data = await response.json()
    // Backend returns: { status: 'GO', payload: { data: { user, tokens: { accessToken, refreshToken } } } }
    const result = data.payload?.data || data.payload || data
    return result
  } catch (error) {
    console.error('Failed to exchange Firebase token:', error)
    throw new Error(error.message || 'Failed to authenticate with backend')
  }
}

/**
 * Register a new user via backend API
 * @param {object} userData - User registration data
 * @returns {Promise<object>} User data with tokens
 */
export async function registerUser(userData) {
  try {
    const response = await api.post('/auth/register', userData, {}, false)
    

    // Registration doesn't require authentication (user doesn't exist yet)

    return response.payload || response.user
  } catch (error) {
    console.error('Failed to register user:', error)
    throw new Error(error.message || 'Failed to register user')
  }
}

/**
 * Create/update user profile after Google sign-in
 * Exchanges Firebase ID token for backend JWT tokens
 * @param {object} profileData - User profile data from Google
 * @param {string} idToken - Firebase ID token for authentication
 * @returns {Promise<object>} User data
 */
export async function syncGoogleProfile(profileData, idToken) {
  try {
    // Use dedicated OAuth profile sync endpoint with Firebase ID token for authentication
    const response = await api.post('/auth/sync-oauth-profile', profileData, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    })
    
    // Extract response data
    const data = response.payload?.data || response
    
    // Store backend JWT tokens for subsequent requests
    if (data.accessToken && data.refreshToken) {
      setBackendTokens(data.accessToken, data.refreshToken)
      console.log('✅ Backend JWT tokens stored after OAuth sync')
    } else {
      console.warn('⚠️ No JWT tokens received from sync endpoint')
    }
    
    // Return user data
    return data.user || data
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
