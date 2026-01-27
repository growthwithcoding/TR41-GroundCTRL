"use client"

import { useState, useEffect } from "react"
import { Satellite, Rocket, Radio, Gauge, Play, Clock, Lock, Loader2, AlertCircle } from "lucide-react"
import { AuthForm } from "@/components/auth-form"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { fetchPublishedScenarios } from "@/lib/firebase/scenariosService"
import { 
  fetchUserProgress, 
  getCompletedScenarioCodes, 
  getInProgressSession,
  getActiveSession,
  getNextAvailableMission,
  getNextLockedMission
} from "@/lib/firebase/userProgressService"

export function SimulatorGrid({ authView, onAuthViewChange, authError }) {
  const { user } = useAuth()
  const [scenarios, setScenarios] = useState([])
  const [userSessions, setUserSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch scenarios and user progress when user logs in
  useEffect(() => {
    async function loadData() {
      if (!user) {
        setScenarios([])
        setUserSessions([])
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch scenarios first (this should work)
        const scenariosData = await fetchPublishedScenarios()
        setScenarios(scenariosData)

        // Try to fetch user progress, but don't fail if it errors
        try {
          const sessionsData = await fetchUserProgress(user.uid)
          setUserSessions(sessionsData)
        } catch (progressErr) {
          console.warn('Could not load user progress (this is okay):', progressErr)
          // Continue without user progress - just show all missions
          setUserSessions([])
        }
      } catch (err) {
        console.error('Error loading missions:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  // Calculate mission suggestions based on user progress
  const getMissionSuggestions = () => {
    if (!user || scenarios.length === 0) {
      return { inProgressMission: null, inProgressSession: null, nextMission: null, lockedMission: null }
    }

    const completedCodes = getCompletedScenarioCodes(userSessions)
    
    // Use getActiveSession to include both IN_PROGRESS and NOT_STARTED sessions
    const activeSession = getActiveSession(userSessions)
    
    // Find the active mission (in-progress or not-started)
    let inProgressMission = null
    if (activeSession) {
      inProgressMission = scenarios.find(
        s => s._firestore?.code === activeSession.scenario_id || s.id === activeSession.scenario_id
      )
    }

    // Find next available mission (exclude the active session's scenario)
    const nextMission = getNextAvailableMission(
      scenarios, 
      completedCodes, 
      activeSession?.scenario_id
    )

    // Find next locked mission if no available mission
    const lockedMission = !nextMission ? getNextLockedMission(scenarios, completedCodes) : null

    return { inProgressMission, inProgressSession: activeSession, nextMission, lockedMission }
  }

  const { inProgressMission, inProgressSession, nextMission, lockedMission } = getMissionSuggestions()

  return (
    <main className="flex-1 flex">
      {/* Hero Section */}
      <section className="flex-1 bg-background flex flex-col items-center justify-center px-8 py-16 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-3xl text-center space-y-6 relative z-10">
          {/* Logo and Title */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/images/GroundCTRL.png" alt="GroundCTRL Logo" className="h-16 w-16 object-contain" style={{ pointerEvents: 'none' }} />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground text-balance tracking-tight">
            GroundCTRL
          </h1>
          <p className="text-xl md:text-2xl text-primary font-medium text-balance">
            Virtual Satellite Simulator
          </p>
          
          <p className="text-lg text-foreground/80 leading-relaxed text-pretty max-w-2xl mx-auto">
            GroundCTRL is a browser-based training simulator that introduces users to the fundamentals of satellite
            operations through interactive, guided missions. Players manage a virtual Earth-orbiting satellite using a
            simplified mission console, real-time AI guidance, and structured objectives that blend learning with
            gameplay.
          </p>
          
          <p className="text-base text-muted-foreground text-pretty max-w-2xl mx-auto">
            Designed for space enthusiasts, students, and new operators, the platform provides visual feedback,
            step-by-step tutorials, and progress tracking. The simulator runs in modern desktop browsers and aims to
            make satellite operations education engaging, accessible, and beginner-friendly.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
              <Rocket className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Orbital Mechanics</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
              <Radio className="w-4 h-4 text-status-nominal" />
              <span className="text-sm font-medium text-foreground">Real-time Telemetry</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
              <Gauge className="w-4 h-4 text-status-warning" />
              <span className="text-sm font-medium text-foreground">Mission Control</span>
            </div>
          </div>
          
          {/* Tech stack */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">React</span>
            <span className="px-3 py-1 rounded-full bg-status-nominal/10 text-status-nominal font-medium">Node.js</span>
            <span className="px-3 py-1 rounded-full bg-status-warning/10 text-status-warning font-medium">Firebase</span>
          </div>
        </div>
      </section>

      {/* Auth Sidebar or Mission Suggestions */}
      <aside className="w-[25%] min-w-[320px] border-l border-border bg-card flex items-center justify-center p-8">
        <div className="w-full space-y-4">
          {authError && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
              {authError}
            </div>
          )}
          
          {!user ? (
            <AuthForm view={authView} onViewChange={onAuthViewChange} />
          ) : (
            <div className="space-y-6">
              {/* Welcome Message */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  Welcome back, {user.displayName || "Operator"}!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ready for your next mission?
                </p>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <Button asChild className="w-full" size="lg">
                  <Link to="/dashboard">
                    <Gauge className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link to="/missions">
                    <Rocket className="w-4 h-4 mr-2" />
                    Browse Missions
                  </Link>
                </Button>
              </div>

              {/* Suggested Missions */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
                  Suggested Missions
                </h3>

                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-destructive font-semibold">🛰️ Signal Lost</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Like a satellite in eclipse, our connection to Mission Control is temporarily dark.
                      </p>
                      {/* Only show technical details in development */}
                      {import.meta.env.DEV && (
                        <p className="text-xs text-muted-foreground/60 mt-1 font-mono">
                          Dev: {error}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Empty State - No Missions Available */}
                {!loading && !error && scenarios.length === 0 && (
                  <div className="bg-card border border-border rounded-lg p-6 text-center">
                    <Satellite className="w-12 h-12 text-muted-foreground mx-auto mb-3 animate-pulse" />
                    <h4 className="text-sm font-semibold text-foreground mb-2">
                      🚀 Mission Database Offline
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Our training scenarios are currently being deployed. 
                      Check back soon for new missions!
                    </p>
                  </div>
                )}

                {/* Active Mission - Show if IN_PROGRESS (not NOT_STARTED) */}
                {!loading && inProgressMission && inProgressSession && inProgressSession.status === 'IN_PROGRESS' && (
                  <Card className="border-primary/40 bg-primary/5 hover:border-primary/60 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Play className="w-4 h-4 text-primary animate-pulse" />
                        {inProgressMission.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {inProgressMission.difficultyLabel} • {inProgressMission.estimatedDuration} min • In Progress
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-xs text-muted-foreground mb-3">
                        {inProgressMission.description}
                      </p>
                      <Button asChild size="sm" className="w-full">
                        <Link to={`/mission-briefing/${inProgressMission.id}?session=${inProgressSession.id}`}>
                          Continue Mission
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Next Available Mission - Show even if there's in-progress */}
                {!loading && nextMission && (
                  <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Rocket className="w-4 h-4 text-primary" />
                        {nextMission.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {nextMission.difficultyLabel} • {nextMission.estimatedDuration} min
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-xs text-muted-foreground mb-3">
                        {nextMission.description}
                      </p>
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link to={`/mission-briefing/${nextMission.id}`}>
                          View Briefing
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Locked Mission (if no available mission) */}
                {!loading && !nextMission && lockedMission && (
                  <Card className="border-border/50 opacity-75">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        {lockedMission.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {lockedMission.difficultyLabel} • {lockedMission.estimatedDuration} min • Locked
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-xs text-muted-foreground mb-3">
                        {lockedMission.description}
                      </p>
                      <div className="text-xs text-amber-600 dark:text-amber-500 mb-3">
                        Complete required missions to unlock
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full" disabled>
                        <span>Locked</span>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* No missions available */}
                {!loading && !inProgressMission && !nextMission && !lockedMission && scenarios.length > 0 && (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">
                      You've completed all available missions! 🎉
                    </p>
                  </div>
                )}

                {/* Browse all missions link */}
                {!loading && scenarios.length > 0 && (
                  <Button asChild variant="ghost" size="sm" className="w-full">
                    <Link to="/missions">
                      Browse All Missions →
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </main>
  )
}
