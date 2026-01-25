import { useMemo, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import AppHeader from "@/components/app-header"
import { NovaAssistant } from "@/components/simulator/nova-assistant"
import { MissionPanel } from "@/components/simulator/mission-panel"
import { CommandConsole } from "@/components/simulator/command-console"
import { SimulatorFooter } from "@/components/simulator/simulator-footer"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

export default function Simulator() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [searchParams] = useSearchParams()
  const missionId = searchParams.get("mission") || "default"
  
  // Generate a stable session ID for this simulator session
  const sessionId = useMemo(() => `simulator-${missionId}-${Date.now()}`, [missionId])

  // Redirect to landing page with error if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/?error=auth_required")
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
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
        <title>Simulator - GroundCTRL</title>
      </Helmet>
      <div className="h-screen min-h-150 flex flex-col bg-background overflow-hidden">
        <AppHeader />
        <div className="flex-1 flex overflow-hidden min-h-0">
          <NovaAssistant sessionId={sessionId} stepId={missionId} />
          <MissionPanel />
          <CommandConsole />
        </div>
        <SimulatorFooter />
      </div>
    </>
  )
}
