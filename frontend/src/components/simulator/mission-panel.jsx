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

import { initialTelemetry, initialMission, updateTelemetry } from "@/lib/simulator-state"
import { WorldMap, latLonToSvg, generateGroundTrack, getSatellitePosition } from "./world-map"

export function MissionPanel() {
  const [telemetry, setTelemetry] = useState(initialTelemetry)
  const [mission] = useState(initialMission)

  // Simulate real-time telemetry updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((current) => updateTelemetry(current))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="flex-1 min-w-0 flex flex-col border-r border-border bg-card overflow-hidden">
      {/* Mission Header - Compact */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        {/* Top Row */}
        <div className="flex items-center gap-6 mb-2">
          {/* Mission Title & Status */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <h2 className="text-sm font-semibold text-foreground">
              {mission.title}
            </h2>
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-primary/10 rounded text-[10px] font-mono text-primary">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              LIVE
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] text-muted-foreground">Progress</span>
            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500" 
                style={{ width: `${(mission.progress || 0)}%` }}
              />
            </div>
            <span className="font-mono text-[10px] font-medium text-foreground">{mission.progress || 0}%</span>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {mission.steps.map((step) => (
              <div 
                key={step.id} 
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
                  step.completed 
                    ? "bg-status-nominal text-white" 
                    : step.active 
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
            <span className="text-[10px] text-muted-foreground flex-shrink-0">Current:</span>
            <span className="text-xs text-foreground truncate">
              {mission.steps.find(s => s.active)?.text || "All steps completed"}
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
          <OrbitParam label="Altitude" value={telemetry.orbit.altitude.toFixed(1)} unit="km" />
          <OrbitParam label="Perigee" value={telemetry.orbit.perigee.toFixed(1)} unit="km" />
          <OrbitParam label="Apogee" value={telemetry.orbit.apogee.toFixed(1)} unit="km" />
          <OrbitParam label="Inclination" value={telemetry.orbit.inclination.toFixed(1)} unit="°" />
          <OrbitParam label="Period" value={telemetry.orbit.period.toFixed(1)} unit="min" />
          <OrbitParam label="Eccentricity" value={telemetry.orbit.eccentricity.toFixed(4)} unit="" />
        </div>
      </div>

      {/* Ground Track Map - Always visible with minimum height */}
      <div className="flex-1 min-h-[200px] relative overflow-hidden bg-muted/10">
        {/* Connection Status Panel */}
        <div className="absolute right-3 top-3 bg-card/95 backdrop-blur border border-border rounded-lg p-2.5 shadow-lg z-20">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded ${
              telemetry.communications.status === "nominal" 
                ? "bg-status-nominal/10" 
                : "bg-status-warning/10"
            }`}>
              <Signal className={`w-4 h-4 ${
                telemetry.communications.status === "nominal"
                  ? "text-status-nominal"
                  : "text-status-warning"
              }`} />
            </div>
            <div>
              <div className="font-semibold text-xs text-foreground">CONNECTED</div>
              <div className="text-[10px] text-muted-foreground">
                {telemetry.communications.groundStation} | {telemetry.communications.signalStrength.toFixed(0)} dBm
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
          inclination={telemetry.orbit.inclination}
          altitude={telemetry.orbit.altitude}
        />
      </div>

      {/* System Status Bars */}
      <div className="p-5 border-t border-border bg-muted/30">
        <div className="grid grid-cols-4 gap-6">
          <StatusBar 
            label="Fuel" 
            value={telemetry.subsystems.propulsion.fuelRemaining} 
            icon={<Zap className="w-3.5 h-3.5" />}
            status={telemetry.subsystems.propulsion.fuelRemaining > 50 ? "nominal" : telemetry.subsystems.propulsion.fuelRemaining > 25 ? "warning" : "critical"}
          />
          <StatusBar 
            label="Battery" 
            value={telemetry.subsystems.power.batterySoc} 
            icon={<Battery className="w-3.5 h-3.5" />}
            status={telemetry.subsystems.power.status}
          />
          <StatusBar 
            label="Solar" 
            value={Math.round((telemetry.subsystems.power.solarArrayOutput / 2000) * 100)} 
            icon={<Sun className="w-3.5 h-3.5" />}
            status="nominal"
          />
          <StatusBar 
            label="Thermal" 
            value={telemetry.subsystems.thermal.status === "nominal" ? 100 : telemetry.subsystems.thermal.status === "warning" ? 75 : 50}
            icon={<Thermometer className="w-3.5 h-3.5" />}
            status={telemetry.subsystems.thermal.status}
            displayText={telemetry.subsystems.thermal.status.charAt(0).toUpperCase() + telemetry.subsystems.thermal.status.slice(1)}
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
      className="w-full h-full min-h-[200px]"
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
