/**
 * Ground Station Seeder
 * 
 * Seeds real-world ground station data into Firestore
 * 
 * Usage:
 *   - Ensure .env file is configured with Firebase credentials
 *   - Run: node seeders/seedGroundStations.js
 */

require('dotenv').config({ path: __dirname + '/../.env' });

const { initializeFirebase, getFirestore } = require('../src/config/firebase');
const { GROUND_STATIONS } = require('../src/constants/groundStations');

// Initialize Firebase Admin SDK
initializeFirebase();
const db = getFirestore();

/**
 * Seed ground stations into Firestore
 */
async function seedGroundStations() {
  console.log('🛰️  Seeding Ground Stations...\n');

  try {
    const collectionRef = db.collection('ground_stations');
    let created = 0;
    let updated = 0;

    for (const station of GROUND_STATIONS) {
      // Check if station already exists by stationId
      const existing = await collectionRef
        .where('stationId', '==', station.stationId)
        .limit(1)
        .get();

      const stationData = {
        ...station,
        updatedAt: new Date().toISOString(),
      };

      if (!existing.empty) {
        // Update existing station
        const docRef = existing.docs[0].ref;
        await docRef.update(stationData);
        console.log(`✅ Updated: ${station.displayName} (${station.stationId})`);
        updated++;
      } else {
        // Create new station
        stationData.createdAt = new Date().toISOString();
        await collectionRef.add(stationData);
        console.log(`✨ Created: ${station.displayName} (${station.stationId})`);
        created++;
      }
    }

    console.log('\n📊 Ground Stations Summary:');
    console.log(`   - Created: ${created}`);
    console.log(`   - Updated: ${updated}`);
    console.log(`   - Total: ${GROUND_STATIONS.length}`);
    console.log('\n✅ Ground station seeding complete!\n');

    return { created, updated, total: GROUND_STATIONS.length };
  } catch (error) {
    console.error('❌ Ground station seeding failed:', error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  seedGroundStations()
    .then(() => {
      console.log('Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedGroundStations };
