/**
 * Rendering System Schema Definitions
 * JSDoc type definitions for orbital mechanics and visualization
 * 
 * @fileoverview Type definitions for 2D/3D rendering, orbital propagation, and coordinate systems
 */

// ============================================================================
// PHYSICAL CONSTANTS
// ============================================================================

/**
 * Physical and mathematical constants
 * @typedef {Object} PhysicalConstants
 * @property {number} EARTH_RADIUS_KM - Mean Earth radius (6371 km)
 * @property {number} EARTH_RADIUS_EQ_KM - Equatorial radius (6378.137 km)
 * @property {number} EARTH_RADIUS_POLAR_KM - Polar radius (6356.752 km)
 * @property {number} MU_EARTH - Earth's gravitational parameter (398600.4418 km³/s²)
 * @property {number} J2 - Earth's oblateness coefficient (0.00108263)
 * @property {number} EARTH_ROTATION_RAD_PER_SEC - Earth rotation rate (7.2921159e-5 rad/s)
 * @property {number} DEG_TO_RAD - Degrees to radians conversion (π/180)
 * @property {number} RAD_TO_DEG - Radians to degrees conversion (180/π)
 */

// ============================================================================
// ORBITAL ELEMENTS
// ============================================================================

/**
 * Classical Keplerian Orbital Elements
 * @typedef {Object} OrbitalElements
 * @property {number} a - Semi-major axis (km)
 * @property {number} e - Eccentricity (0 = circular, < 1 = elliptical)
 * @property {number} i - Inclination (degrees, 0-180)
 * @property {number} raan - Right Ascension of Ascending Node (Ω) in degrees (0-360)
 * @property {number} argP - Argument of Perigee (ω) in degrees (0-360)
 * @property {number} trueAnomaly - True Anomaly (ν) in degrees (0-360)
 * @property {number} epoch - Epoch time (milliseconds since Unix epoch)
 */

/**
 * WGS84 Geodetic Point
 * @typedef {Object} WGS84Point
 * @property {number} lat - Geodetic latitude in degrees (-90 to 90)
 * @property {number} lon - Longitude in degrees (-180 to 180)
 * @property {number} alt - Altitude above ellipsoid in km
 */

// ============================================================================
// COORDINATE SYSTEMS
// ============================================================================

/**
 * Cartesian 3D position vector
 * @typedef {Object} Vector3D
 * @property {number} x - X coordinate (km)
 * @property {number} y - Y coordinate (km)
 * @property {number} z - Z coordinate (km)
 */

/**
 * Complete satellite state vector
 * @typedef {Object} SatelliteState
 * @property {Vector3D} position - Position in ECI coordinates (km)
 * @property {Vector3D} velocity - Velocity in ECI coordinates (km/s)
 * @property {number} lat - Sub-satellite geodetic latitude (degrees)
 * @property {number} lon - Sub-satellite longitude (degrees)
 * @property {number} alt - Altitude above Earth surface (km)
 * @property {OrbitalElements} elements - Current orbital elements
 */

// ============================================================================
// PROJECTION SYSTEMS
// ============================================================================

/**
 * Projection result from forward projection
 * @typedef {Object} ProjectionResult
 * @property {number} x - Screen X coordinate (pixels)
 * @property {number} y - Screen Y coordinate (pixels)
 * @property {boolean} visible - Whether point is visible in this projection
 * @property {number} scale - Local scale factor for rendering
 */

/**
 * Projection mode based on altitude
 * @typedef {'sinusoidal'|'orthographic'|'transitioning'} ProjectionMode
 * - sinusoidal: LEO orbits < 2000 km
 * - orthographic: Space view >= 3000 km
 * - transitioning: Blend between 2000-3000 km
 */

// ============================================================================
// GROUND TRACK
// ============================================================================

/**
 * Point on satellite ground track
 * @typedef {Object} GroundTrackPoint
 * @property {number} lat - Latitude (degrees)
 * @property {number} lon - Longitude (degrees)
 * @property {number} alt - Altitude (km)
 * @property {number} [timestamp] - Optional timestamp (ms)
 */

/**
 * Complete ground track for visualization
 * @typedef {Object} GroundTrack
 * @property {GroundTrackPoint[]} points - Array of track points
 * @property {number} orbits - Number of orbits in track
 * @property {number} pointsPerOrbit - Resolution (points per orbit)
 */

// ============================================================================
// GROUND STATIONS
// ============================================================================

/**
 * Ground station definition
 * @typedef {Object} GroundStation
 * @property {string} name - Station name
 * @property {number} lat - Latitude (degrees)
 * @property {number} lon - Longitude (degrees)
 * @property {boolean} active - Whether station is currently active
 * @property {number} [minElevation] - Minimum elevation angle (degrees, default 5)
 * @property {number} [maxRange] - Maximum range (km)
 */

/**
 * Ground station visibility info
 * @typedef {Object} StationVisibility
 * @property {GroundStation} station - The ground station
 * @property {boolean} inRange - Whether satellite is in range
 * @property {number} elevation - Elevation angle (degrees)
 * @property {number} azimuth - Azimuth angle (degrees)
 * @property {number} range - Distance to satellite (km)
 * @property {number} [aosTime] - Acquisition of Signal time (ms)
 * @property {number} [losTime] - Loss of Signal time (ms)
 */

// ============================================================================
// TERMINATOR (DAY/NIGHT)
// ============================================================================

/**
 * Subsolar point (where sun is directly overhead)
 * @typedef {Object} SubsolarPoint
 * @property {number} lat - Subsolar latitude (degrees)
 * @property {number} lon - Subsolar longitude (degrees)
 */

/**
 * Terminator line point
 * @typedef {Object} TerminatorPoint
 * @property {number} lat - Latitude (degrees)
 * @property {number} lon - Longitude (degrees)
 */

// ============================================================================
// VIEW MODES & RENDERING
// ============================================================================

/**
 * View mode for rendering
 * @typedef {'2d-advanced'|'3d-globe'} ViewMode
 * - 2d-advanced: Advanced 2D canvas with dual projections
 * - 3d-globe: Three.js 3D globe
 */

/**
 * Rendering preferences
 * @typedef {Object} RenderingPreferences
 * @property {ViewMode} defaultViewMode - Default view on load
 * @property {boolean} autoSwitchProjections - Auto-switch based on altitude
 * @property {boolean} showGroundStations - Show ground station markers
 * @property {boolean} showTerminator - Show day/night boundary
 * @property {'high'|'balanced'|'low'} performanceMode - Performance/quality tradeoff
 */

/**
 * Canvas state for 2D rendering
 * @typedef {Object} CanvasState
 * @property {number} width - Canvas width (CSS pixels)
 * @property {number} height - Canvas height (CSS pixels)
 * @property {number} dpr - Device pixel ratio
 */

/**
 * Camera position for 3D rendering
 * @typedef {Object} CameraPosition
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} z - Z position
 * @property {number} [targetX] - Look-at target X
 * @property {number} [targetY] - Look-at target Y
 * @property {number} [targetZ] - Look-at target Z
 */

// ============================================================================
// TEXTURE & ASSETS
// ============================================================================

/**
 * NASA Blue Marble texture info
 * @typedef {Object} TextureInfo
 * @property {string} url - Texture URL
 * @property {number} width - Texture width (pixels)
 * @property {number} height - Texture height (pixels)
 * @property {'equirectangular'|'sinusoidal'} projection - Source projection
 * @property {number} resolution - Approximate km/pixel at equator
 */

// ============================================================================
// ORBITAL PROPAGATION
// ============================================================================

/**
 * Kepler's equation solution parameters
 * @typedef {Object} KeplerSolution
 * @property {number} M - Mean anomaly (radians)
 * @property {number} E - Eccentric anomaly (radians)
 * @property {number} nu - True anomaly (radians)
 * @property {number} r - Orbital radius (km)
 * @property {number} [iterations] - Number of iterations to converge
 */

/**
 * Orbital period calculation result
 * @typedef {Object} OrbitalPeriod
 * @property {number} seconds - Period in seconds
 * @property {number} minutes - Period in minutes
 * @property {number} hours - Period in hours
 */

// ============================================================================
// RENDERING OPTIONS
// ============================================================================

/**
 * 2D Canvas rendering options
 * @typedef {Object} Canvas2DOptions
 * @property {number} altitude - Satellite altitude (km)
 * @property {number} inclination - Orbital inclination (degrees)
 * @property {number} [eccentricity] - Eccentricity (default 0.0001)
 * @property {number} [raan] - RAAN (degrees, default 0)
 * @property {number} [argumentOfPerigee] - Argument of perigee (degrees, default 0)
 * @property {boolean} [showControls] - Show debug controls
 * @property {boolean} [showTerminator] - Show day/night boundary
 * @property {boolean} [showGroundStations] - Show ground stations
 * @property {string} [className] - Additional CSS classes
 */

/**
 * 3D Globe rendering options
 * @typedef {Object} Globe3DOptions
 * @property {number} altitude - Satellite altitude (km)
 * @property {number} inclination - Orbital inclination (degrees)
 * @property {number} [eccentricity] - Eccentricity (default 0.0001)
 * @property {number} [raan] - RAAN (degrees, default 0)
 * @property {boolean} [showOrbit] - Show orbital path line
 * @property {boolean} [showGroundTrack] - Show ground track on globe
 * @property {boolean} [showAtmosphere] - Show atmosphere glow
 * @property {boolean} [showStars] - Show star field background
 * @property {string} [className] - Additional CSS classes
 */

// ============================================================================
// ANIMATION & TIMING
// ============================================================================

/**
 * Animation state for orbital motion
 * @typedef {Object} AnimationState
 * @property {number} time - Current simulation time (seconds since epoch)
 * @property {number} speed - Time acceleration factor (1 = real-time)
 * @property {boolean} paused - Whether animation is paused
 * @property {number} lastFrameTime - Last frame timestamp (ms)
 */

/**
 * Orbital propagation options
 * @typedef {Object} PropagationOptions
 * @property {number} startTime - Start time (seconds since epoch)
 * @property {number} endTime - End time (seconds since epoch)
 * @property {number} [stepSize] - Time step size (seconds, default 60)
 * @property {boolean} [includeVelocity] - Include velocity in output
 */

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Projection error (when point cannot be projected)
 * @typedef {Object} ProjectionError
 * @property {string} message - Error message
 * @property {string} [reason] - Reason for failure
 * @property {Object} [point] - Original point that failed
 */

/**
 * Orbital propagation error
 * @typedef {Object} PropagationError
 * @property {string} message - Error message
 * @property {OrbitalElements} [elements] - Elements that caused error
 * @property {number} [time] - Time when error occurred
 */

// ============================================================================
// EXPORTS (for IDE support)
// ============================================================================

// Export an empty object to make this a module
export {};
