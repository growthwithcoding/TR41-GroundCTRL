/**
 * Firebase Cleanup Script - Keep Users
 * Deletes all Firestore collections EXCEPT the 'users' collection
 * Preserves Firebase Auth users
 * 
 * Run from project root: node helper_scripts/FB_cleanup_keep_users.js
 */

const path = require('path');
const readline = require('readline');

// Load dotenv from backend's node_modules
const dotenvPath = path.join(__dirname, '../backend/node_modules/dotenv');
const dotenv = require(dotenvPath);
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

// Load Firebase config from backend
const { initializeFirebase, getFirestore } = require(path.join(__dirname, '../backend/src/config/firebase'));

/**
 * Create readline interface for user input
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt user for confirmation
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Delete all documents in a collection
 */
async function deleteCollection(db, collectionName, batchSize = 500) {
  const collectionRef = db.collection(collectionName);
  let deletedCount = 0;
  
  try {
    let hasMore = true;
    
    while (hasMore) {
      // Get batch of documents
      const snapshot = await collectionRef.limit(batchSize).get();
      
      if (snapshot.empty) {
        hasMore = false;
        break;
      }
      
      // Delete in batch
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });
      
      await batch.commit();
      process.stdout.write(`\r   Deleted ${deletedCount} documents from ${collectionName}...`);
      
      // Check if there are more documents
      if (snapshot.docs.length < batchSize) {
        hasMore = false;
      }
    }
    
    console.log(`\n✅ Deleted ${deletedCount} documents from collection '${collectionName}'`);
    return deletedCount;
  } catch (error) {
    console.error(`\n❌ Error deleting collection '${collectionName}':`, error.message);
    throw error;
  }
}

/**
 * Get all collection names in Firestore
 */
async function getAllCollections(db) {
  try {
    const collections = await db.listCollections();
    return collections.map(col => col.id);
  } catch (error) {
    console.error('❌ Error listing collections:', error.message);
    throw error;
  }
}

/**
 * Delete all Firestore collections EXCEPT users
 */
async function deleteAllCollectionsExceptUsers(db) {
  console.log('\n🔥 Starting Firestore cleanup (preserving users)...');
  
  // Discover all collections dynamically
  console.log('🔍 Discovering all collections...');
  const collections = await getAllCollections(db);
  
  if (collections.length === 0) {
    console.log('   ℹ️  No collections found');
    return { collections: 0, documents: 0 };
  }
  
  console.log(`   Found ${collections.length} collection(s): ${collections.join(', ')}\n`);
  
  // Filter out users collection
  const collectionsToDelete = collections.filter(name => name !== 'users');
  const usersCollectionExists = collections.includes('users');
  
  if (usersCollectionExists) {
    console.log('👤 Skipping "users" collection (will be preserved)');
  }
  
  if (collectionsToDelete.length === 0) {
    console.log('   ℹ️  No collections to delete (only users collection exists)\n');
    return { collections: 0, documents: 0 };
  }
  
  console.log(`📦 Will delete ${collectionsToDelete.length} collection(s):\n   ${collectionsToDelete.join(', ')}\n`);
  
  let totalDeleted = 0;
  let collectionsDeleted = 0;
  
  for (const collectionName of collectionsToDelete) {
    console.log(`📦 Cleaning collection: ${collectionName}`);
    const count = await deleteCollection(db, collectionName);
    totalDeleted += count;
    collectionsDeleted++;
  }
  
  console.log(`\n✅ Total collections deleted: ${collectionsDeleted}`);
  console.log(`✅ Total documents deleted: ${totalDeleted}`);
  
  if (usersCollectionExists) {
    console.log(`✅ Users collection preserved ✓`);
  }
  
  return { collections: collectionsDeleted, documents: totalDeleted };
}

/**
 * Main cleanup function
 */
async function cleanup() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Firebase Cleanup Script (Keep Users)                  ║');
  console.log('║     GroundCTRL Mission Control                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n⚠️  WARNING: This will permanently delete:');
  console.log('   • ALL Firestore collections (EXCEPT users)');
  console.log('\n✅ This will PRESERVE:');
  console.log('   • Firebase Auth users (not deleted)');
  console.log('   • Users collection in Firestore');
  console.log('\n🚨 THIS OPERATION CANNOT BE UNDONE! 🚨\n');
  
  try {
    // First confirmation
    const confirm1 = await askQuestion('Are you sure you want to continue? (yes/no): ');
    
    if (confirm1.toLowerCase() !== 'yes') {
      console.log('\n❌ Cleanup cancelled.');
      rl.close();
      process.exit(0);
    }
    
    // Second confirmation for extra safety
    const confirm2 = await askQuestion('\n⚠️  Type "DELETE EXCEPT USERS" to confirm: ');
    
    if (confirm2 !== 'DELETE EXCEPT USERS') {
      console.log('\n❌ Cleanup cancelled. Confirmation text did not match.');
      rl.close();
      process.exit(0);
    }
    
    console.log('\n🚀 Starting cleanup process...\n');
    
    // Initialize Firebase
    console.log('📡 Connecting to Firebase...');
    initializeFirebase();
    const db = getFirestore();
    console.log('✅ Connected to Firebase\n');
    
    // Track stats
    const startTime = Date.now();
    
    // Delete Firestore collections (except users)
    const firestoreStats = await deleteAllCollectionsExceptUsers(db);
    
    // Calculate elapsed time
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                  Cleanup Complete!                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n📊 Summary:');
    console.log(`   • Firestore collections deleted: ${firestoreStats.collections}`);
    console.log(`   • Firestore documents deleted: ${firestoreStats.documents}`);
    console.log(`   • Users collection: PRESERVED ✓`);
    console.log(`   • Auth users: PRESERVED ✓`);
    console.log(`   • Time elapsed: ${elapsedTime}s`);
    console.log('\n✅ Cleanup complete - users preserved!\n');
    console.log('💡 Next step: Run "cd backend && npm run seed" to populate fresh data\n');
    
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error('\nError details:', error);
    }
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Run cleanup
cleanup();
