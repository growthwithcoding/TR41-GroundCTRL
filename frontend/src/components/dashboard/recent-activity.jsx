"use client"

import { CheckCircle2, AlertTriangle, Info, Rocket } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "success",
    message: "Completed mission: Orbital Mechanics 101",
    time: "2 hours ago",
    icon: CheckCircle2,
  },
  {
    id: 2,
    type: "info",
    message: "Started mission: Stable Orbit & First Ground Pass",
    time: "3 hours ago",
    icon: Rocket,
  },
  {
    id: 3,
    type: "warning",
    message: "Used hint: Perigee explanation",
    time: "3 hours ago",
    icon: AlertTriangle,
  },
  {
    id: 4,
    type: "success",
    message: "Achievement unlocked: First Orbit",
    time: "1 day ago",
    icon: CheckCircle2,
  },
  {
    id: 5,
    type: "info",
    message: "Account created",
    time: "2 days ago",
    icon: Info,
  },
]

const typeStyles = {
  success: "text-status-nominal bg-status-nominal/10",
  warning: "text-status-warning bg-status-warning/10",
  info: "text-primary bg-primary/10",
}

export function RecentActivity() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-border">
        {activities.map((activity) => (
          <div key={activity.id} className="px-5 py-3 flex items-start gap-3">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              typeStyles[activity.type] || typeStyles.info
            }`}>
              <activity.icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-snug">{activity.message}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-muted/30">
        <button className="text-xs text-primary hover:underline">View all activity</button>
      </div>
    </div>
  )
}
