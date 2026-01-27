import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import AppHeader from "@/components/app-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Zap, 
  Play, 
  Volume2, 
  VolumeOff,
  Clock,
  Target,
  Star,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Rocket,
  Satellite,
  Loader2,
  Compass,
  RotateCw,
  Sun,
  Radio,
  Shield,
  Camera,
  Boxes,
  ArrowLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchPublishedScenarios, fetchScenarioById } from "@/lib/firebase/scenariosService"
import { createSession } from "@/lib/firebase/sessionService"
import { useAuth } from "@/hooks/use-auth"

// Icon mapping for scenarios
const iconMap = {
  'Compass': Compass,
  'Zap': Zap,
  'RotateCw': RotateCw,
  'Sun': Sun,
  'Radio': Radio,
  'Shield': Shield,
  'Target': Target,
  'Camera': Camera,
  'Boxes': Boxes,
  'Rocket': Rocket,
}

// Background Stars Component
function StarField() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Small stars */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(1px 1px at 20px 30px, hsl(var(--muted-foreground)), transparent),
            radial-gradient(1px 1px at 60px 70px, hsl(var(--muted-foreground)), transparent),
            radial-gradient(1px 1px at 50px 120px, hsl(var(--muted-foreground)), transparent),
            radial-gradient(1px 1px at 120px 40px, hsl(var(--muted-foreground)), transparent),
            radial-gradient(1px 1px at 150px 90px, hsl(var(--muted-foreground)), transparent)`,
          backgroundSize: '200px 200px',
          animation: 'twinkle 4s ease-in-out infinite'
        }}
      />
      {/* Medium stars */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(1.5px 1.5px at 80px 10px, hsl(var(--muted-foreground)), transparent),
            radial-gradient(1.5px 1.5px at 190px 70px, hsl(var(--muted-foreground)), transparent),
            radial-gradient(1.5px 1.5px at 50px 160px, hsl(var(--muted-foreground)), transparent)`,
          backgroundSize: '300px 300px',
          animation: 'twinkle 6s ease-in-out infinite reverse'
        }}
      />
      {/* Large stars */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `radial-gradient(2px 2px at 120px 80px, hsl(var(--muted-foreground)), transparent),
            radial-gradient(2px 2px at 280px 150px, hsl(var(--muted-foreground)), transparent)`,
          backgroundSize: '400px 400px',
          animation: 'twinkle 8s ease-in-out infinite'
        }}
      />
    </div>
  )
}

export default function MissionBriefingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const existingSessionId = searchParams.get("session")
  
  // State management
  const [phase, setPhase] = useState("briefing") // briefing | countdown | launch | orbit-insertion | complete
  const [countdown, setCountdown] = useState(10)
  const [launchProgress, setLaunchProgress] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [currentObjective, setCurrentObjective] = useState(0)
  const [mission, setMission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [sessionError, setSessionError] = useState(null)
  const [creatingSession, setCreatingSession] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [sessionData, setSessionData] = useState(null)
  
  // If there's an existing session, skip briefing and go straight to simulator
  useEffect(() => {
    if (existingSessionId && user) {
      console.log('Existing session detected, skipping briefing:', existingSessionId)
      navigate(`/simulator?session=${existingSessionId}`)
    }
  }, [existingSessionId, user, navigate])
  
  // Fetch mission data from Firestore
  useEffect(() => {
    async function loadMission() {
      try {
        setLoading(true)
        const scenarios = await fetchPublishedScenarios()
        const foundMission = scenarios.find(s => s.id === id)
        
        if (!foundMission) {
          setLoadError("Mission not found")
          return
        }
        
        // Transform mission data to match briefing page format
        const transformedMission = {
          category: foundMission.category.toUpperCase(),
          title: foundMission.name,
          icon: iconMap[foundMission.icon] || Rocket,
          description: foundMission.description,
          duration: `${foundMission.estimatedDuration} min`,
          objectives: foundMission._firestore?.objectives?.length || 0,
          difficulty: foundMission.difficulty,
          reward: `+${foundMission.rewards.mp} MP`,
          prerequisites: foundMission.prerequisites.length > 0
            ? `Requires completion of: ${foundMission.prerequisites.map(p => p.missionName).join(', ')}`
            : "No prerequisites required.",
          phases: transformMissionPhases(foundMission)
        }
        
        setMission(transformedMission)
      } catch (err) {
        console.error('Error loading mission:', err)
        setLoadError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    loadMission()
  }, [id])
  
  // Transform Firestore objectives into phases
  function transformMissionPhases(mission) {
    const objectives = mission._firestore?.objectives || []
    
    if (objectives.length === 0) {
      return [{
        title: "MISSION OBJECTIVES",
        objectives: [
          { id: 1, title: "Complete the mission", completed: false }
        ]
      }]
    }
    
    // Group objectives into phases (every 2-3 objectives)
    const phases = []
    const phaseSize = Math.ceil(objectives.length / Math.ceil(objectives.length / 3))
    
    for (let i = 0; i < objectives.length; i += phaseSize) {
      const phaseObjectives = objectives.slice(i, i + phaseSize)
      phases.push({
        title: `PHASE ${phases.length + 1}: ${phaseObjectives[0].toUpperCase().substring(0, 20)}...`,
        objectives: phaseObjectives.map((obj, idx) => ({
          id: i + idx + 1,
          title: obj,
          completed: false
        }))
      })
    }
    
    return phases
  }
  
  const MissionIcon = mission?.icon || Rocket
  
  // Get all objectives for cycling
  const allObjectives = mission?.phases?.flatMap(p => p.objectives) || []
  
  // Trigger entrance animations
  useEffect(() => {
    setTimeout(() => setShowContent(true), 100)
  }, [])
  
  // Objective cycling during briefing phase
  useEffect(() => {
    if (phase === "briefing") {
      const interval = setInterval(() => {
        setCurrentObjective((prev) => (prev + 1) % allObjectives.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [phase, allObjectives.length])
  
  // Countdown phase
  useEffect(() => {
    if (phase === "countdown" && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (phase === "countdown" && countdown === 0) {
      setPhase("launch")
    }
  }, [phase, countdown])
  
  // Launch phase
  useEffect(() => {
    if (phase === "launch" && launchProgress < 100) {
      const timer = setInterval(() => {
        setLaunchProgress((prev) => Math.min(prev + 2, 100))
      }, 50)
      return () => clearInterval(timer)
    } else if (phase === "launch" && launchProgress >= 100 && sessionId) {
      // Navigate directly to simulator after launch completes
      const timer = setTimeout(() => {
        navigate(`/simulator?session=${sessionId}`)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [phase, launchProgress, sessionId, navigate])
  
  const handleStartMission = async () => {
    if (!user) {
      alert('Please sign in to start a mission.')
      navigate('/?view=login')
      return
    }
    
    setCreatingSession(true)
    
    try {
      // Fetch the full scenario data
      const scenario = await fetchScenarioById(id)
      
      if (!scenario) {
        throw new Error('Scenario not found')
      }
      
      console.log('Full scenario data:', scenario)
      console.log('Scenario _firestore:', scenario._firestore)
      
      // Get steps from the right location - check both places
      const scenarioSteps = scenario._firestore?.steps || scenario.steps || []
      console.log('Scenario steps:', scenarioSteps)
      
      // Create session document directly in Firestore
      // This creates a snapshot of the scenario at this point in time
      const sessionData = {
        user_id: user.uid,
        scenario_id: id,
        scenario: {
          title: scenario.name || scenario.title,
          description: scenario.description,
          category: scenario.category,
          difficulty: scenario.difficulty,
        },
        steps: scenarioSteps,
        satellite: scenario._firestore?.satellite_id ? {
          id: scenario._firestore.satellite_id,
          name: 'SAT-01', // Default name
          orbit: {
            altitude_km: 415,
            inclination_degrees: 51.6,
            eccentricity: 0.0
          },
          power: {
            currentCharge_percent: 95,
            solarPower_watts: 1800,
            consumption_watts: 450
          },
          thermal: {
            temperature_celsius: 20
          },
          propulsion: {
            fuel_percent: 100
          },
          payload: {
            status: 'nominal'
          }
        } : null,
        status: 'NOT_STARTED',
        currentStepOrder: 0,
        completedSteps: [],
        total_hints_used: 0,
        total_errors: 0,
        attemptNumber: 1,
        state: {},
        version: 1
      }
      
      // Create the session in Firestore
      const newSessionId = await createSession(sessionData)
      
      setSessionId(newSessionId)
      setSessionData(sessionData) // Store session data for launch animation
      setPhase("countdown")
      setCreatingSession(false)
    } catch (err) {
      console.error('Error creating session:', err)
      console.error('Full error:', err)
      setSessionError(`Failed to create session: ${err.message}`)
      setCreatingSession(false)
      
      // Show alert to user
      alert(`Failed to start mission: ${err.message}\n\nPlease check the console for details.`)
    }
  }
  
  const handleSkipBriefing = async () => {
    if (!user) {
      alert('Please sign in to start a mission.')
      navigate('/?view=login')
      return
    }
    
    setCreatingSession(true)
    
    try {
      // Fetch the full scenario data
      const scenario = await fetchScenarioById(id)
      
      if (!scenario) {
        throw new Error('Scenario not found')
      }
      
      // Get steps from the right location - check both places
      const scenarioSteps = scenario._firestore?.steps || scenario.steps || []
      
      // Create session document directly in Firestore
      const sessionData = {
        user_id: user.uid,
        scenario_id: id,
        scenario: {
          title: scenario.name || scenario.title,
          description: scenario.description,
          category: scenario.category,
          difficulty: scenario.difficulty,
        },
        steps: scenarioSteps,
        satellite: scenario._firestore?.satellite_id ? {
          id: scenario._firestore.satellite_id,
          name: 'SAT-01', // Default name
          orbit: {
            altitude_km: 415,
            inclination_degrees: 51.6,
            eccentricity: 0.0
          },
          power: {
            currentCharge_percent: 95,
            solarPower_watts: 1800,
            consumption_watts: 450
          },
          thermal: {
            temperature_celsius: 20
          },
          propulsion: {
            fuel_percent: 100
          },
          payload: {
            status: 'nominal'
          }
        } : null,
        status: 'NOT_STARTED',
        currentStepOrder: 0,
        completedSteps: [],
        total_hints_used: 0,
        total_errors: 0,
        attemptNumber: 1,
        state: {},
        version: 1
      }
      
      // Create the session in Firestore
      const newSessionId = await createSession(sessionData)
      
      setSessionData(sessionData) // Store session data
      navigate(`/simulator?session=${newSessionId}`)
    } catch (err) {
      console.error('Error creating session:', err)
      console.error('Full error:', err)
      setSessionError(`Failed to create session: ${err.message}`)
      setCreatingSession(false)
      
      // Show alert to user
      alert(`Failed to start mission: ${err.message}\n\nPlease check the console for details.`)
    }
  }
  
  const renderStars = (count) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={cn(
          "w-4 h-4",
          i < count ? "fill-orange text-orange" : "fill-muted text-muted"
        )}
      />
    ))
  }
  
  const systems = ["POWER", "COMMS", "ATTITUDE", "PAYLOAD"]
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <StarField />
        <AppHeader />
        <main className="flex-1 flex flex-col items-center justify-center px-6">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading mission briefing...</p>
        </main>
      </div>
    )
  }
  
  // Error state - only for mission loading errors
  if (loadError || (!loading && !mission)) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <StarField />
        <AppHeader />
        <main className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold">Mission Not Found</h2>
            <p className="text-muted-foreground">
              {loadError || "The requested mission could not be found."}
            </p>
            <Button asChild>
              <a href="/missions">Return to Missions</a>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Phase-specific renderers
  if (phase === "countdown") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <StarField />
        <AppHeader />
        
        {/* Top Bar - Keep navigation visible */}
        <div className="h-14 border-b border-border bg-card flex items-center justify-between px-6 relative z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/missions')}
              className="text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Missions
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary tracking-wide">
                MISSION BRIEFING
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-8 w-8"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeOff className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <main className="flex-1 flex flex-col items-center justify-center px-6 relative">
          <div className="text-center space-y-8 max-w-2xl">
            <div className="text-sm font-mono text-muted-foreground tracking-widest">
              LAUNCH SEQUENCE INITIATED
            </div>
            
            <div className="text-[120px] md:text-[200px] font-bold leading-none">
              T-{countdown}
            </div>
            
            <div className="text-lg text-muted-foreground">
              Preparing satellite systems...
            </div>
            
            {/* System Status Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              {systems.map((system, i) => (
                <div key={system} className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full transition-all duration-500",
                      countdown <= 7 - i * 2
                        ? "bg-green-500 animate-pulse shadow-lg shadow-green-500/50"
                        : "bg-muted-foreground/20"
                    )}
                  />
                  <div className="text-xs font-mono text-muted-foreground">
                    {system}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }
  
  if (phase === "launch") {
    // Get target altitude from session data, default to 415 if not available
    const targetAltitude = sessionData?.satellite?.orbit?.altitude_km || 415
    const altitude = Math.floor(launchProgress * (targetAltitude / 100)) // Scale to target altitude
    
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <StarField />
        <AppHeader />
        
        {/* Top Bar - Keep navigation visible */}
        <div className="h-14 border-b border-border bg-card flex items-center justify-between px-6 relative z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/missions')}
              className="text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Missions
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary tracking-wide">
                MISSION BRIEFING
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-8 w-8"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeOff className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <main className="flex-1 flex flex-col items-center justify-end px-6 relative overflow-hidden">
          {/* Rocket */}
          <div
            className="absolute left-1/2 -translate-x-1/2 transition-all duration-100"
            style={{
              bottom: `${launchProgress}%`,
              transform: `translateX(-50%) translateY(50%)`
            }}
          >
            <div className="relative">
              {/* Rocket body */}
              <div className="w-16 h-24 bg-linear-to-b from-white to-gray-300 rounded-t-full relative">
                {/* Window */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary" />
                {/* Fins */}
                <div className="absolute -left-3 bottom-0 w-0 h-0 border-l-12 border-l-transparent border-r-12 border-r-transparent border-b-16 border-b-gray-400 transform -skew-x-12" />
                <div className="absolute -right-3 bottom-0 w-0 h-0 border-l-12 border-l-transparent border-r-12 border-r-transparent border-b-16 border-b-gray-400 transform skew-x-12" />
              </div>
              {/* Exhaust flame - outer */}
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-8 h-16 bg-linear-to-b from-transparent via-orange-500 to-yellow-300 rounded-b-full blur-sm animate-pulse" />
              {/* Exhaust flame - inner */}
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-4 h-12 bg-linear-to-b from-transparent via-yellow-300 to-white rounded-b-full animate-pulse" />
            </div>
          </div>
          
          {/* Altitude display */}
          <div className="mb-8 text-center space-y-2 z-10">
            <div className="text-xs font-mono text-muted-foreground tracking-widest">
              ALTITUDE
            </div>
            <div className="text-4xl md:text-5xl font-bold">
              {altitude} km
            </div>
            <div className="text-sm text-muted-foreground">
              Ascending to orbit...
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full max-w-md mb-8 z-10">
            <Progress value={launchProgress} className="h-2" />
          </div>
        </main>
      </div>
    )
  }
  
  if (phase === "orbit-insertion") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <StarField />
        <AppHeader />
        
        <main className="flex-1 flex flex-col items-center justify-center px-6 relative">
          <div className="text-center space-y-8">
            {/* Earth with orbit */}
            <div className="relative w-48 h-48 mx-auto">
              {/* Orbit ring */}
              <div className="absolute inset-0 -m-10 rounded-full border-2 border-dashed border-muted-foreground/20 animate-spin-slow" />
              
              {/* Earth */}
              <div className="relative w-48 h-48 rounded-full bg-linear-to-br from-blue-900 via-green-500 to-blue-500 shadow-2xl shadow-primary/20">
                {/* Earth highlight */}
                <div className="absolute inset-0 rounded-full bg-linear-to-br from-white/20 to-transparent" />
              </div>
              
              {/* Satellite icon on orbit */}
              <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2">
                <Satellite className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-green-500 text-lg font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                ORBIT INSERTION SUCCESSFUL
              </div>
              <div className="text-sm text-muted-foreground">
                Establishing communication link...
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }
  
  if (phase === "complete") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <StarField />
        <AppHeader />
        
        <main className="flex-1 flex flex-col items-center justify-center px-6 relative">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 text-green-500 text-2xl font-bold">
              <CheckCircle2 className="w-8 h-8" />
              MISSION READY
            </div>
            <div className="text-muted-foreground">
              Loading simulator...
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Default: Briefing phase
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StarField />
      <AppHeader />
      
      {/* Top Bar */}
      <div className="h-14 border-b border-border bg-card flex items-center justify-between px-6 relative z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/missions')}
            className="text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Missions
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary tracking-wide">
              MISSION BRIEFING
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-8 w-8"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeOff className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkipBriefing}
            className="text-sm"
            disabled={creatingSession}
          >
            {creatingSession ? 'Starting...' : 'Skip Briefing'}
          </Button>
        </div>
      </div>
      
      <main className="flex-1 py-8 px-6 relative">
        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
            {/* Main Content */}
            <div className="space-y-6">
              {/* Mission Title Card */}
              <div
                className={cn(
                  "bg-card border border-border rounded-lg p-8 transition-all duration-700",
                  showContent
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                )}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MissionIcon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-mono text-muted-foreground mb-2 tracking-wider">
                      {mission.category}
                    </div>
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                      {mission.title}
                    </h1>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {mission.description}
                    </p>
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {/* Duration */}
                  <div
                    className={cn(
                      "bg-background border border-border rounded-lg p-4 transition-all duration-500 delay-100",
                      showContent
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-95"
                    )}
                  >
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Duration
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {mission.duration}
                    </div>
                  </div>
                  
                  {/* Objectives */}
                  <div
                    className={cn(
                      "bg-background border border-border rounded-lg p-4 transition-all duration-500 delay-200",
                      showContent
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-95"
                    )}
                  >
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Target className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Objectives
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {mission.objectives}
                    </div>
                  </div>
                  
                  {/* Difficulty */}
                  <div
                    className={cn(
                      "bg-background border border-border rounded-lg p-4 transition-all duration-500 delay-300",
                      showContent
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-95"
                    )}
                  >
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Star className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Difficulty
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {renderStars(mission.difficulty)}
                    </div>
                  </div>
                  
                  {/* Reward */}
                  <div
                    className={cn(
                      "bg-background border border-border rounded-lg p-4 transition-all duration-500 delay-400",
                      showContent
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-95"
                    )}
                  >
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Trophy className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Reward
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {mission.reward}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Prerequisites */}
              <div
                className={cn(
                  "bg-linear-to-r from-orange/10 to-gold/10 border border-orange/30 rounded-lg p-6 transition-all duration-700 delay-500",
                  showContent
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-8"
                )}
              >
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange mb-1">
                      Prerequisites
                    </h3>
                    <p className="text-sm text-foreground/80">
                      {mission.prerequisites}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Begin Mission Button */}
              <div
                className={cn(
                  "transition-all duration-700 delay-600",
                  showContent
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                )}
              >
                <Button
                  onClick={handleStartMission}
                  size="lg"
                  className="w-full sm:w-auto text-base px-8 py-6 bg-primary hover:bg-primary/90 group"
                  disabled={creatingSession}
                >
                  {creatingSession ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Session...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      Begin Mission
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Mission Objectives Sidebar */}
            <div
              className={cn(
                "transition-all duration-700 delay-300",
                showContent
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-8"
              )}
            >
              <div className="bg-card border border-border rounded-lg p-6 sticky top-6">
                <div className="flex items-center gap-2 mb-6">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">
                    Mission Objectives
                  </h2>
                </div>
                
                <div className="space-y-6">
                  {mission.phases.map((phase, phaseIdx) => (
                    <div key={phaseIdx} className="space-y-3">
                      <div className="text-xs font-mono text-muted-foreground tracking-wider">
                        {phase.title}
                      </div>
                      
                      <div className="space-y-2">
                        {phase.objectives.map((objective, objIdx) => {
                          const globalIndex = mission.phases
                            .slice(0, phaseIdx)
                            .reduce((acc, p) => acc + p.objectives.length, 0) + objIdx
                          const isCurrentObjective = globalIndex === currentObjective
                          
                          return (
                            <div
                              key={objective.id}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-lg transition-all",
                                isCurrentObjective
                                  ? "bg-primary/10 border border-primary/30"
                                  : "hover:bg-muted/50"
                              )}
                            >
                              {objective.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-green shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                              )}
                              <span
                                className={cn(
                                  "text-sm",
                                  objective.completed
                                    ? "text-muted-foreground line-through"
                                    : isCurrentObjective
                                    ? "text-primary font-medium"
                                    : "text-foreground"
                                )}
                              >
                                {objective.title}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
