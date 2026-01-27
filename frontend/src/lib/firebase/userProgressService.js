import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from './config';

/**
 * Fetch user's scenario sessions (progress)
 * @param {string} userId - The user's UID
 * @returns {Promise<Array>} User's scenario sessions
 */
export async function fetchUserProgress(userId) {
  try {
    if (!userId) {
      return [];
    }

    const sessionsRef = collection(db, 'scenario_sessions');
    const q = query(
      sessionsRef,
      where('user_id', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const sessions = [];

    querySnapshot.forEach((doc) => {
      const session = doc.data();
      sessions.push({
        id: doc.id,
        ...session,
        createdAt: session.createdAt?.toDate?.() || session.createdAt,
        updatedAt: session.updatedAt?.toDate?.() || session.updatedAt,
        startedAt: session.startedAt?.toDate?.() || session.startedAt,
        completedAt: session.completedAt?.toDate?.() || session.completedAt,
      });
    });

    return sessions;
  } catch (error) {
    console.error('Error fetching user progress:', error);
    throw error;
  }
}

/**
 * Get completed scenario codes for a user
 * @param {Array} sessions - User's scenario sessions
 * @returns {Set<string>} Set of completed scenario codes
 */
export function getCompletedScenarioCodes(sessions) {
  return new Set(
    sessions
      .filter(session => session.status === 'COMPLETED')
      .map(session => session.scenario_id)
  );
}

/**
 * Get in-progress scenario session
 * @param {Array} sessions - User's scenario sessions
 * @returns {Object|null} In-progress session or null
 */
export function getInProgressSession(sessions) {
  return sessions.find(session => session.status === 'IN_PROGRESS') || null;
}

/**
 * Get in-progress OR not-started scenario session (for home page display)
 * @param {Array} sessions - User's scenario sessions
 * @returns {Object|null} Active session or null
 */
export function getActiveSession(sessions) {
  // Check for IN_PROGRESS first, then fall back to most recent NOT_STARTED
  const inProgress = sessions.find(session => session.status === 'IN_PROGRESS');
  if (inProgress) return inProgress;
  
  // Find most recent NOT_STARTED session (user created but hasn't started yet)
  const notStarted = sessions
    .filter(session => session.status === 'NOT_STARTED')
    .sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB - dateA; // Most recent first
    })[0];
  
  return notStarted || null;
}

/**
 * Check if a scenario is available based on prerequisites
 * @param {Object} scenario - The scenario to check
 * @param {Set<string>} completedCodes - Set of completed scenario codes
 * @returns {boolean} True if scenario is available
 */
export function isScenarioAvailable(scenario, completedCodes) {
  if (!scenario.isActive) {
    return false;
  }

  // If no prerequisites, it's available
  if (!scenario._firestore?.prerequisites || scenario._firestore.prerequisites.length === 0) {
    return true;
  }

  // Check if all prerequisites are completed
  return scenario._firestore.prerequisites.every(prereq => completedCodes.has(prereq));
}

/**
 * Get the next available mission for a user
 * @param {Array} scenarios - All available scenarios
 * @param {Set<string>} completedCodes - Set of completed scenario codes
 * @param {string|null} inProgressScenarioId - Current in-progress scenario ID (to exclude)
 * @returns {Object|null} Next available scenario or null
 */
export function getNextAvailableMission(scenarios, completedCodes, inProgressScenarioId = null) {
  // Define tier priority order
  const tierOrder = {
    'ROOKIE_PILOT': 1,
    'MISSION_SPECIALIST': 2,
    'MISSION_COMMANDER': 3,
  };

  // Filter to available scenarios (not completed, not in progress)
  const availableScenarios = scenarios.filter(scenario => {
    // Skip if already completed
    if (completedCodes.has(scenario._firestore?.code)) {
      return false;
    }

    // Skip if it's the current in-progress mission
    if (inProgressScenarioId && scenario._firestore?.code === inProgressScenarioId) {
      return false;
    }

    // Check if available based on prerequisites
    return isScenarioAvailable(scenario, completedCodes);
  });

  if (availableScenarios.length === 0) {
    return null;
  }

  // Sort by tier priority, then by estimated duration (easier/shorter first)
  availableScenarios.sort((a, b) => {
    const tierA = tierOrder[a._firestore?.tier] || 999;
    const tierB = tierOrder[b._firestore?.tier] || 999;

    if (tierA !== tierB) {
      return tierA - tierB;
    }

    // Within same tier, prioritize core missions
    if (a._firestore?.isCore !== b._firestore?.isCore) {
      return a._firestore?.isCore ? -1 : 1;
    }

    // Then by duration (shorter first)
    return a.estimatedDuration - b.estimatedDuration;
  });

  return availableScenarios[0];
}

/**
 * Get locked mission (next mission that's not yet available due to prerequisites)
 * @param {Array} scenarios - All available scenarios
 * @param {Set<string>} completedCodes - Set of completed scenario codes
 * @returns {Object|null} Next locked scenario or null
 */
export function getNextLockedMission(scenarios, completedCodes) {
  // Define tier priority order
  const tierOrder = {
    'ROOKIE_PILOT': 1,
    'MISSION_SPECIALIST': 2,
    'MISSION_COMMANDER': 3,
  };

  // Filter to locked scenarios (has unmet prerequisites)
  const lockedScenarios = scenarios.filter(scenario => {
    // Skip if already completed
    if (completedCodes.has(scenario._firestore?.code)) {
      return false;
    }

    // Must have prerequisites and not all are met
    const hasPrereqs = scenario._firestore?.prerequisites && scenario._firestore.prerequisites.length > 0;
    if (!hasPrereqs) {
      return false;
    }

    // Check if it's locked (not all prerequisites met)
    return !isScenarioAvailable(scenario, completedCodes);
  });

  if (lockedScenarios.length === 0) {
    return null;
  }

  // Sort by tier priority, then by how many prerequisites are met
  lockedScenarios.sort((a, b) => {
    const tierA = tierOrder[a._firestore?.tier] || 999;
    const tierB = tierOrder[b._firestore?.tier] || 999;

    if (tierA !== tierB) {
      return tierA - tierB;
    }

    // Count how many prerequisites are met
    const metA = a._firestore.prerequisites.filter(p => completedCodes.has(p)).length;
    const metB = b._firestore.prerequisites.filter(p => completedCodes.has(p)).length;

    // Prioritize missions with more prerequisites met
    if (metA !== metB) {
      return metB - metA;
    }

    // Then by core missions
    if (a._firestore?.isCore !== b._firestore?.isCore) {
      return a._firestore?.isCore ? -1 : 1;
    }

    return 0;
  });

  return lockedScenarios[0];
}

/**
 * Calculate total logged mission time from all sessions
 * @param {Array} sessions - User's scenario sessions
 * @returns {Object} Total time in hours, minutes, and seconds
 */
export function getTotalMissionTime(sessions) {
  let totalSeconds = 0;

  sessions.forEach(session => {
    // Only count sessions that have been started
    if (session.startedAt) {
      const startTime = session.startedAt instanceof Date ? session.startedAt : new Date(session.startedAt);
      
      // If completed, use completedAt; otherwise use updatedAt or current time
      let endTime;
      if (session.completedAt) {
        endTime = session.completedAt instanceof Date ? session.completedAt : new Date(session.completedAt);
      } else if (session.updatedAt) {
        endTime = session.updatedAt instanceof Date ? session.updatedAt : new Date(session.updatedAt);
      } else {
        // If session is in progress and no updatedAt, don't count it yet
        return;
      }

      // Calculate duration in seconds
      const durationMs = endTime - startTime;
      if (durationMs > 0) {
        totalSeconds += Math.floor(durationMs / 1000);
      }
    }
  });

  // Convert to hours, minutes, seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, totalSeconds };
}

/**
 * Format mission time for display
 * @param {Object} timeObject - Object with hours, minutes, seconds
 * @returns {string} Formatted time string
 */
export function formatMissionTime(timeObject) {
  const { hours, minutes, seconds } = timeObject;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}
