#!/usr/bin/env node
/**
 * Pre-test file verification script
 * Ensures critical files exist before running tests
 */

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/app.js',
  'src/server.js',
  'src/config/jwtConfig.js',
  'tests/helpers/test-utils.js',
  'tests/setup.js',
];

let allFilesExist = true;

console.log('🔍 Verifying required files...\n');

requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    console.log(`✅ ${file}`);
  } else {
    console.error(`❌ MISSING: ${file}`);
    allFilesExist = false;
  }
});

console.log();

if (!allFilesExist) {
  console.error('❌ Some required files are missing. Tests may fail.');
  process.exit(1);
} else {
  console.log('✅ All required files present. Proceeding with tests...\n');
  process.exit(0);
}
