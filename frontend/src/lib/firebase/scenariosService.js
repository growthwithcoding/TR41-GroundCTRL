import { collection, getDocs, getDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from './config';

/**
 * Map Firestore scenario data to frontend mission format
 */
function mapScenarioToMission(scenario, scenarioId) {
  // Map tier to category
  const tierToCategory = {
    ROOKIE_PILOT: 'Fundamentals',
    MISSION_SPECIALIST: 'Advanced Operations',
    MISSION_COMMANDER: 'Expert',
  };

  // Map difficulty to label
  const difficultyToLabel = {
    BEGINNER: 'Beginner',
    INTERMEDIATE: 'Intermediate',
    ADVANCED: 'Advanced',
  };

  // Map difficulty to numeric value (1-5)
  const difficultyToNumber = {
    BEGINNER: 1,
    INTERMEDIATE: 3,
    ADVANCED: 5,
  };

  // Determine status based on isActive and user progress (for now, just use isActive)
  const status = scenario.isActive ? 'available' : 'locked';

  return {
    id: scenarioId,
    name: scenario.title,
    description: scenario.description,
    longDescription: scenario.description, // Could expand this later
    category: tierToCategory[scenario.tier] || 'Other',
    difficulty: difficultyToNumber[scenario.difficulty] || 1,
    difficultyLabel: difficultyToLabel[scenario.difficulty] || 'Beginner',
    estimatedDuration: scenario.estimatedDurationMinutes,
    icon: getIconForScenario(scenario),
    status: status,
    progress: 0, // TODO: Get from user progress data
    completedAt: null,
    startedAt: null,
    steps: [], // TODO: Load scenario steps
    totalObjectives: 0, // TODO: Calculate from steps
    completedObjectives: 0, // TODO: Get from user progress
    prerequisites: Array.isArray(scenario.prerequisites) 
      ? scenario.prerequisites.map(code => ({ missionId: code, missionName: code }))
      : [],
    rewards: {
      mp: calculateMissionPoints(scenario),
      badges: [],
      unlocks: [],
    },
    createdAt: scenario.createdAt || new Date().toISOString(),
    updatedAt: scenario.updatedAt || new Date().toISOString(),
    version: '1.0.0',
    isActive: scenario.isActive,
    isFeatured: scenario.isCore || false,
    tags: scenario.tags || [],
    // Keep original Firestore data for reference
    _firestore: {
      code: scenario.code,
      tier: scenario.tier,
      type: scenario.type,
      satellite_id: scenario.satellite_id,
      initialState: scenario.initialState,
      consoleLayout: scenario.consoleLayout,
      objectives: scenario.objectives,
      isCore: scenario.isCore,
      isPublic: scenario.isPublic,
    },
  };
}

/**
 * Get appropriate icon for scenario based on tags and type
 */
function getIconForScenario(scenario) {
  if (scenario.tags?.includes('orbit')) return 'Compass';
  if (scenario.tags?.includes('power')) return 'Zap';
  if (scenario.tags?.includes('attitude')) return 'RotateCw';
  if (scenario.tags?.includes('thermal')) return 'Sun';
  if (scenario.tags?.includes('communications')) return 'Radio';
  if (scenario.tags?.includes('emergency')) return 'Shield';
  if (scenario.tags?.includes('maneuver')) return 'Target';
  if (scenario.tags?.includes('payload')) return 'Camera';
  if (scenario.type === 'SANDBOX') return 'Boxes';
  return 'Rocket';
}

/**
 * Calculate mission points based on difficulty and duration
 */
function calculateMissionPoints(scenario) {
  const basePoints = {
    BEGINNER: 100,
    INTERMEDIATE: 200,
    ADVANCED: 300,
  };
  
  const base = basePoints[scenario.difficulty] || 100;
  const durationMultiplier = Math.floor(scenario.estimatedDurationMinutes / 10) * 10;
  return base + durationMultiplier;
}

/**
 * Fetch all scenarios from Firestore
 */
export async function fetchScenarios() {
  try {
    const scenariosRef = collection(db, 'scenarios');
    const q = query(
      scenariosRef,
      where('isActive', '==', true),
      orderBy('tier'),
      orderBy('estimatedDurationMinutes')
    );
    
    const querySnapshot = await getDocs(q);
    const scenarios = [];
    
    querySnapshot.forEach((doc) => {
      const scenario = doc.data();
      scenarios.push(mapScenarioToMission(scenario, doc.id));
    });
    
    return scenarios;
  } catch (error) {
    console.error('Error fetching scenarios from Firestore:', error);
    throw error;
  }
}

/**
 * Fetch a single scenario by ID
 */
export async function fetchScenarioById(scenarioId) {
  try {
    const scenarioRef = doc(db, 'scenarios', scenarioId);
    const scenarioDoc = await getDoc(scenarioRef);
    
    if (!scenarioDoc.exists()) {
      return null;
    }
    
    const scenario = scenarioDoc.data();
    return mapScenarioToMission(scenario, scenarioDoc.id);
  } catch (error) {
    console.error('Error fetching scenario by ID:', error);
    throw error;
  }
}

/**
 * Fetch published scenarios only
 */
export async function fetchPublishedScenarios() {
  try {
    const scenariosRef = collection(db, 'scenarios');
    const q = query(
      scenariosRef,
      where('status', '==', 'PUBLISHED'),
      where('isActive', '==', true),
      orderBy('difficulty', 'asc'),
      orderBy('tier', 'asc'),
      orderBy('estimatedDurationMinutes', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const scenarios = [];
    
    querySnapshot.forEach((doc) => {
      const scenario = doc.data();
      scenarios.push(mapScenarioToMission(scenario, doc.id));
    });
    
    return scenarios;
  } catch (error) {
    console.error('Error fetching published scenarios:', error);
    throw error;
  }
}

/**
 * Get mission statistics
 */
export function calculateMissionStats(missions) {
  const completed = missions.filter(m => m.status === 'completed').length;
  const inProgress = missions.filter(m => m.status === 'in-progress').length;
  const available = missions.filter(m => m.status === 'available').length;
  const locked = missions.filter(m => m.status === 'locked').length;
  const totalMp = missions
    .filter(m => m.status === 'completed')
    .reduce((sum, m) => sum + m.rewards.mp, 0);
  
  return {
    total: missions.length,
    completed,
    inProgress,
    available,
    locked,
    totalMp,
    progressPercent: missions.length > 0 ? Math.round((completed / missions.length) * 100) : 0,
  };
}
