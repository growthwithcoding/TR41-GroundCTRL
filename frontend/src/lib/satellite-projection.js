/**
 * Satellite Projection Mathematics
 * 
 * Implements dual projection system for satellite visualization:
 * - Sinusoidal (pseudocylindrical equal-area) for LEO (< 2500 km)
 * - Orthographic (space view) for higher orbits (>= 2500 km)
 * 
 * Mathematical References:
 * - Snyder, J.P. (1987). Map Projections: A Working Manual. USGS Professional Paper 1395
 * - Vallado, D.A. (2013). Fundamentals of Astrodynamics and Applications
 * - https://mathworld.wolfram.com/SinusoidalProjection.html
 * - https://mathworld.wolfram.com/OrthographicProjection.html
 */

// Physical Constants
export const EARTH_RADIUS_KM = 6371 // Mean Earth radius (WGS84 mean)
export const EARTH_RADIUS_EQ_KM = 6378.137 // Equatorial radius (WGS84)
export const EARTH_RADIUS_POLAR_KM = 6356.752 // Polar radius (WGS84)
export const MU_EARTH = 398600.4418 // Earth's gravitational parameter (km³/s²)
export const J2 = 0.00108263 // Earth's oblateness coefficient
export const EARTH_ROTATION_RAD_PER_SEC = 7.2921159e-5 // rad/s

// Projection transition thresholds
export const LEO_UPPER_LIMIT = 2000 // km - LEO upper boundary
export const TRANSITION_START = 2000 // km - Start blending projections
export const TRANSITION_END = 3000 // km - Complete transition to orthographic
export const SWITCH_THRESHOLD = 2500 // km - Midpoint for view switch

// Degree/radian conversions
export const DEG_TO_RAD = Math.PI / 180
export const RAD_TO_DEG = 180 / Math.PI

// ============================================================================
// SINUSOIDAL PROJECTION (Pseudocylindrical Equal-Area)
// ============================================================================

/**
 * Sinusoidal (Sanson-Flamsteed) Forward Projection
 * 
 * Properties:
 * - Equal-area (preserves relative sizes)
 * - Parallels are straight, equally spaced horizontal lines
 * - Central meridian is straight, true to scale
 * - Other meridians are sinusoidal curves
 * 
 * Formulas (Snyder 1987, eq. 30-1, 30-2):
 *   x = R × (λ - λ₀) × cos(φ)
 *   y = R × φ
 * 
 * Where:
 *   φ = latitude in radians
 *   λ = longitude in radians
 *   λ₀ = central meridian longitude
 *   R = Earth radius
 * 
 * @param {number} lat - Latitude in degrees (-90 to 90)
 * @param {number} lon - Longitude in degrees (-180 to 180)
 * @param {number} centralMeridian - Central meridian longitude in degrees (default 0)
 * @param {number} width - Output width in pixels
 * @param {number} height - Output height in pixels
 * @returns {Object} { x, y, visible, scale }
 */
export function sinusoidalForward(
  lat,
  lon,
  centralMeridian = 0,
  width = 720,
  height = 360
) {
  const phi = lat * DEG_TO_RAD
  const lambda = lon * DEG_TO_RAD
  const lambda0 = centralMeridian * DEG_TO_RAD
  
  // Sinusoidal projection formulas
  const x_proj = EARTH_RADIUS_KM * (lambda - lambda0) * Math.cos(phi)
  const y_proj = EARTH_RADIUS_KM * phi
  
  // Normalize to screen coordinates
  // Map x: [-π×R, π×R] → [0, width]
  // Map y: [-π/2×R, π/2×R] → [height, 0] (inverted for screen coords)
  const x_max = EARTH_RADIUS_KM * Math.PI
  const y_max = EARTH_RADIUS_KM * Math.PI / 2
  
  const x = ((x_proj / x_max) + 1) * 0.5 * width
  const y = (1 - (y_proj / y_max + 1) * 0.5) * height
  
  // Local scale factor (varies with latitude due to meridian convergence)
  const scale = Math.cos(phi)
  
  return {
    x,
    y,
    visible: true, // All points visible in sinusoidal
    scale
  }
}

/**
 * Sinusoidal Inverse Projection
 * Convert screen coordinates back to lat/lon
 */
export function sinusoidalInverse(
  x,
  y,
  centralMeridian = 0,
  width = 720,
  height = 360
) {
  const x_max = EARTH_RADIUS_KM * Math.PI
  const y_max = EARTH_RADIUS_KM * Math.PI / 2
  
  // Convert screen to projection coordinates
  const x_proj = ((x / width) * 2 - 1) * x_max
  const y_proj = (1 - (y / height) * 2) * y_max
  
  // Inverse formulas
  const phi = y_proj / EARTH_RADIUS_KM
  
  // Check latitude bounds
  if (Math.abs(phi) > Math.PI / 2) return null
  
  const cosPhi = Math.cos(phi)
  if (Math.abs(cosPhi) < 1e-10) {
    // At poles, any longitude is valid
    return { lat: phi * RAD_TO_DEG, lon: centralMeridian }
  }
  
  const lambda = x_proj / (EARTH_RADIUS_KM * cosPhi) + centralMeridian * DEG_TO_RAD
  
  // Normalize longitude to [-π, π]
  let normalizedLambda = lambda
  while (normalizedLambda > Math.PI) normalizedLambda -= 2 * Math.PI
  while (normalizedLambda < -Math.PI) normalizedLambda += 2 * Math.PI
  
  return {
    lat: phi * RAD_TO_DEG,
    lon: normalizedLambda * RAD_TO_DEG
  }
}

// ============================================================================
// ORTHOGRAPHIC PROJECTION (Space View / Globe)
// ============================================================================

/**
 * Orthographic Forward Projection
 * 
 * Simulates viewing Earth from infinite distance (parallel rays).
 * For finite satellite altitude, we adjust the visible disk size.
 * 
 * Properties:
 * - Shows Earth as seen from space
 * - Only hemisphere facing viewer is visible
 * - Great circles through center appear as straight lines
 * - All other circles appear as ellipses
 * 
 * Formulas (Snyder 1987, eq. 20-3, 20-4):
 *   x = R × cos(φ) × sin(λ - λ₀)
 *   y = R × [cos(φ₀) × sin(φ) - sin(φ₀) × cos(φ) × cos(λ - λ₀)]
 * 
 * Visibility condition:
 *   cos(c) = sin(φ₀) × sin(φ) + cos(φ₀) × cos(φ) × cos(λ - λ₀) > 0
 * 
 * Where (φ₀, λ₀) is the center point (satellite nadir)
 * 
 * @param {number} lat - Point latitude in degrees
 * @param {number} lon - Point longitude in degrees
 * @param {number} centerLat - View center latitude (satellite nadir)
 * @param {number} centerLon - View center longitude
 * @param {number} altitude - Satellite altitude in km (affects visible disk)
 * @param {number} size - Output size in pixels (square)
 * @returns {Object} { x, y, visible, scale }
 */
export function orthographicForward(
  lat,
  lon,
  centerLat,
  centerLon,
  altitude,
  size = 360
) {
  const phi = lat * DEG_TO_RAD
  const lambda = lon * DEG_TO_RAD
  const phi0 = centerLat * DEG_TO_RAD
  const lambda0 = centerLon * DEG_TO_RAD
  
  // Calculate angular distance from center (great circle distance)
  const cosC = Math.sin(phi0) * Math.sin(phi) + 
               Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda - lambda0)
  
  // Point is on the back side of the globe
  if (cosC < 0) {
    return { x: 0, y: 0, visible: false, scale: 0 }
  }
  
  // Calculate horizon angle based on altitude
  // sin(α) = R / (R + h), where α is the angular radius of visible Earth
  const horizonAngle = Math.asin(EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altitude))
  const maxAngularDist = Math.PI / 2 - horizonAngle
  
  // Check if point is beyond the visible horizon from satellite
  const angularDist = Math.acos(Math.max(-1, Math.min(1, cosC)))
  if (angularDist > maxAngularDist) {
    return { x: 0, y: 0, visible: false, scale: 0 }
  }
  
  // Orthographic projection formulas
  const x_proj = EARTH_RADIUS_KM * Math.cos(phi) * Math.sin(lambda - lambda0)
  const y_proj = EARTH_RADIUS_KM * (
    Math.cos(phi0) * Math.sin(phi) - 
    Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda - lambda0)
  )
  
  // Scale to fit in output size
  // Visible disk radius depends on altitude
  const visibleRadius = EARTH_RADIUS_KM * Math.cos(horizonAngle)
  const scale_factor = (size / 2) / visibleRadius
  
  const x = (size / 2) + x_proj * scale_factor
  const y = (size / 2) - y_proj * scale_factor // Flip Y for screen coords
  
  // Local scale factor (foreshortening near edges)
  const scale = cosC
  
  return { x, y, visible: true, scale }
}

/**
 * Orthographic Inverse Projection
 * Convert screen coordinates back to lat/lon
 */
export function orthographicInverse(
  x,
  y,
  centerLat,
  centerLon,
  altitude,
  size = 360
) {
  const phi0 = centerLat * DEG_TO_RAD
  const lambda0 = centerLon * DEG_TO_RAD
  
  // Calculate visible disk radius
  const horizonAngle = Math.asin(EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altitude))
  const visibleRadius = EARTH_RADIUS_KM * Math.cos(horizonAngle)
  const scale_factor = (size / 2) / visibleRadius
  
  // Convert screen to projection coordinates
  const x_proj = (x - size / 2) / scale_factor
  const y_proj = (size / 2 - y) / scale_factor
  
  // Check if point is within Earth's disk
  const rho = Math.sqrt(x_proj * x_proj + y_proj * y_proj)
  if (rho > EARTH_RADIUS_KM) return null
  
  // Inverse formulas (Snyder eq. 20-14, 20-15)
  const c = Math.asin(rho / EARTH_RADIUS_KM)
  const sinC = Math.sin(c)
  const cosC = Math.cos(c)
  
  let phi
  let lambda
  
  if (rho < 1e-10) {
    // At center point
    phi = phi0
    lambda = lambda0
  } else {
    phi = Math.asin(cosC * Math.sin(phi0) + (y_proj * sinC * Math.cos(phi0)) / rho)
    
    if (Math.abs(phi0 - Math.PI / 2) < 1e-10) {
      // North pole center
      lambda = lambda0 + Math.atan2(x_proj, -y_proj)
    } else if (Math.abs(phi0 + Math.PI / 2) < 1e-10) {
      // South pole center
      lambda = lambda0 + Math.atan2(x_proj, y_proj)
    } else {
      lambda = lambda0 + Math.atan2(
        x_proj * sinC,
        rho * Math.cos(phi0) * cosC - y_proj * Math.sin(phi0) * sinC
      )
    }
  }
  
  return {
    lat: phi * RAD_TO_DEG,
    lon: lambda * RAD_TO_DEG
  }
}

// ============================================================================
// EQUIRECTANGULAR PROJECTION (Plate Carrée)
// ============================================================================

/**
 * Equirectangular Forward Projection
 * Simple linear mapping of lat/lon to x/y
 * Used as intermediate format for texture mapping
 */
export function equirectangularForward(
  lat,
  lon,
  width = 720,
  height = 360
) {
  // Simple linear mapping
  const x = ((lon + 180) / 360) * width
  const y = ((90 - lat) / 180) * height
  
  return { x, y, visible: true, scale: 1 }
}

/**
 * Equirectangular Inverse Projection
 */
export function equirectangularInverse(
  x,
  y,
  width = 720,
  height = 360
) {
  const lon = (x / width) * 360 - 180
  const lat = 90 - (y / height) * 180
  return { lat, lon }
}

// ============================================================================
// ORBIT PROPAGATION (Simplified Two-Body)
// ============================================================================

/**
 * Calculate orbital period from semi-major axis
 * Kepler's Third Law: T = 2π × √(a³/μ)
 */
export function orbitalPeriod(semiMajorAxis) {
  return 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / MU_EARTH)
}

/**
 * Calculate mean motion (radians per second)
 * n = √(μ/a³)
 */
export function meanMotion(semiMajorAxis) {
  return Math.sqrt(MU_EARTH / Math.pow(semiMajorAxis, 3))
}

/**
 * Solve Kepler's Equation iteratively
 * M = E - e × sin(E)
 * 
 * Uses Newton-Raphson iteration
 */
export function solveKeplersEquation(
  meanAnomaly,
  eccentricity,
  tolerance = 1e-10,
  maxIterations = 50
) {
  let E = meanAnomaly // Initial guess
  
  for (let i = 0; i < maxIterations; i++) {
    const f = E - eccentricity * Math.sin(E) - meanAnomaly
    const fPrime = 1 - eccentricity * Math.cos(E)
    const delta = f / fPrime
    E -= delta
    
    if (Math.abs(delta) < tolerance) break
  }
  
  return E
}

/**
 * Convert eccentric anomaly to true anomaly
 */
export function eccentricToTrueAnomaly(E, e) {
  return 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2)
  )
}

/**
 * Propagate orbital elements to get position
 * Returns ECI coordinates and sub-satellite lat/lon
 */
export function propagateOrbit(elements, time) {
  const { a, e, i, raan, argP, trueAnomaly: nu0, epoch } = elements
  
  // Convert angles to radians
  const i_rad = i * DEG_TO_RAD
  const raan_rad = raan * DEG_TO_RAD
  const argP_rad = argP * DEG_TO_RAD
  const nu0_rad = nu0 * DEG_TO_RAD
  
  // Calculate mean motion
  const n = meanMotion(a)
  
  // Mean anomaly at epoch
  const E0 = 2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan(nu0_rad / 2))
  const M0 = E0 - e * Math.sin(E0)
  
  // Mean anomaly at current time
  const M = M0 + n * time
  
  // Solve Kepler's equation for eccentric anomaly
  const E = solveKeplersEquation(M, e)
  
  // True anomaly
  const nu = eccentricToTrueAnomaly(E, e)
  
  // Distance from Earth center
  const r = a * (1 - e * Math.cos(E))
  
  // Position in orbital plane
  const x_orb = r * Math.cos(nu)
  const y_orb = r * Math.sin(nu)
  
  // Rotation matrices to ECI
  const cos_raan = Math.cos(raan_rad)
  const sin_raan = Math.sin(raan_rad)
  const cos_i = Math.cos(i_rad)
  const sin_i = Math.sin(i_rad)
  const cos_argP = Math.cos(argP_rad)
  const sin_argP = Math.sin(argP_rad)
  
  // Combined rotation matrix elements
  const r11 = cos_raan * cos_argP - sin_raan * sin_argP * cos_i
  const r12 = -cos_raan * sin_argP - sin_raan * cos_argP * cos_i
  const r21 = sin_raan * cos_argP + cos_raan * sin_argP * cos_i
  const r22 = -sin_raan * sin_argP + cos_raan * cos_argP * cos_i
  const r31 = sin_argP * sin_i
  const r32 = cos_argP * sin_i
  
  // ECI position
  const x_eci = r11 * x_orb + r12 * y_orb
  const y_eci = r21 * x_orb + r22 * y_orb
  const z_eci = r31 * x_orb + r32 * y_orb
  
  // Velocity in orbital plane
  const h = Math.sqrt(MU_EARTH * a * (1 - e * e))
  const vx_orb = -MU_EARTH / h * Math.sin(nu)
  const vy_orb = MU_EARTH / h * (e + Math.cos(nu))
  
  // ECI velocity
  const vx_eci = r11 * vx_orb + r12 * vy_orb
  const vy_eci = r21 * vx_orb + r22 * vy_orb
  const vz_eci = r31 * vx_orb + r32 * vy_orb
  
  // Convert ECI to lat/lon (accounting for Earth rotation)
  const gmst = earthRotationAngle(time * 1000 + epoch)
  const theta = gmst * DEG_TO_RAD
  
  // ECEF coordinates
  const x_ecef = x_eci * Math.cos(theta) + y_eci * Math.sin(theta)
  const y_ecef = -x_eci * Math.sin(theta) + y_eci * Math.cos(theta)
  const z_ecef = z_eci
  
  // Geodetic coordinates
  const lon = Math.atan2(y_ecef, x_ecef) * RAD_TO_DEG
  const lat = Math.atan2(z_ecef, Math.sqrt(x_ecef * x_ecef + y_ecef * y_ecef)) * RAD_TO_DEG
  const alt = r - EARTH_RADIUS_KM
  
  return {
    position: { x: x_eci, y: y_eci, z: z_eci },
    velocity: { x: vx_eci, y: vy_eci, z: vz_eci },
    lat,
    lon,
    alt,
    elements: {
      ...elements,
      trueAnomaly: nu * RAD_TO_DEG
    }
  }
}

/**
 * Calculate Earth rotation angle (GMST approximation)
 * Returns angle in degrees
 */
export function earthRotationAngle(timestamp) {
  // Julian date
  const JD = timestamp / 86400000 + 2440587.5
  const T = (JD - 2451545.0) / 36525
  
  // GMST in degrees (simplified)
  let gmst = 280.46061837 + 360.98564736629 * (JD - 2451545.0) +
             0.000387933 * T * T - T * T * T / 38710000
  
  // Normalize to [0, 360)
  gmst = ((gmst % 360) + 360) % 360
  
  return gmst
}

/**
 * Generate ground track for multiple orbits
 */
export function generateOrbitGroundTrack(
  elements,
  numOrbits = 1,
  pointsPerOrbit = 360
) {
  const period = orbitalPeriod(elements.a)
  const totalTime = period * numOrbits
  const dt = totalTime / (pointsPerOrbit * numOrbits)
  
  const track = []
  
  for (let t = 0; t <= totalTime; t += dt) {
    const state = propagateOrbit(elements, t)
    track.push({
      lat: state.lat,
      lon: state.lon,
      alt: state.alt
    })
  }
  
  return track
}

// ============================================================================
// VIEW TRANSITION
// ============================================================================

/**
 * Smoothstep interpolation function
 * Provides smooth transition between 0 and 1
 */
export function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/**
 * Calculate blend factor between sinusoidal and orthographic views
 * Returns 0 for pure sinusoidal, 1 for pure orthographic
 */
export function calculateViewBlend(altitude) {
  return smoothstep(TRANSITION_START, TRANSITION_END, altitude)
}

/**
 * Get current projection mode based on altitude
 */
export function getProjectionMode(altitude) {
  if (altitude < TRANSITION_START) return 'sinusoidal'
  if (altitude > TRANSITION_END) return 'orthographic'
  return 'transitioning'
}

// ============================================================================
// TERMINATOR (DAY/NIGHT BOUNDARY)
// ============================================================================

/**
 * Calculate subsolar point (where sun is directly overhead)
 * Simplified calculation based on date/time
 */
export function getSubsolarPoint(timestamp) {
  const date = new Date(timestamp)
  
  // Day of year
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const dayOfYear = Math.floor(diff / 86400000)
  
  // Approximate solar declination
  const declination = -23.45 * Math.cos((360 / 365) * (dayOfYear + 10) * DEG_TO_RAD)
  
  // Hour angle based on UTC time
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60
  const solarLon = -15 * (hours - 12) // 15° per hour, noon = 0°
  
  return {
    lat: declination,
    lon: solarLon
  }
}

/**
 * Generate terminator line points
 */
export function generateTerminator(timestamp, numPoints = 180) {
  const subsolar = getSubsolarPoint(timestamp)
  const points = []
  
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI
    
    // Point on terminator circle (90° from subsolar point)
    const lat = Math.asin(
      Math.cos(angle) * Math.cos(subsolar.lat * DEG_TO_RAD)
    ) * RAD_TO_DEG
    
    const lon = subsolar.lon + Math.atan2(
      Math.sin(angle),
      -Math.sin(subsolar.lat * DEG_TO_RAD) * Math.cos(angle)
    ) * RAD_TO_DEG
    
    points.push({ lat, lon: ((lon + 540) % 360) - 180 })
  }
  
  return points
}
