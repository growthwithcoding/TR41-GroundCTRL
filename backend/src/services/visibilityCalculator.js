/**
 * Ground Station Visibility Calculator
 * 
 * Calculates line-of-sight between satellite and ground stations
 * Part of Mission Control Enhancement Plan - Phase 2
 * 
 * Features:
 * - Line-of-sight visibility calculations
 * - Elevation and azimuth angles
 * - Signal strength estimation
 * - Pass duration prediction
 * - Next pass calculations
 */

/**
 * Ground Station Visibility Calculator
 * Calculates when satellites can communicate with ground stations
 */
class VisibilityCalculator {
  constructor() {
    this.earthRadius = 6371; // km
    this.minElevation = 5; // degrees - minimum elevation for communications
  }

  /**
   * Calculate visibility for a satellite to a ground station
   * @param {object} satelliteOrbit - Orbital parameters
   * @param {object} groundStation - Ground station location
   * @param {number} currentTime - Current timestamp
   * @returns {object} Visibility information
   */
  calculateVisibility(satelliteOrbit, groundStation, currentTime) {
    // Convert orbital elements to ECI position
    const satPosition = this.orbitToECI(satelliteOrbit, currentTime);
    
    // Convert ECI to ground station local coordinates
    const localCoords = this.eciToLocal(satPosition, groundStation.location, currentTime);
    
    // Calculate elevation and azimuth
    const elevation = this.calculateElevation(localCoords);
    const azimuth = this.calculateAzimuth(localCoords);
    
    // Check if satellite is visible (above minimum elevation)
    const isVisible = elevation > this.minElevation;
    
    // Calculate additional parameters
    const range = this.calculateRange(localCoords);
    const rangeRate = this.calculateRangeRate(satelliteOrbit, groundStation, currentTime);
    
    let passDuration = 0;
    let nextPassTime = null;
    let maxElevation = elevation;
    
    if (isVisible) {
      // Calculate pass duration and max elevation
      const passInfo = this.calculatePassDuration(satelliteOrbit, groundStation, currentTime);
      passDuration = passInfo.duration;
      maxElevation = passInfo.maxElevation;
    } else {
      // Calculate next pass
      nextPassTime = this.calculateNextPass(satelliteOrbit, groundStation, currentTime);
    }
    
    return {
      isVisible,
      elevation: Math.round(elevation * 100) / 100,
      azimuth: Math.round(azimuth * 100) / 100,
      range: Math.round(range * 100) / 100,
      rangeRate: Math.round(rangeRate * 100) / 100,
      passDuration,
      maxElevation: Math.round(maxElevation * 100) / 100,
      nextPassTime,
      signalStrength: this.calculateSignalStrength(elevation, range)
    };
  }

  /**
   * Convert orbital elements to Earth-Centered Inertial (ECI) coordinates
   * Simplified Keplerian orbit propagation
   */
  orbitToECI(orbit, time) {
    const a = this.earthRadius + orbit.altitude_km;
    const period = this.calculateOrbitalPeriod(orbit.altitude_km);
    
    // Mean motion (rad/s)
    const n = (2 * Math.PI) / period;
    
    // Time since epoch (seconds)
    const t = (time / 1000) % period;
    
    // Mean anomaly
    const M = n * t;
    
    // For circular orbits (e ≈ 0), E ≈ M
    const E = M; // Eccentric anomaly
    
    // True anomaly (for circular orbit, ν ≈ E)
    const nu = E;
    
    // Position in orbital plane
    const x = a * Math.cos(nu);
    const y = a * Math.sin(nu);
    
    // Rotate by inclination
    const incl = orbit.inclination_degrees * Math.PI / 180;
    
    // Rotate by RAAN (right ascension of ascending node)
    // Simplified: use time-dependent rotation
    const raan = (time / 1000) * 0.0001; // Slow precession
    
    // Convert to ECI
    const xECI = x * Math.cos(raan) - y * Math.cos(incl) * Math.sin(raan);
    const yECI = x * Math.sin(raan) + y * Math.cos(incl) * Math.cos(raan);
    const zECI = y * Math.sin(incl);
    
    return { x: xECI, y: yECI, z: zECI };
  }

  /**
   * Convert ECI coordinates to ground station local coordinates (topocentric)
   */
  eciToLocal(satPosition, gsLocation, time) {
    // Convert ground station lat/lon to ECEF
    const lat = gsLocation.latitude * Math.PI / 180;
    const lon = gsLocation.longitude * Math.PI / 180;
    
    // Greenwich Mean Sidereal Time (simplified)
    const gmst = this.calculateGMST(time);
    const lmst = gmst + lon;
    
    // Ground station position in ECI
    const gsECI = {
      x: this.earthRadius * Math.cos(lat) * Math.cos(lmst),
      y: this.earthRadius * Math.cos(lat) * Math.sin(lmst),
      z: this.earthRadius * Math.sin(lat)
    };
    
    // Relative position vector
    const dx = satPosition.x - gsECI.x;
    const dy = satPosition.y - gsECI.y;
    const dz = satPosition.z - gsECI.z;
    
    // Convert to topocentric (local) coordinates
    const south = -Math.sin(lat) * Math.cos(lmst) * dx - Math.sin(lat) * Math.sin(lmst) * dy + Math.cos(lat) * dz;
    const east = -Math.sin(lmst) * dx + Math.cos(lmst) * dy;
    const zenith = Math.cos(lat) * Math.cos(lmst) * dx + Math.cos(lat) * Math.sin(lmst) * dy + Math.sin(lat) * dz;
    
    return { south, east, zenith };
  }

  /**
   * Calculate elevation angle (degrees above horizon)
   */
  calculateElevation(localCoords) {
    const range = Math.sqrt(
      localCoords.south * localCoords.south +
      localCoords.east * localCoords.east +
      localCoords.zenith * localCoords.zenith
    );
    
    if (range === 0) return 0;
    
    const elevation = Math.asin(localCoords.zenith / range) * 180 / Math.PI;
    return elevation;
  }

  /**
   * Calculate azimuth angle (degrees from north, clockwise)
   */
  calculateAzimuth(localCoords) {
    const azimuth = Math.atan2(localCoords.east, -localCoords.south) * 180 / Math.PI;
    return (azimuth + 360) % 360; // Normalize to 0-360
  }

  /**
   * Calculate range (distance) in km
   */
  calculateRange(localCoords) {
    return Math.sqrt(
      localCoords.south * localCoords.south +
      localCoords.east * localCoords.east +
      localCoords.zenith * localCoords.zenith
    );
  }

  /**
   * Calculate range rate (km/s) - rate of change of distance
   */
  calculateRangeRate(orbit, groundStation, currentTime) {
    const dt = 1; // 1 second
    const pos1 = this.calculateVisibility(orbit, groundStation, currentTime);
    const pos2 = this.calculateVisibility(orbit, groundStation, currentTime + dt * 1000);
    
    return (pos2.range - pos1.range) / dt;
  }

  /**
   * Calculate orbital period (seconds)
   */
  calculateOrbitalPeriod(altitude_km) {
    const mu = 398600.4418; // km^3/s^2 (Earth's gravitational parameter)
    const r = this.earthRadius + altitude_km;
    
    return 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / mu);
  }

  /**
   * Calculate Greenwich Mean Sidereal Time
   */
  calculateGMST(time) {
    // Simplified GMST calculation
    const jd = (time / 86400000) + 2440587.5; // Julian date
    const t = (jd - 2451545.0) / 36525; // Julian centuries from J2000
    
    // GMST in hours
    let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t;
    gmst = (gmst % 360) * Math.PI / 180; // Convert to radians
    
    return gmst;
  }

  /**
   * Calculate pass duration and maximum elevation
   */
  calculatePassDuration(orbit, groundStation, currentTime) {
    const period = this.calculateOrbitalPeriod(orbit.altitude_km);
    const timeStep = 10; // Check every 10 seconds
    
    let maxElevation = 0;
    let passStart = null;
    let passEnd = null;
    
    // Look ahead up to half an orbital period
    for (let t = 0; t < period / 2; t += timeStep) {
      const checkTime = currentTime + (t * 1000);
      const vis = this.calculateVisibility(orbit, groundStation, checkTime);
      
      if (vis.isVisible) {
        if (passStart === null) {
          passStart = t;
        }
        passEnd = t;
        maxElevation = Math.max(maxElevation, vis.elevation);
      } else if (passStart !== null) {
        // Pass ended
        break;
      }
    }
    
    const duration = passStart !== null ? passEnd - passStart : 0;
    
    return {
      duration: Math.round(duration),
      maxElevation
    };
  }

  /**
   * Calculate next ground station pass
   */
  calculateNextPass(orbit, groundStation, currentTime) {
    const period = this.calculateOrbitalPeriod(orbit.altitude_km);
    const timeStep = 60; // Check every 60 seconds
    
    // Look ahead up to 3 orbital periods
    for (let t = timeStep; t < period * 3; t += timeStep) {
      const checkTime = currentTime + (t * 1000);
      const vis = this.calculateVisibility(orbit, groundStation, checkTime);
      
      if (vis.isVisible) {
        // Found next pass
        const passInfo = this.calculatePassDuration(orbit, groundStation, checkTime);
        
        return {
          startTime: checkTime,
          duration: passInfo.duration,
          maxElevation: passInfo.maxElevation,
          timeUntilPass: t
        };
      }
    }
    
    return null; // No pass found in next 3 orbits
  }

  /**
   * Calculate signal strength based on elevation and range
   */
  calculateSignalStrength(elevation, range) {
    // Signal strength decreases with range and improves with elevation
    
    // Base signal strength (arbitrary units, 0-100)
    let strength = 100;
    
    // Attenuation due to range (inverse square law, simplified)
    const minRange = 500; // km
    const rangeAttenuation = Math.pow(minRange / Math.max(range, minRange), 2);
    strength *= rangeAttenuation;
    
    // Elevation factor (better signal at higher elevations)
    const elevationFactor = Math.max(0, elevation / 90); // 0 at horizon, 1 at zenith
    strength *= (0.5 + 0.5 * elevationFactor); // Min 50% at horizon
    
    // Atmospheric attenuation at low elevations
    if (elevation < 10) {
      const atmosphericLoss = 0.5 + 0.05 * elevation; // 50-100% at 0-10 degrees
      strength *= atmosphericLoss;
    }
    
    return Math.max(0, Math.min(100, Math.round(strength)));
  }

  /**
   * Get all visible ground stations for a satellite
   */
  getVisibleStations(orbit, groundStations, currentTime) {
    return groundStations
      .map(station => ({
        station,
        visibility: this.calculateVisibility(orbit, station, currentTime)
      }))
      .filter(item => item.visibility.isVisible)
      .sort((a, b) => b.visibility.elevation - a.visibility.elevation); // Sort by elevation
  }

  /**
   * Get best ground station (highest elevation)
   */
  getBestStation(orbit, groundStations, currentTime) {
    const visible = this.getVisibleStations(orbit, groundStations, currentTime);
    return visible.length > 0 ? visible[0] : null;
  }
}

module.exports = VisibilityCalculator;
