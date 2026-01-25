import { useState, useMemo } from "react"
import { Helmet } from "react-helmet-async"
import { Link } from "react-router-dom"
import AppHeader from "@/components/app-header"
import { MissionFilters } from "@/components/missions/mission-filters"
import { MissionGrid } from "@/components/missions/mission-grid"
import { MissionStats } from "@/components/missions/mission-stats"
import { getMissions, getMissionStats } from "@/lib/missions-data"
import { Footer } from "@/components/footer"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Rocket, X } from "lucide-react"

export default function Missions() {
  const { user } = useAuth()
  
  // Simulated data fetch - in production this would come from Firebase
  const allMissions = getMissions()
  const stats = getMissionStats()
  
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
        // Keep original order (by mission progression)
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
                  <Rocket className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium mb-1">Sign in to track your progress</p>
                    <p className="text-xs text-muted-foreground">
                      Create a free account to save your mission progress, earn Mission Points, and unlock advanced satellite operations.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowInfoBanner(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {/* Stats for logged-in users */}
              {user && <MissionStats stats={stats} />}
            </div>

            {/* Progress bar - Only show when logged in */}
            {user && (
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

            {/* Filters */}
            <MissionFilters 
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              isLoggedOut={!user}
            />

            {/* Mission Grid */}
            <MissionGrid 
              missions={sortedMissions}
              selectedCategory={activeCategory}
              searchQuery={searchQuery}
              isLoggedOut={!user}
            />
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
