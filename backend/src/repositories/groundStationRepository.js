/**
 * Ground Station Repository
 * 
 * Firestore operations for ground station data
 */

const { getFirestore } = require('../config/firebase');

/**
 * Get all ground stations
 * @returns {Promise<Array>} Array of ground station objects
 */
async function getAllGroundStations() {
  const db = getFirestore();
  const snapshot = await db.collection('ground_stations').get();
  
  const stations = [];
  snapshot.forEach(doc => {
    stations.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  return stations;
}

/**
 * Get ground station by stationId
 * @param {string} stationId - Station ID
 * @returns {Promise<Object|null>} Ground station object or null
 */
async function getGroundStationByStationId(stationId) {
  const db = getFirestore();
  const snapshot = await db
    .collection('ground_stations')
    .where('stationId', '==', stationId)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  };
}

/**
 * Get ground stations by operator
 * @param {string} operator - Operator name (NASA, ESA, KSAT, SSC)
 * @returns {Promise<Array>} Array of ground station objects
 */
async function getGroundStationsByOperator(operator) {
  const db = getFirestore();
  const snapshot = await db
    .collection('ground_stations')
    .where('operator', '==', operator)
    .get();
  
  const stations = [];
  snapshot.forEach(doc => {
    stations.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  return stations;
}

/**
 * Get ground stations by capability
 * @param {string} capability - Capability key (e.g., 'deepSpace', 'leoSupport')
 * @param {boolean} value - Capability value (true/false)
 * @returns {Promise<Array>} Array of ground station objects
 */
async function getGroundStationsByCapability(capability, value = true) {
  const db = getFirestore();
  const snapshot = await db
    .collection('ground_stations')
    .where(`capabilities.${capability}`, '==', value)
    .get();
  
  const stations = [];
  snapshot.forEach(doc => {
    stations.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  return stations;
}

/**
 * Create or update a ground station
 * @param {Object} stationData - Ground station data
 * @returns {Promise<string>} Document ID
 */
async function upsertGroundStation(stationData) {
  const db = getFirestore();
  
  // Check if station exists by stationId
  const existing = await db
    .collection('ground_stations')
    .where('stationId', '==', stationData.stationId)
    .limit(1)
    .get();
  
  const now = new Date().toISOString();
  
  if (!existing.empty) {
    // Update existing
    const docRef = existing.docs[0].ref;
    await docRef.update({
      ...stationData,
      updatedAt: now
    });
    return docRef.id;
  } else {
    // Create new
    const docRef = await db.collection('ground_stations').add({
      ...stationData,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  }
}

module.exports = {
  getAllGroundStations,
  getGroundStationByStationId,
  getGroundStationsByOperator,
  getGroundStationsByCapability,
  upsertGroundStation
};
