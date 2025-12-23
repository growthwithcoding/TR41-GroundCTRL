/**
 * Firebase Cleanup Script
 * Deletes all Firebase Auth users and Firestore collections
 * Use with caution - this will permanently delete all data!
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const readline = require('readline');
const { initializeFirebase, getAuth, getFirestore } = require('../config/firebase');

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
 * Delete all Firebase Auth users
 */
async function deleteAllAuthUsers(auth) {
  console.log('\n🔥 Starting Firebase Auth cleanup...');
  
  let deletedCount = 0;
  let pageToken;
  
  try {
    do {
      // List users in batches of 1000 (Firebase limit)
      const listUsersResult = await auth.listUsers(1000, pageToken);
      
      if (listUsersResult.users.length === 0) {
        break;
      }
      
      // Delete users in parallel batches
      const deletePromises = listUsersResult.users.map(user => 
        auth.deleteUser(user.uid)
          .then(() => {
            deletedCount++;
            process.stdout.write(`\r   Deleted ${deletedCount} Auth users...`);
            return true;
          })
          .catch(error => {
            console.error(`\n   ⚠️  Failed to delete user ${user.uid}:`, error.message);
            return false;
          })
      );
      
      await Promise.all(deletePromises);
      
      pageToken = listUsersResult.pageToken;
    } while (pageToken);
    
    console.log(`\n✅ Deleted ${deletedCount} Firebase Auth users`);
    return deletedCount;
  } catch (error) {
    console.error('\n❌ Error deleting Auth users:', error.message);
    throw error;
  }
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
 * Delete all Firestore collections
 */
async function deleteAllCollections(db) {
  console.log('\n🔥 Starting Firestore cleanup...');
  
  // Discover all collections dynamically
  console.log('🔍 Discovering all collections...');
  const collections = await getAllCollections(db);
  
  if (collections.length === 0) {
    console.log('   ℹ️  No collections found');
    return 0;
  }
  
  console.log(`   Found ${collections.length} collection(s): ${collections.join(', ')}\n`);
  
  let totalDeleted = 0;
  
  for (const collectionName of collections) {
    console.log(`📦 Cleaning collection: ${collectionName}`);
    const count = await deleteCollection(db, collectionName);
    totalDeleted += count;
  }
  
  console.log(`\n✅ Total documents deleted: ${totalDeleted}`);
  return { collections: collections.length, documents: totalDeleted };
}

/**
 * Main cleanup function
 */
async function cleanup() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           Firebase Cleanup Script                         ║');
  console.log('║           GroundCTRL Mission Control                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n⚠️  WARNING: This will permanently delete ALL data from:');
  console.log('   • All Firebase Auth users');
  console.log('   • ALL Firestore collections (automatically discovered)');
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
    const confirm2 = await askQuestion('\n⚠️  Type "DELETE ALL DATA" to confirm: ');
    
    if (confirm2 !== 'DELETE ALL DATA') {
      console.log('\n❌ Cleanup cancelled. Confirmation text did not match.');
      rl.close();
      process.exit(0);
    }
    
    console.log('\n🚀 Starting cleanup process...\n');
    
    // Initialize Firebase
    console.log('📡 Connecting to Firebase...');
    initializeFirebase();
    const auth = getAuth();
    const db = getFirestore();
    console.log('✅ Connected to Firebase\n');
    
    // Track stats
    const startTime = Date.now();
    
    // Delete Auth users
    const authUsersDeleted = await deleteAllAuthUsers(auth);
    
    // Delete Firestore collections
    const firestoreStats = await deleteAllCollections(db);
    
    // Calculate elapsed time
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                  Cleanup Complete!                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n📊 Summary:');
    console.log(`   • Firebase Auth users deleted: ${authUsersDeleted}`);
    console.log(`   • Firestore collections deleted: ${firestoreStats.collections}`);
    console.log(`   • Firestore documents deleted: ${firestoreStats.documents}`);
    console.log(`   • Time elapsed: ${elapsedTime}s`);
    console.log('\n✅ All Firebase data has been cleared successfully!\n');
    
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
