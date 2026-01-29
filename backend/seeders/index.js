/**
 * Master Seeder
 * Runs all help domain seeders in the correct order
 */

const { getFirestore } = require('../src/config/firebase');
const { seedGroundStations } = require('./seedGroundStations');
const { seedHelpCategories } = require('./helpCategoriesSeeder');
const { seedHelpArticles } = require('./helpArticlesSeeder');
const { seedHelpFaqs } = require('./helpFaqsSeeder');

async function seedAll() {
  console.log('🚀 Starting GroundCTRL Data Seeding...\n');

  try {
    // Step 0: Seed ground stations (independent data)
    console.log('Step 0: Seeding ground stations...');
    await seedGroundStations();
    console.log('');

    // Step 1: Seed categories first (needed for foreign keys)
    console.log('Step 1: Seeding help categories...');
    await seedHelpCategories();
    
    // Get category IDs to map to articles/FAQs
    const db = getFirestore();
    const categoriesSnapshot = await db.collection('help_categories').get();
    const categoryMap = {};
    
    categoriesSnapshot.forEach(doc => {
      const data = doc.data();
      categoryMap[`PLACEHOLDER_${data.code}`] = doc.id;
    });
    
    console.log('✅ Category ID mapping created\n');

    // Step 2: Seed articles
    console.log('Step 2: Seeding articles...');
    await seedHelpArticles(categoryMap);
    console.log('');

    // Step 3: Seed FAQs
    console.log('Step 3: Seeding FAQs...');
    await seedHelpFaqs(categoryMap);
    console.log('');

    // Get ground stations count
    const groundStationsSnapshot = await db.collection('ground_stations').get();

    console.log('🎉 All data seeded successfully!');
    console.log('\nSummary:');
    console.log(`- Ground Stations: ${groundStationsSnapshot.size}`);
    console.log(`- Help Categories: ${categoriesSnapshot.size}`);
    console.log('- Help Articles: 3');
    console.log('- Help FAQs: 8');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedAll()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedAll };
