import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  onAuthStateChanged,
  deleteUser as deleteFirebaseUser
} from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { User, ApiResponse } from '@/types';

/**
 * Authentication API service
 * Handles Firebase Auth operations and user profile management
 */
export const authApi = {
  /**
   * Get all users from Firestore
   */
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

  /**
   * Subscribe to users collection changes
   */
  subscribeToUsers(callback: (users: User[]) => void): () => void {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as User[];
      callback(users);
    }, (error) => {
      console.error('Error in users subscription:', error);
    });
  },

  /**
   * Sign in user with email and password
   */
  async signIn(email: string, password: string): Promise<{ user: FirebaseUser; profile: User }> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      const profile = {
        id: userDoc.id,
        ...userDoc.data(),
        createdAt: userDoc.data().createdAt?.toDate() || new Date(),
        updatedAt: userDoc.data().updatedAt?.toDate() || new Date()
      } as User;
      
      return { user, profile };
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  },

  /**
   * Create new user with email, password and profile data
   */
  async createUser(
    email: string, 
    password: string, 
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      const userProfile = {
        ...userData,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      return user.uid;
    } catch (error: any) {
      console.error('Create user error:', error);
      throw new Error(error.message || 'Failed to create user');
    }
  },

  /**
   * Create initial admin user (for setup)
   */
  async createInitialUser(
    email: string, 
    password: string, 
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userProfile = {
        ...userData,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      return user.uid;
    } catch (error: any) {
      console.error('Create initial user error:', error);
      throw new Error(error.message || 'Failed to create initial user');
    }
  },

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      console.error('Update user error:', error);
      throw new Error(error.message || 'Failed to update user');
    }
  },

  /**
   * Delete user with cascading effects
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      // Get user data first to check if they're a team owner
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data() as User;
      
      // If user is a team owner, handle cascading deletion
      if (userData.role === 'owner' && userData.teamId) {
        await this.handleTeamOwnerDeletion(userData.teamId);
      }
      
      // Delete user profile from Firestore
      await deleteDoc(doc(db, 'users', userId));
      
      // Note: Firebase Auth user deletion would require admin SDK in production
      // For now, we only delete the Firestore profile
    } catch (error: any) {
      console.error('Delete user error:', error);
      throw new Error(error.message || 'Failed to delete user');
    }
  },

  /**
   * Handle team owner deletion with cascading effects
   */
  async handleTeamOwnerDeletion(teamId: string): Promise<void> {
    try {
      // Get all players assigned to this team
      const playersRef = collection(db, 'players');
      const playersQuery = query(playersRef, where('teamId', '==', teamId));
      const playersSnapshot = await getDocs(playersQuery);
      
      // Update all players to active status (remove team assignment)
      const playerUpdates = playersSnapshot.docs.map(playerDoc => 
        updateDoc(playerDoc.ref, {
          teamId: null,
          status: 'active',
          finalPrice: null,
          updatedAt: serverTimestamp()
        })
      );
      
      await Promise.all(playerUpdates);
      
      // Delete the team
      await deleteDoc(doc(db, 'teams', teamId));
    } catch (error: any) {
      console.error('Handle team owner deletion error:', error);
      throw new Error(error.message || 'Failed to handle team owner deletion');
    }
  },

  /**
   * Listen to authentication state changes
   */
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }
};