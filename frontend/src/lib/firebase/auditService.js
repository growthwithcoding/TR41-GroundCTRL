import { auth } from './config'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'

/**
 * Fetch user's recent audit logs from backend API
 * Returns activity feed data with relevant, positive events
 * 
 * @param {string} userId - User ID to fetch audit logs for
 * @param {number} maxResults - Maximum number of results to return (default: 10)
 * @returns {Promise<Array>} Array of audit log entries
 */
export async function fetchUserAuditLogs(userId, maxResults = 10) {
  try {
    // Get current user's ID token for authentication
    const user = auth.currentUser
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    const idToken = await user.getIdToken()
    
    // Call backend API to fetch audit logs
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/audit?limit=${maxResults}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.brief || `Failed to fetch audit logs: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Backend returns audit logs in payload.data array (paginated response)
    // Or sometimes just payload (depending on endpoint structure)
    let auditLogs = []
    
    if (Array.isArray(data.payload?.data)) {
      auditLogs = data.payload.data
    } else if (Array.isArray(data.payload)) {
      auditLogs = data.payload
    } else if (Array.isArray(data.data)) {
      auditLogs = data.data
    } else if (Array.isArray(data)) {
      auditLogs = data
    }
    
    console.log('Fetched audit logs:', auditLogs)
    
    // Convert timestamp strings to Date objects
    return auditLogs.map(log => ({
      ...log,
      timestamp: log.timestamp ? new Date(log.timestamp) : new Date()
    }))
  } catch (error) {
    console.error('Error fetching user audit logs:', error)
    throw error
  }
}

/**
 * Filter audit logs to positive/relevant events only
 * Excludes failures, errors, and noise
 * 
 * @param {Array} auditLogs - Array of audit log entries
 * @returns {Array} Filtered audit logs
 */
export function filterRelevantAuditLogs(auditLogs) {
  // Events we want to show (positive/informational)
  const relevantActions = new Set([
    'LOGIN',
    'REGISTER',
    'LOGOUT',
    'EXECUTE_SCENARIO',
    'CREATE_SCENARIO',
    'UPDATE_USER',
    'PATCH_USER',
    'CREATE_SATELLITE',
    'UPDATE_SATELLITE',
    'EXECUTE_COMMAND',
    'AI_GENERATE',
    'AI_QUERY'
  ])
  
  // Severity levels we want to show (no warnings/errors/critical)
  const relevantSeverities = new Set(['INFO'])
  
  return auditLogs.filter(log => {
    // Filter by action and severity
    return relevantActions.has(log.action) && relevantSeverities.has(log.severity)
  })
}

/**
 * Map audit log action to user-friendly message
 * 
 * @param {object} auditLog - Audit log entry
 * @returns {string} User-friendly message
 */
export function formatAuditLogMessage(auditLog) {
  const { action, metadata = {} } = auditLog
  
  const messageMap = {
    'LOGIN': 'Logged in',
    'LOGOUT': 'Logged out',
    'REGISTER': 'Account created',
    'EXECUTE_SCENARIO': metadata.scenarioName ? `Started mission: ${metadata.scenarioName}` : 'Started a mission',
    'CREATE_SCENARIO': 'Created new scenario',
    'UPDATE_USER': 'Updated profile',
    'PATCH_USER': 'Updated profile',
    'CREATE_SATELLITE': metadata.satelliteName ? `Added satellite: ${metadata.satelliteName}` : 'Added new satellite',
    'UPDATE_SATELLITE': 'Updated satellite',
    'EXECUTE_COMMAND': metadata.commandType ? `Executed command: ${metadata.commandType}` : 'Executed command',
    'AI_GENERATE': 'Used AI assistant',
    'AI_QUERY': 'Asked AI for help'
  }
  
  return messageMap[action] || action
}

/**
 * Determine activity type for display styling
 * 
 * @param {string} action - Audit log action
 * @returns {string} Activity type ('success', 'info', 'warning')
 */
export function getActivityType(action) {
  const successActions = new Set([
    'LOGIN',
    'REGISTER',
    'EXECUTE_SCENARIO',
    'CREATE_SCENARIO',
    'CREATE_SATELLITE'
  ])
  
  if (successActions.has(action)) {
    return 'success'
  }
  
  return 'info'
}

/**
 * Format timestamp to relative time string
 * 
 * @param {Date} timestamp - Timestamp to format
 * @returns {string} Relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp) {
  const now = new Date()
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  
  if (diffSec < 60) {
    return 'Just now'
  } else if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffHour < 24) {
    return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`
  } else if (diffDay < 7) {
    return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`
  } else {
    return date.toLocaleDateString()
  }
}
