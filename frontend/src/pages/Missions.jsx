import { useState, useMemo, useEffect } from "react"
import { Helmet } from "react-helmet-async"
import { Link } from "react-router-dom"
import AppHeader from "@/components/app-header"
import { MissionFilters } from "@/components/missions/mission-filters"
import { MissionGrid } from "@/components/missions/mission-grid"
import { MissionStats } from "@/components/missions/mission-stats"
import { fetchPublishedScenarios, calculateMissionStats } from "@/lib/firebase/scenariosService"
import { fetchUserProgress, getInProgressSession } from "@/lib/firebase/userProgressService"
import { Footer } from "@/components/footer"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Rocket, X, Loader2, AlertCircle, Satellite, Radio, Play } from "lucide-react"

export default function Missions() {
  const { user } = useAuth()
  
  // State for Firestore data
  const [allMissions, setAllMissions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [inProgressSession, setInProgressSession] = useState(null)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [userSessions, setUserSessions] = useState([])
  
  // Load missions from Firestore on mount
  useEffect(() => {
    async function loadMissions() {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch scenarios from Firestore
        const scenarios = await fetchPublishedScenarios()
        
        setAllMissions(scenarios)
        setStats(calculateMissionStats(scenarios))
      } catch (err) {
        console.error('Error loading missions:', err)
        setError(err.message)
        setAllMissions([])
        setStats(null)
      } finally {
        setLoading(false)
      }
    }
    
    loadMissions()
  }, [])
  
  // Load user's in-progress session
  useEffect(() => {
    async function loadInProgressSession() {
      if (!user) {
        setInProgressSession(null)
        return
      }
      
      try {
        setLoadingSessions(true)
        const sessions = await fetchUserProgress(user.uid)
        setUserSessions(sessions) // Store all sessions
        const activeSession = getInProgressSession(sessions)
        setInProgressSession(activeSession)
      } catch (err) {
        console.error('Error loading in-progress session:', err)
        setInProgressSession(null)
        setUserSessions([])
      } finally {
        setLoadingSessions(false)
      }
    }
    
    loadInProgressSession()
  }, [user])
  
  // Filter and sort state
  const [activeCategory, setActiveCategory] = useState("All Missions")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("default")
  const [showInfoBanner, setShowInfoBanner] = useState(!user)
  
  // Sort missions based on selected sort option
  const sortedMissions = useMemo(() => {
    const sorted = [...allMissions]
    
    switch (sortBy) {
      case "difficulty-asc":
        sorted.sort((a, b) => a.difficulty - b.difficulty)
        break
      case "difficulty-desc":
        sorted.sort((a, b) => b.difficulty - a.difficulty)
        break
      case "duration-asc":
        sorted.sort((a, b) => a.estimatedDuration - b.estimatedDuration)
        break
      case "duration-desc":
        sorted.sort((a, b) => b.estimatedDuration - a.estimatedDuration)
        break
      case "mp-desc":
        sorted.sort((a, b) => b.rewards.mp - a.rewards.mp)
        break
      default:
        // Default: Sort by difficulty (beginner to advanced), then by tier, then by duration
        sorted.sort((a, b) => {
          // First sort by difficulty (1=BEGINNER, 3=INTERMEDIATE, 5=ADVANCED)
          if (a.difficulty !== b.difficulty) {
            return a.difficulty - b.difficulty
          }
          // Then by category/tier if difficulty is the same
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category)
          }
          // Finally by duration (shorter first)
          return a.estimatedDuration - b.estimatedDuration
        })
        break
    }
    
    return sorted
  }, [allMissions, sortBy])

  return (
    <>
      <Helmet>
        <title>Missions - GroundCTRL</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <main className="flex-1 p-6">
          <div className="max-w-400 mx-auto space-y-6">
            {/* Page Title, CTAs, and Info Banner */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Page Title */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">Training Missions</h1>
                <p className="text-muted-foreground">
                  Master satellite operations through hands-on training scenarios
                </p>
                {!user && (
                  <div className="flex items-center gap-2 mt-3">
                    <Link to="/?view=login">
                      <Button size="sm" className="text-xs">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/?view=register">
                      <Button variant="outline" size="sm" className="text-xs bg-transparent">
                        Create Account
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Info Banner for logged-out users (on same row) */}
              {!user && showInfoBanner && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3 lg:flex-1">
                  <Rocket className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium mb-1">Sign in to track your progress</p>
                    <p className="text-xs text-muted-foreground">
                      Create a free account to save your mission progress, earn Mission Points, and unlock advanced satellite operations.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowInfoBanner(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {/* Stats for logged-in users */}
              {user && stats && <MissionStats stats={stats} />}
            </div>

            {/* Progress bar - Only show when logged in and stats loaded */}
            {user && stats && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Overall Progress</span>
                  <span className="text-sm font-mono text-muted-foreground">{stats.progressPercent}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${stats.progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Continue Mission Banner - Show when user has an in-progress session */}
            {user && inProgressSession && !loadingSessions && (
              <div className="bg-primary/10 border-2 border-primary/40 rounded-lg p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Play className="w-6 h-6 text-primary animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground mb-1">
                        Mission In Progress
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        You have an active mission waiting for you. Continue where you left off!
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        Session ID: {inProgressSession.id.substring(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <Link to={`/mission-briefing/${inProgressSession.scenario_id}?session=${inProgressSession.id}`}>
                    <Button size="lg" className="gap-2">
                      <Play className="w-4 h-4" />
                      Continue Mission
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground">Loading training missions...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-destructive font-medium mb-1">🛸 Houston, We Have a Problem</p>
                  <p className="text-xs text-muted-foreground">
                    Our mission control servers are experiencing a momentary communications blackout. 
                    Please stand by while we reestablish the uplink.
                  </p>
                  {/* Only show technical details in development */}
                  {import.meta.env.DEV && (
                    <p className="text-xs text-muted-foreground/60 mt-2 font-mono">
                      Dev: {error}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Empty State - No Missions */}
            {!loading && !error && allMissions.length === 0 && (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="flex items-center justify-center gap-4">
                    <Satellite className="w-16 h-16 text-primary animate-pulse" />
                    <Radio className="w-12 h-12 text-muted-foreground" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-foreground">
                      📡 No Missions Detected
                    </h3>
                    <p className="text-muted-foreground">
                      Mission Control is currently calibrating our training scenarios. 
                      Like SpaceX waiting for optimal launch conditions, we're preparing 
                      the perfect missions for your journey to becoming a satellite operator.
                    </p>
                    <p className="text-sm text-primary font-mono">
                      "The universe is under no obligation to make sense to you." - Neil deGrasse Tyson
                    </p>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      onClick={() => window.location.reload()} 
                      variant="outline"
                      className="gap-2"
                    >
                      <Rocket className="w-4 h-4" />
                      Refresh Mission Database
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Filters - Only show when not loading */}
            {!loading && (
              <MissionFilters 
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
                isLoggedOut={!user}
              />
            )}

            {/* Mission Grid - Only show when not loading */}
            {!loading && (
              <MissionGrid 
                missions={sortedMissions}
                selectedCategory={activeCategory}
                searchQuery={searchQuery}
                isLoggedOut={!user}
                userSessions={user ? userSessions : []}
              />
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
