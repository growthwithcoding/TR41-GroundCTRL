import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import AppHeader from "@/components/app-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Circle
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

export default function MissionBriefingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isAnimating, setIsAnimating] = useState(true)
  const [showContent, setShowContent] = useState(false)
  
  const mission = MISSION_DATA[id] || MISSION_DATA["power-management"]
  const MissionIcon = mission.icon
  
  useEffect(() => {
    // Trigger animations on mount
    setTimeout(() => setShowContent(true), 100)
    setTimeout(() => setIsAnimating(false), 1500)
  }, [])
  
  const handleStartMission = () => {
    navigate(`/simulator?mission=${id}`)
  }
  
  const handleSkipBriefing = () => {
    navigate('/missions')
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      
      {/* Top Bar */}
      <div className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
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
      
      <main className="flex-1 py-8 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-accent rounded-full blur-[100px]" />
        </div>
        
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
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
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
                  "bg-gradient-to-r from-orange/10 to-gold/10 border border-orange/30 rounded-lg p-6 transition-all duration-700 delay-500",
                  showContent
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-8"
                )}
              >
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange flex-shrink-0 mt-0.5" />
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
                        {phase.objectives.map((objective) => (
                          <div
                            key={objective.id}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg transition-all",
                              objective.active
                                ? "bg-primary/10 border border-primary/30"
                                : "hover:bg-muted/50"
                            )}
                          >
                            {objective.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green flex-shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                            )}
                            <span
                              className={cn(
                                "text-sm",
                                objective.completed
                                  ? "text-muted-foreground line-through"
                                  : objective.active
                                  ? "text-primary font-medium"
                                  : "text-foreground"
                              )}
                            >
                              {objective.title}
                            </span>
                          </div>
                        ))}
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
