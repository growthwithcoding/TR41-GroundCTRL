/**
 * Verification script for test migration
 * Ensures tests-backend is removed and tests/ is properly configured
 * 
 * Usage: node tests/scripts/verify-migration.js
 */

const fs = require('fs');
const path = require('path');

const issues = [];

// Check if tests-backend still exists
if (fs.existsSync(path.join(__dirname, '../../tests-backend'))) {
  issues.push('❌ tests-backend directory still exists - should be deleted');
} else {
  console.log('✅ tests-backend directory removed');
}

// Check if tests directory exists
if (!fs.existsSync(path.join(__dirname, '..'))) {
  issues.push('❌ tests directory does not exist');
} else {
  console.log('✅ tests directory exists');
}

// Check if setup.js exists
if (!fs.existsSync(path.join(__dirname, '../setup.js'))) {
  issues.push('❌ tests/setup.js does not exist');
} else {
  console.log('✅ tests/setup.js exists');
}

// Check jest.config.js references
const jestConfig = fs.readFileSync(path.join(__dirname, '../../jest.config.js'), 'utf8');
if (jestConfig.includes('tests-backend')) {
  issues.push('⚠️  jest.config.js still references tests-backend');
} else {
  console.log('✅ jest.config.js updated');
}

// Check package.json scripts
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));
const testScripts = Object.entries(packageJson.scripts).filter(([key]) => key.startsWith('test'));
const hasOldPaths = testScripts.some(([, script]) => script.includes('tests-backend'));

if (hasOldPaths) {
  issues.push('⚠️  package.json test scripts still reference tests-backend');
} else {
  console.log('✅ package.json test scripts updated');
}

// Summary
console.log('\n' + '='.repeat(50));
if (issues.length === 0) {
  console.log('✅ Migration verification complete - no issues found!');
  process.exit(0);
} else {
  console.log('❌ Migration verification found issues:\n');
  issues.forEach(issue => console.log(issue));
  process.exit(1);
}
