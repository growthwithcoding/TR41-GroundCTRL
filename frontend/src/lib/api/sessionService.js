/**
 * Session API Service
 * Handles scenario session operations via backend API
 */

import api from './httpClient'

/**
 * Create a new scenario session via backend API
 * @param {object} sessionData - Session data
 * @returns {Promise<string>} Session ID
 */
export async function createSession(sessionData) {
  try {
    const response = await api.post('/scenario-sessions', sessionData)
    
    // Backend returns: { success: true, payload: { id: '...', ...sessionData } }
    return response.payload?.id || response.id
  } catch (error) {
    console.error('Failed to create session:', error)
    throw new Error(error.message || 'Failed to create training session')
  }
}

/**
 * Update an existing session via backend API
 * @param {string} sessionId - Session ID
 * @param {object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateSession(sessionId, updates) {
  try {
    await api.patch(`/scenario-sessions/${sessionId}`, updates)
  } catch (error) {
    console.error('Failed to update session:', error)
    throw new Error(error.message || 'Failed to update session')
  }
}

/**
 * Mark a session as in progress
 * @param {string} sessionId - Session ID
 * @returns {Promise<void>}
 */
export async function markSessionInProgress(sessionId) {
  return updateSession(sessionId, {
    status: 'IN_PROGRESS',
  })
}

/**
 * Save session progress (steps completed, responses, etc.)
 * @param {string} sessionId - Session ID
 * @param {object} progressData - Progress data to save
 * @returns {Promise<void>}
 */
export async function saveSessionProgress(sessionId, progressData) {
  return updateSession(sessionId, progressData)
}

/**
 * Mark a session as complete
 * @param {string} sessionId - Session ID
 * @param {object} completionData - Completion data (score, time, etc.)
 * @returns {Promise<void>}
 */
export async function completeSession(sessionId, completionData) {
  return updateSession(sessionId, {
    status: 'COMPLETED',
    ...completionData,
  })
}

/**
 * Get a specific session by ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<object>} Session data
 */
export async function getSession(sessionId) {
  try {
    const response = await api.get(`/scenario-sessions/${sessionId}`)
    return response.payload || response
  } catch (error) {
    console.error('Failed to get session:', error)
    throw new Error(error.message || 'Failed to retrieve session')
  }
}

/**
 * Get all sessions for the current user
 * @param {object} filters - Optional filters (scenario_id, status, etc.)
 * @returns {Promise<Array>} Array of sessions
 */
export async function getUserSessions(filters = {}) {
  try {
    const queryParams = new URLSearchParams(filters).toString()
    const endpoint = queryParams ? `/scenario-sessions?${queryParams}` : '/scenario-sessions'
    
    const response = await api.get(endpoint)
    return response.payload || response
  } catch (error) {
    console.error('Failed to get user sessions:', error)
    throw new Error(error.message || 'Failed to retrieve sessions')
  }
}
