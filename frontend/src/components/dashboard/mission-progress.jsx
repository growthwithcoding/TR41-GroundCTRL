"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Circle, Lock, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { fetchPublishedScenarios } from "@/lib/firebase/scenariosService"
import { fetchUserProgress, getCompletedScenarioCodes, getInProgressSession } from "@/lib/firebase/userProgressService"

/**
 * Mission Progress Component - Shows user's progress through training scenarios
 * Fetches real data from Firestore (scenario sessions)
 * 
 * Completed logic: session.status === 'COMPLETED' (deterministic)
 * Progress calculation: Based on actual session data, grouped by tier
 */
export function MissionProgress() {
  const { user } = useAuth()
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadMissionData() {
      if (!user) return

      try {
        setLoading(true)
        
        // Fetch scenarios and user sessions in parallel
        const [scenarios, sessions] = await Promise.all([
          fetchPublishedScenarios(),
          fetchUserProgress(user.uid)
        ])

        console.log('[MissionProgress] Loaded data:', {
          scenarioCount: scenarios.length,
          sessionCount: sessions.length,
          scenarios: scenarios.map(s => ({ id: s.id, name: s.name })),
          sessions: sessions.map(s => ({ id: s.id, scenario_id: s.scenario_id, status: s.status }))
        })

        // Get completed scenario IDs (deterministic: status === 'COMPLETED')
        const completedCodes = getCompletedScenarioCodes(sessions)
        const inProgressSession = getInProgressSession(sessions)
        
        // Map sessions by scenario_id for quick lookup
        const sessionsByScenario = {}
        sessions.forEach(session => {
          if (!sessionsByScenario[session.scenario_id] || 
              new Date(session.updatedAt) > new Date(sessionsByScenario[session.scenario_id].updatedAt)) {
            sessionsByScenario[session.scenario_id] = session
          }
        })

        // Determine mission status for each scenario
        const missionsWithStatus = scenarios.map(scenario => {
          const session = sessionsByScenario[scenario.id]
          const isCompleted = completedCodes.has(scenario.id)
          const isInProgress = inProgressSession?.scenario_id === scenario.id
          
          // Check if prerequisites are met
          const prerequisites = scenario._firestore?.prerequisites || []
          const prerequisitesMet = prerequisites.every(prereq => completedCodes.has(prereq))
          
          let status = 'locked'
          let progress = 0
          
          // Deterministic completion logic: status === 'COMPLETED'
          if (isCompleted) {
            status = 'completed'
            progress = 100
          } else if (isInProgress) {
            status = 'in-progress'
            // Calculate progress based on completed steps
            if (session?.completedSteps && session?.totalSteps) {
              progress = Math.round((session.completedSteps / session.totalSteps) * 100)
            } else {
              progress = 0
            }
          } else if (prerequisitesMet && scenario.isActive) {
            status = 'available'
            progress = 0
          }

          return {
            id: scenario.id,
            name: scenario.name,
            description: scenario.description,
            tier: scenario._firestore?.tier || 'ROOKIE_PILOT',
            status,
            progress,
            session,
          }
        })

        // Sort missions by tier and name
        const tierOrder = { 'ROOKIE_PILOT': 1, 'MISSION_SPECIALIST': 2, 'MISSION_COMMANDER': 3 }
        missionsWithStatus.sort((a, b) => {
          const tierDiff = (tierOrder[a.tier] || 999) - (tierOrder[b.tier] || 999)
          if (tierDiff !== 0) return tierDiff
          return a.name.localeCompare(b.name)
        })

        // Calculate progress by tier
        const tierProgress = {}
        missionsWithStatus.forEach(mission => {
          if (!tierProgress[mission.tier]) {
            tierProgress[mission.tier] = { total: 0, completed: 0 }
          }
          tierProgress[mission.tier].total++
          if (mission.status === 'completed') {
            tierProgress[mission.tier].completed++
          }
        })

        setMissions(missionsWithStatus.slice(0, 5)) // Show top 5
        setProgressByTier(tierProgress)
        setError(null)
      } catch (err) {
        console.error('Error loading mission progress:', err)
        setError('Failed to load mission progress')
      } finally {
        setLoading(false)
      }
    }

    loadMissionData()
  }, [user])

  // Calculate overall progress
  const totalMissions = missions.length
  const completedMissions = missions.filter(m => m.status === "completed").length
  const overallProgress = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
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
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    )
  }

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
        {missions.length === 0 ? (
          <div className="px-5 py-8 text-center text-muted-foreground text-sm">
            No missions available yet. Check back soon!
          </div>
        ) : (
          missions.map((mission) => (
            <div
              key={mission.id}
              className={`px-5 py-4 flex items-center gap-4 ${
                mission.status === "locked" ? "opacity-50" : ""
              }`}
            >
              {/* Status Icon */}
              <div className="shrink-0">
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
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-muted/30">
        <Link to="/missions" className="text-xs text-primary hover:underline px-2 py-1 inline-block">
          View all missions
        </Link>
      </div>
    </div>
  )
}
