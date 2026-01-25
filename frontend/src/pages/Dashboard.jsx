import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import AppHeader from "@/components/app-header"
import { SatelliteOverview } from "@/components/dashboard/satellite-overview"
import { MissionProgress } from "@/components/dashboard/mission-progress"
import { SystemMetrics } from "@/components/dashboard/system-metrics"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, Satellite, Radio } from "lucide-react"
import { Footer } from "@/components/footer"

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      navigate("/")
    }
  }, [user, loading, navigate])

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
                <div className="hidden md:block text-right">
                  <div className="text-xs text-muted-foreground">MISSION TIME</div>
                  <div className="font-mono text-foreground">
                    {new Date().toLocaleTimeString('en-US', { hour12: false })} UTC
                  </div>
                </div>
              </div>
            </div>

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
