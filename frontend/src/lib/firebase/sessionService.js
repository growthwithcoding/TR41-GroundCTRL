/**
 * Session Service
 * 
 * Handles fetching and managing scenario session data from Firestore.
 * Sessions contain a snapshot of scenario/satellite data at the time of creation,
 * ensuring that updates to the base scenario don't affect in-progress sessions.
 */

import { db } from './config'
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

const SESSIONS_COLLECTION = 'scenario_sessions'

/**
 * Fetch a session by ID
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object|null>} Session data or null if not found
 */
export async function fetchSessionById(sessionId) {
  try {
    const sessionDoc = await getDoc(doc(db, SESSIONS_COLLECTION, sessionId))
    
    if (!sessionDoc.exists()) {
      return null
    }
    
    const data = sessionDoc.data()
    
    return {
      id: sessionDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      startedAt: data.startedAt?.toDate?.() || data.startedAt,
      completedAt: data.completedAt?.toDate?.() || data.completedAt
    }
  } catch (error) {
    console.error('Error fetching session:', error)
    throw new Error(`Failed to fetch session: ${error.message}`)
  }
}

/**
 * Fetch user's active/in-progress session for a scenario
 * @param {string} userId - User ID
 * @param {string} scenarioId - Scenario ID
 * @returns {Promise<Object|null>} Active session or null
 */
export async function fetchActiveSession(userId, scenarioId) {
  try {
    const sessionsRef = collection(db, SESSIONS_COLLECTION)
    const q = query(
      sessionsRef,
      where('user_id', '==', userId),
      where('scenario_id', '==', scenarioId),
      where('status', '==', 'IN_PROGRESS')
    )
    
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    // Return the first active session (there should only be one)
    const sessionDoc = querySnapshot.docs[0]
    const data = sessionDoc.data()
    
    return {
      id: sessionDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      startedAt: data.startedAt?.toDate?.() || data.startedAt,
      completedAt: data.completedAt?.toDate?.() || data.completedAt
    }
  } catch (error) {
    console.error('Error fetching active session:', error)
    throw new Error(`Failed to fetch active session: ${error.message}`)
  }
}

/**
 * Create a new session (snapshot of scenario data)
 * This is typically called by the backend, but included for completeness
 * @param {Object} sessionData - Session data to create
 * @returns {Promise<string>} Created session ID
 */
export async function createSession(sessionData) {
  try {
    const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), {
      ...sessionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return docRef.id
  } catch (error) {
    console.error('Error creating session:', error)
    throw new Error(`Failed to create session: ${error.message}`)
  }
}

/**
 * Update session progress
 * @param {string} sessionId - Session ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateSession(sessionId, updates) {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId)
    await updateDoc(sessionRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating session:', error)
    throw new Error(`Failed to update session: ${error.message}`)
  }
}

/**
 * Mark session as IN_PROGRESS when user enters the simulator
 * @param {string} sessionId - Session ID
 * @returns {Promise<void>}
 */
export async function markSessionInProgress(sessionId) {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId)
    const sessionDoc = await getDoc(sessionRef)
    
    if (!sessionDoc.exists()) {
      throw new Error('Session not found')
    }
    
    const sessionData = sessionDoc.data()
    
    // Only update if status is NOT_STARTED
    if (sessionData.status === 'NOT_STARTED') {
      await updateDoc(sessionRef, {
        status: 'IN_PROGRESS',
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      console.log(`Session ${sessionId} marked as IN_PROGRESS`)
    }
  } catch (error) {
    console.error('Error marking session in progress:', error)
    throw new Error(`Failed to mark session in progress: ${error.message}`)
  }
}

/**
 * Fetch all sessions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of sessions
 */
export async function fetchUserSessions(userId) {
  try {
    const sessionsRef = collection(db, SESSIONS_COLLECTION)
    const q = query(
      sessionsRef,
      where('user_id', '==', userId)
    )
    
    const querySnapshot = await getDocs(q)
    const sessions = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      sessions.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        startedAt: data.startedAt?.toDate?.() || data.startedAt,
        completedAt: data.completedAt?.toDate?.() || data.completedAt
      })
    })
    
    return sessions
  } catch (error) {
    console.error('Error fetching user sessions:', error)
    throw new Error(`Failed to fetch user sessions: ${error.message}`)
  }
}

/**
 * Save session progress (current step, time, state)
 * This should be called periodically during mission and on disconnect
 * @param {string} sessionId - Session ID
 * @param {Object} progress - Progress data
 * @param {number} progress.currentStepOrder - Current step index
 * @param {Array} progress.completedSteps - Array of completed step IDs
 * @param {number} progress.elapsedTime - Elapsed time in seconds
 * @param {Object} progress.state - Current mission state (optional)
 * @returns {Promise<void>}
 */
export async function saveSessionProgress(sessionId, progress) {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId)
    
    const updates = {
      currentStepOrder: progress.currentStepOrder,
      completedSteps: progress.completedSteps || [],
      updatedAt: serverTimestamp()
    }
    
    // Add elapsed time if provided
    if (typeof progress.elapsedTime === 'number') {
      updates.elapsedTime = progress.elapsedTime
    }
    
    // Add state if provided
    if (progress.state) {
      updates.state = progress.state
    }
    
    await updateDoc(sessionRef, updates)
    console.log(`Session ${sessionId} progress saved:`, {
      step: progress.currentStepOrder,
      completed: progress.completedSteps?.length || 0,
      time: progress.elapsedTime
    })
  } catch (error) {
    console.error('Error saving session progress:', error)
    // Don't throw - we don't want to interrupt the mission if save fails
  }
}

/**
 * Mark session as completed
 * @param {string} sessionId - Session ID
 * @param {Object} completionData - Completion data
 * @returns {Promise<void>}
 */
export async function completeSession(sessionId, completionData = {}) {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId)
    await updateDoc(sessionRef, {
      status: 'COMPLETED',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...completionData
    })
    console.log(`Session ${sessionId} marked as COMPLETED`)
  } catch (error) {
    console.error('Error completing session:', error)
    throw new Error(`Failed to complete session: ${error.message}`)
  }
}
