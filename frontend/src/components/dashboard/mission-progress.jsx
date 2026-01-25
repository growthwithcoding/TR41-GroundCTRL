"use client"

import { CheckCircle2, Circle, Lock, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

const missions = [
  {
    id: 1,
    name: "System Initialization",
    description: "Learn basic satellite boot procedures",
    status: "completed",
    progress: 100,
  },
  {
    id: 2,
    name: "Orientation & First Contact",
    description: "Establish communication with ground station",
    status: "completed",
    progress: 100,
  },
  {
    id: 3,
    name: "Orbital Mechanics 101",
    description: "Understanding perigee and apogee",
    status: "completed",
    progress: 100,
  },
  {
    id: 4,
    name: "Stable Orbit & First Ground Pass",
    description: "Maintain orbit and complete data transfer",
    status: "in-progress",
    progress: 40,
  },
  {
    id: 5,
    name: "Power Management",
    description: "Balance solar panels and battery usage",
    status: "locked",
    progress: 0,
  },
]

export function MissionProgress() {
  const totalMissions = missions.length
  const completedMissions = missions.filter(m => m.status === "completed").length
  const overallProgress = Math.round((completedMissions / totalMissions) * 100)

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Mission Progress</h2>
          <p className="text-xs text-muted-foreground">
            {completedMissions} of {totalMissions} missions completed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-foreground">{overallProgress}%</span>
        </div>
      </div>

      {/* Missions List */}
      <div className="divide-y divide-border">
        {missions.map((mission) => (
          <div
            key={mission.id}
            className={`px-5 py-4 flex items-center gap-4 ${
              mission.status === "locked" ? "opacity-50" : ""
            }`}
          >
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {mission.status === "completed" ? (
                <CheckCircle2 className="w-5 h-5 text-status-nominal" />
              ) : mission.status === "in-progress" ? (
                <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </div>
              ) : mission.status === "locked" ? (
                <Lock className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            {/* Mission Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{mission.name}</p>
              <p className="text-xs text-muted-foreground truncate">{mission.description}</p>
            </div>

            {/* Progress/Action */}
            {mission.status === "in-progress" ? (
              <div className="flex items-center gap-3">
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-status-warning rounded-full"
                    style={{ width: `${mission.progress}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground w-10">{mission.progress}%</span>
              </div>
            ) : mission.status === "completed" ? (
              <span className="text-xs font-medium text-status-nominal">COMPLETE</span>
            ) : null}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-muted/30">
        <Link to="/missions" className="text-xs text-primary hover:underline">
          View all missions
        </Link>
      </div>
    </div>
  )
}
