/**
 * Scenario API Service
 * Handles scenario, scenario steps, and satellite operations via backend API
 */

import api from './httpClient'

// ==================== Scenarios ====================

/**
 * Create a new training scenario
 * @param {object} scenarioData - Scenario data matching backend schema
 * @returns {Promise<object>} Created scenario
 */
export async function createScenario(scenarioData) {
  try {
    const response = await api.post('/scenarios', scenarioData)
    return response.payload || response
  } catch (error) {
    console.error('Failed to create scenario:', error)
    throw new Error(error.message || 'Failed to create scenario')
  }
}

/**
 * Update an existing scenario (partial)
 * @param {string} scenarioId - Scenario ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated scenario
 */
export async function updateScenario(scenarioId, updates) {
  try {
    const response = await api.patch(`/scenarios/${scenarioId}`, updates)
    return response.payload || response
  } catch (error) {
    console.error('Failed to update scenario:', error)
    throw new Error(error.message || 'Failed to update scenario')
  }
}

/**
 * Get scenario by ID
 * @param {string} scenarioId - Scenario ID
 * @returns {Promise<object>} Scenario data
 */
export async function getScenario(scenarioId) {
  try {
    const response = await api.get(`/scenarios/${scenarioId}`)
    return response.payload || response
  } catch (error) {
    console.error('Failed to get scenario:', error)
    throw new Error(error.message || 'Failed to retrieve scenario')
  }
}

/**
 * List all scenarios (with filters)
 * @param {object} filters - Query filters (status, tier, difficulty, etc.)
 * @returns {Promise<Array>} Array of scenarios
 */
export async function listScenarios(filters = {}) {
  try {
    const queryParams = new URLSearchParams(filters).toString()
    const endpoint = queryParams ? `/scenarios?${queryParams}` : '/scenarios'
    
    const response = await api.get(endpoint)
    return response.payload || response
  } catch (error) {
    console.error('Failed to list scenarios:', error)
    throw new Error(error.message || 'Failed to retrieve scenarios')
  }
}

/**
 * Delete a scenario
 * @param {string} scenarioId - Scenario ID
 * @returns {Promise<void>}
 */
export async function deleteScenario(scenarioId) {
  try {
    await api.delete(`/scenarios/${scenarioId}`)
  } catch (error) {
    console.error('Failed to delete scenario:', error)
    throw new Error(error.message || 'Failed to delete scenario')
  }
}

// ==================== Scenario Steps ====================

/**
 * Create a scenario step
 * @param {object} stepData - Step data (scenario_id, stepOrder, title, instructions, etc.)
 * @returns {Promise<object>} Created step
 */
export async function createScenarioStep(stepData) {
  try {
    console.log('Creating scenario step with data:', stepData)
    const response = await api.post('/scenario-steps', stepData)
    return response.payload || response
  } catch (error) {
    console.error('Failed to create scenario step:', error)
    console.error('Step validation errors:', error.data?.payload?.error || error.data?.errors || error.data)
    throw new Error(error.message || 'Failed to create step')
  }
}

/**
 * Update a scenario step (partial)
 * @param {string} stepId - Step ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated step
 */
export async function updateScenarioStep(stepId, updates) {
  try {
    const response = await api.patch(`/scenario-steps/${stepId}`, updates)
    return response.payload || response
  } catch (error) {
    console.error('Failed to update scenario step:', error)
    throw new Error(error.message || 'Failed to update step')
  }
}

/**
 * List steps for a scenario
 * @param {string} scenarioId - Scenario ID
 * @returns {Promise<Array>} Array of steps ordered by stepOrder
 */
export async function listScenarioSteps(scenarioId) {
  try {
    const response = await api.get(`/scenario-steps?scenario_id=${scenarioId}&sortBy=stepOrder&sortOrder=asc`)
    return response.payload || response
  } catch (error) {
    console.error('Failed to list scenario steps:', error)
    throw new Error(error.message || 'Failed to retrieve steps')
  }
}

/**
 * Delete a scenario step
 * @param {string} stepId - Step ID
 * @returns {Promise<void>}
 */
export async function deleteScenarioStep(stepId) {
  try {
    await api.delete(`/scenario-steps/${stepId}`)
  } catch (error) {
    console.error('Failed to delete scenario step:', error)
    throw new Error(error.message || 'Failed to delete step')
  }
}

// ==================== Satellites ====================

/**
 * Get all satellites
 * @returns {Promise<Array>} Array of satellites
 */
export async function getSatellites() {
  try {
    const response = await api.get('/satellites')
    return response.payload || response
  } catch (error) {
    console.error('Failed to get satellites:', error)
    throw new Error(error.message || 'Failed to retrieve satellites')
  }
}

/**
 * Create a new satellite
 * @param {object} satelliteData - Satellite data
 * @returns {Promise<object>} Created satellite
 */
export async function createSatellite(satelliteData) {
  try {
    const response = await api.post('/satellites', satelliteData)
    return response.payload || response
  } catch (error) {
    console.error('Failed to create satellite:', error)
    throw new Error(error.message || 'Failed to create satellite')
  }
}

/**
 * Get satellite by ID
 * @param {string} satelliteId - Satellite ID
 * @returns {Promise<object>} Satellite data
 */
export async function getSatellite(satelliteId) {
  try {
    const response = await api.get(`/satellites/${satelliteId}`)
    return response.payload || response
  } catch (error) {
    console.error('Failed to get satellite:', error)
    throw new Error(error.message || 'Failed to retrieve satellite')
  }
}
