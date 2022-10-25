// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getFunctions, connectFunctionsEmulator } from "firebase/functions"

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID
};


// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app)

// Detect and adapt to dev env
if (window.location.hostname === "localhost") {
  console.log('DEV ENV')
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFunctionsEmulator(functions, "localhost", 5001)
  connectFirestoreEmulator(db, "localhost", 8080, {
    ssl: false
  })
}