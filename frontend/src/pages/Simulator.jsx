import { useMemo, useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import AppHeader from "@/components/app-header"
import { FloatingNovaChat } from "@/components/nova/FloatingNovaChat"
import { CommandConsoleHUD } from "@/components/simulator/command-console-hud"
import { MissionStepsPanel } from "@/components/simulator/mission-steps-panel"
import { SimulatorFooter } from "@/components/simulator/simulator-footer"
import { MissionStartModal } from "@/components/simulator/mission-start-modal"
import { AlertPanel } from "@/components/simulator/alert-panel"
import { CommandQueueStatus } from "@/components/simulator/command-queue-status"
import { GroundStationIndicator } from "@/components/simulator/ground-station-indicator"
import { TimeControlDisplay } from "@/components/simulator/time-control-display"
import { OperatorPrompt } from "@/components/simulator/operator-prompt"
import { PerformanceMetrics } from "@/components/simulator/performance-metrics"
import { VisualizationSwitcher } from "@/components/simulator/views"
import { useAuth } from "@/hooks/use-auth"
import { useSimulatorState } from "@/contexts/SimulatorStateContext"
import { useWebSocket } from "@/contexts/WebSocketContext"
import { fetchSessionById, markSessionInProgress } from "@/lib/firebase/sessionService"
import { Loader2, AlertCircle, Satellite, Radio } from "lucide-react"

export default function Simulator() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const sessionIdParam = searchParams.get("session")
  
  // Loading and error states
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState(null)
  const [sessionData, setSessionData] = useState(null)
  
  // Use simulator state context
  const { 
    missionStarted, 
    initializeSession, 
    startMission,
    sessionId: contextSessionId,
    connected 
  } = useSimulatorState()
  
  // Import WebSocket context to manually connect
  const { connect: connectWebSocket, disconnect: disconnectWebSocket } = useWebSocket()

  const handleStartMission = async () => {
    try {
      // Mark session as IN_PROGRESS when user clicks "Start Mission"
      if (sessionIdParam) {
        await markSessionInProgress(sessionIdParam)
      }
      startMission()
    } catch (error) {
      console.error('Error marking session in progress:', error)
      // Continue anyway - don't block mission start
      startMission()
    }
  }
  
  // Connect WebSocket when simulator page loads
  useEffect(() => {
    console.log('[Simulator] Page mounted - connecting WebSocket...')
    connectWebSocket()
    
    return () => {
      console.log('[Simulator] Page unmounting - disconnecting WebSocket...')
      disconnectWebSocket()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount/unmount
  
  // Load SESSION data from Firestore (contains snapshot of scenario/satellite data)
  useEffect(() => {
    async function loadSession() {
      if (!sessionIdParam) {
        setSessionError('No session ID provided')
        setSessionLoading(false)
        return
      }
      
      try {
        setSessionLoading(true)
        setSessionError(null)
        
        // Fetch the session document which contains all scenario data as a snapshot
        const session = await fetchSessionById(sessionIdParam)
        
        if (!session) {
          setSessionError('Session not found')
          setSessionLoading(false)
          return
        }
        
        setSessionData(session)
        setSessionLoading(false)
      } catch (err) {
        console.error('Error loading session:', err)
        setSessionError(err.message)
        setSessionLoading(false)
      }
    }
    
    loadSession()
  }, [sessionIdParam])
  
  // Initialize simulator state when session is loaded
  useEffect(() => {
    if (user && sessionData && !contextSessionId) {
      // Use the session data which contains the scenario snapshot
      const savedProgress = {
        currentStepOrder: sessionData.currentStepOrder || 0,
        completedSteps: sessionData.completedSteps || [],
        elapsedTime: sessionData.elapsedTime || 0
      }
      
      console.log('Restoring session progress:', savedProgress)
      
      const steps = sessionData.steps?.map((step, idx) => {
        const stepId = step.id || idx + 1
        const isCompleted = savedProgress.completedSteps.includes(stepId)
        const isActive = idx === savedProgress.currentStepOrder && !isCompleted
        
        return {
          id: stepId,
          text: step.objective || step.text || step.description,
          requiredCommands: step.requiredCommands || [],
          active: isActive,
          completed: isCompleted
        }
      }) || []
      
      // Create initial telemetry from session satellite data
      // Always provide default telemetry even if satellite data is missing
      const satelliteData = sessionData.satellite || {}
      const initialTelemetry = {
        timestamp: Date.now(),
        orbit: {
          altitude_km: satelliteData.orbit?.altitude_km || 415,
          perigee_km: satelliteData.orbit?.altitude_km || 415,
          apogee_km: satelliteData.orbit?.altitude_km || 415,
          inclination_degrees: satelliteData.orbit?.inclination_degrees || 51.6,
          period_minutes: 92.7,
          eccentricity: satelliteData.orbit?.eccentricity || 0.0
        },
        subsystems: {
          power: {
            batterySoc: satelliteData.power?.currentCharge_percent || 95,
            solarArrayOutput: satelliteData.power?.solarPower_watts || 1800,
            status: 'nominal'
          },
          thermal: {
            temperature_celsius: satelliteData.thermal?.temperature_celsius || 20,
            status: 'nominal'
          },
          propulsion: {
            fuelRemaining: satelliteData.propulsion?.fuel_percent || 100,
            status: 'nominal'
          }
        },
        communications: {
          status: 'nominal',
          signalStrength: -85,
          groundStation: 'Goldstone'
        }
      }
      
      initializeSession(
        sessionData.id, // Use the actual session ID from Firestore
        sessionData.scenario_id,
        {
          name: sessionData.scenario?.title || 'Mission',
          steps: steps,
          satellite: sessionData.satellite, // Include satellite snapshot
          savedProgress: savedProgress // Pass saved progress
        },
        initialTelemetry // Provide initial telemetry so UI isn't stuck loading
      )
    }
  }, [user, sessionData, contextSessionId, initializeSession])

  // Redirect to landing page with error if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/?error=auth_required")
    }
  }, [user, authLoading, navigate])

  // Handle no session ID
  if (!sessionIdParam) {
    return (
      <>
        <Helmet>
          <title>Simulator - GroundCTRL</title>
        </Helmet>
        <div className="h-screen flex flex-col bg-background">
          <AppHeader />
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="bg-card border border-border rounded-lg p-12 text-center max-w-md">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">No Session ID</h2>
              <p className="text-muted-foreground mb-4">
                A session ID is required to access the simulator. Please start a mission from the missions page.
              </p>
              <button
                onClick={() => navigate('/missions')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Back to Missions
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Auth loading
  if (authLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Initializing mission control...</p>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return null
  }
  
  // Session loading
  if (sessionLoading) {
    return (
      <>
        <Helmet>
          <title>Loading Mission - GroundCTRL</title>
        </Helmet>
        <div className="h-screen flex flex-col bg-background">
          <AppHeader />
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading session data...</p>
          </div>
        </div>
      </>
    )
  }
  
  // Session error
  if (sessionError || !sessionData) {
    return (
      <>
        <Helmet>
          <title>Error - GroundCTRL</title>
        </Helmet>
        <div className="h-screen flex flex-col bg-background">
          <AppHeader />
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-12 text-center max-w-2xl">
              <div className="flex items-center justify-center gap-4 mb-6">
                <Satellite className="w-16 h-16 text-destructive animate-pulse" />
                <Radio className="w-12 h-12 text-muted-foreground" />
              </div>
              
              <h2 className="text-2xl font-bold text-foreground mb-3">
                📡 Session Data Unavailable
              </h2>
              <p className="text-muted-foreground mb-4">
                Houston, we're experiencing a communications blackout with the session database. 
                The session may have expired or been deleted. Please start a new mission.
              </p>
              
              {import.meta.env.DEV && sessionError && (
                <p className="text-xs text-muted-foreground/60 font-mono mb-4">
                  Dev: {sessionError}
                </p>
              )}
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Retry Connection
                </button>
                <button
                  onClick={() => navigate('/missions')}
                  className="px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted"
                >
                  Back to Missions
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>Simulator - GroundCTRL</title>
      </Helmet>
      <div className="h-screen min-h-150 flex flex-col bg-background overflow-hidden">
        <AppHeader />
        
        {/* Mission Steps Panel - Shows current objectives */}
        {missionStarted && <MissionStepsPanel />}
        
        {/* Mission Control Enhancement - Ground Station Indicator + Controls */}
        {missionStarted && (
          <div className="px-4 py-2 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <GroundStationIndicator />
              <div className="flex items-center gap-2">
                <TimeControlDisplay sessionId={contextSessionId || sessionIdParam} />
                <PerformanceMetrics sessionId={contextSessionId || sessionIdParam} />
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* Advanced Satellite Visualization with 2D/3D Projection Switching - Now Full Width */}
          <div className="flex-1 flex flex-col min-w-0">
            <VisualizationSwitcher
              altitude={sessionData?.satellite?.orbit?.altitude_km || 415}
              inclination={sessionData?.satellite?.orbit?.inclination_degrees || 51.6}
              eccentricity={sessionData?.satellite?.orbit?.eccentricity || 0.0001}
              raan={sessionData?.satellite?.orbit?.raan_degrees || 0}
              defaultView="2d"
              showToggle={true}
              className="h-full w-full"
            />
          </div>
          
          <CommandConsoleHUD />
          
          {/* Mission Control Enhancement - Command Queue Status Overlay */}
          {missionStarted && (
            <div className="absolute top-4 right-4 z-10 w-80">
              <CommandQueueStatus />
            </div>
          )}
        </div>
        
        {/* Mission Control Enhancement - Enhanced Footer (Full Width) */}
        <SimulatorFooter 
          missionStarted={missionStarted} 
          sessionId={contextSessionId || sessionIdParam}
          satellite={sessionData?.satellite}
        />
        
        {/* Alert Panel - displays system alerts */}
        <AlertPanel />
        
        {/* Mission Control Enhancement - Operator Prompt for time acceleration */}
        {missionStarted && (
          <OperatorPrompt sessionId={contextSessionId || sessionIdParam} />
        )}
        
        {/* Mission Start Modal - shows before mission begins */}
        {!missionStarted && sessionData && (
          <MissionStartModal 
            missionId={sessionData.scenario_id} 
            onStart={handleStartMission}
          />
        )}
        
        {/* Floating NOVA Chat - Only show when mission started */}
        {missionStarted && (
          <FloatingNovaChat 
            sessionId={contextSessionId || sessionIdParam} 
            stepId={sessionData?.scenario_id}
            context="simulator"
            position="left"
          />
        )}
      </div>
    </>
  )
}
