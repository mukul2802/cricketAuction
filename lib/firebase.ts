import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
// Staging config
const firebaseConfig = {
  apiKey: "AIzaSyDTdk9MR-jis-Oq_PAqEgExToI-1xbVuBg",
  authDomain: "cricket-bidding-system.firebaseapp.com",
  projectId: "cricket-bidding-system",
  storageBucket: "cricket-bidding-system.firebasestorage.app",
  messagingSenderId: "932523598329",
  appId: "1:932523598329:web:ae388b98aca5aa6cf49d28"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
