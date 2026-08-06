// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBBb2BLJZK2b3Yqo8cWcCDCZSi4T-48XGw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "trigonlinks-pasrur.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://trigonlinks-pasrur-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "trigonlinks-pasrur",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "trigonlinks-pasrur.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "301448184473",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:301448184473:web:939e209cf9a10fd3ca2e08",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-SSJTHD4MMY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in browser environment
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, analytics, firebaseConfig };
