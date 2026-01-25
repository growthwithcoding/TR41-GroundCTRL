"use client"

/**
 * Equirectangular (Plate Carrée) World Map
 * 
 * Uses NASA Blue Marble: Next Generation imagery 
 * https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/
 * 
 * Based on Wikipedia's equirectangular projection formulas:
 * For plate carrée (standard parallel φ₁ = 0):
 *   x = R × (λ - λ₀)  where λ is longitude in radians
 *   y = R × (φ - φ₀)  where φ is latitude in radians
 * 
 * In simplified form for SVG viewBox 720×360:
 *   x = (longitude + 180) × 2  →  range 0 to 720
 *   y = (90 - latitude) × 2    →  range 0 to 360
 * 
 * This creates a 2:1 aspect ratio map where:
 * - Horizontal axis: -180°W (x=0) to +180°E (x=720)
 * - Vertical axis: +90°N (y=0) to -90°S (y=360)
 */

// NASA Blue Marble: Next Generation (January, 5400x2700, 8km/pixel)
// Source: https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/
const NASA_BLUE_MARBLE_URL = "/images/world.jpg"

// Convert lat/lon to SVG coordinates using plate carrée projection
export function latLonToSvg(lat, lon) {
  return {
    x: (lon + 180) * 2,  // -180 to +180 → 0 to 720
    y: (90 - lat) * 2    // +90 to -90 → 0 to 360
  }
}

// Convert SVG coordinates back to lat/lon
export function svgToLatLon(x, y) {
  return {
    lon: (x / 2) - 180,
    lat: 90 - (y / 2)
  }
}

export function WorldMap({ className = "", showGrid = true, showLabels = true }) {
  return (
    <g className={className}>
      {/* NASA Blue Marble background image - equirectangular projection */}
      <image 
        href={NASA_BLUE_MARBLE_URL}
        x="0" 
        y="0" 
        width="720" 
        height="360"
        preserveAspectRatio="none"
      />
      
      {/* Semi-transparent overlay for better contrast with UI elements */}
      <rect x="0" y="0" width="720" height="360" fill="#000" fillOpacity="0.15" />
      
      {/* Grid lines */}
      {showGrid && (
        <g stroke="#ffffff" strokeWidth="0.3" fill="none" opacity="0.25">
          {/* Latitude lines every 30° */}
          <line x1="0" y1="60" x2="720" y2="60" strokeDasharray="4 8" /> {/* 60°N */}
          <line x1="0" y1="120" x2="720" y2="120" strokeDasharray="4 8" /> {/* 30°N */}
          <line x1="0" y1="180" x2="720" y2="180" strokeWidth="0.5" opacity="0.4" /> {/* Equator */}
          <line x1="0" y1="240" x2="720" y2="240" strokeDasharray="4 8" /> {/* 30°S */}
          <line x1="0" y1="300" x2="720" y2="300" strokeDasharray="4 8" /> {/* 60°S */}
          
          {/* Longitude lines every 30° */}
          <line x1="60" y1="0" x2="60" y2="360" strokeDasharray="4 8" /> {/* 150°W */}
          <line x1="120" y1="0" x2="120" y2="360" strokeDasharray="4 8" /> {/* 120°W */}
          <line x1="180" y1="0" x2="180" y2="360" strokeDasharray="4 8" /> {/* 90°W */}
          <line x1="240" y1="0" x2="240" y2="360" strokeDasharray="4 8" /> {/* 60°W */}
          <line x1="300" y1="0" x2="300" y2="360" strokeDasharray="4 8" /> {/* 30°W */}
          <line x1="360" y1="0" x2="360" y2="360" strokeWidth="0.5" opacity="0.4" /> {/* Prime Meridian */}
          <line x1="420" y1="0" x2="420" y2="360" strokeDasharray="4 8" /> {/* 30°E */}
          <line x1="480" y1="0" x2="480" y2="360" strokeDasharray="4 8" /> {/* 60°E */}
          <line x1="540" y1="0" x2="540" y2="360" strokeDasharray="4 8" /> {/* 90°E */}
          <line x1="600" y1="0" x2="600" y2="360" strokeDasharray="4 8" /> {/* 120°E */}
          <line x1="660" y1="0" x2="660" y2="360" strokeDasharray="4 8" /> {/* 150°E */}
        </g>
      )}
      
      {/* Coordinate labels */}
      {showLabels && (
        <g fill="#ffffff" fontSize="7" fontFamily="ui-monospace, monospace" opacity="0.7">
          {/* Latitude labels (left side) */}
          <text x="4" y="63">60°N</text>
          <text x="4" y="123">30°N</text>
          <text x="4" y="183">0°</text>
          <text x="4" y="243">30°S</text>
          <text x="4" y="303">60°S</text>
          
          {/* Longitude labels (bottom) */}
          <text x="120" y="356" textAnchor="middle">120°W</text>
          <text x="240" y="356" textAnchor="middle">60°W</text>
          <text x="360" y="356" textAnchor="middle">0°</text>
          <text x="480" y="356" textAnchor="middle">60°E</text>
          <text x="600" y="356" textAnchor="middle">120°E</text>
        </g>
      )}
    </g>
  )
}

/**
 * Ground Track Mathematics
 * 
 * A satellite in circular orbit traces a sinusoidal path on an equirectangular map:
 * - latitude = inclination × sin(θ)  where θ is the orbital angle (0° to 360°)
 * - The track crosses the equator twice per orbit at ascending/descending nodes
 * - Earth rotates beneath at ~0.25°/minute, causing westward drift between orbits
 * 
 * For a 53° inclination orbit (like Starlink), the track oscillates between 53°N and 53°S
 * The characteristic "figure-8" appearance comes from viewing multiple orbits overlaid
 */

// Generate a single orbital ground track
export function generateGroundTrack(
  startLon,           // Starting longitude at equator crossing (ascending node)
  inclination = 53,   // Orbital inclination in degrees
  numPoints = 100     // Resolution of the curve
) {
  const points = []
  
  for (let i = 0; i <= numPoints; i++) {
    // θ goes from 0 to 360° for one complete orbit
    const theta = (i / numPoints) * 360
    const thetaRad = theta * Math.PI / 180
    
    // Latitude oscillates sinusoidally based on inclination
    // lat = inclination × sin(θ)
    const lat = inclination * Math.sin(thetaRad)
    
    // Longitude advances linearly (simplified - ignores Earth rotation for single orbit view)
    // For visualization, we spread the orbit across the map width
    const lon = startLon + (theta * (360 / 360)) - 180
    const normalizedLon = ((lon + 540) % 360) - 180 // normalize to [-180, 180]
    
    const { x, y } = latLonToSvg(lat, normalizedLon)
    
    // Handle antimeridian crossing - start new path segment
    if (i === 0) {
      points.push(`M${x.toFixed(1)},${y.toFixed(1)}`)
    } else {
      const prevTheta = ((i - 1) / numPoints) * 360
      const prevLon = startLon + (prevTheta * (360 / 360)) - 180
      const prevNormLon = ((prevLon + 540) % 360) - 180
      
      // If we crossed the antimeridian (jump > 180°), start new path
      if (Math.abs(normalizedLon - prevNormLon) > 180) {
        points.push(`M${x.toFixed(1)},${y.toFixed(1)}`)
      } else {
        points.push(`L${x.toFixed(1)},${y.toFixed(1)}`)
      }
    }
  }
  
  return points.join(' ')
}

// Generate multiple orbits showing westward drift
export function generateMultiOrbitTrack(
  startLon,
  inclination = 53,
  numOrbits = 2,
  numPointsPerOrbit = 100
) {
  const orbits = []
  const westwardDriftPerOrbit = 22.5 // degrees (Earth rotates ~22.5° in 90 min orbit)
  
  for (let orbit = 0; orbit < numOrbits; orbit++) {
    const orbitStartLon = startLon - (orbit * westwardDriftPerOrbit)
    orbits.push(generateGroundTrack(orbitStartLon, inclination, numPointsPerOrbit))
  }
  
  return orbits
}

// Get satellite position at a specific point in orbit
export function getSatellitePosition(
  startLon,
  inclination,
  orbitProgress // 0 to 1
) {
  const theta = orbitProgress * 360
  const thetaRad = theta * Math.PI / 180
  
  const lat = inclination * Math.sin(thetaRad)
  const lon = startLon + theta - 180
  const normalizedLon = ((lon + 540) % 360) - 180
  
  const { x, y } = latLonToSvg(lat, normalizedLon)
  return { lat, lon: normalizedLon, x, y }
}

export default WorldMap
