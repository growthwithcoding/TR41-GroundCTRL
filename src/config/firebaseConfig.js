// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC5lq5EgmFfKXSCSu68r6ZbSR2TH7lMdSI",
  authDomain: "groundctrl-c8860.firebaseapp.com",
  projectId: "groundctrl-c8860",
  storageBucket: "groundctrl-c8860.firebasestorage.app",
  messagingSenderId: "339386417366",
  appId: "1:339386417366:web:dcf1050cf2718580864977",
  measurementId: "G-FNKLYS3BLC",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Used for Data Analyst. Can be used later if need be. 
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
