"use client"

import { 
  CheckCircle2, 
  Lock, 
  Clock, 
  Star, 
  ChevronRight,
  Rocket,
  Radio,
  Zap,
  Compass,
  Target,
  Shield,
  Satellite,
  Globe,
  Gauge,
  Wifi,
  Sun,
  RotateCw,
  BookOpen,
} from "lucide-react"

import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

// Icon mapping for dynamic rendering from Firestore string values
const iconMap = {
  Rocket,
  Radio,
  Zap,
  Compass,
  Target,
  Shield,
  Satellite,
  Globe,
  Gauge,
  Wifi,
  Sun,
  RotateCw,
  BookOpen,
}

const difficultyLabels = ["", "Beginner", "Easy", "Intermediate", "Advanced", "Expert"]
const difficultyColors = ["", "text-status-nominal", "text-teal", "text-status-warning", "text-orange", "text-status-critical"]

export function MissionGrid({ missions, selectedCategory, searchQuery, isLoggedOut = false }) {
  // Filter missions based on category and search
  const filteredMissions = missions.filter(mission => {
    const matchesCategory = selectedCategory === "All Missions" || mission.category === selectedCategory
    const matchesSearch = searchQuery === "" || 
      mission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  if (filteredMissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Satellite className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No missions found</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {searchQuery 
            ? `No missions match "${searchQuery}". Try a different search term.`
            : "Try selecting a different category."}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredMissions.map((mission) => (
        <MissionCard key={mission.id} mission={mission} isLoggedOut={isLoggedOut} />
      ))}
    </div>
  )
}

function MissionCard({ mission, isLoggedOut = false }) {
  // For logged-out users, treat all missions as available for preview
  const isLocked = !isLoggedOut && mission.status === "locked"
  const isCompleted = !isLoggedOut && mission.status === "completed"
  const isInProgress = !isLoggedOut && mission.status === "in-progress"
  
  const IconComponent = iconMap[mission.icon] || Rocket

  return (
    <div
      className={`bg-card border border-border rounded-lg overflow-hidden transition-all hover:shadow-lg ${
        isLocked ? "opacity-60" : ""
      }`}
    >
      {/* Header with icon and status */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isLocked ? "bg-muted" : "bg-primary/10"
        }`}>
          {isLocked ? (
            <Lock className="w-5 h-5 text-muted-foreground" />
          ) : (
            <IconComponent className={`w-5 h-5 ${
              isCompleted ? "text-status-nominal" : "text-primary"
            }`} />
          )}
        </div>
        
        {/* Only show status badges when logged in */}
        {!isLoggedOut && isCompleted && (
          <div className="flex items-center gap-1 text-status-nominal">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-medium">COMPLETE</span>
          </div>
        )}
        {!isLoggedOut && isInProgress && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-status-warning animate-pulse" />
            <span className="text-xs font-medium text-status-warning">IN PROGRESS</span>
          </div>
        )}
        {mission.isFeatured && !isCompleted && !isInProgress && !isLocked && (
          <div className="px-2 py-0.5 bg-primary/10 rounded text-xs font-medium text-primary">
            Featured
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <h3 className="font-semibold text-foreground text-sm leading-tight">{mission.name}</h3>
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{mission.description}</p>
      </div>

      {/* Category badge */}
      <div className="px-4 pb-2">
        <span className="inline-block px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">
          {mission.category}
        </span>
      </div>

      {/* Meta info */}
      <div className="px-4 pb-3 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{mission.estimatedDuration} min</span>
        </div>
        <div className="flex items-center gap-1">
          <Target className="w-3 h-3" />
          <span>{mission.totalObjectives} objectives</span>
        </div>
      </div>

      {/* Difficulty and MP */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${
                i < mission.difficulty ? difficultyColors[mission.difficulty] : "text-muted"
              }`}
              fill={i < mission.difficulty ? "currentColor" : "none"}
            />
          ))}
          <span className={`text-xs ml-1 ${difficultyColors[mission.difficulty]}`}>
            {mission.difficultyLabel}
          </span>
        </div>
        {/* Reframe MP display for logged-out users */}
        <span className="text-xs font-medium text-primary">
          {isLoggedOut ? `Earn up to ${mission.rewards.mp} MP` : `+${mission.rewards.mp} MP`}
        </span>
      </div>

      {/* Progress bar (for in-progress) - Only show when logged in */}
      {!isLoggedOut && isInProgress && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-mono text-foreground">{mission.progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-status-warning rounded-full transition-all"
              style={{ width: `${mission.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Prerequisites for locked missions */}
      {isLocked && mission.prerequisites.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="w-3 h-3" />
            {isLoggedOut 
              ? "Sign in to unlock this mission" 
              : `Complete: ${mission.prerequisites.join(", ")}`}
          </p>
          {isLoggedOut && (
            <p className="text-xs text-muted-foreground mt-1">
              Progression and prerequisites unlock after login.
            </p>
          )}
        </div>
      )}

      {/* Action */}
      <div className="p-4 pt-3 border-t border-border">
        {isLoggedOut ? (
          <Link to="/?view=login">
            <Button size="sm" className="w-full text-xs">
              Sign in to start
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        ) : isCompleted ? (
          <Link to={`/mission-briefing/${mission.id}`}>
            <Button variant="outline" size="sm" className="w-full text-xs bg-transparent">
              Replay Mission
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        ) : isInProgress ? (
          <Link to={`/simulator?mission=${mission.id}`}>
            <Button size="sm" className="w-full text-xs">
              Continue Mission
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        ) : isLocked ? (
          <Button variant="outline" size="sm" className="w-full text-xs bg-transparent" disabled>
            <Lock className="w-3 h-3 mr-1" />
            Locked
          </Button>
        ) : (
          <Link to={`/mission-briefing/${mission.id}`}>
            <Button size="sm" className="w-full text-xs">
              Start Mission
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
