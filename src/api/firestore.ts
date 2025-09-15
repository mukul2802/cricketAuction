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
import { db } from '@/firebase';
import { User, Team, Player, AuctionRound, Bid, TargetPlayer } from '@/types';

/**
 * Firestore API service
 * Handles all database operations for the application
 */

// User Operations
export const userApi = {
  async getAllUsers(): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as User[];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  },

  async getUserById(id: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', id));
      if (!userDoc.exists()) {
        return null;
      }
      return {
        id: userDoc.id,
        ...userDoc.data(),
        createdAt: userDoc.data().createdAt?.toDate() || new Date(),
        updatedAt: userDoc.data().updatedAt?.toDate() || new Date()
      } as User;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user');
    }
  },

  async updateUser(id: string, userData: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, 'users', id);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }
};

// Team Operations
export const teamApi = {
  async getAllTeams(): Promise<Team[]> {
    try {
      const teamsRef = collection(db, 'teams');
      const q = query(teamsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Team[];
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw new Error('Failed to fetch teams');
    }
  },

  subscribeToTeams(callback: (teams: Team[]) => void): () => void {
    const teamsRef = collection(db, 'teams');
    const q = query(teamsRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const teams = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Team[];
      callback(teams);
    }, (error) => {
      console.error('Error in teams subscription:', error);
    });
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
      console.error('Error creating team:', error);
      throw new Error('Failed to create team');
    }
  },

  async updateTeam(id: string, teamData: Partial<Team>): Promise<void> {
    try {
      const teamRef = doc(db, 'teams', id);
      await updateDoc(teamRef, {
        ...teamData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating team:', error);
      throw new Error('Failed to update team');
    }
  },

  async deleteTeam(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'teams', id));
    } catch (error) {
      console.error('Error deleting team:', error);
      throw new Error('Failed to delete team');
    }
  },

  async updateTeamBudget(teamId: string, amount: number): Promise<void> {
    try {
      const teamRef = doc(db, 'teams', teamId);
      const teamDoc = await getDoc(teamRef);
      
      if (!teamDoc.exists()) {
        throw new Error('Team not found');
      }
      
      const currentBudget = teamDoc.data().remainingBudget || 0;
      const newBudget = currentBudget - amount;
      
      await updateDoc(teamRef, {
        remainingBudget: newBudget,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating team budget:', error);
      throw new Error('Failed to update team budget');
    }
  }
};

// Player Operations
export const playerApi = {
  async getAllPlayers(): Promise<Player[]> {
    try {
      const playersRef = collection(db, 'players');
      const q = query(playersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Player[];
    } catch (error) {
      console.error('Error fetching players:', error);
      throw new Error('Failed to fetch players');
    }
  },

  subscribeToPlayers(callback: (players: Player[]) => void): () => void {
    const playersRef = collection(db, 'players');
    const q = query(playersRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const players = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Player[];
      callback(players);
    }, (error) => {
      console.error('Error in players subscription:', error);
    });
  },

  async getPlayerById(id: string): Promise<Player | null> {
    try {
      const playerDoc = await getDoc(doc(db, 'players', id));
      if (!playerDoc.exists()) {
        return null;
      }
      return {
        id: playerDoc.id,
        ...playerDoc.data(),
        createdAt: playerDoc.data().createdAt?.toDate() || new Date(),
        updatedAt: playerDoc.data().updatedAt?.toDate() || new Date()
      } as Player;
    } catch (error) {
      console.error('Error fetching player:', error);
      throw new Error('Failed to fetch player');
    }
  },

  async getPlayersByTeam(teamId: string): Promise<Player[]> {
    try {
      const playersRef = collection(db, 'players');
      const q = query(playersRef, where('teamId', '==', teamId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Player[];
    } catch (error) {
      console.error('Error fetching team players:', error);
      throw new Error('Failed to fetch team players');
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
      console.error('Error creating player:', error);
      throw new Error('Failed to create player');
    }
  },

  async updatePlayer(id: string, playerData: Partial<Player>): Promise<void> {
    try {
      const playerRef = doc(db, 'players', id);
      await updateDoc(playerRef, {
        ...playerData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating player:', error);
      throw new Error('Failed to update player');
    }
  },

  async deletePlayer(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'players', id));
    } catch (error) {
      console.error('Error deleting player:', error);
      throw new Error('Failed to delete player');
    }
  },

  async sellPlayer(playerId: string, teamId: string, finalPrice: number): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      // Update player
      const playerRef = doc(db, 'players', playerId);
      batch.update(playerRef, {
        teamId,
        finalPrice,
        status: 'sold',
        updatedAt: serverTimestamp()
      });
      
      // Update team budget and add player to team
      const teamRef = doc(db, 'teams', teamId);
      const teamDoc = await getDoc(teamRef);
      
      if (teamDoc.exists()) {
        const teamData = teamDoc.data() as Team;
        const newBudget = teamData.remainingBudget - finalPrice;
        const updatedPlayers = [...(teamData.players || []), playerId];
        
        batch.update(teamRef, {
          remainingBudget: newBudget,
          players: updatedPlayers,
          updatedAt: serverTimestamp()
        });
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error selling player:', error);
      throw new Error('Failed to sell player');
    }
  },

  async bulkImportPlayers(players: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const playersRef = collection(db, 'players');
      
      players.forEach((playerData) => {
        const docRef = doc(playersRef);
        batch.set(docRef, {
          ...playerData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error bulk importing players:', error);
      throw new Error('Failed to bulk import players');
    }
  }
};