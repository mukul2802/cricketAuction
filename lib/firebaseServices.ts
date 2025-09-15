import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, db } from './firebase';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'owner';
  teamId?: string;
  createdAt: Date;
  updatedAt: Date;
}

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
  createdAt: Date;
  updatedAt: Date;
}

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

export interface TargetPlayer {
  id: string;
  teamId: string;
  playerId: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Authentication Services
export const authService = {
  async getAllUsers(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as User[];
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  },

  subscribeToUsers(callback: (users: User[]) => void): () => void {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as User[];
      callback(users);
    }, (error) => {
      console.error('Users subscription error:', error);
    });
    return unsubscribe;
  },
  async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      return {
        user: userCredential.user,
        profile: { id: userDoc.id, ...userDoc.data() } as User
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  async createUser(email: string, password: string, userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      // Store current admin user credentials to re-authenticate later
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      // Create new user (this will automatically sign them in)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      const userProfile: Omit<User, 'id'> = {
        ...userData,
        email,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Use the Firebase user's UID as the document ID
      await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
      
      // Sign out the newly created user to restore admin session
      await signOut(auth);
      
      // Re-authenticate the admin user using updateCurrentUser
      // This restores the admin session without requiring password
      await auth.updateCurrentUser(currentUser);
      
      return {
        user: userCredential.user,
        profile: { id: userCredential.user.uid, ...userProfile } as User
      };
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  },

  async createInitialUser(email: string, password: string, userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      // Create new user (this will automatically sign them in)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      const userProfile: Omit<User, 'id'> = {
        ...userData,
        email,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Use the Firebase user's UID as the document ID
      await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
      
      return {
        user: userCredential.user,
        profile: { id: userCredential.user.uid, ...userProfile } as User
      };
    } catch (error) {
      console.error('Create initial user error:', error);
      throw error;
    }
  }
};

// User Services
export const userService = {
  async getAllUsers(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as User[];
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  },

  async getUserById(id: string): Promise<User | null> {
    try {
      const docSnap = await getDoc(doc(db, 'users', id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  },

  async updateUser(id: string, userData: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', id), {
        ...userData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }
};

// Team Services
export const teamService = {
  async getAllTeams(): Promise<Team[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'teams'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Team[];
    } catch (error) {
      console.error('Get teams error:', error);
      throw error;
    }
  },

  subscribeToTeams(callback: (teams: Team[]) => void): () => void {
    const unsubscribe = onSnapshot(collection(db, 'teams'), (snapshot) => {
      const teams = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Team[];
      callback(teams);
    }, (error) => {
      console.error('Teams subscription error:', error);
      // For permission errors, call callback with empty array to prevent crashes
      if (error.code === 'permission-denied') {
        console.log('Teams subscription: Permission denied, continuing with empty teams data');
        callback([]);
      }
    });
    return unsubscribe;
  },

  async createTeam(teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'teams'), {
        ...teamData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Create team error:', error);
      throw error;
    }
  },

  async updateTeam(id: string, teamData: Partial<Team>): Promise<void> {
    try {
      await updateDoc(doc(db, 'teams', id), {
        ...teamData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Update team error:', error);
      throw error;
    }
  },

  async deleteTeam(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'teams', id));
    } catch (error) {
      console.error('Delete team error:', error);
      throw error;
    }
  },

  async updateTeamBudget(teamId: string, amount: number): Promise<void> {
    try {
      const teamDoc = await getDoc(doc(db, 'teams', teamId));
      if (teamDoc.exists()) {
        const currentBudget = teamDoc.data().remainingBudget || 0;
        await updateDoc(doc(db, 'teams', teamId), {
          remainingBudget: currentBudget - amount,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Update team budget error:', error);
      throw error;
    }
  }
};

// Player Services
export const playerService = {
  async getAllPlayers(): Promise<Player[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'players'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Player[];
    } catch (error) {
      console.error('Get players error:', error);
      throw error;
    }
  },

  subscribeToPlayers(callback: (players: Player[]) => void): () => void {
    const unsubscribe = onSnapshot(collection(db, 'players'), (snapshot) => {
      const players = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Player[];
      callback(players);
    }, (error) => {
      console.error('Players subscription error:', error);
      // Handle network errors gracefully - don't crash the app
      if (error.code === 'permission-denied') {
        console.log('Players subscription: Permission denied, continuing with empty players data');
        callback([]);
      } else if (error.code === 'unavailable' || error.message?.includes('ERR_ABORTED')) {
        console.log('Players subscription: Network error, will retry automatically');
        // Don't call callback to avoid clearing current data during network issues
      } else {
        // For other errors, call callback with empty array to prevent crashes
        callback([]);
      }
    });
    return unsubscribe;
  },

  async getPlayerById(id: string): Promise<Player | null> {
    try {
      const docRef = doc(db, 'players', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Player;
      }
      return null;
    } catch (error) {
      console.error('Get player by ID error:', error);
      throw error;
    }
  },

  async getPlayersByTeam(teamId: string): Promise<Player[]> {
    try {
      const q = query(collection(db, 'players'), where('teamId', '==', teamId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Player[];
    } catch (error) {
      console.error('Get players by team error:', error);
      throw error;
    }
  },

  async createPlayer(playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'players'), {
        ...playerData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Create player error:', error);
      throw error;
    }
  },

  async updatePlayer(id: string, playerData: Partial<Player>): Promise<void> {
    try {
      await updateDoc(doc(db, 'players', id), {
        ...playerData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Update player error:', error);
      throw error;
    }
  },

  async deletePlayer(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'players', id));
    } catch (error) {
      console.error('Delete player error:', error);
      throw error;
    }
  },

  async sellPlayer(playerId: string, teamId: string, finalPrice: number): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Update player
      const playerRef = doc(db, 'players', playerId);
      batch.update(playerRef, {
        status: 'sold',
        teamId,
        finalPrice,
        updatedAt: serverTimestamp()
      });
      
      // Update team budget and add player to team
      const teamRef = doc(db, 'teams', teamId);
      const teamDoc = await getDoc(teamRef);
      if (teamDoc.exists()) {
        const teamData = teamDoc.data();
        batch.update(teamRef, {
          remainingBudget: teamData.remainingBudget - finalPrice,
          players: [...(teamData.players || []), playerId],
          updatedAt: serverTimestamp()
        });
      }
      
      await batch.commit();
      
      // Remove player from all target lists when sold
      await targetPlayerService.removeTargetPlayerWhenSold(playerId);
    } catch (error) {
      console.error('Sell player error:', error);
      throw error;
    }
  },

  async bulkImportPlayers(players: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      players.forEach(playerData => {
        const docRef = doc(collection(db, 'players'));
        batch.set(docRef, {
          ...playerData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Bulk import players error:', error);
      throw error;
    }
  }
};

// Auction Services
export const auctionService = {
  async getCurrentRound(): Promise<AuctionRound | null> {
    try {
      // Get all active and waiting_for_admin rounds without orderBy to avoid composite index requirement
      const q = query(
        collection(db, 'auctionRounds'),
        where('status', 'in', ['active', 'waiting_for_admin'])
      );
      const querySnapshot = await getDocs(q);
      
      // Sort the results in memory instead of using orderBy in the query
      const sortedDocs = querySnapshot.docs.sort((a, b) => {
        const roundA = a.data().round || 0;
        const roundB = b.data().round || 0;
        return roundB - roundA; // descending order
      });
      
      if (!querySnapshot.empty) {
        const doc = sortedDocs[0];
        return {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        } as AuctionRound;
      }
      return null;
    } catch (error) {
      console.error('Get current round error:', error);
      throw error;
    }
  },

  async createAuctionRound(roundData: Omit<AuctionRound, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    console.log('🎯 Creating new auction round', {
      round: roundData.round,
      status: roundData.status,
      playersLeft: roundData.playersLeft,
      totalPlayers: roundData.totalPlayers,
      currentPlayerId: roundData.currentPlayerId,
      timestamp: new Date().toISOString()
    });
    
    try {
      const docRef = await addDoc(collection(db, 'auctionRounds'), {
        ...roundData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Auction round created successfully', {
        roundId: docRef.id,
        round: roundData.round
      });
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Create auction round error:', error);
      throw error;
    }
  },

  async updateAuctionRound(id: string, roundData: Partial<AuctionRound>): Promise<void> {
    try {
      await updateDoc(doc(db, 'auctionRounds', id), {
        ...roundData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Update auction round error:', error);
      throw error;
    }
  },

  // Real-time subscription for auction updates
  subscribeToAuctionUpdates(callback: (round: AuctionRound | null) => void) {
    // Get only active and waiting_for_admin rounds, exclude completed rounds
    const q = query(
      collection(db, 'auctionRounds'),
      where('status', 'in', ['active', 'waiting_for_admin'])
    );
    
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Sort the results in memory instead of using orderBy in the query
        const sortedDocs = snapshot.docs.sort((a, b) => {
          const updatedAtA = a.data().updatedAt?.toDate() || new Date(0);
          const updatedAtB = b.data().updatedAt?.toDate() || new Date(0);
          return updatedAtB.getTime() - updatedAtA.getTime(); // descending order
        });
        
        const doc = sortedDocs[0];
        const round = {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        } as AuctionRound;
        console.log('🔄 Auction subscription update:', round.status, 'round', round.round);
        callback(round);
      } else {
        console.log('🔄 Auction subscription: No active rounds found');
        callback(null);
      }
    }, (error) => {
      console.error('Auction subscription error:', error);
      // Handle network errors gracefully - don't crash the app
      if (error.code === 'permission-denied') {
        console.log('Auction subscription: Permission denied, continuing with null data');
        callback(null);
      } else if (error.code === 'unavailable' || error.message?.includes('ERR_ABORTED')) {
        console.log('Auction subscription: Network error, will retry automatically');
        // Don't call callback to avoid clearing current data during network issues
      } else {
        // For other errors, call callback with null to prevent crashes
        callback(null);
      }
    });
  },

  // Get eligible players for a specific round
  async getEligiblePlayersForRound(roundNumber: number): Promise<Player[]> {
    try {
      const allPlayers = await playerService.getAllPlayers();
      console.log(`🔍 getEligiblePlayersForRound(${roundNumber}): Total players:`, allPlayers.length);
      console.log('🔍 Player statuses:', allPlayers.map(p => ({ name: p.name, status: p.status })));
      
      let eligiblePlayers: Player[] = [];
      
      if (roundNumber === 1) {
        // First round: active, pending, and unsold players (to handle restarts)
        eligiblePlayers = allPlayers.filter(p => 
          p.status === 'active' || p.status === 'pending' || p.status === 'unsold'
        );
        console.log(`🔍 Round 1 - Active/Pending/Unsold players:`, eligiblePlayers.length);
      } else {
        // Subsequent rounds: active and pending players (unsold players are reset to active in startNextRound)
        eligiblePlayers = allPlayers.filter(p => p.status === 'active' || p.status === 'pending');
        console.log(`🔍 Round ${roundNumber} - Active/Pending players:`, eligiblePlayers.length);
      }
      
      // Randomize player order for each round using Fisher-Yates shuffle
      for (let i = eligiblePlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [eligiblePlayers[i], eligiblePlayers[j]] = [eligiblePlayers[j], eligiblePlayers[i]];
      }
      
      // Remove any potential duplicates based on player ID
      const uniquePlayers = eligiblePlayers.filter((player, index, self) => 
        index === self.findIndex(p => p.id === player.id)
      );
      
      console.log(`🔍 Final eligible players for round ${roundNumber}:`, uniquePlayers.map(p => ({ name: p.name, status: p.status })));
      return uniquePlayers;
    } catch (error) {
      console.error('Error getting eligible players for round:', error);
      throw error;
    }
  },

  // Validate round integrity - ensure no player appears twice
  async validateRoundIntegrity(roundNumber: number): Promise<boolean> {
    try {
      const eligiblePlayers = await this.getEligiblePlayersForRound(roundNumber);
      const playerIds = eligiblePlayers.map(p => p.id);
      const uniqueIds = [...new Set(playerIds)];
      
      // Check if there are any duplicate player IDs
      const hasDuplicates = playerIds.length !== uniqueIds.length;
      
      if (hasDuplicates) {
        console.warn(`Round ${roundNumber} has duplicate players`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating round integrity:', error);
      return false;
    }
  },

  // Check if auction should auto-end (all players sold or no unsold players for next round)
  async shouldAuctionEnd(): Promise<boolean> {
    try {
      const allPlayers = await playerService.getAllPlayers();
      const unsoldPlayers = allPlayers.filter(p => p.status === 'unsold');
      const activePlayers = allPlayers.filter(p => p.status === 'active' || p.status === 'pending');
      
      // Auction can only end if no unsold players and no active/pending players are available
      // But it won't automatically end - admin must choose to end it
      return unsoldPlayers.length === 0 && activePlayers.length === 0;
    } catch (error) {
      console.error('Error checking if auction should end:', error);
      return false;
    }
  },

  // Check if there are players available for next round
  async hasPlayersForNextRound(): Promise<boolean> {
    try {
      const allPlayers = await playerService.getAllPlayers();
      const unsoldPlayers = allPlayers.filter(p => p.status === 'unsold');
      const activePlayers = allPlayers.filter(p => p.status === 'active' || p.status === 'pending');
      
      // Players are available if there are unsold players (can be reset to active) or active/pending players
      return unsoldPlayers.length > 0 || activePlayers.length > 0;
    } catch (error) {
      console.error('Error checking if players available for next round:', error);
      return false;
    }
  },

  // Check if all players are sold (auction should end)
  async areAllPlayersSold(): Promise<boolean> {
    try {
      const allPlayers = await playerService.getAllPlayers();
      const soldPlayers = allPlayers.filter(p => p.status === 'sold');
      
      // All players are sold if sold count equals total count
      return soldPlayers.length === allPlayers.length && allPlayers.length > 0;
    } catch (error) {
      console.error('Error checking if all players are sold:', error);
      return false;
    }
  },

  // Get count of remaining players for auction
  async getRemainingPlayersCount(): Promise<{unsold: number, active: number, total: number}> {
    try {
      const allPlayers = await playerService.getAllPlayers();
      const unsoldPlayers = allPlayers.filter(p => p.status === 'unsold');
      const activePlayers = allPlayers.filter(p => p.status === 'active' || p.status === 'pending');
      
      return {
        unsold: unsoldPlayers.length,
        active: activePlayers.length,
        total: allPlayers.length
      };
    } catch (error) {
      console.error('Error getting remaining players count:', error);
      return { unsold: 0, active: 0, total: 0 };
    }
  },

  // Start next round with unsold players (supports unlimited rounds)
  async startNextRound(): Promise<string | null> {
    console.log('🚀 Start Next Round function called', {
      timestamp: new Date().toISOString()
    });
    
    try {
      // Get current round to determine next round number
      const currentRound = await this.getCurrentRound();
      const nextRoundNumber = currentRound ? currentRound.round + 1 : 1;
      
      console.log('📊 Round information', {
        currentRoundId: currentRound?.id,
        currentRoundNumber: currentRound?.round,
        nextRoundNumber
      });
      
      // Reset unsold players to active status for the new round
      if (nextRoundNumber > 1) {
        const allPlayers = await playerService.getAllPlayers();
        const unsoldPlayers = allPlayers.filter(p => p.status === 'unsold');
        
        console.log('🔄 Resetting unsold players to active', {
          unsoldPlayersCount: unsoldPlayers.length,
          unsoldPlayerNames: unsoldPlayers.map(p => p.name)
        });
        
        // Update all unsold players to active status
        const batch = writeBatch(db);
        for (const player of unsoldPlayers) {
          const playerRef = doc(db, 'players', player.id);
          batch.update(playerRef, { 
            status: 'active',
            updatedAt: serverTimestamp()
          });
        }
        await batch.commit();
        console.log(`✅ Reset ${unsoldPlayers.length} unsold players to active status for round ${nextRoundNumber}`);
      }
      
      const eligiblePlayers = await this.getEligiblePlayersForRound(nextRoundNumber);
      
      if (eligiblePlayers.length === 0) {
        console.log(`No eligible players available for round ${nextRoundNumber}`);
        return null;
      }

      // Complete current round if active or waiting_for_admin
      if (currentRound && (currentRound.status === 'active' || currentRound.status === 'waiting_for_admin')) {
        await this.updateAuctionRound(currentRound.id, { status: 'completed' });
      }

      // Create next round with waiting_for_admin status to show countdown timer
      const nextRoundId = await this.createAuctionRound({
        round: nextRoundNumber,
        status: 'waiting_for_admin',
        playersLeft: eligiblePlayers.length,
        totalPlayers: eligiblePlayers.length,
        currentPlayerId: eligiblePlayers[0]?.id
      });

      console.log(`Round ${nextRoundNumber} started with ${eligiblePlayers.length} eligible players`);
      return nextRoundId;
    } catch (error) {
      console.error('Error starting next round:', error);
      throw error;
    }
  },

  // Legacy method for backward compatibility
  async startRound2(): Promise<string | null> {
    return this.startNextRound();
  },

  // End auction completely
  async endAuction(): Promise<void> {
    try {
      // Get all active and waiting_for_admin rounds to end them all
      const q = query(
        collection(db, 'auctionRounds'),
        where('status', 'in', ['active', 'waiting_for_admin'])
      );
      const querySnapshot = await getDocs(q);
      
      console.log('🔍 endAuction: Found', querySnapshot.docs.length, 'rounds to end');
      
      if (!querySnapshot.empty) {
        // Update all active/waiting rounds to completed
        const batch = writeBatch(db);
        querySnapshot.docs.forEach(doc => {
          console.log('✅ endAuction: Marking round', doc.id, 'as completed');
          batch.update(doc.ref, { 
            status: 'completed',
            updatedAt: serverTimestamp()
          });
        });
        
        await batch.commit();
        console.log('✅ endAuction: All rounds updated to completed');
      } else {
        console.log('❌ endAuction: No eligible rounds found');
      }
      console.log('Auction ended successfully');
    } catch (error) {
      console.error('Error ending auction:', error);
      throw error;
    }
  },

  // Reset auction to waiting state (removes currentPlayerId to prevent auto-start appearance)
  async resetAuctionToWaitingState(): Promise<void> {
    try {
      const currentRound = await this.getCurrentRound();
      if (currentRound && currentRound.status === 'active') {
        await this.updateAuctionRound(currentRound.id, { 
          status: 'waiting_for_admin',
          currentPlayerId: undefined
        });
        console.log('Auction reset to waiting state');
      }
    } catch (error) {
      console.error('Error resetting auction state:', error);
      throw error;
    }
  }
};

// Target Players Service
export const targetPlayerService = {
  async getTargetPlayersByTeam(teamId: string): Promise<TargetPlayer[]> {
    try {
      const q = query(collection(db, 'targetPlayers'), where('teamId', '==', teamId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as TargetPlayer[];
    } catch (error) {
      console.error('Get target players error:', error);
      // Return empty array if collection doesn't exist yet
      if (error instanceof Error && error.message.includes('permissions')) {
        return [];
      }
      throw error;
    }
  },

  subscribeToTargetPlayers(teamId: string, callback: (targetPlayers: TargetPlayer[]) => void): () => void {
    const q = query(collection(db, 'targetPlayers'), where('teamId', '==', teamId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const targetPlayers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as TargetPlayer[];
      callback(targetPlayers);
    }, (error) => {
      console.error('Target players subscription error:', error);
    });
    return unsubscribe;
  },

  async addTargetPlayer(teamId: string, playerId: string, priority: 'high' | 'medium' | 'low' = 'medium', notes?: string): Promise<string> {
    try {
      // Check if player is already a target for this team
      let existing: TargetPlayer[] = [];
      try {
        existing = await this.getTargetPlayersByTeam(teamId);
      } catch (error) {
        // If collection doesn't exist yet, that's fine - we'll create the first document
        console.log('Target players collection may not exist yet, creating first entry');
      }
      
      if (existing.some(tp => tp.playerId === playerId)) {
        throw new Error('Player is already in target list');
      }

      const docRef = await addDoc(collection(db, 'targetPlayers'), {
        teamId,
        playerId,
        priority,
        notes: notes || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Add target player error:', error);
      throw error;
    }
  },

  async removeTargetPlayer(targetPlayerId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'targetPlayers', targetPlayerId));
    } catch (error) {
      console.error('Remove target player error:', error);
      throw error;
    }
  },

  async removeTargetPlayerByPlayerAndTeam(teamId: string, playerId: string): Promise<void> {
    try {
      const targetPlayers = await this.getTargetPlayersByTeam(teamId);
      const targetPlayer = targetPlayers.find(tp => tp.playerId === playerId);
      if (targetPlayer) {
        await this.removeTargetPlayer(targetPlayer.id);
      }
    } catch (error) {
      console.error('Remove target player by player and team error:', error);
      throw error;
    }
  },

  async updateTargetPlayerPriority(targetPlayerId: string, priority: 'high' | 'medium' | 'low'): Promise<void> {
    try {
      await updateDoc(doc(db, 'targetPlayers', targetPlayerId), {
        priority,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Update target player priority error:', error);
      throw error;
    }
  },

  // Auto-remove sold players from all teams' target lists
  async removeTargetPlayerWhenSold(playerId: string): Promise<void> {
    try {
      const q = query(collection(db, 'targetPlayers'), where('playerId', '==', playerId));
      const querySnapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Remove target player when sold error:', error);
      throw error;
    }
  }
};

// Admin Reset Service
export const adminResetService = {
  async resetAllTeamsToInitialState(): Promise<void> {
    try {
      const teams = await teamService.getAllTeams();
      const batch = writeBatch(db);
      
      teams.forEach(team => {
        const teamRef = doc(db, 'teams', team.id);
        batch.update(teamRef, {
          remainingBudget: team.budget,
          players: [],
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Reset teams error:', error);
      throw error;
    }
  },

  async resetAllPlayersToAuctionState(): Promise<void> {
    try {
      const players = await playerService.getAllPlayers();
      const batch = writeBatch(db);
      
      players.forEach(player => {
        const playerRef = doc(db, 'players', player.id);
        batch.update(playerRef, {
          status: 'active',
          teamId: null,
          finalPrice: null,
          soldPrice: null,
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Reset players error:', error);
      throw error;
    }
  },

  async deleteAllPlayers(): Promise<void> {
    try {
      const players = await playerService.getAllPlayers();
      const batch = writeBatch(db);
      
      players.forEach(player => {
        const playerRef = doc(db, 'players', player.id);
        batch.delete(playerRef);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Delete all players error:', error);
      throw error;
    }
  },

  async clearAllTargetPlayers(): Promise<void> {
    try {
      const q = query(collection(db, 'targetPlayers'));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Clear target players error:', error);
      // Don't throw error for permission issues, just log them
      if (error instanceof Error && error.message.includes('permissions')) {
        console.warn('Insufficient permissions to clear target players, skipping...');
        return;
      }
      throw error;
    }
  },

  async resetAuctionData(): Promise<void> {
    try {
      // Clear auction rounds
      const roundsQuery = query(collection(db, 'auctionRounds'));
      const roundsSnapshot = await getDocs(roundsQuery);
      const batch = writeBatch(db);
      
      roundsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Clear bids
      const bidsQuery = query(collection(db, 'bids'));
      const bidsSnapshot = await getDocs(bidsQuery);
      
      bidsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Reset auction data error:', error);
      throw error;
    }
  },

  async performFullReset(): Promise<void> {
    try {
      await this.resetAllTeamsToInitialState();
      await this.resetAllPlayersToAuctionState();
      await this.clearAllTargetPlayers();
      await this.resetAuctionData();
    } catch (error) {
      console.error('Full reset error:', error);
      // Don't throw error for permission issues, just log them
      if (error instanceof Error && error.message.includes('permissions')) {
        console.warn('Some operations failed due to insufficient permissions, but continuing...');
        return;
      }
      throw error;
    }
  }
};

// Note: Image URLs should be provided directly (e.g., from Google Drive)
// No file upload service needed as images will be stored externally