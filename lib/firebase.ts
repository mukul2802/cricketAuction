import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
// Staging config
const firebaseConfig = {
  apiKey: "AIzaSyBk7p7RdgmGqH0HrNkmya0OgidWdQh0_Lg",
  authDomain: "cricket-bidding-system-staging.firebaseapp.com",
  projectId: "cricket-bidding-system-staging",
  storageBucket: "cricket-bidding-system-staging.firebasestorage.app",
  messagingSenderId: "66480547646",
  appId: "1:66480547646:web:aa0eeedeaec7371a5a6e6f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
