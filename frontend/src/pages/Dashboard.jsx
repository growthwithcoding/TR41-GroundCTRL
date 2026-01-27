import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import AppHeader from "@/components/app-header"
import { SatelliteOverview } from "@/components/dashboard/satellite-overview"
import { MissionProgress } from "@/components/dashboard/mission-progress"
import { SystemMetrics } from "@/components/dashboard/system-metrics"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, Satellite, Radio, Clock, Play } from "lucide-react"
import { Footer } from "@/components/footer"
import { fetchUserProgress, getTotalMissionTime, formatMissionTime, getInProgressSession } from "@/lib/firebase/userProgressService"
import { Link } from "react-router-dom"

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [missionTime, setMissionTime] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [loadingMissionTime, setLoadingMissionTime] = useState(true)
  const [inProgressSession, setInProgressSession] = useState(null)

  useEffect(() => {
    if (!loading && !user) {
      navigate("/")
    }
  }, [user, loading, navigate])

  // Fetch user's mission time and in-progress session from scenario sessions
  useEffect(() => {
    async function loadMissionData() {
      if (!user) return
      
      try {
        setLoadingMissionTime(true)
        const sessions = await fetchUserProgress(user.uid)
        const totalTime = getTotalMissionTime(sessions)
        setMissionTime(totalTime)
        
        // Get in-progress session
        const activeSession = getInProgressSession(sessions)
        setInProgressSession(activeSession)
      } catch (error) {
        console.error('Error loading mission data:', error)
      } finally {
        setLoadingMissionTime(false)
      }
    }

    loadMissionData()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - GroundCTRL</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <main className="flex-1 p-6">
          <div className="max-w-400 mx-auto space-y-6">
            {/* Mission Control Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome back, <span className="text-primary">{user.displayName || user.email?.split("@")[0]}</span>
                </h1>
                <p className="text-muted-foreground text-sm">
                  Operator Dashboard - All systems nominal
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border">
                  <Radio className="h-4 w-4 text-green-500" />
                  <div className="text-xs">
                    <div className="text-muted-foreground">UPLINK STATUS</div>
                    <div className="font-mono text-green-500">CONNECTED</div>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border">
                  <Clock className="h-4 w-4 text-primary" />
                  <div className="text-xs">
                    <div className="text-muted-foreground">LOGGED MISSION TIME</div>
                    <div className="font-mono text-foreground">
                      {loadingMissionTime ? (
                        <Loader2 className="h-3 w-3 animate-spin inline" />
                      ) : (
                        formatMissionTime(missionTime)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Continue Mission Banner - Show when user has an in-progress session */}
            {inProgressSession && !loadingMissionTime && (
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
                    <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Continue Mission
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* Top row - Overview cards */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <SystemMetrics />
            </div>
            
            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column - Satellite visualization */}
              <div className="lg:col-span-2 space-y-6">
                <SatelliteOverview />
                <MissionProgress />
              </div>
              
              {/* Right column - Activity and actions */}
              <div className="space-y-6">
                <QuickActions />
                <RecentActivity />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
