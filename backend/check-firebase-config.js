/**
 * Firebase Configuration Diagnostic Tool
 * 
 * This script helps diagnose Firebase configuration issues
 * Run: node backend/check-firebase-config.js
 */

require('dotenv').config({ path: __dirname + '/.env' });

console.log('🔍 Firebase Configuration Diagnostic\n');
console.log('=' .repeat(60));

// Check if .env file variables are loaded
console.log('\n1️⃣  Environment Variables Status:');
console.log('   FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
console.log('   FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing');
console.log('   FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing');

if (process.env.FIREBASE_PRIVATE_KEY) {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  
  console.log('\n2️⃣  Private Key Analysis:');
  console.log('   Length:', key.length, 'characters');
  console.log('   Type:', typeof key);
  console.log('   Starts with:', key.substring(0, 30) + '...');
  console.log('   Contains \\n literals:', key.includes('\\n') ? '⚠️  Yes (needs fixing)' : '✅ No');
  console.log('   Contains actual newlines:', key.includes('\n') ? '✅ Yes' : '❌ No (needs fixing)');
  console.log('   Has BEGIN marker:', key.includes('BEGIN PRIVATE KEY') ? '✅ Yes' : '❌ No');
  console.log('   Has END marker:', key.includes('END PRIVATE KEY') ? '✅ Yes' : '❌ No');
  
  console.log('\n3️⃣  Expected Format:');
  console.log('   Your private key should look like:');
  console.log('   "-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----\\n"');
  console.log('   ');
  console.log('   Note: Use DOUBLE quotes, and literal \\n (backslash-n)');
  
  if (key.includes('\\n') && !key.includes('\n')) {
    console.log('\n❌ ISSUE DETECTED:');
    console.log('   Your .env file has literal "\\n" instead of actual newlines.');
    console.log('   The dotenv library will convert \\n to newlines automatically.');
    console.log('   Make sure you are using DOUBLE quotes around the key value.');
  }
  
  if (key.includes('PLACEHOLDER') || key.length < 100) {
    console.log('\n❌ ISSUE DETECTED:');
    console.log('   Your private key appears to be a placeholder.');
    console.log('   Please replace it with your actual Firebase private key.');
  }
}

console.log('\n4️⃣  How to Fix:');
console.log('   1. Go to Firebase Console > Project Settings > Service Accounts');
console.log('   2. Click "Generate new private key"');
console.log('   3. Open the downloaded JSON file');
console.log('   4. Copy the "private_key" value (including quotes)');
console.log('   5. In your .env file, set:');
console.log('      FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_HERE\\n-----END PRIVATE KEY-----\\n"');
console.log('   6. Make sure to use DOUBLE quotes (not single quotes)');
console.log('   7. Keep the \\n as literal backslash-n (dotenv will convert them)');

console.log('\n' + '='.repeat(60));
console.log('✅ Diagnostic complete\n');
