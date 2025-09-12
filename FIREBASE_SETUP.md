# Firebase Setup Guide for Cricket Bidding System

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `cricket-bidding-system`
4. Follow the setup wizard

## 2. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** authentication
3. Optionally enable **Anonymous** for guest access

## 3. Create Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (we'll add security rules later)
4. Select a location close to your users

## 4. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps**
3. Click **Web app** icon (`</>`)
4. Register your app with name: `cricket-bidding-app`
5. Copy the Firebase configuration object

## 5. Update Configuration

Replace the configuration in `/lib/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com", 
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 6. Set up Firestore Security Rules

In Firebase Console, go to **Firestore Database** > **Rules** and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager'];
    }
    
    // Teams - readable by all authenticated users, writable by admin/manager
    match /teams/{teamId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager'];
    }
    
    // Players - readable by all authenticated users, writable by admin
    match /players/{playerId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Auction rounds - readable by all authenticated users, writable by admin/manager
    match /auctionRounds/{roundId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager'];
    }
    
    // Bids - readable by all authenticated users, writable by authenticated users
    match /bids/{bidId} {
      allow read, write: if request.auth != null;
    }
    
    // Target Players - readable and writable by team owners for their own team
    match /targetPlayers/{targetPlayerId} {
      allow read, write: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager'] ||
        resource.data.teamId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.teamId
      );
      allow create: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager'] ||
        request.resource.data.teamId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.teamId
      );
    }
  }
}
```

## 7. Images Storage

This application doesn't use Firebase Storage. Instead:
- Store player images and team logos on Google Drive
- Make them publicly viewable
- Use the direct URLs in the application
- Example URL format: `https://drive.google.com/uc?id=YOUR_FILE_ID`

## 8. Initialize Sample Data

After setting up Firebase, run this in your browser console or create a setup page:

```typescript
import { setupFirebaseData, createInitialAdminUser } from './lib/setupFirebaseData';

// Create initial admin user (run once)
await createInitialAdminUser();

// Setup sample teams and players (run once)
await setupFirebaseData();
```

## 9. Environment Variables (Optional)

For production, consider using environment variables:

Create `.env.local`:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Then update `/lib/firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

## 10. Test Login

Default admin credentials:
- Email: `admin@cricket.com`
- Password: `admin123`

## 11. Database Collections Structure

Your Firestore will have these collections:

- **users**: User profiles with roles
- **teams**: Team information and budgets  
- **players**: Player data and stats
- **auctionRounds**: Auction round management
- **bids**: Bidding history (optional)

## Troubleshooting

1. **Authentication errors**: Check if Email/Password is enabled
2. **Permission errors**: Verify Firestore security rules
3. **Connection errors**: Check Firebase configuration
4. **CORS errors**: Ensure your domain is authorized in Firebase Console

## Next Steps

1. Create additional user accounts for managers and owners
2. Import your actual player data
3. Customize team information
4. Set up production security rules
5. Configure backup and monitoring