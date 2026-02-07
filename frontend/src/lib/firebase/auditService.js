import { db } from './config'
import { collection, query, where, orderBy, limit as firestoreLimit, getDocs } from 'firebase/firestore'

/**
 * Fetch user's recent audit logs from Firestore
 * Returns activity feed data with relevant, positive events
 * 
 * @param {string} userId - User ID to fetch audit logs for
 * @param {number} maxResults - Maximum number of results to return (default: 10)
 * @returns {Promise<Array>} Array of audit log entries
 */
export async function fetchUserAuditLogs(userId, maxResults = 10) {
  try {
    // Query Firestore directly for user's audit logs
    const auditLogsRef = collection(db, 'audit_logs')
    const q = query(
      auditLogsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(maxResults)
    )
    
    const querySnapshot = await getDocs(q)
    const auditLogs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }))
    
    console.log('Fetched audit logs from Firestore:', auditLogs)
    
    return auditLogs
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
  console.log('[AuditService] Filtering audit logs:', {
    totalLogs: auditLogs.length,
    actions: auditLogs.map(log => ({ action: log.action, severity: log.severity, result: log.result, resource: log.resource }))
  })
  
  const filtered = auditLogs.filter(log => {
    // Show all successful activities (INFO severity or success result)
    // Exclude only errors and API errors
    const isSuccess = log.result === 'success' || log.severity === 'INFO'
    const notError = log.action !== 'API_ERROR' && log.severity !== 'ERROR'
    
    return isSuccess && notError
  })
  
  console.log('[AuditService] Filtered results:', {
    filteredCount: filtered.length,
    filtered: filtered.map(log => ({ action: log.action, severity: log.severity, result: log.result }))
  })
  
  return filtered
}

/**
 * Map audit log action to user-friendly message
 * 
 * @param {object} auditLog - Audit log entry
 * @returns {string} User-friendly message
 */
export function formatAuditLogMessage(auditLog) {
  const { action, resource, details, metadata = {} } = auditLog
  
  // User-friendly activity messages
  const messageMap = {
    'LOGIN': 'Signed in',
    'LOGOUT': 'Signed out',
    'REGISTER': 'Joined GroundCTRL',
    'UPDATE_USER': 'Updated profile settings',
    'PATCH_USER': 'Updated account',
    'CREATE_SATELLITE': 'Added a new satellite',
    'UPDATE_SATELLITE': 'Updated satellite configuration',
    'EXECUTE_COMMAND': 'Executed a command',
    'AI_GENERATE': 'Used AI assistant',
    'AI_QUERY': 'Asked NOVA for help'
  }
  
  // If we have a specific action mapping, use it
  if (messageMap[action]) {
    return messageMap[action]
  }
  
  // Format based on resource for common activities
  if (resource) {
    const resourceLower = resource.toLowerCase()
    
    if (resourceLower.includes('scenario') || resourceLower.includes('mission')) {
      return 'Started a mission'
    }
    if (resourceLower.includes('session')) {
      return 'Continued training session'
    }
    if (resourceLower.includes('command')) {
      return 'Executed satellite command'
    }
    if (resourceLower.includes('satellite')) {
      return 'Updated satellite'
    }
    if (resourceLower.includes('user') || resourceLower.includes('profile')) {
      return 'Updated profile'
    }
    if (resourceLower.includes('achievement') || resourceLower.includes('badge')) {
      return 'Earned an achievement'
    }
  }
  
  // Generic fallback
  return 'Completed an activity'
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
