"use client"

import { useState, useEffect } from 'react'
import { 
  Signal, 
  Check, 
  Circle, 
  FileText,
  Zap,
  Battery,
  Sun,
  Thermometer,
  Satellite
} from "lucide-react"

import { useSimulatorState } from "@/contexts/SimulatorStateContext"
import { WorldMap, latLonToSvg, generateGroundTrack, getSatellitePosition } from "./world-map"
import { Loader2, AlertCircle } from "lucide-react"

export function MissionPanel() {
  // Use telemetry and mission data from context - NO FALLBACK DATA
  const { 
    telemetry, 
    steps, 
    currentStepIndex, 
    missionProgress,
    scenario,
    connected
  } = useSimulatorState()
  
  // Telemetry automatically updates from WebSocket
  // Show loading state if telemetry not yet received
  if (!telemetry) {
    return (
      <main className="flex-1 min-w-0 flex flex-col border-r border-border bg-card overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground">
            {connected ? 'Receiving telemetry data...' : 'Connecting to satellite...'}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 min-w-0 flex flex-col border-r border-border bg-card overflow-hidden">
      {/* Mission Header - Compact */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        {/* Top Row */}
        <div className="flex items-center gap-6 mb-2">
          {/* Mission Title & Status */}
          <div className="flex items-center gap-3 shrink-0">
            <h2 className="text-sm font-semibold text-foreground">
              {scenario?.name || 'Mission in Progress'}
            </h2>
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-primary/10 rounded text-[10px] font-mono text-primary">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              LIVE
            </div>
          </div>

          {/* Progress from context */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-muted-foreground">Progress</span>
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500" 
                style={{ width: `${missionProgress}%` }}
              />
            </div>
            <span className="font-mono text-[10px] font-medium text-foreground">{missionProgress}%</span>
          </div>

          {/* Step indicators from context */}
          <div className="flex items-center gap-2">
            {steps.map((step, idx) => (
              <div 
                key={step.id} 
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
                  step.completed 
                    ? "bg-status-nominal text-white" 
                    : idx === currentStepIndex 
                      ? "bg-primary text-white" 
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step.completed ? <Check className="w-3 h-3" /> : step.id}
              </div>
            ))}
          </div>

          {/* Current Step Text */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] text-muted-foreground shrink-0">Current:</span>
            <span className="text-xs text-foreground truncate">
              {steps[currentStepIndex]?.text || "All steps completed"}
            </span>
          </div>
        </div>
      </div>

      {/* Orbit Parameters Section */}
      <div className="px-5 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-3 mb-3">
          <Satellite className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm text-foreground">Orbit Parameters</h4>
        </div>
        <div className="grid grid-cols-6 gap-4">
          <OrbitParam 
            label="Altitude" 
            value={(telemetry.orbit?.altitude_km || telemetry.orbit?.altitude || 0).toFixed(1)} 
            unit="km" 
          />
          <OrbitParam 
            label="Perigee" 
            value={(telemetry.orbit?.perigee_km || telemetry.orbit?.perigee || 0).toFixed(1)} 
            unit="km" 
          />
          <OrbitParam 
            label="Apogee" 
            value={(telemetry.orbit?.apogee_km || telemetry.orbit?.apogee || 0).toFixed(1)} 
            unit="km" 
          />
          <OrbitParam 
            label="Inclination" 
            value={(telemetry.orbit?.inclination_degrees || telemetry.orbit?.inclination || 0).toFixed(1)} 
            unit="°" 
          />
          <OrbitParam 
            label="Period" 
            value={(telemetry.orbit?.period_minutes || telemetry.orbit?.period || 0).toFixed(1)} 
            unit="min" 
          />
          <OrbitParam 
            label="Eccentricity" 
            value={(telemetry.orbit?.eccentricity || 0).toFixed(4)} 
            unit="" 
          />
        </div>
      </div>

      {/* Ground Track Map - Always visible with minimum height */}
      <div className="flex-1 min-h-50 relative overflow-hidden bg-muted/10">
        {/* Connection Status Panel */}
        <div className="absolute right-3 top-3 bg-card/95 backdrop-blur border border-border rounded-lg p-2.5 shadow-lg z-20">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded ${
              telemetry.communications?.status === "nominal" 
                ? "bg-status-nominal/10" 
                : "bg-status-warning/10"
            }`}>
              <Signal className={`w-4 h-4 ${
                telemetry.communications?.status === "nominal"
                  ? "text-status-nominal"
                  : "text-status-warning"
              }`} />
            </div>
            <div>
              <div className="font-semibold text-xs text-foreground">
                {connected ? 'CONNECTED' : 'CONNECTING...'}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {telemetry.communications?.groundStation || 'N/A'} | {(telemetry.communications?.signalStrength || 0).toFixed(0)} dBm
              </div>
            </div>
          </div>
        </div>

        {/* AOS/LOS Timer */}
        <div className="absolute left-3 top-3 bg-card/95 backdrop-blur border border-border rounded-lg p-2.5 shadow-lg z-20">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Next AOS</div>
          <div className="font-mono text-lg font-bold text-status-nominal">08:22:45</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Pass duration: 12m 34s</div>
        </div>

        {/* World Map with Ground Track */}
        <GroundTrackVisualization 
          inclination={telemetry.orbit?.inclination_degrees || telemetry.orbit?.inclination || 51.6}
          altitude={telemetry.orbit?.altitude_km || telemetry.orbit?.altitude || 400}
        />
      </div>

      {/* System Status Bars */}
      <div className="p-5 border-t border-border bg-muted/30">
        <div className="grid grid-cols-4 gap-6">
          <StatusBar 
            label="Fuel" 
            value={telemetry.subsystems?.propulsion?.fuelRemaining || 0} 
            icon={<Zap className="w-3.5 h-3.5" />}
            status={(telemetry.subsystems?.propulsion?.fuelRemaining || 0) > 50 ? "nominal" : (telemetry.subsystems?.propulsion?.fuelRemaining || 0) > 25 ? "warning" : "critical"}
          />
          <StatusBar 
            label="Battery" 
            value={telemetry.subsystems?.power?.batterySoc || 0} 
            icon={<Battery className="w-3.5 h-3.5" />}
            status={telemetry.subsystems?.power?.status || "offline"}
          />
          <StatusBar 
            label="Solar" 
            value={Math.round(((telemetry.subsystems?.power?.solarArrayOutput || 0) / 2000) * 100)} 
            icon={<Sun className="w-3.5 h-3.5" />}
            status="nominal"
          />
          <StatusBar 
            label="Thermal" 
            value={(telemetry.subsystems?.thermal?.status || "offline") === "nominal" ? 100 : (telemetry.subsystems?.thermal?.status || "offline") === "warning" ? 75 : 50}
            icon={<Thermometer className="w-3.5 h-3.5" />}
            status={telemetry.subsystems?.thermal?.status || "offline"}
            displayText={(telemetry.subsystems?.thermal?.status || "offline").charAt(0).toUpperCase() + (telemetry.subsystems?.thermal?.status || "offline").slice(1)}
          />
        </div>
      </div>
    </main>
  )
}

function OrbitParam({ label, value, unit }) {
  return (
    <div className="text-center">
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
      <div className="font-mono text-sm font-semibold text-foreground">
        {value}
        {unit && <span className="text-muted-foreground text-xs ml-0.5">{unit}</span>}
      </div>
    </div>
  )
}

/**
 * Ground Track Visualization Component
 * 
 * Displays satellite orbital path on equirectangular world map using proper math:
 * - latitude = inclination × sin(θ) creates the sinusoidal ground track
 * - The track crosses the equator at ascending and descending nodes
 * - Multiple orbits show westward drift due to Earth's rotation
 */
function GroundTrackVisualization({ 
  inclination = 53, 
  altitude = 415 
}) {
  // Animate satellite position along the orbit
  const [orbitProgress, setOrbitProgress] = useState(0)
  
  useEffect(() => {
    // Simulate orbital motion - complete orbit in ~60 seconds for visualization
    // Real ISS orbit is ~92 minutes, but we speed it up for demo
    const interval = setInterval(() => {
      setOrbitProgress((prev) => {
        const next = prev + 0.002 // Increment ~0.2% per tick
        return next >= 1 ? 0 : next // Reset to 0 when orbit completes
      })
    }, 100) // Update every 100ms for smooth animation
    
    return () => clearInterval(interval)
  }, [])
  
  const satPos = getSatellitePosition(0, inclination, orbitProgress)
  
  // Generate ground tracks for current orbit and adjacent orbits
  const currentOrbit = generateGroundTrack(0, inclination, 200)
  const previousOrbit = generateGroundTrack(22.5, inclination, 200) // shifted east (earlier in time)
  const nextOrbit = generateGroundTrack(-22.5, inclination, 200) // shifted west (later in time)
  
  // Format coordinates for display
  const latDir = satPos.lat >= 0 ? 'N' : 'S'
  const lonDir = satPos.lon >= 0 ? 'E' : 'W'
  const latDisplay = `${Math.abs(satPos.lat).toFixed(1)}°${latDir}`
  const lonDisplay = `${Math.abs(satPos.lon).toFixed(1)}°${lonDir}`
  
  return (
    <svg 
      viewBox="0 0 720 360" 
      className="w-full h-full min-h-50"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Accurate World Map */}
      <WorldMap />
      
      {/* Ground Tracks - sinusoidal paths */}
      {/* Previous orbit (faded, dashed) */}
      <path 
        d={previousOrbit}
        stroke="#3b82f6"
        strokeOpacity="0.2"
        strokeWidth="2" 
        fill="none"
        strokeDasharray="8 4"
      />
      
      {/* Current orbit track (solid) */}
      <path 
        d={currentOrbit}
        stroke="#3b82f6"
        strokeWidth="2.5" 
        fill="none"
      />
      
      {/* Next orbit prediction (faded, dashed) */}
      <path 
        d={nextOrbit}
        stroke="#3b82f6"
        strokeOpacity="0.3"
        strokeWidth="1.5" 
        fill="none"
        strokeDasharray="6 6"
      />
      
      {/* Equator crossing indicator (ascending node) */}
      <g transform={`translate(${latLonToSvg(0, 0).x}, ${latLonToSvg(0, 0).y})`}>
        <circle r="6" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
        <line x1="-8" y1="0" x2="8" y2="0" stroke="#3b82f6" strokeWidth="1" />
        <text x="12" y="4" fill="#64748b" fontSize="8">Equator</text>
        <text x="12" y="13" fill="#3b82f6" fontSize="7">{inclination}° incl.</text>
      </g>
      
      {/* Deep Space Network Ground Stations */}
      {/* Goldstone, USA (35.4°N, 116.9°W) */}
      <g>
        <circle cx={latLonToSvg(35.4, -116.9).x} cy={latLonToSvg(35.4, -116.9).y} r="35" fill="#22c55e" fillOpacity="0.1" stroke="#22c55e" strokeOpacity="0.5" strokeWidth="1" />
        <circle cx={latLonToSvg(35.4, -116.9).x} cy={latLonToSvg(35.4, -116.9).y} r="4" fill="#22c55e" />
        <text x={latLonToSvg(35.4, -116.9).x} y={latLonToSvg(35.4, -116.9).y + 18} fill="#6b9e8a" fontSize="8" textAnchor="middle">Goldstone</text>
      </g>
      
      {/* Madrid, Spain (40.4°N, 3.7°W) */}
      <g>
        <circle cx={latLonToSvg(40.4, -3.7).x} cy={latLonToSvg(40.4, -3.7).y} r="35" fill="#22c55e" fillOpacity="0.1" stroke="#22c55e" strokeOpacity="0.5" strokeWidth="1" />
        <circle cx={latLonToSvg(40.4, -3.7).x} cy={latLonToSvg(40.4, -3.7).y} r="4" fill="#22c55e" />
        <text x={latLonToSvg(40.4, -3.7).x} y={latLonToSvg(40.4, -3.7).y + 18} fill="#6b9e8a" fontSize="8" textAnchor="middle">Madrid</text>
      </g>
      
      {/* Canberra, Australia (35.4°S, 149.0°E) - currently out of range */}
      <g>
        <circle cx={latLonToSvg(-35.4, 149.0).x} cy={latLonToSvg(-35.4, 149.0).y} r="35" fill="#6b7280" fillOpacity="0.1" stroke="#6b7280" strokeOpacity="0.4" strokeWidth="1" strokeDasharray="4 2" />
        <circle cx={latLonToSvg(-35.4, 149.0).x} cy={latLonToSvg(-35.4, 149.0).y} r="4" fill="#6b7280" />
        <text x={latLonToSvg(-35.4, 149.0).x} y={latLonToSvg(-35.4, 149.0).y + 18} fill="#6b7280" fontSize="8" textAnchor="middle">Canberra</text>
      </g>
      
      {/* Satellite position marker */}
      <g transform={`translate(${satPos.x}, ${satPos.y})`}>
        {/* Footprint / visibility cone */}
        <ellipse cx="0" cy="0" rx="45" ry="25" fill="#3b82f6" fillOpacity="0.15" stroke="#3b82f6" strokeOpacity="0.4" strokeWidth="1" />
        {/* Satellite body */}
        <rect x="-6" y="-6" width="12" height="12" rx="2" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" transform="rotate(45)" />
        {/* Solar panels */}
        <rect x="-18" y="-2" width="9" height="4" rx="1" fill="#3b82f6" />
        <rect x="9" y="-2" width="9" height="4" rx="1" fill="#3b82f6" />
        {/* Pulse animation */}
        <circle cx="0" cy="0" r="10" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.4" className="animate-ping" />
      </g>
      <text x={satPos.x} y={satPos.y + 32} fill="#e2e8f0" fontSize="9" fontWeight="bold" textAnchor="middle">SAT-01</text>
      
      {/* Current satellite coordinates display */}
      <g transform="translate(360, 340)">
        <rect x="-75" y="-10" width="150" height="18" rx="4" fill="#0f172a" fillOpacity="0.8" stroke="#334155" strokeWidth="0.5" />
        <text x="0" y="3" fill="#94a3b8" fontSize="9" fontFamily="ui-monospace, monospace" textAnchor="middle">
          {latDisplay}  {lonDisplay}  Alt: {altitude.toFixed(0)}km
        </text>
      </g>
    </svg>
  )
}

function StatusBar({ 
  label, 
  value, 
  icon,
  status,
  displayText
}) {
  const statusColors = {
    nominal: "bg-status-nominal",
    warning: "bg-status-warning", 
    critical: "bg-status-critical",
    offline: "bg-status-offline"
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${statusColors[status]} rounded-full transition-all duration-500`} 
          style={{ width: `${value}%` }}
        />
      </div>
      {displayText && (
        <div className="text-xs text-muted-foreground mt-1">{displayText}</div>
      )}
    </div>
  )
}
