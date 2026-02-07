/**
 * GroundTrack2D - 2D Equirectangular Map Visualization
 * 
 * Displays satellite orbital path on a flat world map using plate carree projection.
 * 
 * Mathematical basis:
 * - latitude = inclination * sin(theta) creates the sinusoidal ground track
 * - The track crosses the equator at ascending and descending nodes
 * - Multiple orbits show westward drift due to Earth's rotation (~22.5 deg/orbit)
 */

import { useState, useEffect } from "react"
import { WorldMap, latLonToSvg, generateGroundTrack, getSatellitePosition } from "./world-map"

// ============================================================================
// Constants
// ============================================================================

const GROUND_STATIONS = [
  { name: "Goldstone", lat: 35.4, lon: -116.9, active: true },
  { name: "Madrid", lat: 40.4, lon: -3.7, active: true },
  { name: "Canberra", lat: -35.4, lon: 149.0, active: false },
]

// ============================================================================
// Sub-Components
// ============================================================================

/** Ground station marker with coverage circle */
function GroundStationMarker({ station }) {
  const pos = latLonToSvg(station.lat, station.lon)
  const color = station.active ? "#22c55e" : "#6b7280"
  
  return (
    <g>
      {/* Coverage circle */}
      <circle 
        cx={pos.x} 
        cy={pos.y} 
        r="35" 
        fill={color} 
        fillOpacity="0.1" 
        stroke={color} 
        strokeOpacity={station.active ? 0.5 : 0.4}
        strokeWidth="1"
        strokeDasharray={station.active ? undefined : "4 2"}
      />
      {/* Station marker */}
      <circle cx={pos.x} cy={pos.y} r="4" fill={color} />
      {/* Label */}
      <text 
        x={pos.x} 
        y={pos.y + 18} 
        fill={station.active ? "#6b9e8a" : "#6b7280"} 
        fontSize="8" 
        textAnchor="middle"
      >
        {station.name}
      </text>
    </g>
  )
}

/** Orbital ground track path */
function OrbitTrack({ 
  path, 
  opacity = 1, 
  dashed = false,
  strokeWidth = 2.5
}) {
  return (
    <path 
      d={path}
      stroke="#3b82f6"
      strokeOpacity={opacity}
      strokeWidth={strokeWidth}
      fill="none"
      strokeDasharray={dashed ? "6 6" : undefined}
    />
  )
}

/** Satellite marker with footprint */
function SatelliteMarker({ 
  x, 
  y, 
  showFootprint = true 
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Footprint / visibility cone */}
      {showFootprint && (
        <ellipse 
          cx="0" 
          cy="0" 
          rx="45" 
          ry="25" 
          fill="#3b82f6" 
          fillOpacity="0.15" 
          stroke="#3b82f6" 
          strokeOpacity="0.4" 
          strokeWidth="1" 
        />
      )}
      
      {/* Satellite body */}
      <rect 
        x="-6" 
        y="-6" 
        width="12" 
        height="12" 
        rx="2" 
        fill="#1e293b" 
        stroke="#3b82f6" 
        strokeWidth="2" 
        transform="rotate(45)" 
      />
      
      {/* Solar panels */}
      <rect x="-18" y="-2" width="9" height="4" rx="1" fill="#3b82f6" />
      <rect x="9" y="-2" width="9" height="4" rx="1" fill="#3b82f6" />
      
      {/* Pulse animation */}
      <circle 
        cx="0" 
        cy="0" 
        r="10" 
        fill="none" 
        stroke="#3b82f6" 
        strokeWidth="2" 
        opacity="0.4" 
        className="animate-ping" 
      />
    </g>
  )
}

/** Equator crossing indicator */
function EquatorIndicator({ inclination }) {
  const pos = latLonToSvg(0, 0)
  
  return (
    <g transform={`translate(${pos.x}, ${pos.y})`}>
      <circle r="6" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
      <line x1="-8" y1="0" x2="8" y2="0" stroke="#3b82f6" strokeWidth="1" />
      <text x="12" y="4" fill="#64748b" fontSize="8">Equator</text>
      <text x="12" y="13" fill="#3b82f6" fontSize="7">{inclination}° incl.</text>
    </g>
  )
}

/** Coordinate display bar */
function CoordinateDisplay({ 
  lat, 
  lon, 
  altitude 
}) {
  const latDir = lat >= 0 ? "N" : "S"
  const lonDir = lon >= 0 ? "E" : "W"
  const latDisplay = `${Math.abs(lat).toFixed(1)}°${latDir}`
  const lonDisplay = `${Math.abs(lon).toFixed(1)}°${lonDir}`
  
  return (
    <g transform="translate(360, 350)">
      <rect 
        x="-90" 
        y="-12" 
        width="180" 
        height="20" 
        rx="4" 
        fill="#0f172a" 
        fillOpacity="0.9" 
        stroke="#334155" 
        strokeWidth="0.5" 
      />
      <text 
        x="0" 
        y="2" 
        fill="#94a3b8" 
        fontSize="10" 
        fontFamily="ui-monospace, monospace" 
        textAnchor="middle"
      >
        {latDisplay}  {lonDisplay}  Alt: {altitude.toFixed(0)}km
      </text>
    </g>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function GroundTrack2D({ 
  inclination = 53, 
  altitude = 415,
  showFootprint = true,
  showGroundStations = true,
  showPredictions = true,
  className = "",
}) {
  const [orbitProgress, setOrbitProgress] = useState(0)
  
  // Animate satellite position along the orbit
  useEffect(() => {
    const interval = setInterval(() => {
      setOrbitProgress((prev) => {
        const next = prev + 0.002
        return next >= 1 ? 0 : next
      })
    }, 100)
    
    return () => clearInterval(interval)
  }, [])
  
  // Calculate current satellite position
  const satPos = getSatellitePosition(0, inclination, orbitProgress)
  
  // Generate ground tracks
  const currentOrbit = generateGroundTrack(0, inclination, 200)
  const previousOrbit = generateGroundTrack(22.5, inclination, 200)
  const nextOrbit = generateGroundTrack(-22.5, inclination, 200)
  
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <svg 
        viewBox="0 0 720 360" 
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        style={{ display: 'block' }}
        role="img"
        aria-label="Satellite ground track visualization"
      >
      {/* Base world map */}
      <WorldMap />
      
      {/* Orbit tracks */}
      {showPredictions && (
        <>
          <OrbitTrack path={previousOrbit} opacity={0.2} dashed strokeWidth={2} />
          <OrbitTrack path={nextOrbit} opacity={0.3} dashed strokeWidth={1.5} />
        </>
      )}
      <OrbitTrack path={currentOrbit} />
      
      {/* Equator crossing indicator */}
      <EquatorIndicator inclination={inclination} />
      
      {/* Ground stations */}
      {showGroundStations && GROUND_STATIONS.map((station) => (
        <GroundStationMarker key={station.name} station={station} />
      ))}
      
      {/* Satellite marker */}
      <SatelliteMarker x={satPos.x} y={satPos.y} showFootprint={showFootprint} />
      
      {/* Satellite label */}
      <text 
        x={satPos.x} 
        y={satPos.y + 32} 
        fill="#e2e8f0" 
        fontSize="9" 
        fontWeight="bold" 
        textAnchor="middle"
      >
        SAT-01
      </text>
      
      {/* Coordinate display */}
      <CoordinateDisplay lat={satPos.lat} lon={satPos.lon} altitude={altitude} />
      </svg>
    </div>
  )
}

export default GroundTrack2D
