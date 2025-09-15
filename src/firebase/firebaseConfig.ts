import { FirebaseConfig } from '@/types';

// Firebase configuration (prefer env vars, fallback to defaults)
// Production Config
// const firebaseConfig: FirebaseConfig = {
//   apiKey: "AIzaSyDTdk9MR-jis-Oq_PAqEgExToI-1xbVuBg",
//   authDomain: "cricket-bidding-system.firebaseapp.com",
//   projectId: "cricket-bidding-system",
//   storageBucket: "cricket-bidding-system.firebasestorage.app",
//   messagingSenderId: "932523598329",
//   appId: "1:932523598329:web:ae388b98aca5aa6cf49d28"
// };

// Staging config
const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyBk7p7RdgmGqH0HrNkmya0OgidWdQh0_Lg",
  authDomain: "cricket-bidding-system-staging.firebaseapp.com",
  projectId: "cricket-bidding-system-staging",
  storageBucket: "cricket-bidding-system-staging.firebasestorage.app",
  messagingSenderId: "66480547646",
  appId: "1:66480547646:web:aa0eeedeaec7371a5a6e6f"
};

export default firebaseConfig;