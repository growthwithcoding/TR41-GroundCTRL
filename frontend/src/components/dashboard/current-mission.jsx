"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Play, Target, CheckCircle2, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { fetchPublishedScenarios } from "@/lib/firebase/scenariosService"
import { fetchUserProgress, getCompletedScenarioCodes, getInProgressSession } from "@/lib/firebase/userProgressService"

/**
 * Current/Suggested Mission Component
 * 
 * Shows:
 * 1. Active mission with progress + "Continue" CTA if user has IN_PROGRESS session
 * 2. Suggested next mission if no active session (respects tier locks and prerequisites)
 * 3. Completion message if all missions are complete
 */
export function CurrentMission() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [inProgressSession, setInProgressSession] = useState(null)
  const [suggestedMission, setSuggestedMission] = useState(null)
  const [scenario, setScenario] = useState(null)
  const [allComplete, setAllComplete] = useState(false)

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

        // Check for in-progress session
        const activeSession = getInProgressSession(sessions)
        
        if (activeSession) {
          // User has active mission - show progress
          setInProgressSession(activeSession)
          
          // Find the scenario details
          const activeScenario = scenarios.find(s => s.id === activeSession.scenario_id)
          setScenario(activeScenario)
        } else {
          // No active session - suggest next mission
          const completedCodes = getCompletedScenarioCodes(sessions)
          const suggested = suggestNextMission(scenarios, completedCodes)
          
          if (suggested) {
            setSuggestedMission(suggested)
          } else {
            // All missions complete!
            setAllComplete(true)
          }
        }
      } catch (error) {
        console.error('Error loading mission data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMissionData()
  }, [user])

  /**
   * Suggest next available mission based on:
   * 1. Tier progression (ROOKIE_PILOT -> MISSION_SPECIALIST -> MISSION_COMMANDER)
   * 2. Prerequisites met
   * 3. Not yet completed
   */
  function suggestNextMission(scenarios, completedCodes) {
    const tierOrder = ['ROOKIE_PILOT', 'MISSION_SPECIALIST', 'MISSION_COMMANDER']
    
    // Filter to available scenarios only
    const availableScenarios = scenarios.filter(scenario => {
      // Must be active
      if (!scenario.isActive) return false
      
      // Must not be completed
      if (completedCodes.has(scenario.id)) return false
      
      // Check prerequisites
      const prerequisites = scenario._firestore?.prerequisites || []
      const prerequisitesMet = prerequisites.every(prereq => completedCodes.has(prereq))
      
      return prerequisitesMet
    })

    if (availableScenarios.length === 0) {
      return null // All missions complete
    }

    // Sort by tier order, then by name
    availableScenarios.sort((a, b) => {
      const tierA = tierOrder.indexOf(a._firestore?.tier) ?? 999
      const tierB = tierOrder.indexOf(b._firestore?.tier) ?? 999
      
      if (tierA !== tierB) {
        return tierA - tierB
      }
      
      return a.name.localeCompare(b.name)
    })

    // Return first available mission
    return availableScenarios[0]
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  // Show in-progress mission with progress
  if (inProgressSession && scenario) {
    const progress = inProgressSession.completedSteps && inProgressSession.totalSteps
      ? Math.round((inProgressSession.completedSteps / inProgressSession.totalSteps) * 100)
      : 0

    return (
      <div className="bg-primary/10 border-2 border-primary/40 rounded-lg p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Play className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-foreground">
                  Mission In Progress
                </h3>
                <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded">
                  {progress}%
                </span>
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {scenario.name}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {scenario.description}
              </p>
              
              {/* Progress bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              {inProgressSession.completedSteps && inProgressSession.totalSteps && (
                <p className="text-xs text-muted-foreground mt-2">
                  {inProgressSession.completedSteps} of {inProgressSession.totalSteps} steps completed
                </p>
              )}
            </div>
          </div>
          <Link to={`/mission-briefing/${inProgressSession.scenario_id}?session=${inProgressSession.id}`}>
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium flex items-center gap-2 whitespace-nowrap">
              <Play className="w-5 h-5" />
              Continue Mission
            </button>
          </Link>
        </div>
      </div>
    )
  }

  // Show suggested mission
  if (suggestedMission) {
    const tierLabels = {
      'ROOKIE_PILOT': 'Rookie Pilot',
      'MISSION_SPECIALIST': 'Mission Specialist',
      'MISSION_COMMANDER': 'Mission Commander'
    }

    const difficultyLabels = {
      'BEGINNER': 'Beginner',
      'INTERMEDIATE': 'Intermediate',
      'ADVANCED': 'Advanced'
    }

    const tier = suggestedMission._firestore?.tier || 'ROOKIE_PILOT'
    const difficulty = suggestedMission._firestore?.difficulty || 'BEGINNER'

    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-foreground">
                  Suggested Mission
                </h3>
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {suggestedMission.name}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {suggestedMission.description}
              </p>
              
              {/* Mission metadata */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="font-medium">{tierLabels[tier]}</span>
                </span>
                <span>•</span>
                <span>{difficultyLabels[difficulty]}</span>
                <span>•</span>
                <span>{suggestedMission.estimatedDuration || 15} min</span>
              </div>
            </div>
          </div>
          <Link to={`/mission-briefing/${suggestedMission.id}`}>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 whitespace-nowrap">
              <Play className="w-5 h-5" />
              Start Mission
            </button>
          </Link>
        </div>
      </div>
    )
  }

  // All missions complete!
  if (allComplete) {
    return (
      <div className="bg-green-500/10 border-2 border-green-500/40 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground mb-1">
              All Missions Complete!
            </h3>
            <p className="text-sm text-muted-foreground">
              Congratulations! You've completed all available training missions. New missions coming soon!
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
