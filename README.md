# Cricket Player Bidding System

A comprehensive web application for managing cricket player auctions with role-based access for Admin and Owner users. Built with React, TypeScript, Tailwind CSS, and Firebase, this system provides a complete solution for organizing and conducting cricket player auctions with real-time bidding capabilities.

## 🏏 Project Overview

The Cricket Player Bidding System is designed to streamline the process of cricket player auctions, commonly used in leagues like IPL, CPL, and other franchise-based cricket tournaments. The application provides different interfaces for administrators who manage the auction and team owners who participate in bidding.

## ✨ Key Features

### 🔐 Authentication & User Management
- **Role-based Authentication**: Secure login system with Admin and Owner access levels
- **User Management**: Admin can create, edit, and manage user accounts
- **Team Assignment**: Owners are automatically linked to their respective teams
- **Session Management**: Secure authentication with Firebase Auth

### 👥 Player Management
- **Comprehensive Player Database**: Store detailed player information including statistics
- **Player Profiles**: Name, role, age, matches played, batting/bowling statistics
- **Performance Metrics**: Batting average, bowling average, strike rate, economy rate
- **Player Import**: Bulk import players from CSV/Excel files
- **Player Status Tracking**: Active, Sold, Unsold, Pending statuses
- **Search & Filter**: Advanced filtering by role, status, and search functionality

### 🏆 Team Management
- **Team Creation**: Set up teams with names, initials, and logos
- **Budget Management**: Configure team budgets and track spending
- **Roster Management**: View team compositions and player assignments
- **Budget Tracking**: Real-time budget updates during auctions
- **Team Statistics**: Performance analytics and spending patterns

### 🎯 Live Auction System
- **Real-time Auction Interface**: Interactive bidding system for administrators
- **Round-based Auctions**: Organize auctions in multiple rounds
- **Player Presentation**: Display current player with detailed statistics
- **Bidding Controls**: Start, pause, and manage auction rounds
- **Instant Player Assignment**: Assign players to teams with price tracking
- **Auction Statistics**: Live stats including players sold, remaining budget
- **Fullscreen Mode**: Distraction-free auction management

### 📊 Public Display Features
- **Public Auction Display**: External screen for audience viewing
- **Open Auction Display**: Simplified view for public events
- **Real-time Updates**: Live synchronization of auction progress
- **Professional Presentation**: Clean, broadcast-ready interface

### 🎯 Target Player System
- **Player Targeting**: Owners can mark players as high, medium, or low priority
- **Strategic Planning**: Pre-auction team strategy development
- **Notes & Comments**: Add strategic notes for targeted players

### 📈 Analytics & Reporting
- **Auction Statistics**: Comprehensive auction performance metrics
- **Team Analytics**: Budget utilization and player acquisition analysis
- **Player Market Analysis**: Price trends and bidding patterns
- **Real-time Dashboards**: Live updates during active auctions

### 🔧 Administrative Features
- **Auction Management**: Create, schedule, and control multiple auctions
- **System Configuration**: Manage auction parameters and settings
- **Data Export**: Export auction results and player data
- **Backup & Recovery**: Secure data management with Firebase

### 📱 User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern UI**: Clean, intuitive interface built with Tailwind CSS
- **Performance Optimized**: Fast loading with React 18 and Vite
- **Accessibility**: WCAG compliant design principles
- **Real-time Notifications**: Instant updates using Sonner toast notifications

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS v4
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **UI Components**: ShadCN UI, Radix UI
- **Icons**: Lucide React
- **Notifications**: Sonner

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cricket-bidding-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create Firestore Database
4. Copy your Firebase configuration
5. Update `/lib/firebase.ts` with your config:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 4. Initialize Sample Data
After Firebase setup, run the setup function once to create initial data:

```typescript
// In browser console or setup page
import { setupFirebaseData, createInitialAdminUser } from './lib/setupFirebaseData';

// Create admin user
await createInitialAdminUser();

// Setup sample teams and players
await setupFirebaseData();
```

### 5. Run the Application
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Default Login Credentials

After running the setup:
- **Email**: admin@cricket.com  
- **Password**: admin123

## Environment Variables (Optional)

Create `.env.local` for production:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Project Structure

```
├── components/
│   ├── pages/           # Main application pages
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Layout components
│   └── figma/           # Figma-specific components
├── contexts/            # React context providers
├── lib/                # Firebase services and utilities
├── styles/             # Global styles and Tailwind config
└── guidelines/         # Project guidelines
```

## Key Features by Role

### Admin
- Full system access
- Player management (CRUD operations)
- Team management
- User management
- Auction control
- Reports and analytics

### Manager
- Player database access
- Team information viewing
- Auction participation
- Limited administrative functions

### Owner
- Team dashboard
- Player targeting
- Auction participation
- Team roster management

## Image Storage

This application uses Google Drive for image storage:
1. Upload player images and team logos to Google Drive
2. Make them publicly viewable
3. Use direct URLs in the application
4. Example URL format: `https://drive.google.com/uc?id=YOUR_FILE_ID`

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel/Netlify
1. Connect your repository
2. Set environment variables
3. Deploy with build command: `npm run build`
4. Set output directory: `dist`

## Troubleshooting

### Common Issues

1. **Firebase Connection Errors**
   - Check Firebase configuration
   - Verify project ID and API keys
   - Ensure Firestore is enabled

2. **Authentication Issues**
   - Confirm Email/Password is enabled in Firebase
   - Check security rules in Firestore

3. **Build Errors**
   - Clear node_modules: `rm -rf node_modules package-lock.json`
   - Reinstall: `npm install`
   - Check TypeScript errors: `npm run build`

4. **Styling Issues**
   - Ensure Tailwind CSS v4 is properly configured
   - Check if CSS variables are defined in globals.css

### Performance Tips

1. **Optimize Images**
   - Use compressed images for player photos
   - Consider using WebP format

2. **Database Optimization**
   - Use proper Firestore indexes
   - Implement pagination for large datasets

3. **Bundle Size**
   - Lazy load pages with React.lazy()
   - Use dynamic imports for large components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting guide
2. Review Firebase setup documentation
3. Create an issue on GitHub

---

**Note**: This application is designed for cricket auction management and should not be used for collecting personally identifiable information (PII) or handling sensitive financial data without proper security measures.