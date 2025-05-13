import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA6KTSxE6mafT-iXA3pMrM5S1xHkrTtY9U",
  authDomain: "haircut-v2.firebaseapp.com",
  projectId: "haircut-v2",
  storageBucket: "haircut-v2.appspot.com",
  messagingSenderId: "718112437150",
  appId: "1:718112437150:web:c00ddb33a4b4dc2b2edc8f",
  measurementId: "G-6NCLV34S1P"
};

console.log('[Firebase] Initializing with config:', firebaseConfig);
const app = initializeApp(firebaseConfig);
console.log('[Firebase] App initialized:', app.name);

export const auth = getAuth(app);
console.log('[Firebase] Auth exported:', auth);

export const provider = new GoogleAuthProvider();
console.log('[Firebase] GoogleAuthProvider exported:', provider);

export const db = getFirestore(app);
console.log('[Firebase] Firestore DB exported:', db);

// Admins
export const ADMINS = [
  'sabag1715@gmail.com'
];
export function isAdmin(email) {
  return ADMINS.includes(email);
}

export { signInWithPopup, signOut };