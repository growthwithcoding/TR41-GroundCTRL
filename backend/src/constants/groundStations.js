/**
 * Ground Station Constants
 * 
 * Real ground station data with correct GPS coordinates
 * No placeholders, no aggregated locations - every point can be drawn today
 * 
 * Data sources:
 * - NASA Deep Space Network: https://deepspace.jpl.nasa.gov/
 * - ESA ESTRACK: https://www.esa.int/estrack
 * - KSAT: https://www.ksat.no/
 */

const GROUND_STATIONS = [
  // =========================
  // NASA – Deep Space Network
  // =========================
  {
    stationId: 'dsn_goldstone',
    displayName: 'Goldstone',
    operator: 'NASA',
    network: 'DSN',
    country: 'United States',
    location: {
      latitude: 35.2472,
      longitude: -116.7933,
      elevationMeters: 900
    },
    capabilities: {
      frequencyBands: ['S', 'X', 'Ka'],
      deepSpace: true
    }
  },
  {
    stationId: 'dsn_madrid',
    displayName: 'Madrid',
    operator: 'NASA',
    network: 'DSN',
    country: 'Spain',
    location: {
      latitude: 40.4532,
      longitude: -4.3675,
      elevationMeters: 794
    },
    capabilities: {
      frequencyBands: ['X', 'Ka'],
      deepSpace: true
    }
  },
  {
    stationId: 'dsn_canberra',
    displayName: 'Canberra',
    operator: 'NASA',
    network: 'DSN',
    country: 'Australia',
    location: {
      latitude: -35.4014,
      longitude: 148.9817,
      elevationMeters: 691
    },
    capabilities: {
      frequencyBands: ['S', 'X', 'Ka'],
      deepSpace: true
    }
  },

  // ==============
  // ESA – ESTRACK
  // ==============
  {
    stationId: 'esa_cebreros',
    displayName: 'Cebreros',
    operator: 'ESA',
    network: 'ESTRACK',
    country: 'Spain',
    location: {
      latitude: 40.4527,
      longitude: -4.3675
    },
    capabilities: {
      frequencyBands: ['X', 'Ka'],
      deepSpace: true
    }
  },
  {
    stationId: 'esa_new_norcia',
    displayName: 'New Norcia',
    operator: 'ESA',
    network: 'ESTRACK',
    country: 'Australia',
    location: {
      latitude: -31.0482,
      longitude: 116.1914
    },
    capabilities: {
      frequencyBands: ['S', 'X'],
      deepSpace: true
    }
  },

  // ==========================
  // KSAT / SSC – Polar Network
  // ==========================
  {
    stationId: 'ksat_svalbard',
    displayName: 'Svalbard',
    operator: 'KSAT',
    network: 'KSAT Polar',
    country: 'Norway',
    location: {
      latitude: 78.2298,
      longitude: 15.4078
    },
    capabilities: {
      leoSupport: true,
      polarCoverage: true
    }
  },
  {
    stationId: 'ksat_troll',
    displayName: 'Troll',
    operator: 'KSAT',
    network: 'KSAT Polar',
    country: 'Antarctica',
    location: {
      latitude: -72.0060,
      longitude: 2.5290
    },
    capabilities: {
      polarCoverage: true
    }
  }
];

module.exports = { GROUND_STATIONS };
