/**
 * HTTP Client for Backend API
 * Centralized fetch wrapper with authentication and error handling
 */

import { auth } from '../firebase/config'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'

// Store backend JWT tokens
let backendAccessToken = null
let backendRefreshToken = null

/**
 * Set backend JWT tokens after login
 */
export function setBackendTokens(accessToken, refreshToken) {
  backendAccessToken = accessToken
  backendRefreshToken = refreshToken
  // Store in localStorage for persistence
  if (accessToken) localStorage.setItem('backend_access_token', accessToken)
  if (refreshToken) localStorage.setItem('backend_refresh_token', refreshToken)
}

/**
 * Clear backend tokens on logout
 */
export function clearBackendTokens() {
  backendAccessToken = null
  backendRefreshToken = null
  localStorage.removeItem('backend_access_token')
  localStorage.removeItem('backend_refresh_token')
}

/**
 * Get backend access token (from memory or localStorage)
 */
export function getBackendAccessToken() {
  if (backendAccessToken) return backendAccessToken
  return localStorage.getItem('backend_access_token')
}

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.data = data
  }
}

/**
 * Make an authenticated API request with retry logic for rate limiting
 * @param {string} endpoint - API endpoint (e.g., '/users/123')
 * @param {object} options - Fetch options
 * @param {boolean} requiresAuth - Whether the request requires authentication (default: true)
 * @returns {Promise<any>} Response data
 */
export async function apiRequest(endpoint, options = {}, requiresAuth = true) {
  const url = `${API_BASE_URL}${endpoint}`
  const maxRetries = 3
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Add authentication token if required
    if (requiresAuth) {
      // Try to use backend JWT token first (preferred)
      const backendToken = getBackendAccessToken()
      
      if (backendToken) {
        console.log('Using backend JWT token:', backendToken.substring(0, 20) + '...')
        headers['Authorization'] = `Bearer ${backendToken}`
      } else {
        // Fallback to Firebase token
        const user = auth.currentUser
        if (!user) {
          throw new APIError('Not authenticated', 401, { brief: 'User not logged in' })
        }
        
        try {
          const firebaseToken = await user.getIdToken(true) // Force refresh
          console.log('Using Firebase token:', firebaseToken.substring(0, 20) + '...')
          headers['Authorization'] = `Bearer ${firebaseToken}`
        } catch (error) {
          console.error('Failed to get token:', error)
          throw new APIError('Failed to get auth token', 401, { brief: error.message })
        }
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // If rate limited (429), retry with exponential backoff
      if (response.status === 429 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff: 1s, 2s, 4s
        console.warn(`Rate limited (429), retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      // Parse response
      const data = await response.json().catch(() => ({}))

      // Handle non-OK responses
      if (!response.ok) {
        const errorMessage = data.brief || data.message || `Request failed with status ${response.status}`
        throw new APIError(errorMessage, response.status, data)
      }

      return data
    } catch (error) {
      // Re-throw APIError as-is
      if (error instanceof APIError) {
        throw error
      }

      // Network errors or other fetch errors - don't retry these
      throw new APIError(
        error.message || 'Network request failed',
        0,
        { brief: 'Failed to connect to backend API' }
      )
    }
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (endpoint, options = {}, requiresAuth = true) => 
    apiRequest(endpoint, { ...options, method: 'GET' }, requiresAuth),
  
  post: (endpoint, body, options = {}, requiresAuth = true) => 
    apiRequest(endpoint, { 
      ...options, 
      method: 'POST',
      body: JSON.stringify(body) 
    }, requiresAuth),
  
  patch: (endpoint, body, options = {}, requiresAuth = true) => 
    apiRequest(endpoint, { 
      ...options, 
      method: 'PATCH',
      body: JSON.stringify(body) 
    }, requiresAuth),
  
  put: (endpoint, body, options = {}, requiresAuth = true) => 
    apiRequest(endpoint, { 
      ...options, 
      method: 'PUT',
      body: JSON.stringify(body) 
    }, requiresAuth),
  
  delete: (endpoint, options = {}, requiresAuth = true) => 
    apiRequest(endpoint, { ...options, method: 'DELETE' }, requiresAuth),
}

export default api
