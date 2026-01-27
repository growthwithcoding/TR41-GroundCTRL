import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  Play, 
  Target, 
  Clock, 
  Trophy,
  CheckCircle2,
  Circle,
  Rocket
} from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchPublishedScenarios } from "@/lib/firebase/scenariosService"

export function MissionStartModal({ missionId, onStart }) {
  const [mission, setMission] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMission() {
      try {
        const scenarios = await fetchPublishedScenarios()
        const foundMission = scenarios.find(s => s.id === missionId)
        setMission(foundMission)
      } catch (err) {
        console.error('Error loading mission:', err)
      } finally {
        setLoading(false)
      }
    }

    if (missionId && missionId !== 'default') {
      loadMission()
    } else {
      setLoading(false)
    }
  }, [missionId])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Rocket className="w-12 h-12 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Preparing mission...</p>
        </div>
      </div>
    )
  }

  // Default mission data if no mission found
  const displayMission = mission || {
    name: "Free Flight Mode",
    description: "Explore satellite operations at your own pace",
    difficultyLabel: "Beginner",
    estimatedDuration: 30,
    rewards: { mp: 0 },
    _firestore: { objectives: ["Explore satellite controls", "Learn at your own pace"] }
  }

  const objectives = displayMission._firestore?.objectives || []

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-border p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {displayMission.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {displayMission.description}
              </p>
            </div>
          </div>
        </div>

        {/* Mission Info */}
        <div className="grid grid-cols-3 gap-4 p-6 border-b border-border">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
              Difficulty
            </div>
            <div className="text-sm font-semibold text-foreground">
              {displayMission.difficultyLabel}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              Duration
            </div>
            <div className="text-sm font-semibold text-foreground">
              {displayMission.estimatedDuration} min
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3" />
              Reward
            </div>
            <div className="text-sm font-semibold text-primary">
              +{displayMission.rewards.mp} MP
            </div>
          </div>
        </div>

        {/* Objectives */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">
              Mission Objectives
            </h3>
          </div>

          <div className="space-y-2">
            {objectives.map((objective, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors"
              >
                <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  {objective}
                </span>
              </div>
            ))}
          </div>

          {objectives.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No specific objectives - free exploration mode
              </p>
            </div>
          )}
        </div>

        {/* Pre-Mission Brief */}
        <div className="px-6 pb-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-xs text-foreground/80">
              <strong className="text-primary">Mission Brief:</strong> All systems are nominal. 
              Mission timer and satellite movement will begin when you click "Start Mission". 
              Remember to monitor telemetry and respond to system events promptly. Good luck, Operator!
            </p>
          </div>
        </div>

        {/* Start Button */}
        <div className="p-6 pt-0">
          <Button
            onClick={onStart}
            size="lg"
            className="w-full text-base py-6 bg-primary hover:bg-primary/90 group"
          >
            <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Start Mission
          </Button>
        </div>

        {/* Footer Note */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">ESC</kbd> at any time to pause
          </p>
        </div>
      </div>
    </div>
  )
}
