import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Player } from '@/types';

const COLLECTION_NAME = 'players';

export const playersApi = {
  // Get all players
  async getAllPlayers(): Promise<Player[]> {
    try {
      const playersRef = collection(db, COLLECTION_NAME);
      const q = query(playersRef, orderBy('name'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Player[];
    } catch (error) {
      console.error('Error fetching players:', error);
      throw error;
    }
  },

  // Get player by ID
  async getPlayerById(id: string): Promise<Player | null> {
    try {
      const playerRef = doc(db, COLLECTION_NAME, id);
      const snapshot = await getDoc(playerRef);
      
      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...snapshot.data(),
          createdAt: snapshot.data().createdAt?.toDate() || new Date(),
          updatedAt: snapshot.data().updatedAt?.toDate() || new Date()
        } as Player;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching player:', error);
      throw error;
    }
  },

  // Get players by team ID
  async getPlayersByTeam(teamId: string): Promise<Player[]> {
    try {
      const playersRef = collection(db, COLLECTION_NAME);
      const q = query(
        playersRef, 
        where('teamId', '==', teamId),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Player[];
    } catch (error) {
      console.error('Error fetching team players:', error);
      throw error;
    }
  },

  // Get available players (not assigned to any team)
  async getAvailablePlayers(): Promise<Player[]> {
    try {
      const playersRef = collection(db, COLLECTION_NAME);
      const q = query(
        playersRef,
        where('teamId', '==', null),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Player[];
    } catch (error) {
      console.error('Error fetching available players:', error);
      throw error;
    }
  },

  // Create new player
  async createPlayer(playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...playerData,
        createdAt: now,
        updatedAt: now
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating player:', error);
      throw error;
    }
  },

  // Update player
  async updatePlayer(id: string, updates: Partial<Player>): Promise<void> {
    try {
      const playerRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(playerRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating player:', error);
      throw error;
    }
  },

  // Delete player
  async deletePlayer(id: string): Promise<void> {
    try {
      const playerRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(playerRef);
    } catch (error) {
      console.error('Error deleting player:', error);
      throw error;
    }
  },

  // Assign player to team
  async assignPlayerToTeam(playerId: string, teamId: string, finalPrice?: number): Promise<void> {
    try {
      const playerRef = doc(db, COLLECTION_NAME, playerId);
      const updates: Partial<Player> = {
        teamId,
        status: 'sold',
        updatedAt: new Date()
      };
      
      if (finalPrice !== undefined) {
        updates.finalPrice = finalPrice;
      }
      
      await updateDoc(playerRef, updates);
    } catch (error) {
      console.error('Error assigning player to team:', error);
      throw error;
    }
  },

  // Remove player from team
  async removePlayerFromTeam(playerId: string): Promise<void> {
    try {
      const playerRef = doc(db, COLLECTION_NAME, playerId);
      await updateDoc(playerRef, {
        teamId: null,
        finalPrice: null,
        status: 'active',
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error removing player from team:', error);
      throw error;
    }
  },

  // Subscribe to players changes
  subscribeToPlayers(callback: (players: Player[]) => void): () => void {
    const playersRef = collection(db, COLLECTION_NAME);
    const q = query(playersRef, orderBy('name'));
    
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

  // Subscribe to team players
  subscribeToTeamPlayers(teamId: string, callback: (players: Player[]) => void): () => void {
    const playersRef = collection(db, COLLECTION_NAME);
    const q = query(
      playersRef,
      where('teamId', '==', teamId),
      orderBy('name')
    );
    
    return onSnapshot(q, (snapshot) => {
      const players = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Player[];
      
      callback(players);
    }, (error) => {
      console.error('Error in team players subscription:', error);
    });
  },

  // Get players by role
  async getPlayersByRole(role: string): Promise<Player[]> {
    try {
      const playersRef = collection(db, COLLECTION_NAME);
      const q = query(
        playersRef,
        where('role', '==', role),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Player[];
    } catch (error) {
      console.error('Error fetching players by role:', error);
      throw error;
    }
  },

  // Bulk import players
  async bulkImportPlayers(players: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
    try {
      const now = Timestamp.now();
      const promises = players.map(player => 
        addDoc(collection(db, COLLECTION_NAME), {
          ...player,
          createdAt: now,
          updatedAt: now
        })
      );
      
      const results = await Promise.all(promises);
      return results.map(doc => doc.id);
    } catch (error) {
      console.error('Error bulk importing players:', error);
      throw error;
    }
  }
};