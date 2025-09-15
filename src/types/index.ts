// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'owner';
  teamId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'manager' | 'owner';

// Team Types
export interface Team {
  id: string;
  name: string;
  initials: string;
  logo?: string;
  budget: number;
  remainingBudget: number;
  ownerId?: string;
  players: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Player Types
export interface Player {
  id: string;
  name: string;
  role: string;
  basePrice: number;
  finalPrice?: number;
  teamId?: string;
  status: 'active' | 'sold' | 'unsold' | 'pending';
  image?: string;
  age?: number;
  matches?: number;
  runs?: number;
  wickets?: number;
  battingAvg?: number;
  bowlingAvg?: number;
  economy?: number;
  strikeRate?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Auction Types
export interface AuctionRound {
  id: string;
  round: number;
  status: 'pending' | 'active' | 'completed' | 'waiting_for_admin';
  playersLeft: number;
  totalPlayers: number;
  currentPlayerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bid {
  id: string;
  playerId: string;
  teamId: string;
  amount: number;
  timestamp: Date;
  auctionRoundId: string;
}

// Target Player Types
export interface TargetPlayer {
  id: string;
  teamId: string;
  playerId: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Auction Types
export type AuctionStatus = 'scheduled' | 'active' | 'paused' | 'completed';

export interface Auction {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  status: AuctionStatus;
  createdBy: string;
  teams: string[];
  playerIds: string[];
  currentPlayerIndex: number;
  maxTeams: number;
  baseBudget: number;
  bids: Bid[];
  createdAt: Date;
  updatedAt: Date;
}

// Navigation Types
export type PageType = 
  | 'dashboard' 
  | 'players' 
  | 'teams' 
  | 'users' 
  | 'import' 
  | 'auction' 
  | 'my-team'
  | 'other-teams'
  | 'public-auction'
  | 'open-auction';

// Auth Context Types
export interface AuthContextType {
  user: User | null;
  teams: Team[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  refreshTeams: () => Promise<void>;
}

// Component Props Types
export interface NavigationProps {
  onNavigate: (page: PageType) => void;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Firebase Types
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Utility Types
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface PlayerFormData extends Omit<Player, 'id' | 'createdAt' | 'updatedAt'> {}
export interface TeamFormData extends Omit<Team, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UserFormData extends Omit<User, 'id' | 'createdAt' | 'updatedAt'> {}