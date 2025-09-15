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
import { Team } from '@/types';

const COLLECTION_NAME = 'teams';

export const teamsApi = {
  // Get all teams
  async getAllTeams(): Promise<Team[]> {
    try {
      const teamsRef = collection(db, COLLECTION_NAME);
      const q = query(teamsRef, orderBy('name'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Team[];
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  },

  // Get team by ID
  async getTeamById(id: string): Promise<Team | null> {
    try {
      const teamRef = doc(db, COLLECTION_NAME, id);
      const snapshot = await getDoc(teamRef);
      
      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...snapshot.data(),
          createdAt: snapshot.data().createdAt?.toDate() || new Date(),
          updatedAt: snapshot.data().updatedAt?.toDate() || new Date()
        } as Team;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching team:', error);
      throw error;
    }
  },

  // Create new team
  async createTeam(teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...teamData,
        createdAt: now,
        updatedAt: now
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  },

  // Update team
  async updateTeam(id: string, updates: Partial<Team>): Promise<void> {
    try {
      const teamRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(teamRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  },

  // Delete team
  async deleteTeam(id: string): Promise<void> {
    try {
      const teamRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(teamRef);
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  },

  // Update team budget
  async updateTeamBudget(id: string, remainingBudget: number): Promise<void> {
    try {
      const teamRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(teamRef, {
        remainingBudget,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating team budget:', error);
      throw error;
    }
  },

  // Add player to team
  async addPlayerToTeam(teamId: string, playerId: string): Promise<void> {
    try {
      const teamRef = doc(db, COLLECTION_NAME, teamId);
      const team = await this.getTeamById(teamId);
      
      if (team) {
        const updatedPlayers = [...team.players, playerId];
        await updateDoc(teamRef, {
          players: updatedPlayers,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error adding player to team:', error);
      throw error;
    }
  },

  // Remove player from team
  async removePlayerFromTeam(teamId: string, playerId: string): Promise<void> {
    try {
      const teamRef = doc(db, COLLECTION_NAME, teamId);
      const team = await this.getTeamById(teamId);
      
      if (team) {
        const updatedPlayers = team.players.filter(id => id !== playerId);
        await updateDoc(teamRef, {
          players: updatedPlayers,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error removing player from team:', error);
      throw error;
    }
  },

  // Get teams by owner
  async getTeamsByOwner(ownerId: string): Promise<Team[]> {
    try {
      const teamsRef = collection(db, COLLECTION_NAME);
      const q = query(
        teamsRef,
        where('ownerId', '==', ownerId),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Team[];
    } catch (error) {
      console.error('Error fetching teams by owner:', error);
      throw error;
    }
  },

  // Subscribe to teams changes
  subscribeToTeams(callback: (teams: Team[]) => void): () => void {
    const teamsRef = collection(db, COLLECTION_NAME);
    const q = query(teamsRef, orderBy('name'));
    
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

  // Subscribe to specific team
  subscribeToTeam(teamId: string, callback: (team: Team | null) => void): () => void {
    const teamRef = doc(db, COLLECTION_NAME, teamId);
    
    return onSnapshot(teamRef, (snapshot) => {
      if (snapshot.exists()) {
        const team = {
          id: snapshot.id,
          ...snapshot.data(),
          createdAt: snapshot.data().createdAt?.toDate() || new Date(),
          updatedAt: snapshot.data().updatedAt?.toDate() || new Date()
        } as Team;
        callback(team);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error in team subscription:', error);
    });
  },

  // Reset all team budgets
  async resetAllTeamBudgets(): Promise<void> {
    try {
      const teams = await this.getAllTeams();
      const promises = teams.map(team => 
        this.updateTeam(team.id, {
          remainingBudget: team.budget,
          players: []
        })
      );
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error resetting team budgets:', error);
      throw error;
    }
  },

  // Get team statistics
  async getTeamStats(teamId: string): Promise<{
    totalPlayers: number;
    totalSpent: number;
    avgPlayerCost: number;
    budgetUtilization: number;
  }> {
    try {
      const team = await this.getTeamById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }
      
      const totalSpent = team.budget - team.remainingBudget;
      const totalPlayers = team.players.length;
      const avgPlayerCost = totalPlayers > 0 ? totalSpent / totalPlayers : 0;
      const budgetUtilization = (totalSpent / team.budget) * 100;
      
      return {
        totalPlayers,
        totalSpent,
        avgPlayerCost,
        budgetUtilization
      };
    } catch (error) {
      console.error('Error getting team stats:', error);
      throw error;
    }
  },

  // Bulk create teams
  async bulkCreateTeams(teams: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
    try {
      const now = Timestamp.now();
      const promises = teams.map(team => 
        addDoc(collection(db, COLLECTION_NAME), {
          ...team,
          createdAt: now,
          updatedAt: now
        })
      );
      
      const results = await Promise.all(promises);
      return results.map(doc => doc.id);
    } catch (error) {
      console.error('Error bulk creating teams:', error);
      throw error;
    }
  }
};