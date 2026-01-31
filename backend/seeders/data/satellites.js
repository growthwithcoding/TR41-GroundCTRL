/**
 * Satellite Seed Data
 * Training satellites with TLE data for SGP4 orbital mechanics
 */

const CREATED_BY_UID = '5usOQ3eOm7OjXmDOFjEmKSQovs42';

const satellites = [
  {
    code: 'TRAINING_SAT_01',
    data: {
      name: 'TrainingSat-01 Alpha',
      description: 'Beginner training satellite for orbit fundamentals - LEO 400km ISS-like orbit',
      
      // TLE data for SGP4 propagation (LEO ~408km, 51.6° inclination)
      tle: {
        line1: '1 99991U 24001A   24031.50000000  .00001000  00000-0  50000-4 0  9991',
        line2: '2 99991  51.6000   0.0000 0001000   0.0000   0.0000 15.53000000    01'
      },
      
      orbit: {
        altitude_km: 408,
        inclination_degrees: 51.6,
        eccentricity: 0.0001,
        period_minutes: 92.8,
      },
      
      power: {
        solarPower_watts: 100,
        batteryCapacity_wh: 50,
        baseDrawRate_watts: 20,
        currentCharge_percent: 85,
      },
      
      attitude: {
        currentTarget: 'NADIR',
        error_degrees: 0.5,
        controlType: 'three_axis',
      },
      
      thermal: {
        currentTemp_celsius: 20,
        minSafe_celsius: -20,
        maxSafe_celsius: 50,
        heaterAvailable: true,
        heaterPower_watts: 30,
      },
      
      propulsion: {
        propellantRemaining_kg: 2.0,
        maxDeltaV_ms: 50,
        thrusterType: 'cold_gas',
      },
      
      payload: {
        type: 'Camera',
        isActive: false,
        powerDraw_watts: 15,
        resolution: '1024x768',
      },
      
      communications: {
        beaconInterval_seconds: 120,
        antennaDeployed: false,
        transmitterPower_watts: 5,
      },
      
      status: 'TRAINING',
      isPublic: true,
      capabilities: ['Basic attitude control', 'Power management', 'Thermal control', 'Beacon transmission'],
      designSource: 'ISS-inspired LEO trainer',
      createdBy: CREATED_BY_UID,
    },
  },
  
  {
    code: 'TRAINING_SAT_02',
    data: {
      name: 'TrainingSat-02 Beta',
      description: 'Intermediate satellite with advanced systems - Sun-synchronous polar orbit',
      
      // TLE data for polar orbit (~550km, 97.8° inclination)
      tle: {
        line1: '1 99992U 24001B   24031.50000000  .00000800  00000-0  40000-4 0  9992',
        line2: '2 99992  97.8000   0.0000 0001000   0.0000   0.0000 14.95000000    01'
      },
      
      orbit: {
        altitude_km: 550,
        inclination_degrees: 97.8,
        eccentricity: 0.0001,
        period_minutes: 96.2,
      },
      
      power: {
        solarPower_watts: 150,
        batteryCapacity_wh: 100,
        baseDrawRate_watts: 30,
        currentCharge_percent: 75,
      },
      
      attitude: {
        currentTarget: 'SUN',
        error_degrees: 1.0,
        controlType: 'three_axis',
      },
      
      thermal: {
        currentTemp_celsius: 15,
        minSafe_celsius: -30,
        maxSafe_celsius: 60,
        heaterAvailable: true,
        heaterPower_watts: 40,
      },
      
      propulsion: {
        propellantRemaining_kg: 5.0,
        maxDeltaV_ms: 100,
        thrusterType: 'hydrazine',
      },
      
      payload: {
        type: 'Spectrometer',
        isActive: false,
        powerDraw_watts: 25,
        spectralBands: 12,
      },
      
      communications: {
        beaconInterval_seconds: 120,
        antennaDeployed: true,
        transmitterPower_watts: 10,
      },
      
      status: 'TRAINING',
      isPublic: true,
      capabilities: ['Advanced power management', 'Orbital maneuvers', 'Scientific instruments', 'Sun tracking'],
      designSource: 'Polar orbit science satellite',
      createdBy: CREATED_BY_UID,
    },
  },
  
  {
    code: 'TRAINING_SAT_03',
    data: {
      name: 'TrainingSat-03 Gamma',
      description: 'Advanced geostationary communications satellite - Complex mission operations',
      
      // TLE data for GEO orbit (~35786km, 0° inclination)
      tle: {
        line1: '1 99993U 24001C   24031.50000000  .00000000  00000-0  00000-0 0  9993',
        line2: '2 99993   0.0500   0.0000 0001000   0.0000   0.0000  1.00273791    01'
      },
      
      orbit: {
        altitude_km: 35786,
        inclination_degrees: 0.05,
        eccentricity: 0.0001,
        period_minutes: 1436.0, // ~24 hours
      },
      
      power: {
        solarPower_watts: 200,
        batteryCapacity_wh: 200,
        baseDrawRate_watts: 40,
        currentCharge_percent: 95,
      },
      
      attitude: {
        currentTarget: 'INERTIAL_EAST',
        error_degrees: 0.1,
        controlType: 'three_axis_precise',
      },
      
      thermal: {
        currentTemp_celsius: 25,
        minSafe_celsius: -40,
        maxSafe_celsius: 70,
        heaterAvailable: true,
        heaterPower_watts: 50,
      },
      
      propulsion: {
        propellantRemaining_kg: 10.0,
        maxDeltaV_ms: 200,
        thrusterType: 'ion_electric',
      },
      
      payload: {
        type: 'Communications Array',
        isActive: true,
        powerDraw_watts: 50,
        transponders: 24,
      },
      
      communications: {
        beaconInterval_seconds: 120,
        antennaDeployed: true,
        transmitterPower_watts: 20,
      },
      
      status: 'TRAINING',
      isPublic: true,
      capabilities: ['Geostationary operations', 'High-power systems', 'Communications relay', 'Station keeping'],
      designSource: 'GEO communications satellite',
      createdBy: CREATED_BY_UID,
    },
  },
];

module.exports = satellites;
