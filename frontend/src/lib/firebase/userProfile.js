import { doc, getDoc } from "firebase/firestore"
import { db } from "./config"

// Fetch user profile from Firestore by UID
export async function fetchUserProfile(uid) {
  if (!uid) return null
  const userDoc = await getDoc(doc(db, "users", uid))
  if (userDoc.exists()) {
    return userDoc.data()
  }
  return null
}
