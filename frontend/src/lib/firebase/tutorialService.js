/**
 * Tutorial Progress Service
 * 
 * Manages tutorial progress synchronization with Firestore
 * Stores tutorial state in users/{userId}/preferences/tutorials
 */

import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * Save tutorial progress to Firestore
 * @param {string} userId - User's Firebase UID
 * @param {Object} progressData - Tutorial progress data
 * @param {boolean} progressData.enabled - Whether tutorials are enabled
 * @param {string[]} progressData.completedFlows - Array of completed flow IDs
 * @param {string[]} progressData.dismissedFlows - Array of dismissed flow IDs
 * @param {Object} [progressData.scenarioPreferences] - Per-scenario preferences
 * @param {string|null} [progressData.lastActiveFlow] - Last active flow ID
 * @param {number} [progressData.lastActiveStepIndex] - Last active step index
 * @returns {Promise<void>}
 */
export async function saveTutorialProgress(userId, progressData) {
  try {
    const userDocRef = doc(db, 'users', userId);
    
    const tutorialData = {
      enabled: progressData.enabled ?? true,
      completedFlows: progressData.completedFlows ?? [],
      dismissedFlows: progressData.dismissedFlows ?? [],
      scenarioPreferences: progressData.scenarioPreferences ?? {},
      lastActiveFlow: progressData.lastActiveFlow ?? null,
      lastActiveStepIndex: progressData.lastActiveStepIndex ?? 0,
      lastUpdated: Date.now()
    };
    
    // Update the preferences.tutorials nested object
    await updateDoc(userDocRef, {
      'preferences.tutorials': tutorialData
    });
    
    console.log('[TutorialService] Progress saved successfully');
  } catch (error) {
    // If user document doesn't exist, create it
    if (error.code === 'not-found') {
      try {
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, {
          preferences: {
            tutorials: {
              enabled: progressData.enabled ?? true,
              completedFlows: progressData.completedFlows ?? [],
              dismissedFlows: progressData.dismissedFlows ?? [],
              scenarioPreferences: progressData.scenarioPreferences ?? {},
              lastActiveFlow: progressData.lastActiveFlow ?? null,
              lastActiveStepIndex: progressData.lastActiveStepIndex ?? 0,
              lastUpdated: Date.now()
            }
          }
        }, { merge: true });
        
        console.log('[TutorialService] User document created with tutorial progress');
      } catch (createError) {
        console.error('[TutorialService] Error creating user document:', createError);
        throw createError;
      }
    } else {
      console.error('[TutorialService] Error saving tutorial progress:', error);
      throw error;
    }
  }
}

/**
 * Load tutorial progress from Firestore
 * @param {string} userId - User's Firebase UID
 * @returns {Promise<Object|null>} Tutorial progress data or null if not found
 */
export async function loadTutorialProgress(userId) {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const tutorialData = userData?.preferences?.tutorials;
      
      if (tutorialData) {
        console.log('[TutorialService] Progress loaded successfully');
        return {
          enabled: tutorialData.enabled ?? true,
          completedFlows: tutorialData.completedFlows ?? [],
          dismissedFlows: tutorialData.dismissedFlows ?? [],
          scenarioPreferences: tutorialData.scenarioPreferences ?? {},
          lastActiveFlow: tutorialData.lastActiveFlow ?? null,
          lastActiveStepIndex: tutorialData.lastActiveStepIndex ?? 0,
          lastUpdated: tutorialData.lastUpdated
        };
      }
    }
    
    console.log('[TutorialService] No tutorial progress found, returning defaults');
    return null;
  } catch (error) {
    console.error('[TutorialService] Error loading tutorial progress:', error);
    throw error;
  }
}

/**
 * Mark a flow as completed
 * @param {string} userId - User's Firebase UID
 * @param {string} flowId - Flow ID to mark as completed
 * @returns {Promise<void>}
 */
export async function markFlowCompleted(userId, flowId) {
  try {
    const currentProgress = await loadTutorialProgress(userId);
    
    const completedFlows = currentProgress?.completedFlows ?? [];
    if (!completedFlows.includes(flowId)) {
      completedFlows.push(flowId);
    }
    
    await saveTutorialProgress(userId, {
      ...currentProgress,
      completedFlows,
      lastActiveFlow: null,
      lastActiveStepIndex: 0
    });
    
    console.log(`[TutorialService] Flow "${flowId}" marked as completed`);
  } catch (error) {
    console.error('[TutorialService] Error marking flow as completed:', error);
    throw error;
  }
}

/**
 * Mark a flow as dismissed
 * @param {string} userId - User's Firebase UID
 * @param {string} flowId - Flow ID to mark as dismissed
 * @returns {Promise<void>}
 */
export async function markFlowDismissed(userId, flowId) {
  try {
    const currentProgress = await loadTutorialProgress(userId);
    
    const dismissedFlows = currentProgress?.dismissedFlows ?? [];
    if (!dismissedFlows.includes(flowId)) {
      dismissedFlows.push(flowId);
    }
    
    await saveTutorialProgress(userId, {
      ...currentProgress,
      dismissedFlows,
      lastActiveFlow: null,
      lastActiveStepIndex: 0
    });
    
    console.log(`[TutorialService] Flow "${flowId}" marked as dismissed`);
  } catch (error) {
    console.error('[TutorialService] Error marking flow as dismissed:', error);
    throw error;
  }
}

/**
 * Update scenario preference
 * @param {string} userId - User's Firebase UID
 * @param {string} scenarioKey - Scenario key
 * @param {boolean} showTutorials - Whether to show tutorials for this scenario
 * @returns {Promise<void>}
 */
export async function updateScenarioPreference(userId, scenarioKey, showTutorials) {
  try {
    const currentProgress = await loadTutorialProgress(userId);
    
    const scenarioPreferences = currentProgress?.scenarioPreferences ?? {};
    scenarioPreferences[scenarioKey] = showTutorials;
    
    await saveTutorialProgress(userId, {
      ...currentProgress,
      scenarioPreferences
    });
    
    console.log(`[TutorialService] Scenario "${scenarioKey}" preference updated to ${showTutorials}`);
  } catch (error) {
    console.error('[TutorialService] Error updating scenario preference:', error);
    throw error;
  }
}

/**
 * Reset all tutorial progress
 * @param {string} userId - User's Firebase UID
 * @returns {Promise<void>}
 */
export async function resetTutorialProgress(userId) {
  try {
    await saveTutorialProgress(userId, {
      enabled: true,
      completedFlows: [],
      dismissedFlows: [],
      scenarioPreferences: {},
      lastActiveFlow: null,
      lastActiveStepIndex: 0
    });
    
    console.log('[TutorialService] Tutorial progress reset successfully');
  } catch (error) {
    console.error('[TutorialService] Error resetting tutorial progress:', error);
    throw error;
  }
}

/**
 * Toggle tutorial system on/off
 * @param {string} userId - User's Firebase UID
 * @param {boolean} enabled - Whether tutorials should be enabled
 * @returns {Promise<void>}
 */
export async function setTutorialEnabled(userId, enabled) {
  try {
    const currentProgress = await loadTutorialProgress(userId);
    
    await saveTutorialProgress(userId, {
      ...currentProgress,
      enabled,
      lastActiveFlow: enabled ? currentProgress?.lastActiveFlow : null,
      lastActiveStepIndex: enabled ? currentProgress?.lastActiveStepIndex : 0
    });
    
    console.log(`[TutorialService] Tutorials ${enabled ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error('[TutorialService] Error toggling tutorial state:', error);
    throw error;
  }
}

/**
 * Sync current tutorial state to Firestore (for real-time updates)
 * @param {string} userId - User's Firebase UID
 * @param {Object} state - Current tutorial state
 * @returns {Promise<void>}
 */
export async function syncTutorialState(userId, state) {
  try {
    const progressData = {
      enabled: state.enabled,
      completedFlows: state.completedFlows,
      dismissedFlows: state.dismissedFlows,
      scenarioPreferences: state.scenarioPreferences,
      lastActiveFlow: state.activeFlowId,
      lastActiveStepIndex: state.activeStepIndex
    };
    
    await saveTutorialProgress(userId, progressData);
  } catch (error) {
    // Don't throw on sync errors - just log them
    console.warn('[TutorialService] Non-critical sync error:', error);
  }
}
