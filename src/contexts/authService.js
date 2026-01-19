import { auth } from "../config/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";

const API_URL = import.meta.env.VITE_API_URL;

export const registerUser = async (email, password, callSign) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const token = await cred.user.getIdToken();

  const res = await fetch(API_URL+'/auth/register', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": 'Bearer ' + token
    },
    body: JSON.stringify({ callSign }),
  });

  return res.json();
};

export const loginUser = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const token = await cred.user.getIdToken();

  const res = await fetch(API_URL+'/auth/login', {
    method: "POST",
    headers: {
      "Authorization": 'Bearer ' + token
    }
  });

  return res.json();
};
