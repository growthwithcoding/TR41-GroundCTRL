"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, AlertTriangle, Info, Rocket, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { 
  fetchUserAuditLogs, 
  filterRelevantAuditLogs, 
  formatAuditLogMessage, 
  getActivityType,
  formatRelativeTime 
} from "@/lib/firebase/auditService"

/**
 * Recent Activity Component - Shows user's recent activity from audit logs
 * Fetches real data from the backend audit API via fetchUserAuditLogs
 * 
 * Filters to positive/relevant events only (no failures/errors)
 * Caps list to recent entries (10 max displayed, 5 shown by default)
 */

const typeStyles = {
  success: "text-status-nominal bg-status-nominal/10",
  warning: "text-status-warning bg-status-warning/10",
  info: "text-primary bg-primary/10",
}

const iconMap = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Rocket,
}

export function RecentActivity() {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadActivityData() {
      if (!user) return

      try {
        setLoading(true)
        
        // Fetch recent audit logs (limit 10)
        const auditLogs = await fetchUserAuditLogs(user.uid, 10)
        
        // Filter to positive/relevant events only
        const relevantLogs = filterRelevantAuditLogs(auditLogs)
        
        // Map to activity format
        const activityData = relevantLogs.map(log => ({
          id: log.id,
          type: getActivityType(log.action),
          message: formatAuditLogMessage(log),
          time: formatRelativeTime(log.timestamp),
          icon: iconMap[getActivityType(log.action)] || Info,
          rawTimestamp: log.timestamp
        }))
        
        // Take top 5 most recent
        setActivities(activityData.slice(0, 5))
        setError(null)
      } catch (err) {
        console.error('Error loading recent activity:', err)
        
        // Handle authorization/permission errors gracefully
        // (Backend API requires JWT tokens, not Firebase ID tokens)
        if (err.message?.includes('authorization') || err.message?.includes('permissions')) {
          // Show empty state instead of error for auth issues
          setActivities([])
          setError(null)
        } else {
          setError('Failed to load recent activity')
        }
      } finally {
        setLoading(false)
      }
    }

    loadActivityData()
  }, [user])

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/30">
          <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
        </div>
        <div className="px-5 py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/30">
          <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-border">
        {activities.length === 0 ? (
          <div className="px-5 py-8 text-center text-muted-foreground text-sm">
            No recent activity yet. Start your first mission!
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="px-5 py-3 flex items-start gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                typeStyles[activity.type] || typeStyles.info
              }`}>
                <activity.icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug">{activity.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-muted/30">
        <button className="text-xs text-primary hover:underline px-2 py-1">View all activity</button>
      </div>
    </div>
  )
}
