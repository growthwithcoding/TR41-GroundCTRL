/**
 * Firebase Emulator Configuration Validator
 * 
 * Run this script to verify that Firebase Emulator setup is correct
 * Usage: node tests-backend/validate-emulator-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Firebase Emulator Configuration...\n');

let allChecksPass = true;

// Check 1: firebase.json has emulator config
console.log('1️⃣  Checking firebase.json...');
try {
  const firebaseJsonPath = path.join(__dirname, '../../firebase.json');
  const firebaseJson = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
  
  if (!firebaseJson.emulators) {
    console.log('   ❌ No emulator configuration found in firebase.json');
    allChecksPass = false;
  } else {
    console.log('   ✅ Emulator configuration found');
    
    if (firebaseJson.emulators.auth?.port === 9099) {
      console.log('   ✅ Auth emulator port: 9099');
    } else {
      console.log('   ⚠️  Auth emulator port not set to 9099');
    }
    
    if (firebaseJson.emulators.firestore?.port === 8080) {
      console.log('   ✅ Firestore emulator port: 8080');
    } else {
      console.log('   ⚠️  Firestore emulator port not set to 8080');
    }
    
    if (firebaseJson.emulators.ui?.enabled) {
      console.log(`   ✅ Emulator UI enabled on port ${firebaseJson.emulators.ui.port || 4000}`);
    }
  }
} catch (error) {
  console.log(`   ❌ Error reading firebase.json: ${error.message}`);
  allChecksPass = false;
}

// Check 2: setup.js exists
console.log('\n2️⃣  Checking setup.js...');
const setupPath = path.join(__dirname, 'setup.js');
if (fs.existsSync(setupPath)) {
  console.log('   ✅ setup.js exists');
  
  const setupContent = fs.readFileSync(setupPath, 'utf8');
  if (setupContent.includes('FIREBASE_AUTH_EMULATOR_HOST')) {
    console.log('   ✅ Sets FIREBASE_AUTH_EMULATOR_HOST');
  } else {
    console.log('   ❌ Missing FIREBASE_AUTH_EMULATOR_HOST');
    allChecksPass = false;
  }
  
  if (setupContent.includes('FIRESTORE_EMULATOR_HOST')) {
    console.log('   ✅ Sets FIRESTORE_EMULATOR_HOST');
  } else {
    console.log('   ❌ Missing FIRESTORE_EMULATOR_HOST');
    allChecksPass = false;
  }
} else {
  console.log('   ❌ setup.js not found');
  allChecksPass = false;
}

// Check 3: jest.config.js includes setup file
console.log('\n3️⃣  Checking jest.config.js...');
try {
  const jestConfigPath = path.join(__dirname, '../jest.config.js');
  const jestConfig = require(jestConfigPath);
  
  if (jestConfig.setupFilesAfterEnv?.includes('<rootDir>/tests-backend/setup.js')) {
    console.log('   ✅ Jest configured to use setup.js');
  } else {
    console.log('   ❌ Jest not configured to use setup.js');
    allChecksPass = false;
  }
} catch (error) {
  console.log(`   ❌ Error reading jest.config.js: ${error.message}`);
  allChecksPass = false;
}

// Check 4: package.json has test:emulator script
console.log('\n4️⃣  Checking package.json...');
try {
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (packageJson.scripts['test:emulator']) {
    console.log('   ✅ test:emulator script exists');
    console.log(`   📝 Script: ${packageJson.scripts['test:emulator']}`);
  } else {
    console.log('   ⚠️  test:emulator script not found (optional)');
  }
} catch (error) {
  console.log(`   ❌ Error reading package.json: ${error.message}`);
  allChecksPass = false;
}

// Final result
console.log('\n' + '='.repeat(60));
if (allChecksPass) {
  console.log('✅ All checks passed! Firebase Emulator setup is complete.');
  console.log('\n📚 Next steps:');
  console.log('   1. Run: cd backend && npm run test:emulator');
  console.log('   2. Or manually: firebase emulators:start --only auth,firestore');
  console.log('   3. Access Emulator UI: http://localhost:4000');
} else {
  console.log('❌ Some checks failed. Please review the output above.');
  process.exit(1);
}
console.log('='.repeat(60));
