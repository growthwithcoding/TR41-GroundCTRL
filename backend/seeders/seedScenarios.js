// seedScenariosctrl.js

/**
 * Firestore seeder for GroundCTRL Scenarios
 *
 * Usage:
 *   node seedScenariosctrl.js
 *
 * Requirements:
 *   - GOOGLE_APPLICATION_CREDENTIALS set OR
 *   - admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
 */

require('dotenv').config();
const admin = require('firebase-admin');
const { satellites, scenarios, steps, commands } = require('./scenarioSeed');

const CREATED_BY_UID = '5usOQ3eOm7OjXmDOFjEmKSQovs42';

// Initialize Firebase Admin with credentials from .env
if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.error('Missing Firebase credentials in .env file');
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

    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

async function seedSatellites() {
  const satelliteCodeToId = {};

  for (const sat of satellites) {
    const now = new Date().toISOString();

    const ref = await db.collection('satellites').add({
      ...sat.data,
      code: sat.code,
      createdBy: sat.data.createdBy || CREATED_BY_UID,
      updatedBy: sat.data.updatedBy || CREATED_BY_UID,
      createdAt: sat.data.createdAt || now,
      updatedAt: sat.data.updatedAt || now,
    });

    satelliteCodeToId[sat.code] = ref.id;
    console.log(`Created satellite ${sat.code} with id ${ref.id}`);
  }

  return satelliteCodeToId;
}

async function seedScenarios(satelliteCodeToId) {
  const scenarioCodeToId = {};

  for (const scn of scenarios) {
    const satelliteCode = scn.data.satellite_code;
    const satellite_id = satelliteCodeToId[satelliteCode];

    if (!satellite_id) {
      throw new Error(
        `No satellite_id resolved for scenario ${scn.code} (satellite_code=${satelliteCode})`,
      );
    }

    const now = new Date().toISOString();

    const data = {
      ...scn.data,
      satellite_id,
      createdBy: scn.data.createdBy || CREATED_BY_UID,
      updatedBy: scn.data.updatedBy || CREATED_BY_UID,
      createdAt: scn.data.createdAt || now,
      updatedAt: scn.data.updatedAt || now,
    };
    delete data.satellite_code;

    const ref = await db.collection('scenarios').add(data);
    scenarioCodeToId[scn.code] = ref.id;
    console.log(`Created scenario ${scn.code} with id ${ref.id}`);
  }

  return scenarioCodeToId;
}

async function seedScenarioSteps(scenarioCodeToId) {
  for (const step of steps) {
    const scenario_id = scenarioCodeToId[step.scenarioCode];

    if (!scenario_id) {
      throw new Error(
        `No scenario_id resolved for step with scenarioCode=${step.scenarioCode}`,
      );
    }

    const now = new Date().toISOString();

    const data = {
      ...step.data,
      scenario_id,
      createdBy: step.data.createdBy || CREATED_BY_UID,
      updatedBy: step.data.updatedBy || CREATED_BY_UID,
      createdAt: step.data.createdAt || now,
      updatedAt: step.data.updatedAt || now,
    };

    const ref = await db.collection('scenario_steps').add(data);
    console.log(
      `Created step for scenario ${step.scenarioCode} (stepOrder=${step.data.stepOrder}) id=${ref.id}`,
    );
  }
}

async function seedCommands() {
  for (const cmd of commands) {
    const now = new Date().toISOString();

    const data = {
      ...cmd,
      createdBy: cmd.createdBy || CREATED_BY_UID,
      updatedBy: cmd.updatedBy || CREATED_BY_UID,
      createdAt: cmd.createdAt || now,
      updatedAt: cmd.updatedAt || now,
      isActive: true,
    };

    const ref = await db.collection('commands').add(data);
    console.log(`Created command ${cmd.name} with id ${ref.id}`);
  }
}

async function runSeed() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const flags = {
      satellites: args.includes('--satellites'),
      scenarios: args.includes('--scenarios'),
      steps: args.includes('--steps'),
      commands: args.includes('--commands'),
      all: args.includes('--all') || args.length === 0, // Default to all if no flags
    };

    // If --all is specified or no flags, enable all
    if (flags.all) {
      flags.satellites = true;
      flags.scenarios = true;
      flags.steps = true;
      flags.commands = true;
    }

    console.log('🚀 GroundCTRL Seeder Starting...\n');
    console.log('Seeding flags:', {
      satellites: flags.satellites,
      scenarios: flags.scenarios,
      steps: flags.steps,
      commands: flags.commands,
    });
    console.log('');

    let satelliteCodeToId = {};
    let scenarioCodeToId = {};
    let seededCounts = {
      satellites: 0,
      scenarios: 0,
      steps: 0,
      commands: 0,
    };

    // Seed satellites
    if (flags.satellites) {
      console.log('📡 Seeding satellites...');
      satelliteCodeToId = await seedSatellites();
      seededCounts.satellites = satellites.length;
      console.log('');
    } else {
      console.log('⏭️  Skipping satellites (use --satellites to seed)');
      console.log('');
    }

    // Seed scenarios (requires satellites)
    if (flags.scenarios) {
      if (!flags.satellites && Object.keys(satelliteCodeToId).length === 0) {
        console.warn('⚠️  Cannot seed scenarios without satellites. Fetching existing satellites...');
        // Fetch existing satellites from Firestore
        const satellitesSnapshot = await db.collection('satellites').get();
        satellitesSnapshot.forEach((doc) => {
          const satData = doc.data();
          if (satData.code) {
            satelliteCodeToId[satData.code] = doc.id;
          }
        });
        console.log(`   Found ${Object.keys(satelliteCodeToId).length} existing satellites`);
        console.log('');
      }

      console.log('🎯 Seeding scenarios...');
      scenarioCodeToId = await seedScenarios(satelliteCodeToId);
      seededCounts.scenarios = scenarios.length;
      console.log('');
    } else {
      console.log('⏭️  Skipping scenarios (use --scenarios to seed)');
      console.log('');
    }

    // Seed scenario steps (requires scenarios)
    if (flags.steps) {
      if (!flags.scenarios && Object.keys(scenarioCodeToId).length === 0) {
        console.warn('⚠️  Cannot seed steps without scenarios. Fetching existing scenarios...');
        // Fetch existing scenarios from Firestore
        const scenariosSnapshot = await db.collection('scenarios').get();
        scenariosSnapshot.forEach((doc) => {
          const scnData = doc.data();
          if (scnData.code) {
            scenarioCodeToId[scnData.code] = doc.id;
          }
        });
        console.log(`   Found ${Object.keys(scenarioCodeToId).length} existing scenarios`);
        console.log('');
      }

      console.log('📝 Seeding scenario steps...');
      await seedScenarioSteps(scenarioCodeToId);
      seededCounts.steps = steps.length;
      console.log('');
    } else {
      console.log('⏭️  Skipping scenario steps (use --steps to seed)');
      console.log('');
    }

    // Seed commands (independent)
    if (flags.commands) {
      console.log('⚙️  Seeding commands...');
      await seedCommands();
      seededCounts.commands = commands.length;
      console.log('');
    } else {
      console.log('⏭️  Skipping commands (use --commands to seed)');
      console.log('');
    }

    // Summary
    console.log('✅ GroundCTRL seed completed successfully!\n');
    console.log('Summary:');
    if (seededCounts.satellites > 0) console.log(`   ✓ ${seededCounts.satellites} satellites`);
    if (seededCounts.scenarios > 0) console.log(`   ✓ ${seededCounts.scenarios} scenarios`);
    if (seededCounts.steps > 0) console.log(`   ✓ ${seededCounts.steps} scenario steps`);
    if (seededCounts.commands > 0) console.log(`   ✓ ${seededCounts.commands} commands`);
    console.log('');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

// Show usage if --help flag is provided
if (process.argv.includes('--help')) {
  console.log(`
GroundCTRL Database Seeder

Usage:
  node seedScenarios.js [flags]

Flags:
  --all          Seed all collections (default if no flags provided)
  --satellites   Seed only satellites
  --scenarios    Seed only scenarios (requires satellites)
  --steps        Seed only scenario steps (requires scenarios)
  --commands     Seed only commands (independent)
  --help         Show this help message

Examples:
  node seedScenarios.js                    # Seed everything
  node seedScenarios.js --all              # Seed everything
  node seedScenarios.js --satellites       # Seed only satellites
  node seedScenarios.js --scenarios        # Seed scenarios (fetches existing satellites)
  node seedScenarios.js --commands         # Seed only commands
  node seedScenarios.js --satellites --scenarios  # Seed satellites and scenarios

Notes:
  - Scenarios require satellites to exist (will fetch from DB if not seeding)
  - Steps require scenarios to exist (will fetch from DB if not seeding)
  - Commands are independent and can be seeded alone
  - All data is owned by user: 5usOQ3eOm7OjXmDOFjEmKSQovs42
`);
  process.exit(0);
}

runSeed();
