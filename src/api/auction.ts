import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Auction, AuctionStatus, Bid } from '@/types';

export const auctionApi = {
  /**
   * Get all auctions
   */
  async getAllAuctions(): Promise<Auction[]> {
    try {
      const auctionsRef = collection(db, 'auctions');
      const q = query(auctionsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Auction[];
    } catch (error) {
      console.error('Error fetching auctions:', error);
      throw new Error('Failed to fetch auctions');
    }
  },

  /**
   * Get auction by ID
   */
  async getAuctionById(id: string): Promise<Auction | null> {
    try {
      const auctionDoc = await getDoc(doc(db, 'auctions', id));
      if (!auctionDoc.exists()) {
        return null;
      }
      
      const data = auctionDoc.data();
      return {
        id: auctionDoc.id,
        ...data,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Auction;
    } catch (error) {
      console.error('Error fetching auction:', error);
      throw new Error('Failed to fetch auction');
    }
  },

  /**
   * Create a new auction
   */
  async createAuction(auctionData: Omit<Auction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const auctionsRef = collection(db, 'auctions');
      const docRef = await addDoc(auctionsRef, {
        ...auctionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating auction:', error);
      throw new Error('Failed to create auction');
    }
  },

  /**
   * Update an auction
   */
  async updateAuction(id: string, updates: Partial<Auction>): Promise<void> {
    try {
      const auctionRef = doc(db, 'auctions', id);
      await updateDoc(auctionRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating auction:', error);
      throw new Error('Failed to update auction');
    }
  },

  /**
   * Delete an auction
   */
  async deleteAuction(id: string): Promise<void> {
    try {
      const auctionRef = doc(db, 'auctions', id);
      await deleteDoc(auctionRef);
    } catch (error) {
      console.error('Error deleting auction:', error);
      throw new Error('Failed to delete auction');
    }
  },

  /**
   * Start an auction
   */
  async startAuction(id: string): Promise<void> {
    try {
      const auctionRef = doc(db, 'auctions', id);
      await updateDoc(auctionRef, {
        status: 'active',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error starting auction:', error);
      throw new Error('Failed to start auction');
    }
  },

  /**
   * Pause an auction
   */
  async pauseAuction(id: string): Promise<void> {
    try {
      const auctionRef = doc(db, 'auctions', id);
      await updateDoc(auctionRef, {
        status: 'paused',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error pausing auction:', error);
      throw new Error('Failed to pause auction');
    }
  },

  /**
   * End an auction
   */
  async endAuction(id: string): Promise<void> {
    try {
      const auctionRef = doc(db, 'auctions', id);
      await updateDoc(auctionRef, {
        status: 'completed',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error ending auction:', error);
      throw new Error('Failed to end auction');
    }
  },

  /**
   * Add team to auction
   */
  async addTeamToAuction(auctionId: string, teamId: string): Promise<void> {
    try {
      const auction = await this.getAuctionById(auctionId);
      if (!auction) {
        throw new Error('Auction not found');
      }
      
      if (auction.teams.includes(teamId)) {
        throw new Error('Team already in auction');
      }
      
      if (auction.teams.length >= auction.maxTeams) {
        throw new Error('Auction is full');
      }
      
      const auctionRef = doc(db, 'auctions', auctionId);
      await updateDoc(auctionRef, {
        teams: [...auction.teams, teamId],
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding team to auction:', error);
      throw new Error('Failed to add team to auction');
    }
  },

  /**
   * Remove team from auction
   */
  async removeTeamFromAuction(auctionId: string, teamId: string): Promise<void> {
    try {
      const auction = await this.getAuctionById(auctionId);
      if (!auction) {
        throw new Error('Auction not found');
      }
      
      const auctionRef = doc(db, 'auctions', auctionId);
      await updateDoc(auctionRef, {
        teams: auction.teams.filter(id => id !== teamId),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error removing team from auction:', error);
      throw new Error('Failed to remove team from auction');
    }
  },

  /**
   * Place a bid
   */
  async placeBid(auctionId: string, bid: Omit<Bid, 'id'>): Promise<void> {
    try {
      const auction = await this.getAuctionById(auctionId);
      if (!auction) {
        throw new Error('Auction not found');
      }
      
      if (auction.status !== 'active') {
        throw new Error('Auction is not active');
      }
      
      const newBid = {
        ...bid,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      const auctionRef = doc(db, 'auctions', auctionId);
      await updateDoc(auctionRef, {
        bids: [...auction.bids, newBid],
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error placing bid:', error);
      throw new Error('Failed to place bid');
    }
  },

  /**
   * Get active auctions
   */
  async getActiveAuctions(): Promise<Auction[]> {
    try {
      const auctionsRef = collection(db, 'auctions');
      const q = query(
        auctionsRef, 
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Auction[];
    } catch (error) {
      console.error('Error fetching active auctions:', error);
      throw new Error('Failed to fetch active auctions');
    }
  },

  /**
   * Subscribe to auction changes
   */
  subscribeToAuction(auctionId: string, callback: (auction: Auction | null) => void): () => void {
    const auctionRef = doc(db, 'auctions', auctionId);
    
    return onSnapshot(auctionRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const auction = {
          id: doc.id,
          ...data,
          startTime: data.startTime?.toDate() || new Date(),
          endTime: data.endTime?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Auction;
        callback(auction);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error in auction subscription:', error);
      callback(null);
    });
  },

  /**
   * Subscribe to all auctions
   */
  subscribeToAuctions(callback: (auctions: Auction[]) => void): () => void {
    const auctionsRef = collection(db, 'auctions');
    const q = query(auctionsRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const auctions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Auction[];
      callback(auctions);
    }, (error) => {
      console.error('Error in auctions subscription:', error);
    });
  }
};