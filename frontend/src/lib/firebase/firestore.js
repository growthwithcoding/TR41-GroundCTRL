import { collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit, } from 'firebase/firestore'
import { db } from "./config"

/**
 * Firestore Database Utilities
 * 
 * READ-ONLY operations for frontend.
 * All write operations must go through backend API for security and audit logging.
 * 
 * Common collections for the simulator app:
 * - users: User profiles and settings
 * - missions: User mission progress and scores
 * - simulations: Saved simulation states
 */

// Generic document READ operations
export async function getDocument(
  collectionName,
  docId: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, docId)
  const docSnap = await getDoc(docRef)
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } 
  }
  return null
}

export async function getDocuments(
  collectionName,
  ...queryConstraints: QueryConstraint[]
): Promise<T[]> {
  const collectionRef = collection(db, collectionName)
  const q = query(collectionRef, ...queryConstraints)
  const querySnapshot = await getDocs(q)
  
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) 
}

// Re-export query helpers for convenience
export { where, orderBy, limit }

// Collection name constants
export const COLLECTIONS = {
  USERS: "users",
  MISSIONS: "missions",
  SIMULATIONS: "simulations",
  PROGRESS: "progress",
} 
