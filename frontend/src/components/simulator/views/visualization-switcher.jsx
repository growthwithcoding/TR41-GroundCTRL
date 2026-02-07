/**
 * VisualizationSwitcher - Unified view controller for 2D/3D satellite visualization
 * 
 * Provides a seamless toggle between flat equirectangular map view and
 * 3D globe view with shared orbital parameters.
 */

import { useState, lazy, Suspense } from "react"
import { GroundTrack2D } from "./ground-track-2d"

// Lazy load the heavy 3D component to reduce initial bundle size
const EarthGlobe3D = lazy(() => import("./earth-globe-3d").then(module => ({ default: module.EarthGlobe3D })))

// ============================================================================
// Sub-Components
// ============================================================================

/** Loading component for lazy-loaded views */
function ViewLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span className="text-sm text-muted-foreground">Loading visualization...</span>
      </div>
    </div>
  )
}

/** View mode toggle button */
function ViewToggle({ 
  mode, 
  onToggle 
}) {
  return (
    <button
      onClick={onToggle}
      className="absolute left-3 bottom-3 bg-card/95 backdrop-blur border border-border rounded-lg px-2.5 py-1.5 shadow-lg z-20 hover:bg-accent transition-colors"
      aria-label={`Switch to ${mode === "2d" ? "3D" : "2D"} view`}
    >
      <div className="flex items-center gap-2">
        <ViewIcon mode={mode} />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {mode === "2d" ? "2D Map View" : "3D Globe View"}
        </span>
      </div>
    </button>
  )
}

/** View mode icon */
function ViewIcon({ mode }) {
  if (mode === "2d") {
    return (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="w-3.5 h-3.5 text-muted-foreground"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18" />
        <path d="M3 15h18" />
        <path d="M9 3v18" />
        <path d="M15 3v18" />
      </svg>
    )
  }
  
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="w-3.5 h-3.5 text-muted-foreground"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function VisualizationSwitcher({
  altitude = 415,
  inclination = 51.6,
  eccentricity = 0.0001,
  raan = 0,
  defaultView = "2d",
  showToggle = true,
  className = "",
}) {
  const [viewMode, setViewMode] = useState(defaultView)

  const toggleView = () => {
    setViewMode(prev => prev === "2d" ? "3d" : "2d")
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {viewMode === "2d" ? (
        <GroundTrack2D
          altitude={altitude}
          inclination={inclination}
          showFootprint={true}
          showGroundStations={true}
          showPredictions={true}
          className="w-full h-full"
        />
      ) : (
        <Suspense fallback={<ViewLoader />}>
          <EarthGlobe3D
            altitude={altitude}
            inclination={inclination}
            eccentricity={eccentricity}
            raan={raan}
            showOrbit={true}
            showAtmosphere={true}
            showStars={true}
            className="w-full h-full"
          />
        </Suspense>
      )}
      
      {showToggle && (
        <ViewToggle mode={viewMode} onToggle={toggleView} />
      )}
    </div>
  )
}

export default VisualizationSwitcher
