/**
 * firebase.js
 * Firebase configuration and initialization.
 * 
 * ⚠️  REPLACE the config values below with YOUR Firebase project credentials!
 *     Get them from: Firebase Console → Project Settings → Your apps → Web app
 */
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAxE2IXhowciyE4udO0fXfylNWGSnBq_Kk",
  authDomain: "inclusive-classroom-ea3ce.web.app",
  projectId: "inclusive-classroom-ea3ce",
  storageBucket: "inclusive-classroom-ea3ce.firebasestorage.app",
  messagingSenderId: "247352475782",
  appId: "1:247352475782:web:d8745bd6d8758224829107"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
