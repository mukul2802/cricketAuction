// Application Constants
export const APP_NAME = 'Thoughtwin Premier League Auction - 2025 System';
export const APP_VERSION = '1.0.0';

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  OWNER: 'owner'
} as const;

// Player Status
export const PLAYER_STATUS = {
  ACTIVE: 'active',
  SOLD: 'sold',
  UNSOLD: 'unsold',
  PENDING: 'pending'
} as const;

// Auction Round Status
export const AUCTION_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  WAITING_FOR_ADMIN: 'waiting_for_admin'
} as const;

// Target Player Priority
export const TARGET_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
} as const;

// Page Types
export const PAGE_TYPES = {
  DASHBOARD: 'dashboard',
  PLAYERS: 'players',
  TEAMS: 'teams',
  USERS: 'users',
  IMPORT: 'import',
  AUCTION: 'auction',
  MY_TEAM: 'my-team',
  OTHER_TEAMS: 'other-teams',
  PUBLIC_AUCTION: 'public-auction',
  OPEN_AUCTION: 'open-auction'
} as const;

// Default Values
export const DEFAULT_TEAM_BUDGET = 1000000; // 10 Lakh
export const MIN_BID_INCREMENT = 10000; // 10K
export const MAX_PLAYERS_PER_TEAM = 11;

// File Upload Constants
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Firebase Collections
export const COLLECTIONS = {
  USERS: 'users',
  TEAMS: 'teams',
  PLAYERS: 'players',
  AUCTION_ROUNDS: 'auctionRounds',
  BIDS: 'bids',
  TARGET_PLAYERS: 'targetPlayers'
} as const;

// Storage Paths
export const STORAGE_PATHS = {
  PLAYERS: 'players',
  TEAMS: 'teams',
  AVATARS: 'avatars'
} as const;

// Demo accounts for testing
export const DEMO_ACCOUNTS = {
  ADMIN: { role: 'admin', email: 'admin@cricket.com', password: 'admin123' },
  OWNER: { role: 'owner', email: 'owner@cricket.com', password: 'owner123' }
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  LOGIN_FAILED: 'Login failed. Please try again.',
  USER_NOT_FOUND: 'User not found.',
  TEAM_NOT_FOUND: 'Team not found.',
  PLAYER_NOT_FOUND: 'Player not found.',
  INSUFFICIENT_BUDGET: 'Insufficient budget for this bid.',
  AUCTION_NOT_ACTIVE: 'Auction is not currently active.',
  EMAIL_ALREADY_EXISTS: 'Email already exists.',
  WEAK_PASSWORD: 'Password should be at least 6 characters.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  GENERIC_ERROR: 'Something went wrong. Please try again.'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  LOGOUT_SUCCESS: 'Successfully logged out!',
  PLAYER_CREATED: 'Player created successfully!',
  PLAYER_UPDATED: 'Player updated successfully!',
  PLAYER_DELETED: 'Player deleted successfully!',
  TEAM_CREATED: 'Team created successfully!',
  TEAM_UPDATED: 'Team updated successfully!',
  TEAM_DELETED: 'Team deleted successfully!',
  BID_PLACED: 'Bid placed successfully!',
  AUCTION_STARTED: 'Auction started successfully!',
  AUCTION_ENDED: 'Auction ended successfully!'
} as const;

// Routes (for future React Router implementation)
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PLAYERS: '/players',
  TEAMS: '/teams',
  USERS: '/users',
  AUCTION: '/auction',
  PROFILE: '/profile',
  SETTINGS: '/settings'
} as const;