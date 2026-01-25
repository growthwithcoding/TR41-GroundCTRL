import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
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
  Satellite
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock mission data - in production this would come from an API
const MISSION_DATA = {
  "power-management": {
    category: "POWER SYSTEMS",
    title: "Power Management",
    icon: Zap,
    description: "Satellites depend on careful power management to survive. In this mission, you'll learn how to optimize solar panel orientation, manage battery charge cycles, and prioritize power distribution when resources are limited. You'll face scenarios where you must make critical decisions about which systems to power.",
    duration: "25 min",
    objectives: 6,
    difficulty: 2,
    reward: "+200 MP",
    prerequisites: "Completion of 'Stable Orbit & First Ground Pass' recommended.",
    phases: [
      {
        title: "PHASE 1: SOLAR POWER BASICS",
        objectives: [
          { id: 1, title: "Solar Panel Orientation", completed: false },
          { id: 2, title: "Optimize Panel Angle", completed: false }
        ]
      },
      {
        title: "PHASE 2: BATTERY MANAGEMENT",
        objectives: [
          { id: 3, title: "Monitor Eclipse Entry", completed: false },
          { id: 4, title: "Survive Eclipse Period", completed: false }
        ]
      },
      {
        title: "PHASE 3: POWER DISTRIBUTION",
        objectives: [
          { id: 5, title: "Power Priority Quiz", completed: false, active: true },
          { id: 6, title: "Handle Power Emergency", completed: false }
        ]
      }
    ]
  }
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
  
  // State management
  const [phase, setPhase] = useState("briefing") // briefing | countdown | launch | orbit-insertion | complete
  const [countdown, setCountdown] = useState(10)
  const [launchProgress, setLaunchProgress] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [currentObjective, setCurrentObjective] = useState(0)
  
  const mission = MISSION_DATA[id] || MISSION_DATA["power-management"]
  const MissionIcon = mission.icon
  
  // Get all objectives for cycling
  const allObjectives = mission.phases.flatMap(p => p.objectives)
  
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
    } else if (phase === "launch" && launchProgress >= 100) {
      setPhase("orbit-insertion")
    }
  }, [phase, launchProgress])
  
  // Orbit insertion phase
  useEffect(() => {
    if (phase === "orbit-insertion") {
      const timer = setTimeout(() => {
        setPhase("complete")
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [phase])
  
  // Complete phase - navigate to simulator
  useEffect(() => {
    if (phase === "complete") {
      const timer = setTimeout(() => {
        navigate(`/simulator?mission=${id}`)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [phase, navigate, id])
  
  const handleStartMission = () => {
    setPhase("countdown")
  }
  
  const handleSkipBriefing = () => {
    navigate(`/simulator?mission=${id}`)
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

  // Phase-specific renderers
  if (phase === "countdown") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <StarField />
        <AppHeader />
        
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
    const altitude = Math.floor(launchProgress * 4.15) // 0-415 km
    
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <StarField />
        <AppHeader />
        
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
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-primary tracking-wide">
            MISSION BRIEFING
          </span>
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
          >
            Skip Briefing
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
                >
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Begin Mission
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
