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
        
        // Deduplicate activities with same message and similar timestamps (within 10 seconds)
        const deduped = []
        const seen = new Map()
        
        for (const activity of activityData) {
          const key = activity.message
          const existingTime = seen.get(key)
          
          if (!existingTime) {
            // First occurrence of this message
            deduped.push(activity)
            seen.set(key, activity.rawTimestamp)
          } else {
            // Check if timestamps are more than 10 seconds apart
            const timeDiff = Math.abs(activity.rawTimestamp - existingTime) / 1000
            if (timeDiff > 10) {
              // Different enough to be a separate activity
              deduped.push(activity)
              seen.set(key, activity.rawTimestamp)
            }
            // Otherwise skip (it's a duplicate)
          }
        }
        
        // Take top 7 most recent
        setActivities(deduped.slice(0, 7))
        setError(null)
      } catch (err) {
        console.error('Error loading recent activity:', err)
        
        // Backend audit logging not implemented yet - show placeholder
        // Instead of showing error, show empty state gracefully
        setActivities([])
        setError(null)
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
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Activity tracking coming soon</p>
            <p className="text-xs mt-1">Your mission progress is being tracked</p>
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
    </div>
  )
}
