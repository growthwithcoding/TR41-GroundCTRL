/**
 * Orbital Mechanics Service
 * 
 * High-fidelity orbital calculations using SGP4 propagation
 * Part of Mission Control Enhancement Plan - Phase 4
 * 
 * Features:
 * - SGP4/SDP4 orbital propagation from TLEs
 * - Eclipse/occultation detection
 * - Coordinate transformations (ECI, ECEF, Geodetic)
 * - Solar position calculations
 * - Atmospheric drag modeling
 */

const satellite = require('satellite.js');
const logger = require('../utils/logger');

/**
 * Orbital Mechanics Service
 * Provides high-fidelity orbit calculations using SGP4
 */
class OrbitalMechanics {
  constructor() {
    this.earthRadius = 6371; // km
    this.au = 149597870.7; // Astronomical Unit in km
    
    // Sample TLEs for common orbits (can be replaced with real data)
    this.sampleTLEs = {
      ISS: {
        line1: '1 25544U 98067A   24031.50000000  .00016717  00000-0  10270-3 0  9005',
        line2: '2 25544  51.6416 339.8014 0002735  32.4851  14.8192 15.50574920437487'
      },
      LEO_400KM: {
        line1: '1 99999U 24001A   24031.50000000  .00000000  00000-0  00000-0 0  9999',
        line2: '2 99999  51.6000   0.0000 0001000   0.0000   0.0000 15.48000000    01'
      },
      LEO_600KM: {
        line1: '1 99998U 24001B   24031.50000000  .00000000  00000-0  00000-0 0  9998',
        line2: '2 99998  97.5000   0.0000 0001000   0.0000   0.0000 14.84000000    01'
      }
    };
  }

  /**
   * Create satellite record from TLE
   * @param {string} line1 - TLE line 1
   * @param {string} line2 - TLE line 2
   * @returns {object} Satellite record
   */
  createSatelliteRecord(line1, line2) {
    try {
      const satrec = satellite.twoline2satrec(line1, line2);
      
      if (satrec.error !== 0) {
        logger.error('TLE parsing error', { error: satrec.error });
        return null;
      }
      
      return satrec;
    } catch (error) {
      logger.error('Failed to create satellite record', { error: error.message });
      return null;
    }
  }

  /**
   * Propagate satellite position using SGP4
   * @param {object} satrec - Satellite record from TLE
   * @param {Date} date - Date/time to propagate to
   * @returns {object} Position and velocity in ECI coordinates
   */
  propagate(satrec, date) {
    try {
      const positionAndVelocity = satellite.propagate(satrec, date);
      
      if (positionAndVelocity.error) {
        logger.error('SGP4 propagation error', { error: positionAndVelocity.error });
        return null;
      }
      
      return {
        position: positionAndVelocity.position, // km
        velocity: positionAndVelocity.velocity  // km/s
      };
    } catch (error) {
      logger.error('Propagation failed', { error: error.message });
      return null;
    }
  }

  /**
   * Get satellite position at specific time
   * @param {string} line1 - TLE line 1
   * @param {string} line2 - TLE line 2
   * @param {number} timestamp - Unix timestamp in milliseconds
   * @returns {object} Position data
   */
  getSatellitePosition(line1, line2, timestamp) {
    const satrec = this.createSatelliteRecord(line1, line2);
    if (!satrec) return null;
    
    const date = new Date(timestamp);
    const positionAndVelocity = this.propagate(satrec, date);
    
    if (!positionAndVelocity) return null;
    
    const position = positionAndVelocity.position;
    const velocity = positionAndVelocity.velocity;
    
    // Convert to geodetic coordinates
    const gmst = satellite.gstime(date);
    const positionGd = satellite.eciToGeodetic(position, gmst);
    
    // Calculate velocity magnitude
    const speed = Math.sqrt(
      velocity.x * velocity.x +
      velocity.y * velocity.y +
      velocity.z * velocity.z
    );
    
    return {
      // ECI coordinates
      eci: {
        x: position.x,
        y: position.y,
        z: position.z
      },
      
      // Geodetic coordinates
      latitude: satellite.degreesLat(positionGd.latitude),
      longitude: satellite.degreesLong(positionGd.longitude),
      altitude: positionGd.height, // km above sea level
      
      // Velocity
      velocity: {
        x: velocity.x,
        y: velocity.y,
        z: velocity.z,
        magnitude: speed
      },
      
      // Additional data
      gmst,
      timestamp
    };
  }

  /**
   * Calculate if satellite is in eclipse (Earth's shadow)
   * @param {object} satPosition - Satellite position in ECI
   * @param {number} timestamp - Unix timestamp
   * @returns {object} Eclipse information
   */
  calculateEclipse(satPosition, timestamp) {
    // Get sun position
    const sunPosition = this.getSunPosition(timestamp);
    
    // Vector from Earth center to satellite
    const satVector = {
      x: satPosition.x,
      y: satPosition.y,
      z: satPosition.z
    };
    
    // Vector from Earth center to sun
    const sunVector = {
      x: sunPosition.x,
      y: sunPosition.y,
      z: sunPosition.z
    };
    
    // Distance from satellite to Earth center
    const satDistance = Math.sqrt(
      satVector.x * satVector.x +
      satVector.y * satVector.y +
      satVector.z * satVector.z
    );
    
    // Distance from sun to Earth center
    const sunDistance = Math.sqrt(
      sunVector.x * sunVector.x +
      sunVector.y * sunVector.y +
      sunVector.z * sunVector.z
    );
    
    // Normalize vectors
    const satUnitVector = {
      x: satVector.x / satDistance,
      y: satVector.y / satDistance,
      z: satVector.z / satDistance
    };
    
    const sunUnitVector = {
      x: sunVector.x / sunDistance,
      y: sunVector.y / sunDistance,
      z: sunVector.z / sunDistance
    };
    
    // Dot product (cos of angle between sat and sun)
    const cosAngle = (
      satUnitVector.x * sunUnitVector.x +
      satUnitVector.y * sunUnitVector.y +
      satUnitVector.z * sunUnitVector.z
    );
    
    // If angle > 90 degrees, satellite might be in shadow
    if (cosAngle < 0) {
      // Calculate shadow cone
      const shadowAngle = Math.asin(this.earthRadius / satDistance);
      const sunAngle = Math.acos(cosAngle);
      
      // Check if in umbra (full shadow) or penumbra (partial shadow)
      const inUmbra = sunAngle > (Math.PI / 2 + shadowAngle);
      const inPenumbra = !inUmbra && sunAngle > (Math.PI / 2 - shadowAngle);
      
      return {
        inEclipse: inUmbra || inPenumbra,
        inUmbra,
        inPenumbra,
        shadowFraction: inUmbra ? 1.0 : (inPenumbra ? 0.5 : 0.0)
      };
    }
    
    return {
      inEclipse: false,
      inUmbra: false,
      inPenumbra: false,
      shadowFraction: 0.0
    };
  }

  /**
   * Get sun position in ECI coordinates
   * @param {number} timestamp - Unix timestamp
   * @returns {object} Sun position vector
   */
  getSunPosition(timestamp) {
    const date = new Date(timestamp);
    
    // Days since J2000.0
    const jd = this.getJulianDate(date);
    const T = (jd - 2451545.0) / 36525.0;
    
    // Mean longitude of sun (degrees)
    const L = (280.460 + 36000.771 * T) % 360;
    
    // Mean anomaly of sun (degrees)
    const M = (357.528 + 35999.050 * T) % 360;
    const M_rad = M * Math.PI / 180;
    
    // Ecliptic longitude (degrees)
    const lambda = L + 1.915 * Math.sin(M_rad) + 0.020 * Math.sin(2 * M_rad);
    const lambda_rad = lambda * Math.PI / 180;
    
    // Obliquity of ecliptic (degrees)
    const epsilon = 23.439 - 0.013 * T;
    const epsilon_rad = epsilon * Math.PI / 180;
    
    // Sun distance (AU)
    const R = 1.00014 - 0.01671 * Math.cos(M_rad) - 0.00014 * Math.cos(2 * M_rad);
    
    // Convert to ECI coordinates (km)
    const x = R * this.au * Math.cos(lambda_rad);
    const y = R * this.au * Math.cos(epsilon_rad) * Math.sin(lambda_rad);
    const z = R * this.au * Math.sin(epsilon_rad) * Math.sin(lambda_rad);
    
    return { x, y, z };
  }

  /**
   * Get Julian Date from JavaScript Date
   * @param {Date} date - JavaScript Date object
   * @returns {number} Julian Date
   */
  getJulianDate(date) {
    return (date.getTime() / 86400000) + 2440587.5;
  }

  /**
   * Calculate look angles from ground station to satellite
   * @param {object} satPosition - Satellite position in ECI
   * @param {object} gsLocation - Ground station {latitude, longitude, altitude}
   * @param {number} timestamp - Unix timestamp
   * @returns {object} Look angles (azimuth, elevation, range)
   */
  calculateLookAngles(satPosition, gsLocation, timestamp) {
    const date = new Date(timestamp);
    const gmst = satellite.gstime(date);
    
    // Ground station position in radians
    const observerGd = {
      latitude: gsLocation.latitude * Math.PI / 180,
      longitude: gsLocation.longitude * Math.PI / 180,
      height: gsLocation.altitude || 0 // km
    };
    
    // Convert ECI position to look angles
    const positionEci = {
      x: satPosition.x,
      y: satPosition.y,
      z: satPosition.z
    };
    
    const lookAngles = satellite.ecfToLookAngles(
      observerGd,
      positionEci,
      gmst
    );
    
    return {
      azimuth: lookAngles.azimuth * 180 / Math.PI,
      elevation: lookAngles.elevation * 180 / Math.PI,
      range: lookAngles.rangeSat // km
    };
  }

  /**
   * Calculate orbital period from TLE
   * @param {string} line1 - TLE line 1
   * @param {string} line2 - TLE line 2
   * @returns {number} Orbital period in seconds
   */
  calculateOrbitalPeriod(line1, line2) {
    const satrec = this.createSatelliteRecord(line1, line2);
    if (!satrec) return null;
    
    // Mean motion is in revolutions per day
    const meanMotion = satrec.no; // radians per minute
    const meanMotionRevPerDay = meanMotion * 1440 / (2 * Math.PI);
    
    // Period in seconds
    const period = 86400 / meanMotionRevPerDay;
    
    return period;
  }

  /**
   * Generate TLE for orbit parameters
   * Simplified - creates approximate TLE
   * @param {object} orbitParams - {altitude_km, inclination_degrees, eccentricity}
   * @returns {object} TLE lines
   */
  generateTLEFromParams(orbitParams) {
    const altitude = orbitParams.altitude_km || 400;
    const inclination = orbitParams.inclination_degrees || 51.6;
    const eccentricity = orbitParams.eccentricity || 0.0001;
    
    // Calculate mean motion (revolutions per day)
    const mu = 398600.4418; // km^3/s^2
    const a = this.earthRadius + altitude; // semi-major axis
    const n = Math.sqrt(mu / Math.pow(a, 3)); // rad/s
    const meanMotion = n * 86400 / (2 * Math.PI); // rev/day
    
    // Format mean motion for TLE (8 digits after decimal)
    const meanMotionStr = meanMotion.toFixed(8).padStart(11, '0');
    
    // Create simplified TLE
    const epoch = new Date();
    const year = epoch.getFullYear().toString().slice(-2);
    const dayOfYear = this.getDayOfYear(epoch).toFixed(8);
    
    const line1 = `1 99999U 24001A   ${year}${dayOfYear}  .00000000  00000-0  00000-0 0  9999`;
    const line2 = `2 99999 ${inclination.toFixed(4).padStart(8)} 000.0000 ${(eccentricity * 10000000).toFixed(0).padStart(7, '0')}   0.0000   0.0000 ${meanMotionStr}    01`;
    
    return { line1, line2 };
  }

  /**
   * Get day of year
   * @param {Date} date - Date object
   * @returns {number} Day of year
   */
  getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  /**
   * Get sample TLE for testing
   * @param {string} orbitType - Type of orbit (ISS, LEO_400KM, LEO_600KM)
   * @returns {object} TLE lines
   */
  getSampleTLE(orbitType = 'LEO_400KM') {
    return this.sampleTLEs[orbitType] || this.sampleTLEs.LEO_400KM;
  }
}

module.exports = OrbitalMechanics;
