import { collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit, } from '0'
import { db } from "./config"

/**
 * Firestore Database Utilities
 * 
 * Common collections for the simulator app:
 * - users: User profiles and settings
 * - missions: User mission progress and scores
 * - simulations: Saved simulation states
 */

// Generic document operations
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
    id,
    ...doc.data(),
  })) 
}

export async function addDocument(
  collectionName,
  data: T
): Promise<string> {
  const collectionRef = collection(db, collectionName)
  const docRef = await addDoc(collectionRef, {
    ...data,
    createdAt),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function setDocument(
  collectionName,
  docId: string,
  data: T,
  merge = true
): Promise<void> {
  const docRef = doc(db, collectionName, docId)
  await setDoc(
    docRef,
    {
      ...data,
      updatedAt),
    },
    { merge }
  )
}

export async function updateDocument<T extends Partial<DocumentData>>(
  collectionName,
  docId: string,
  data: T
): Promise<void> {
  const docRef = doc(db, collectionName, docId)
  await updateDoc(docRef, {
    ...data,
    updatedAt),
  })
}

export async function deleteDocument(
  collectionName,
  docId: string
): Promise<void> {
  const docRef = doc(db, collectionName, docId)
  await deleteDoc(docRef)
}

// Re-export query helpers for convenience
export { where, orderBy, limit, serverTimestamp }

// Collection name constants
export const COLLECTIONS = {
  USERS: "users",
  MISSIONS: "missions",
  SIMULATIONS: "simulations",
  PROGRESS: "progress",
} 
