/**
 * Unified Database Seeder for GroundCTRL
 * 
 * Usage:
 *   node seed.js [--all|--satellites|--scenarios|--steps|--commands|--ground-stations]
 * 
 * Examples:
 *   node seed.js                    # Seed everything (default)
 *   node seed.js --all              # Seed everything
 *   node seed.js --satellites       # Seed only satellites
 *   node seed.js --scenarios        # Seed scenarios (fetches existing satellites)
 *   node seed.js --steps            # Seed steps (fetches existing scenarios)
 *   node seed.js --commands         # Seed commands only
 *   node seed.js --ground-stations  # Seed ground stations only
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const admin = require('firebase-admin');

// Import seed data
const commands = require('./data/commands');
const satellites = require('./data/satellites');
const scenarios = require('./data/scenarios');
const steps = require('./data/steps');
const groundStations = require('./data/groundStations');
const helpCategories = require('./data/helpCategories');
const helpArticles = require('./data/helpArticles');
const helpFaqs = require('./data/helpFaqs');

const CREATED_BY_UID = '5usOQ3eOm7OjXmDOFjEmKSQovs42';

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.error('❌ Missing Firebase credentials in .env file');
      console.error('Please ensure FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL are set');
      process.exit(1);
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });

    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

// Seed functions
async function seedCommands() {
  console.log('⚙️  Seeding commands...');
  let count = 0;
  
  for (const cmd of commands) {
    const now = new Date().toISOString();
    await db.collection('commands').add({
      ...cmd,
      createdAt: cmd.createdAt || now,
      updatedAt: cmd.updatedAt || now,
      isActive: true,
    });
    count++;
  }
  
  console.log(`   ✓ ${count} commands seeded`);
  return count;
}

async function seedSatellites() {
  console.log('📡 Seeding satellites...');
  const satelliteMap = {};
  
  for (const sat of satellites) {
    const now = new Date().toISOString();
    const ref = await db.collection('satellites').add({
      ...sat.data,
      code: sat.code,
      createdAt: sat.data.createdAt || now,
      updatedAt: sat.data.updatedAt || now,
    });
    satelliteMap[sat.code] = ref.id;
    console.log(`   ✓ ${sat.code} → ${ref.id}`);
  }
  
  return satelliteMap;
}

async function seedScenarios(satelliteMap) {
  console.log('🎯 Seeding scenarios...');
  const scenarioMap = {};
  
  for (const scn of scenarios) {
    const satelliteCode = scn.data.satellite_code;
    const satellite_id = satelliteMap[satelliteCode];
    
    if (!satellite_id) {
      throw new Error(`No satellite_id for scenario ${scn.code} (satellite_code=${satelliteCode})`);
    }
    
    const now = new Date().toISOString();
    const data = { ...scn.data };
    delete data.satellite_code;
    
    const ref = await db.collection('scenarios').add({
      ...data,
      satellite_id,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    });
    
    scenarioMap[scn.code] = ref.id;
    console.log(`   ✓ ${scn.code} → ${ref.id}`);
  }
  
  return scenarioMap;
}

async function seedSteps(scenarioMap) {
  console.log('📝 Seeding scenario steps...');
  let count = 0;
  
  for (const step of steps) {
    const scenario_id = scenarioMap[step.scenarioCode];
    
    if (!scenario_id) {
      throw new Error(`No scenario_id for step (scenarioCode=${step.scenarioCode})`);
    }
    
    const now = new Date().toISOString();
    await db.collection('scenario_steps').add({
      ...step.data,
      scenario_id,
      createdAt: step.data.createdAt || now,
      updatedAt: step.data.updatedAt || now,
    });
    count++;
  }
  
  console.log(`   ✓ ${count} steps seeded`);
  return count;
}

async function seedGroundStations() {
  console.log('🛰️  Seeding ground stations...');
  let count = 0;
  
  for (const gs of groundStations) {
    const now = new Date().toISOString();
    await db.collection('ground_stations').add({
      ...gs,
      createdAt: gs.createdAt || now,
      updatedAt: gs.updatedAt || now,
    });
    count++;
  }
  
  console.log(`   ✓ ${count} ground stations seeded`);
  return count;
}

async function seedHelpSystem() {
  console.log('📚 Seeding help system...');
  const categoryMap = {};
  
  // Seed categories first
  for (const category of helpCategories) {
    const now = new Date().toISOString();
    const ref = await db.collection('help_categories').add({
      ...category,
      createdAt: now,
      updatedAt: now,
    });
    categoryMap[category.code] = ref.id;
  }
  console.log(`   ✓ ${helpCategories.length} categories seeded`);
  
  // Seed articles (requires category IDs)
  let articleCount = 0;
  for (const article of helpArticles) {
    const category_id = categoryMap[article.categoryCode];
    if (!category_id) {
      console.warn(`   ⚠️  No category_id for article: ${article.title}`);
      continue;
    }
    
    const now = new Date().toISOString();
    const slug = article.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 200);
    
    // Build plain text from content blocks
    const plainTextContent = article.content
      .filter(block => block.type === 'PARAGRAPH' || block.type === 'HEADING')
      .map(block => block.content)
      .join(' ');
    
    await db.collection('help_articles').add({
      slug,
      title: article.title,
      excerpt: article.excerpt,
      category_id,
      type: article.type || 'GUIDE',
      difficulty: article.difficulty || 'BEGINNER',
      tags: article.tags || [],
      content: article.content,
      plainTextContent,
      status: 'PUBLISHED',
      isActive: true,
      isFeatured: false,
      isPinned: false,
      orderIndex: articleCount,
      estimatedReadMinutes: article.estimatedReadMinutes || 5,
      seo: {
        metaTitle: article.title,
        metaDescription: article.excerpt,
        keywords: article.tags || [],
        noIndex: false,
      },
      version: '1.0.0',
      publishedAt: now,
      lastReviewedAt: now,
      stats: {
        views: 0,
        helpfulCount: 0,
        notHelpfulCount: 0,
        searchAppearances: 0,
        avgTimeOnPage_seconds: 0,
      },
      createdAt: now,
      updatedAt: now,
    });
    articleCount++;
  }
  console.log(`   ✓ ${articleCount} articles seeded`);
  
  // Seed FAQs (requires category IDs)
  let faqCount = 0;
  for (const faq of helpFaqs) {
    const category_id = categoryMap[faq.categoryCode];
    if (!category_id) {
      console.warn(`   ⚠️  No category_id for FAQ: ${faq.question}`);
      continue;
    }
    
    const now = new Date().toISOString();
    await db.collection('help_faqs').add({
      question: faq.question,
      answer: faq.answer,
      category_id,
      orderIndex: faq.orderIndex,
      isActive: faq.isActive !== false,
      stats: {
        views: 0,
        helpfulCount: 0,
        notHelpfulCount: 0,
      },
      createdAt: now,
      updatedAt: now,
    });
    faqCount++;
  }
  console.log(`   ✓ ${faqCount} FAQs seeded`);
  
  return {
    categories: helpCategories.length,
    articles: articleCount,
    faqs: faqCount,
  };
}

// Fetch existing data from Firestore
async function fetchExistingSatellites() {
  const satelliteMap = {};
  const snapshot = await db.collection('satellites').get();
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.code) {
      satelliteMap[data.code] = doc.id;
    }
  });
  return satelliteMap;
}

async function fetchExistingScenarios() {
  const scenarioMap = {};
  const snapshot = await db.collection('scenarios').get();
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.code) {
      scenarioMap[data.code] = doc.id;
    }
  });
  return scenarioMap;
}

// Main seeder
async function runSeed() {
  try {
    const args = process.argv.slice(2);
    
    // Parse flags
    const flags = {
      satellites: args.includes('--satellites'),
      scenarios: args.includes('--scenarios'),
      steps: args.includes('--steps'),
      commands: args.includes('--commands'),
      groundStations: args.includes('--ground-stations'),
      help: args.includes('--help-system'),
      all: args.includes('--all') || args.length === 0,
    };
    
    if (flags.all) {
      flags.satellites = true;
      flags.scenarios = true;
      flags.steps = true;
      flags.commands = true;
      flags.groundStations = true;
      flags.help = true;
    }
    
    console.log('\n🚀 GroundCTRL Database Seeder\n');
    console.log('Seeding:', Object.entries(flags).filter(([k, v]) => v && k !== 'all').map(([k]) => k).join(', '));
    console.log('');
    
    const counts = {
      satellites: 0,
      scenarios: 0,
      steps: 0,
      commands: 0,
      groundStations: 0,
    };
    
    let satelliteMap = {};
    let scenarioMap = {};
    
    // Seed satellites
    if (flags.satellites) {
      satelliteMap = await seedSatellites();
      counts.satellites = satellites.length;
    }
    
    // Seed scenarios (requires satellites)
    if (flags.scenarios) {
      if (Object.keys(satelliteMap).length === 0) {
        console.log('⚠️  Fetching existing satellites for scenarios...');
        satelliteMap = await fetchExistingSatellites();
        console.log(`   Found ${Object.keys(satelliteMap).length} satellites\n`);
      }
      scenarioMap = await seedScenarios(satelliteMap);
      counts.scenarios = scenarios.length;
    }
    
    // Seed steps (requires scenarios)
    if (flags.steps) {
      if (Object.keys(scenarioMap).length === 0) {
        console.log('⚠️  Fetching existing scenarios for steps...');
        scenarioMap = await fetchExistingScenarios();
        console.log(`   Found ${Object.keys(scenarioMap).length} scenarios\n`);
      }
      counts.steps = await seedSteps(scenarioMap);
    }
    
    // Seed commands (independent)
    if (flags.commands) {
      counts.commands = await seedCommands();
    }
    
    // Seed ground stations (independent)
    if (flags.groundStations) {
      counts.groundStations = await seedGroundStations();
    }
    
    // Seed help system (independent)
    if (flags.help) {
      counts.helpSystem = await seedHelpSystem();
    }
    
    // Summary
    console.log('\n✅ Seeding complete!\n');
    console.log('Summary:');
    if (counts.satellites > 0) console.log(`   📡 ${counts.satellites} satellites`);
    if (counts.scenarios > 0) console.log(`   🎯 ${counts.scenarios} scenarios`);
    if (counts.steps > 0) console.log(`   📝 ${counts.steps} steps`);
    if (counts.commands > 0) console.log(`   ⚙️  ${counts.commands} commands`);
    if (counts.groundStations > 0) console.log(`   🛰️  ${counts.groundStations} ground stations`);
    if (counts.helpSystem) {
      console.log(`   📚 ${counts.helpSystem.categories} help categories`);
      console.log(`   📄 ${counts.helpSystem.articles} help articles`);
      console.log(`   ❓ ${counts.helpSystem.faqs} FAQs`);
    }
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Show help
if (process.argv.includes('--help')) {
  console.log(`
GroundCTRL Database Seeder

Usage:
  node seed.js [flags]

Flags:
  --all              Seed everything (default if no flags)
  --satellites       Seed satellites only
  --scenarios        Seed scenarios (fetches existing satellites if needed)
  --steps            Seed scenario steps (fetches existing scenarios if needed)
  --commands         Seed commands only
  --ground-stations  Seed ground stations only
  --help-system      Seed help center (categories, articles, FAQs)
  --help             Show this help message

Examples:
  node seed.js                        # Seed everything
  node seed.js --all                  # Seed everything
  node seed.js --satellites           # Seed only satellites
  node seed.js --scenarios            # Seed scenarios (fetches satellites from DB)
  node seed.js --satellites --scenarios  # Seed satellites and scenarios together
  node seed.js --help-system          # Seed help center only

What Gets Seeded (--all):
  📡 3 Satellites (with TLE orbital data)
  🎯 8 Training Scenarios (Rookie → Commander progression)
  📝 50+ Scenario Steps (detailed mission objectives)
  ⚙️  39 Commands (including 9 NEW commissioning commands)
  🛰️  7 Global Ground Stations (NASA, ESA, JAXA, etc.)
  📚 7 Help Categories
  📄 50+ Help Articles (comprehensive guides)
  ❓ 35 FAQs

Notes:
  - Scenarios require satellites (will fetch from DB if not seeding)
  - Steps require scenarios (will fetch from DB if not seeding)
  - Commands, ground stations, and help system are independent
  - All data owned by user: ${CREATED_BY_UID}
`);
  process.exit(0);
}

// Run seeder
runSeed();
