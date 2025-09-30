// React and core hooks for component state management and lifecycle
import React, { useState, useEffect, useCallback, useRef, startTransition, useMemo } from 'react';

// Layout and UI components for the auction interface
import { MainLayout } from '../layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Application routing and authentication
import { PageType } from '@/components/Router';
import { useAuth } from '../../contexts/AuthContext';

// Custom components and services
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { auctionService, playerService, teamService, Player, Team, AuctionRound as AuctionRoundType } from '../../lib/firebaseServices';
import { formatCurrency } from '../../src/utils';
import Shimmer, { ShimmerText, ShimmerAvatar, ShimmerButton } from '@/components/ui/shimmer';
import { toast } from 'sonner';

// Icons for the auction interface
import {
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Target,
  Play,
  Pause,
  Maximize,
  Minimize,
  Home,
  Users,
  FileSpreadsheet
} from 'lucide-react';

// Props interface for the LiveAuctionPage component
interface LiveAuctionPageProps {
  onNavigate: (page: PageType) => void; // Function to navigate between different pages
}

/**
 * LiveAuctionPage Component
 * 
 * This is the main auction management interface where administrators can:
 * - View and navigate through players available for auction
 * - Start and manage auction rounds
 * - Assign players to teams with final prices
 * - Monitor auction progress and statistics
 * - Control the auction flow (start, pause, next round)
 */
export const LiveAuctionPage = React.memo(function LiveAuctionPage({ onNavigate }: LiveAuctionPageProps) {
  
  // Authentication and team data from context
  const { user, teams } = useAuth();
  
  // Player navigation and selection state
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0); // Index of currently displayed player
  const [showSoldDialog, setShowSoldDialog] = useState(false); // Controls the "Mark as Sold" dialog visibility
  const [soldPrice, setSoldPrice] = useState(''); // Final price when player is sold
  const [selectedTeam, setSelectedTeam] = useState(''); // Team selected to buy the current player
  const [isProcessing, setIsProcessing] = useState(false); // Loading state for async operations
  
  // Auction round management
  const [currentRound, setCurrentRound] = useState<AuctionRoundType | null>(null); // Current active auction round

  // UI state management
  const [isFullscreen, setIsFullscreen] = useState(false); // Fullscreen mode toggle
  const [showSidebar, setShowSidebar] = useState(true); // Sidebar visibility toggle
  const [players, setPlayers] = useState<Player[]>([]); // List of all players in the auction
  const [loading, setLoading] = useState(true); // Initial data loading state
  const [isPlayerTransitioning, setIsPlayerTransitioning] = useState(false); // Animation state for player transitions

  // Auction progress tracking
  const [auctionStarted, setAuctionStarted] = useState(false); // Whether auction has been initiated
  const [hasPlayersForNextRound, setHasPlayersForNextRound] = useState(true); // Check if more rounds are possible
  const [allPlayersSold, setAllPlayersSold] = useState(false); // Check if auction is complete
  const [remainingPlayersCount, setRemainingPlayersCount] = useState({unsold: 0, active: 0, total: 0}); // Player count statistics
  
  // Component lifecycle management
  const mountedRef = useRef(true); // Prevents state updates after component unmount


  /**
   * Check Auction Status
   * 
   * Monitors the current state of the auction to determine:
   * - Whether there are players available for the next round
   * - If all players have been sold (auction complete)
   * - Current count of remaining players by status
   * 
   * This function is called periodically to update the UI and enable/disable
   * auction controls based on the current auction progress.
   */
  const checkAuctionStatus = useCallback(async () => {
    try {
      // Fetch auction status data in parallel for better performance
      const [hasPlayers, allSold, remainingCount] = await Promise.all([
        auctionService.hasPlayersForNextRound(), // Check if more rounds are possible
        auctionService.areAllPlayersSold(), // Check if auction is complete
        auctionService.getRemainingPlayersCount() // Get detailed player count statistics
      ]);
      
      // Update component state with fetched data
      setHasPlayersForNextRound(hasPlayers);
      setAllPlayersSold(allSold);
      setRemainingPlayersCount(remainingCount);
      
      // Log status for debugging and monitoring
      console.log('🔍 Auction Status Check:', {
        hasPlayersForNextRound: hasPlayers,
        allPlayersSold: allSold,
        remainingCount
      });
    } catch (error) {
      console.error('Error checking auction status:', error);
    }
  }, []);

  /**
   * Handle Start Next Round
   * 
   * Initiates a new auction round by:
   * - Creating a new round in the database
   * - Resetting player statuses for the new round
   * - Loading eligible players for bidding
   * - Updating the UI to reflect the new round state
   * 
   * This function is called when the admin wants to start a new round
   * after the current round is completed or when starting the first round.
   */
  const handleStartNextRound = useCallback(async () => {
    // Ensure we have a current round context
    if (!currentRound) return;
    
    try {
      // Create new auction round and reset player statuses
      // This service method handles all the backend logic for round creation
      const newRoundId = await auctionService.startNextRound();
      
      // Check if round creation was successful
      if (!newRoundId) {
        toast.error('No players available for next round');
        return;
      }
      
      // Fetch the newly created round data from the database
      const newRound = await auctionService.getCurrentRound();
      console.log('🔍 New round data from handleStartNextRound:', {
        newRoundId: newRound?.id,
        newRoundNumber: newRound?.round,
        newRoundStatus: newRound?.status
      });
      if (newRound) {
        // Update currentRound immediately to prevent UI lag
        setCurrentRound(newRound);
        
        // Get eligible players for the new round
        const eligiblePlayers = await auctionService.getEligiblePlayersForRound(newRound.round);
        setPlayers(eligiblePlayers);
        // Direct atomic updates to prevent flicker
        setCurrentPlayerIndex(0);
        if (eligiblePlayers.length > 0) {
          setStableCurrentPlayer(eligiblePlayers[0]);
        }
        
        toast.success(`New round started with ${eligiblePlayers.length} players`);
        
        // Ensure the round has the correct player count
        if (newRound.playersLeft !== eligiblePlayers.length) {
          await auctionService.updateAuctionRound(newRound.id, {
            playersLeft: eligiblePlayers.length,
            totalPlayers: eligiblePlayers.length
          });
        }
        
        // Activate the round immediately
        await auctionService.updateAuctionRound(newRound.id, {
          status: 'active'
        });
        setAuctionStarted(true);
        
        // Check auction status after starting new round
        await checkAuctionStatus();
      }
    } catch (error) {
      console.error('Error starting next round:', error);
      toast.error('Failed to start next round');
    }
  }, [currentRound]);



  const handleEndAuction = async () => {
    if (!currentRound) return;
    
    try {
      // Update auction round status to completed
      await auctionService.updateAuctionRound(currentRound.id, {
        status: 'completed',
        currentPlayerId: ""
      });
      
      // Let subscription handle the state update to ensure correct round number
      // setCurrentRound(prev => prev ? { ...prev, status: 'completed' } : null);
      
      toast.success('Auction ended successfully');
      
      // Add a small delay to ensure the UI updates before navigation
      setTimeout(() => {
        onNavigate('dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error ending auction:', error);
      toast.error('Failed to end auction');
    }
  };

  // Note: Countdown completion is handled within the startCountdown function
  // No separate useEffect needed as it would conflict with the countdown logic



  // Load auction data when component mounts
  const loadData = useCallback(async () => {
      if (!mountedRef.current) return;
      
      try {
        setLoading(true);
        // Get current auction round
        const round = await auctionService.getCurrentRound();
        if (!mountedRef.current) return;
        
        setCurrentRound(round);
        
        // Get eligible players for this round using the auction service
        let eligiblePlayers: Player[] = [];
        
        if (round) {
          // Validate round integrity first
          const isValidRound = await auctionService.validateRoundIntegrity(round.round);
          if (!isValidRound) {
            console.warn(`Round ${round.round} has integrity issues, but continuing...`);
          }
          
          eligiblePlayers = await auctionService.getEligiblePlayersForRound(round.round);
          if (!mountedRef.current) return;
          
          // Only set auction as started if it's explicitly active (not auto-start)
          console.log('🔍 Checking auction status on page load', {
            roundId: round.id,
            status: round.status,
            currentPlayerId: round.currentPlayerId,
            autoStartPrevented: true
          });
          
          if (round.status === 'active' && round.currentPlayerId) {
            console.log('✅ Auction is already active, resuming from current state');
            setAuctionStarted(true);
            const playerIndex = eligiblePlayers.findIndex(p => p.id === round.currentPlayerId);
            if (playerIndex !== -1) {
              setCurrentPlayerIndex(playerIndex);
              setStableCurrentPlayer(eligiblePlayers[playerIndex]);
            } else {
              // If current player not found, start from beginning
              setCurrentPlayerIndex(0);
              if (eligiblePlayers.length > 0) {
                setStableCurrentPlayer(eligiblePlayers[0]);
              }
            }
          } else {
            // Auction not started yet or waiting for admin confirmation
            console.log('⏸️ Auction not active, waiting for admin confirmation');
            setAuctionStarted(false);
            setCurrentPlayerIndex(0);
            if (eligiblePlayers.length > 0) {
              setStableCurrentPlayer(eligiblePlayers[0]);
            }
          }
        }
        
        if (mountedRef.current) {
          setPlayers(eligiblePlayers);
        }
        
        // Check auction status
        await checkAuctionStatus();
      } catch (error) {
        console.error('Error loading auction data:', error);
        if (mountedRef.current) {
          toast.error('Failed to load auction data');
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }, []);

  // Function to start the auction manually
  const handleStartAuction = useCallback(async () => {
    console.log('🚀 Auction start function called', {
      currentRound: currentRound?.id,
      playersCount: players.length,
      timestamp: new Date().toISOString()
    });
    
    if (!currentRound || !players.length) {
      console.log('❌ Auction start aborted - missing requirements', {
        hasCurrentRound: !!currentRound,
        playersLength: players.length
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      const firstPlayer = players[0];
      
      console.log('✅ Starting auction with first player', {
        playerId: firstPlayer.id,
        playerName: firstPlayer.name,
        roundId: currentRound.id
      });
      
      // Update the round with the first player
      await auctionService.updateAuctionRound(currentRound.id, {
        currentPlayerId: firstPlayer.id,
        status: 'active',
        updatedAt: new Date()
      });
      
      setAuctionStarted(true);
      // Direct atomic updates to prevent flicker
      setCurrentPlayerIndex(0);
      if (players.length > 0) {
        setStableCurrentPlayer(players[0]);
      }
      toast.success('Auction started!');
      
      console.log('🎉 Auction started successfully');
    } catch (error) {
      console.error('❌ Error starting auction:', error);
      toast.error('Failed to start auction');
    } finally {
      setIsProcessing(false);
    }
  }, [currentRound, players]);
    
    // Stable auction update handler
    const handleAuctionUpdate = useCallback(async (round: AuctionRoundType | null) => {
      if (!mountedRef.current) return;
      
      console.log('Auction update received:', round);
      
      // Check if this is a significant round change that requires player reload
      const isSignificantChange = !currentRound || 
        currentRound.id !== round?.id || 
        currentRound.status !== round?.status || 
        currentRound.round !== round?.round;
      
      // Update current round
      setCurrentRound(prevRound => {
        if (prevRound?.id === round?.id && 
            prevRound?.status === round?.status && 
            prevRound?.currentPlayerId === round?.currentPlayerId) {
          return prevRound; // No change, return previous to prevent re-render
        }
        return round;
      });
      
      // If significant change, reload players to ensure synchronization
      if (isSignificantChange && round) {
        try {
          console.log('Significant auction change detected, reloading players');
          const freshPlayers = await auctionService.getEligiblePlayersForRound(round.round);
          
          if (!mountedRef.current) return;
          
          setPlayers(freshPlayers);
          
          // Set current player index based on currentPlayerId - direct atomic updates
          if (round.currentPlayerId) {
            const playerIndex = freshPlayers.findIndex(p => p.id === round.currentPlayerId);
            if (playerIndex !== -1) {
              setCurrentPlayerIndex(playerIndex);
              setStableCurrentPlayer(freshPlayers[playerIndex]);
            } else {
              setCurrentPlayerIndex(0);
              setStableCurrentPlayer(freshPlayers[0] || null);
            }
          } else {
             setCurrentPlayerIndex(0);
             setStableCurrentPlayer(freshPlayers[0] || null);
           }
           
           // Check auction status after significant changes to ensure UI consistency
           await checkAuctionStatus();
         } catch (error) {
           console.error('Error reloading players after auction update:', error);
         }
       } else if (round && round.currentPlayerId) {
        // Update player index and stableCurrentPlayer when currentPlayerId changes - direct atomic updates
        const playerIndex = players.findIndex(p => p.id === round.currentPlayerId);
        if (playerIndex !== -1) {
          // Only update if the player has actually changed to prevent unnecessary transitions
          if (players[playerIndex]?.id !== stableCurrentPlayer?.id) {
            updatePlayerStateAtomically(playerIndex, players[playerIndex]);
          }
        }
      }
    }, [currentRound, players]);

    // Stable player update handler - reload players for current round with debouncing
    const handlePlayerUpdate = useCallback(async () => {
      if (!mountedRef.current || !currentRound) return;
      
      console.log('Player update received, reloading players for current round');
      
      try {
        // Get fresh player data for the current round
        const freshPlayers = await auctionService.getEligiblePlayersForRound(currentRound.round);
        
        if (!mountedRef.current) return;
        
        // Only update if player data has actually changed (prevent flickering)
        const currentPlayerIds = players.map(p => p.id).sort().join(',');
        const freshPlayerIds = freshPlayers.map(p => p.id).sort().join(',');
        const currentPlayerStatuses = players.map(p => `${p.id}:${p.status}`).sort().join(',');
        const freshPlayerStatuses = freshPlayers.map(p => `${p.id}:${p.status}`).sort().join(',');
        
        if (currentPlayerIds !== freshPlayerIds || currentPlayerStatuses !== freshPlayerStatuses) {
          console.log('Player data changed, updating players list');
          
          // Use functional update to prevent unnecessary re-renders
          setPlayers(prevPlayers => {
            // Double-check if update is still needed
            const prevIds = prevPlayers.map(p => p.id).sort().join(',');
            const prevStatuses = prevPlayers.map(p => `${p.id}:${p.status}`).sort().join(',');
            
            if (prevIds === freshPlayerIds && prevStatuses === freshPlayerStatuses) {
              return prevPlayers; // No change needed
            }
            return freshPlayers;
          });
          
          // Update current player index if current player is still valid - atomic updates
          if (currentRound.currentPlayerId) {
            const newPlayerIndex = freshPlayers.findIndex(p => p.id === currentRound.currentPlayerId);
            if (newPlayerIndex !== -1) {
              setCurrentPlayerIndex(newPlayerIndex);
              setStableCurrentPlayer(freshPlayers[newPlayerIndex]);
            }
          }
        }
      } catch (error) {
        console.error('Error reloading players after update:', error);
      }
    }, [currentRound, players]);

    // Removed duplicate subscription - using consolidated subscription below
  
  // Consolidated subscription and data loading effect
  useEffect(() => {
    let mounted = true;
    let auctionUnsubscribe: (() => void) | null = null;
    let playerUnsubscribe: (() => void) | null = null;
    
    const initializeSubscriptions = async () => {
      try {
        // Subscribe to auction updates with debounced player reloading
         auctionUnsubscribe = auctionService.subscribeToAuctionUpdates(async (round: AuctionRoundType | null) => {
           if (!mounted) return;
           
           console.log('🔄 Auction update received in LiveAuctionPage:', {
             roundId: round?.id,
             roundNumber: round?.round,
             roundStatus: round?.status,
             previousRoundNumber: currentRound?.round
           });
           
           if (round) {
             const prevRound = currentRound;
             const shouldReloadPlayers = !prevRound || 
               prevRound.round !== round.round || 
               prevRound.status !== round.status;
             
             console.log('🔄 Setting currentRound via subscription:', {
               newRoundNumber: round.round,
               shouldReloadPlayers
             });
             setCurrentRound(round);
             
             if (shouldReloadPlayers) {
               try {
                 const eligiblePlayers = await auctionService.getEligiblePlayersForRound(round.round);
                 if (!mounted) return;
                 
                 // Update players and current player atomically to prevent flicker
                 setPlayers(eligiblePlayers);
                 
                 // Set current player index based on currentPlayerId
                 const targetIndex = round.currentPlayerId 
                   ? eligiblePlayers.findIndex(p => p.id === round.currentPlayerId)
                   : 0;
                 const finalIndex = targetIndex !== -1 ? targetIndex : 0;
                 
                 // Update both index and stable player with the new players list
                 setCurrentPlayerIndex(finalIndex);
                 const targetPlayer = eligiblePlayers[finalIndex];
                 if (targetPlayer) {
                   setStableCurrentPlayer(targetPlayer);
                 }
                 
                 // Update auction started state
                 setAuctionStarted(round.status === 'active' && !!round.currentPlayerId);
                 
                 // Note: Countdown should only start when admin clicks 'Start Next Round' button
                 // Removed auto-start countdown to ensure admin has control over when next round begins
               } catch (error) {
                 console.error('Error loading players after auction update:', error);
               }
             } else if (round.currentPlayerId) {
               // Update player index if currentPlayerId changed - always use fresh data to prevent race conditions
               console.log('🔄 CurrentPlayerId changed, updating player:', {
                 newPlayerId: round.currentPlayerId,
                 currentPlayerIndex,
                 currentPlayerId: currentPlayer?.id
               });
               
               try {
                 const freshPlayers = await auctionService.getEligiblePlayersForRound(round.round);
                 const playerIndex = freshPlayers.findIndex(p => p.id === round.currentPlayerId);
                 
                 console.log('🔄 Fresh player lookup result:', {
                   playerIndex,
                   foundPlayer: freshPlayers[playerIndex]?.name,
                   totalFreshPlayers: freshPlayers.length
                 });
                 
                 if (playerIndex !== -1) {
                   // Always update to ensure sync, even if index appears the same
                   setPlayers(freshPlayers);
                   setCurrentPlayerIndex(playerIndex);
                   const targetPlayer = freshPlayers[playerIndex];
                   if (targetPlayer) {
                     setStableCurrentPlayer(targetPlayer);
                   }
                 }
               } catch (error) {
                 console.error('Error getting fresh player data:', error);
               }
             }
           } else {
             setCurrentRound(null);
             setPlayers([]);
             setAuctionStarted(false);
           }
         });
        
        // Load initial data
        await loadData();
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing LiveAuctionPage subscriptions:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    initializeSubscriptions();
    
    return () => {
      mounted = false;
      if (auctionUnsubscribe) {
        auctionUnsubscribe();
        auctionUnsubscribe = null;
      }
      if (playerUnsubscribe) {
        playerUnsubscribe();
        playerUnsubscribe = null;
      }
    };
  }, []); // Empty dependency array - only run once on mount



  // Toggle fullscreen and sidebar visibility
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setShowSidebar(isFullscreen); // Show sidebar when exiting fullscreen, hide when entering
  };

  // Use real players data instead of mock data
  // For current round, show players that are eligible for this round
  const activeRoundPlayers = useMemo(() => players, [players]);
  
  // Use state for currentPlayer to prevent flicker during transitions
  const [stableCurrentPlayer, setStableCurrentPlayer] = useState<Player | null>(null);
  
  // Batch state updates to prevent flicker using startTransition
  const updatePlayerStateAtomically = useCallback((newIndex: number, newPlayer: Player | null) => {
    // Start transition loading state
    setIsPlayerTransitioning(true);
    
    // Brief delay to show shimmer effect - balanced for visibility and smoothness
    setTimeout(() => {
      startTransition(() => {
        setCurrentPlayerIndex(newIndex);
        setStableCurrentPlayer(newPlayer);
        setIsPlayerTransitioning(false);
      });
    }, 200); // 200ms delay for shimmer visibility - balanced timing
  }, []);
  
  // Always show stableCurrentPlayer to prevent flickering - never show undefined during transitions
  const currentPlayer: Player | undefined = useMemo(() => stableCurrentPlayer || undefined, [stableCurrentPlayer]);
  
  // Debug logging for round number display (memoized to prevent excessive logging)
  const debugState = useMemo(() => ({
    currentRoundNumber: currentRound?.round,
    currentRoundStatus: currentRound?.status,
    playersLeft: currentRound?.playersLeft,
    totalPlayers: players.length,
    currentPlayerName: currentPlayer?.name
  }), [currentRound?.round, currentRound?.status, currentRound?.playersLeft, players.length, currentPlayer?.name]);
  
  console.log('🔍 LiveAuctionPage render state:', debugState);
  
  // Debug button render conditions (memoized to prevent excessive logging)
  const buttonDebugState = useMemo(() => ({
    userRole: user?.role,
    hasCurrentPlayer: !!currentPlayer,
    currentPlayerName: currentPlayer?.name,
    selectedTeam,
    isProcessing,
    confirmSaleDisabled: !selectedTeam || isProcessing,
    markUnsoldDisabled: isProcessing,
    teamsCount: teams.length
  }), [user?.role, currentPlayer, selectedTeam, isProcessing, teams.length]);
  
  useEffect(() => {
    console.log('🔍 Button render conditions:', buttonDebugState);
  }, [buttonDebugState]);
  
  // Memoize team data for performance
  const topTeams = useMemo(() => 
    teams.slice(0, 5).map(team => ({
      id: team.id,
      abbreviation: team.name.split(' ').map(word => word[0]).join('').slice(0, 2),
      budgetDisplay: (team.remainingBudget / 10000000).toFixed(2)
    })), [teams]
  );

  // Memoize team options for select dropdown
  const teamOptions = useMemo(() => 
    teams.map(team => ({
      id: team.id,
      name: team.name,
      displayText: `${team.name} (${formatCurrency(team.remainingBudget)})`
    })), [teams]
  );

  // Memoize auction state conditions
  const auctionStateConditions = useMemo(() => ({
    isAuctionCompleted: currentRound?.status === 'completed',
    isWaitingForAdmin: currentRound?.status === 'waiting_for_admin',
    isAuctionNotStarted: currentRound && !auctionStarted && players.length > 0,
    isAuctionNotLive: !currentRound || currentRound.status === 'pending'
  }), [currentRound?.status, auctionStarted, players.length]);

  // Only show no player state if we're certain there are no players and not in a loading state
  // Prevent flickering by being more conservative about when to show this state
  if (!currentPlayer && !loading && players.length === 0) {
    const { isAuctionCompleted, isWaitingForAdmin, isAuctionNotStarted, isAuctionNotLive } = auctionStateConditions;
    
    // Removed transition loading state that was causing flickering
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center auction-dark">
        <Card className="max-w-md w-full mx-4 bg-gray-800/90 border-gray-700">
          <CardContent className="p-8 text-center">
            <Trophy className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4 text-white">
              {isAuctionCompleted ? 'Auction Completed!' : 
               isWaitingForAdmin ? user?.role === 'admin' ? 'Round Complete - Start Next Round' : 'Waiting for Next Round' :
               isAuctionNotStarted ? 'Auction Ready to Start' : 
               isAuctionNotLive ? 'No Auction Going On' : 'No Player Available'}
            </h2>
            <p className="text-gray-300 mb-6">
              {isAuctionCompleted 
                ? 'Thank you for participating! The auction has been completed successfully. Redirecting to dashboard...' 
                : isWaitingForAdmin
                ? user?.role === 'admin' 
                  ? 'The current round is complete. You can start the next round or end the auction.' 
                  : 'Waiting for admin to start the next round or end auction...'
                : isAuctionNotStarted
                ? `Ready to start auction with ${players.length} players. Admin can start the auction.`
                : isAuctionNotLive
                ? 'There is no auction currently running. Please wait for the admin to start a new auction or check back later.'
                : 'No players are currently available for auction in this round.'}
            </p>
            
            <div className="space-y-3">
              {isAuctionNotStarted && user?.role === 'admin' && (
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    handleStartAuction();
                  }} 
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Starting...' : 'Start Auction'}
                </Button>
              )}
              
              {isWaitingForAdmin && user?.role === 'admin' && (
                <>
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      handleStartNextRound();
                    }} 
                    disabled={isProcessing}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isProcessing ? 'Starting...' : 'Start Next Round'}
                  </Button>
                  <Button variant="outline" onClick={(e) => {
                    e.preventDefault();
                    handleEndAuction();
                  }} className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white">
                    End Auction
                  </Button>
                </>
              )}

              {!isAuctionCompleted && !isAuctionNotStarted && !isWaitingForAdmin && auctionStarted && user?.role === 'admin' && (
                <Button variant="outline" onClick={(e) => {
                  e.preventDefault();
                  handleEndAuction();
                }} className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white">
                  End Auction
                </Button>
              )}
              
              <Button 
                 onClick={(e) => {
                   e.preventDefault();
                   onNavigate('dashboard');
                 }}
                 className="w-full bg-gray-600 hover:bg-gray-700"
               >
                 Go to Dashboard
               </Button>
               
               {!isAuctionCompleted && user?.role !== 'admin' && (
                 <p className="text-sm text-gray-400 text-center">
                   {isAuctionNotStarted ? 'Waiting for admin to start the auction...' : 'Waiting for admin action...'}
                 </p>
               )}
               
               {isAuctionCompleted && (
                 <p className="text-sm text-green-400 text-center">
                   Thank you for participating in the auction!
                 </p>
               )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Only show loading state when actually loading, not when currentPlayer is temporarily null
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center auction-dark">
        <Card className="max-w-md w-full mx-4 bg-gray-800/90 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-4 text-white">Loading Auction</h2>
            <p className="text-gray-300">Please wait while we load the auction data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback: if currentPlayer is null but we have players, initialize with first available player
  // This prevents the "Preparing Player" loading screen when players are available
  if (!currentPlayer && players.length > 0 && currentRound) {
    // Initialize with the current player from the round, or first player if none set
    const targetPlayer = currentRound.currentPlayerId 
      ? players.find(p => p.id === currentRound.currentPlayerId) || players[0]
      : players[0];
    
    if (targetPlayer) {
      // Set the current player immediately to prevent loading screen
      setStableCurrentPlayer(targetPlayer);
      const playerIndex = players.findIndex(p => p.id === targetPlayer.id);
      setCurrentPlayerIndex(playerIndex >= 0 ? playerIndex : 0);
    }
    
    // Show a brief loading state while the state updates
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center auction-dark">
        <Card className="max-w-md w-full mx-4 bg-gray-800/90 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-4 text-white">Preparing Player</h2>
            <p className="text-gray-300">Loading player data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Legacy mock players data for reference - to be removed
  const mockPlayers = [
    {
      id: '1',
      name: 'Virat Kohli',
      role: 'Batsman',
      basePrice: 20000000,
      currentBid: 102500000,
      image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=300&h=300&fit=crop&crop=face',
      status: 'active',
      battingStats: { matches: 2000, average: 45.0, strikeRate: 130.5 },
      bowlingStats: { overs: 50, wickets: 15, economy: 7.8 }
    },
    {
      id: '2',
      name: 'Jasprit Bumrah',
      role: 'Bowler',
      basePrice: 15000000,
      currentBid: 85000000,
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
      status: 'active',
      battingStats: { matches: 1500, average: 12.5, strikeRate: 95.2 },
      bowlingStats: { overs: 800, wickets: 180, economy: 6.2 }
    },
    {
      id: '3',
      name: 'Rohit Sharma',
      role: 'Batsman',
      basePrice: 18000000,
      currentBid: 95000000,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
      status: 'active',
      battingStats: { matches: 1800, average: 42.8, strikeRate: 125.3 },
      bowlingStats: { overs: 20, wickets: 8, economy: 8.5 }
    },
    {
      id: '4',
      name: 'MS Dhoni',
      role: 'Wicket-Keeper',
      basePrice: 25000000,
      currentBid: 120000000,
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&crop=face',
      status: 'active',
      battingStats: { matches: 2200, average: 38.5, strikeRate: 135.8 },
      bowlingStats: { overs: 0, wickets: 0, economy: 0 }
    },
    {
      id: '5',
      name: 'Hardik Pandya',
      role: 'All-rounder',
      basePrice: 16000000,
      currentBid: 88000000,
      image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=300&fit=crop&crop=face',
      status: 'active',
      battingStats: { matches: 1200, average: 28.2, strikeRate: 142.5 },
      bowlingStats: { overs: 450, wickets: 95, economy: 7.2 }
    },
    {
      id: '6',
      name: 'Rashid Khan',
      role: 'Bowler',
      basePrice: 14000000,
      currentBid: 78000000,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
      status: 'active',
      battingStats: { matches: 800, average: 15.8, strikeRate: 118.2 },
      bowlingStats: { overs: 650, wickets: 145, economy: 6.5 }
    },
    {
      id: '7',
      name: 'KL Rahul',
      role: 'Wicket-Keeper',
      basePrice: 17000000,
      currentBid: 92000000,
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face',
      status: 'active',
      battingStats: { matches: 1600, average: 41.2, strikeRate: 128.9 },
      bowlingStats: { overs: 10, wickets: 2, economy: 9.1 }
    },
    {
      id: '8',
      name: 'Pat Cummins',
      role: 'Bowler',
      basePrice: 13000000,
      currentBid: 72000000,
      image: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=300&h=300&fit=crop&crop=face',
      status: 'active',
      battingStats: { matches: 900, average: 18.5, strikeRate: 105.8 },
      bowlingStats: { overs: 720, wickets: 162, economy: 6.8 }
    },
    {
      id: '9',
      name: 'Suryakumar Yadav',
      role: 'Batsman',
      basePrice: 12000000,
      currentBid: 68000000,
      image: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=300&h=300&fit=crop&crop=face',
      status: 'active',
      battingStats: { matches: 1100, average: 35.8, strikeRate: 148.2 },
      bowlingStats: { overs: 5, wickets: 1, economy: 10.2 }
    },
    {
      id: '10',
      name: 'Yuzvendra Chahal',
      role: 'Bowler',
      basePrice: 11000000,
      currentBid: 58000000,
      image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=300&h=300&fit=crop&crop=face',
      status: 'active',
      battingStats: { matches: 700, average: 8.2, strikeRate: 85.5 },
      bowlingStats: { overs: 580, wickets: 125, economy: 7.8 }
    },
    {
      id: '11',
      name: 'Shikhar Dhawan',
      role: 'Batsman',
      basePrice: 10000000,
      currentBid: 55000000,
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&crop=face',
      status: 'active',
      battingStats: { matches: 1900, average: 40.2, strikeRate: 122.8 },
      bowlingStats: { overs: 15, wickets: 3, economy: 8.8 }
    },
    {
      id: '12',
      name: 'Ishan Kishan',
      role: 'Wicket-Keeper',
      basePrice: 9000000,
      currentBid: 52000000,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop&crop=face',
      status: 'active',
      battingStats: { matches: 800, average: 32.5, strikeRate: 138.8 },
      bowlingStats: { overs: 0, wickets: 0, economy: 0 }
    }
  ];

  const handleMarkAsSold = async () => {
    console.log('🔥 CONFIRM SALE button clicked!', {
      currentPlayer: currentPlayer?.name,
      selectedTeam,
      soldPrice,
      isProcessing,
      userRole: user?.role
    });
    
    if (!currentPlayer) {
      console.log('❌ No current player found');
      return;
    }
    
    // Validate price input
    let finalPrice = currentPlayer.basePrice;
    if (soldPrice) {
      const parsedPrice = parseInt(soldPrice.replace(/[^0-9]/g, ''));
      if (isNaN(parsedPrice)) {
        toast.error('Please enter a valid price');
        return;
      }
      if (parsedPrice < currentPlayer.basePrice) {
        toast.error(`Price must be at least the base price of ${formatCurrency(currentPlayer.basePrice)}`);
        return;
      }
      finalPrice = parsedPrice;
    }
    
    const selectedTeamObj = teams.find(t => t.name === selectedTeam);
    
    if (selectedTeamObj && !isProcessing && finalPrice >= currentPlayer.basePrice) {
      setIsProcessing(true);
      
      try {
        // Check if team has enough budget
        if (selectedTeamObj.remainingBudget < finalPrice) {
          toast.error(`${selectedTeam} doesn't have enough budget`);
          setIsProcessing(false);
          return;
        }
        
        // Update player status and team budget in Firebase
        await playerService.sellPlayer(currentPlayer.id, selectedTeamObj.id, finalPrice);
        
        // Update auction round in Firebase - only decrement if player wasn't already sold
        if (currentRound && currentPlayer.status !== 'sold') {
          await auctionService.updateAuctionRound(currentRound.id, {
            playersLeft: Math.max(0, (currentRound.playersLeft || 0) - 1)
          });
        }
        
        toast.success(`${currentPlayer.name} sold to ${selectedTeam} for ${formatCurrency(finalPrice)}`);
        
        // Reset form
        setSoldPrice('');
        setSelectedTeam('');
        
        // Check if there are more eligible players remaining in this round
        // Get fresh player data to ensure we have the latest status
        const freshPlayers = currentRound ? await auctionService.getEligiblePlayersForRound(currentRound.round) : [];
        const remainingPlayers = freshPlayers.filter(p => 
          (p.status === 'active' || p.status === 'pending') && p.id !== currentPlayer.id
        );
        
        console.log('🔍 Remaining eligible players after sale:', {
          totalPlayers: freshPlayers.length,
          remainingCount: remainingPlayers.length,
          remainingPlayers: remainingPlayers.map(p => ({ name: p.name, status: p.status }))
        });
        
        // Let subscription handle player state updates to prevent race conditions
        
        if (remainingPlayers.length > 0) {
          // Get the first remaining player directly from fresh data
          const nextPlayer = remainingPlayers[0];
          
          // Use atomic update to show shimmer during transition
          if (currentRound && nextPlayer) {
            try {
              const nextPlayerIndex = freshPlayers.findIndex(p => p.id === nextPlayer.id);
              if (nextPlayerIndex !== -1) {
                // Show shimmer and update player atomically
                updatePlayerStateAtomically(nextPlayerIndex, nextPlayer);
                // Update Firebase with next player and remaining count
                await auctionService.updateAuctionRound(currentRound.id, {
                  playersLeft: remainingPlayers.length,
                  currentPlayerId: nextPlayer.id
                });
              }
            } catch (error) {
              console.error('Error updating current player:', error);
              toast.error('Failed to update current player');
            }
          }
        } else {
          // No more eligible players in this round
          // Update round status to waiting_for_admin so all users see the dialog
          if (currentRound) {
            await auctionService.updateAuctionRound(currentRound.id, {
              status: 'waiting_for_admin',
              playersLeft: 0,
              currentPlayerId: ''
            });
            // Let subscription handle the state update to ensure correct round number
            // setCurrentRound(prev => prev ? { ...prev, status: 'waiting_for_admin', playersLeft: 0, currentPlayerId: '' } : null);
          }
          toast.success('🏆 Round completed! Admin can choose to start next round or end auction.');
        }
        
        // Only update auction status if there are remaining players to avoid UI flash
        if (remainingPlayers.length > 0) {
          await checkAuctionStatus();
        }
      } catch (error) {
        console.error('Error marking player as sold:', error);
        toast.error('Failed to complete sale');
      } finally {
        setIsProcessing(false);
      }
    } else if (!selectedTeamObj) {
      toast.error('Please select a team');
    } else if (finalPrice < currentPlayer.basePrice) {
      toast.error(`Price cannot be less than base price of ${formatCurrency(currentPlayer.basePrice)}`);
    }
  };

  const handleMarkAsUnsold = async () => {
    console.log('🚫 MARK UNSOLD button clicked!', {
      currentPlayer: currentPlayer?.name,
      isProcessing,
      userRole: user?.role
    });
    
    if (!currentPlayer) {
      console.log('❌ No current player found');
      return;
    }
    
    setIsProcessing(true);
    try {
      // Update player status in Firebase
      await playerService.updatePlayer(currentPlayer.id, { status: 'unsold' });
      
      // Reset form fields
      setSelectedTeam('');
      setSoldPrice('');
      
      // Update auction round in Firebase - only decrement if player wasn't already unsold
      if (currentRound && currentPlayer.status !== 'unsold') {
        await auctionService.updateAuctionRound(currentRound.id, {
          playersLeft: Math.max(0, (currentRound.playersLeft || 0) - 1)
        });
      }
      
      toast.success(`${currentPlayer.name} marked as unsold`);
      
      // Check if there are more eligible players remaining in this round
      // Get fresh player data to ensure we have the latest status
      const freshPlayers = currentRound ? await auctionService.getEligiblePlayersForRound(currentRound.round) : [];
      const remainingPlayers = freshPlayers.filter(p => 
        (p.status === 'active' || p.status === 'pending') && p.id !== currentPlayer.id
      );
      
      console.log('🔍 Remaining eligible players after marking unsold:', {
        totalPlayers: freshPlayers.length,
        remainingCount: remainingPlayers.length,
        remainingPlayers: remainingPlayers.map(p => ({ name: p.name, status: p.status }))
      });
      
      // Let subscription handle player state updates to prevent race conditions
      
      if (remainingPlayers.length > 0) {
        // Get the first remaining player directly from fresh data
        const nextPlayer = remainingPlayers[0];
        
        // Use atomic update to show shimmer during transition
        if (currentRound && nextPlayer) {
          try {
            const nextPlayerIndex = freshPlayers.findIndex(p => p.id === nextPlayer.id);
            if (nextPlayerIndex !== -1) {
              // Show shimmer and update player atomically
              updatePlayerStateAtomically(nextPlayerIndex, nextPlayer);
              // Update Firebase with next player and remaining count
              await auctionService.updateAuctionRound(currentRound.id, {
                playersLeft: remainingPlayers.length,
                currentPlayerId: nextPlayer.id
              });
            }
          } catch (error) {
            console.error('Error updating current player:', error);
            toast.error('Failed to update current player');
          }
        }
      } else {
        // No more eligible players in this round
        // Update round status to waiting_for_admin so all users see the dialog
        if (currentRound) {
          await auctionService.updateAuctionRound(currentRound.id, {
            status: 'waiting_for_admin',
            playersLeft: 0,
            currentPlayerId: ''
          });
          // Let subscription handle the state update to ensure correct round number
          // setCurrentRound(prev => prev ? { ...prev, status: 'waiting_for_admin', playersLeft: 0, currentPlayerId: '' } : null);
        }
        toast.success('🏆 Round completed! Admin can choose to start next round or end auction.');
      }
      
      // Only update auction status if there are remaining players to avoid UI flash
      if (remainingPlayers.length > 0) {
        await checkAuctionStatus();
      }
    } catch (error) {
      console.error('Error marking player as unsold:', error);
      toast.error('Failed to mark as unsold');
    } finally {
      setIsProcessing(false);
    }  
  };

  const handleNextPlayer = async () => {
    // Check if there are more eligible players remaining in this round
    const freshPlayers = currentRound ? await auctionService.getEligiblePlayersForRound(currentRound.round) : [];
    const remainingPlayers = freshPlayers.filter(p => 
      (p.status === 'active' || p.status === 'pending') && 
      p.id !== (currentPlayer?.id || '')
    );
    
    console.log('🔍 Next player check:', {
      currentPlayerIndex,
      totalPlayers: activeRoundPlayers.length,
      remainingEligible: remainingPlayers.length,
      remainingPlayers: remainingPlayers.map(p => ({ name: p.name, status: p.status }))
    });
    
    if (remainingPlayers.length > 0) {
      // Get the first remaining player directly from fresh data
      const nextPlayer = remainingPlayers[0];
      
      // Only update Firebase - let subscription handle UI updates to prevent race conditions
      if (currentRound && nextPlayer) {
        try {
          await auctionService.updateAuctionRound(currentRound.id, {
            currentPlayerId: nextPlayer.id,
            playersLeft: remainingPlayers.length
          });
        } catch (error) {
          console.error('Error updating current player:', error);
          toast.error('Failed to update current player');
        }
      }
    } else {
      // No more eligible players - round complete
      console.log('🏁 Round complete - no more eligible players');
      if (currentRound) {
        try {
          await auctionService.updateAuctionRound(currentRound.id, {
            status: 'waiting_for_admin',
            playersLeft: 0,
            currentPlayerId: ""
          });
          
          // Update auction status to refresh UI state
          await checkAuctionStatus();
        } catch (error) {
          console.error('Error completing round:', error);
          toast.error('Failed to complete round');
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center auction-dark">
        <Card className="max-w-md w-full mx-4 bg-gray-800/90 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-4 text-white">Loading Auction</h2>
            <p className="text-gray-300">Please wait while we load the auction data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (currentRound?.status === 'waiting_for_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center auction-dark">
        <Card className="max-w-md w-full mx-4 bg-gray-800/90 border-gray-700">
          <CardContent className="p-8 text-center">
            <Trophy className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4 text-white">Round Complete!</h2>
            <p className="text-gray-300 mb-6">
              All players for this round have been processed.
            </p>
            
            <div className="space-y-3">
                {/* Show auction status information */}
                {allPlayersSold && (
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-center">
                    <p className="text-green-400 font-medium">🎉 All players have been sold!</p>
                    <p className="text-green-300 text-sm">The auction is complete.</p>
                  </div>
                )}
                
                {!allPlayersSold && !hasPlayersForNextRound && (
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-center">
                    <p className="text-yellow-400 font-medium">⚠️ No players available for next round</p>
                    <p className="text-yellow-300 text-sm">All remaining players have been processed.</p>
                  </div>
                )}
                
                {/* Show start next round option only if players are available - ADMIN ONLY */}
                {user?.role === 'admin' && hasPlayersForNextRound && !allPlayersSold && (
                  <Button onClick={(e) => {
                    e.preventDefault();
                    handleStartNextRound();
                  }} className="w-full bg-primary hover:bg-primary/90">
                    <Play className="w-4 h-4 mr-2" />
                    Start Next Round
                  </Button>
                )}
                
                {user?.role === 'admin' && (
                  <Button variant="outline" onClick={(e) => {
                    e.preventDefault();
                    handleEndAuction();
                  }} className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                    End Auction
                  </Button>
                )}
                
                {user?.role !== 'admin' && (
                  <p className="text-sm text-gray-400 text-center">
                    {allPlayersSold 
                      ? 'Auction complete - all players sold!' 
                      : hasPlayersForNextRound 
                        ? 'Waiting for admin to start next round or end auction...' 
                        : 'Waiting for admin to end auction - no more players available...' 
                    }
                  </p>
                )}
              </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle case when auction is not started (no current round)
  if (!currentRound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center auction-dark">
        <Card className="max-w-md w-full mx-4 bg-gray-800/90 border-gray-700">
          <CardContent className="p-8 text-center">
            <Play className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4 text-white">Auction Not Started</h2>
            <p className="text-gray-300 mb-6">
              No auction is currently active. Start the first round to begin the auction.
            </p>
            
            <div className="space-y-3">
              {/* Only show Start Auction button if user is admin and auction hasn't been started yet */}
              
              <Button variant="outline" onClick={(e) => {
                e.preventDefault();
                onNavigate('dashboard');
              }} className="w-full border-gray-600 text-gray-300 hover:bg-gray-700">
                Back to Dashboard
              </Button>
              
              {user?.role !== 'admin' && user?.role !== 'owner' && (
                <p className="text-sm text-gray-400 text-center">
                  Waiting for admin to start the auction...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center auction-dark">
        <Card className="max-w-md w-full mx-4 bg-gray-800/90 border-gray-700">
          <CardContent className="p-8 text-center">
            <Trophy className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4 text-white">No More Players</h2>
            <p className="text-gray-300 mb-6">
              All players in the current round have been processed.
            </p>
            
            <div className="space-y-3">
              {user?.role === 'admin' && (
                <Button variant="outline" onClick={(e) => {
                  e.preventDefault();
                  handleEndAuction();
                }} className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white">
                  End Auction
                </Button>
              )}
              
              <Button onClick={(e) => {
                e.preventDefault();
                onNavigate('dashboard');
              }} className="w-full bg-primary hover:bg-primary/90">
                Back to Dashboard
              </Button>
              
              {user?.role !== 'admin' && user?.role !== 'owner' && (
                <p className="text-sm text-gray-400 text-center">
                  Waiting for admin action...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden auction-dark flex">
      {/* Sidebar */}
      {showSidebar && !isFullscreen && (
        <div className="w-16 bg-gray-800/50 backdrop-blur-sm border-r border-gray-700 flex flex-col items-center py-4 space-y-4 z-20">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('dashboard');
            }}
            className="w-10 h-10 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <Home className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('teams');
            }}
            className="w-10 h-10 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <Users className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('players');
            }}
            className="w-10 h-10 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <FileSpreadsheet className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              toggleFullscreen();
            }}
            className="w-10 h-10 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Static Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

        {/* Cricket Auction Logo - Top Center */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex items-center gap-3 bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700/50">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1580831800257-f83135932664?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmlja2V0JTIwbG9nbyUyMHRyb3BoeXxlbnwxfHx8fDE3NTY4OTk1MzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Cricket Auction Logo"
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-primary font-bold text-lg">CRICKET AUCTION</span>
          </div>
        </div>

        {/* Team Budgets - Top Right */}
        <div className={`absolute top-4 right-4 z-10 max-w-2xl overflow-hidden ${!showSidebar ? 'mt-12' : ''}`}>
          {/* Fullscreen Toggle - Only show when sidebar is hidden */}
          {!showSidebar && (
            <div className="absolute -top-12 right-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  toggleFullscreen();
                }}
                className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </Button>
            </div>
          )}
          {/* Display 4-5 teams in single row */}
          <div className="grid grid-cols-4 lg:grid-cols-5 gap-2">
            {topTeams.map((team) => (
              <div key={team.id} className="bg-black/30 backdrop-blur-sm rounded-lg px-2 py-1 border border-gray-700/50 text-center">
                <div className="text-xs font-bold text-primary mb-1">
                  {team.abbreviation}
                </div>
                <div className="text-xs text-white">
                  ₹{team.budgetDisplay}Cr
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Round Info - Top Left */}
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 text-center border border-gray-700/50">
            <div className="text-xs text-gray-400">PLAYERS LEFT</div>
            <div className="text-xl font-bold text-primary">{currentRound?.playersLeft || 0}</div>
            
          </div>
        </div>

        {/* Main Auction Content */}
        <div className={`flex items-center justify-center px-8 pb-8 ${user?.role === 'admin' ? 'pt-40' : 'pt-16'}`}>
          <div className="max-w-6xl w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              
              {/* Player Info - Left */}
              <div className="text-center lg:text-left space-y-6 lg:pl-0">
                {isPlayerTransitioning ? (
                  <>
                    <Shimmer height="h-12" width="w-3/4" className="mx-auto lg:mx-0" />
                    <Shimmer height="h-8" width="w-24" className="mx-auto lg:mx-0" rounded="full" />
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
                      <div className="space-y-3 text-center">
                        <Shimmer height="h-6" width="w-32" className="mx-auto" />
                        <Shimmer height="h-10" width="w-40" className="mx-auto" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
                      {currentPlayer.name.toUpperCase()}
                    </h1>
                    
                    <div className="mb-6">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-lg px-4 py-2">
                        {currentPlayer.role}
                      </Badge>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-4 justify-center lg:justify-start">
                      <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700/50">
                        <div className="text-xs text-gray-400 mb-1">BATTING HAND</div>
                        <div className="text-sm font-semibold text-white">{(currentPlayer as any).battingHand || 'N/A'}</div>
                      </div>
                      <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700/50">
                        <div className="text-xs text-gray-400 mb-1">BOWLING HAND</div>
                        <div className="text-sm font-semibold text-white">{(currentPlayer as any).bowlingHand || 'N/A'}</div>
                      </div>
                    </div>


                  </>
                )}
              </div>

              {/* Player Image - Center */}
              <div className="flex justify-center">
                <div className="relative">
                  {isPlayerTransitioning ? (
                    <>
                      <div className="w-80 h-80 rounded-full border-4 border-primary overflow-hidden">
                        <ShimmerAvatar size="lg" className="w-full h-full" />
                      </div>
                      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                        <Shimmer height="h-8" width="w-32" rounded="full" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-80 h-80 rounded-full border-4 border-primary overflow-hidden">
                        <ImageWithFallback
                          src={currentPlayer.image}
                          alt={currentPlayer.name}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                        <div className="bg-primary/20 backdrop-blur-sm rounded-full px-6 py-2 border border-primary/30">
                          <span className="text-primary font-bold">ON AUCTION</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Team Selection & Actions - Right */}
              <div className="text-center lg:text-right lg:pr-0">
                {(() => {
                  console.log('🔍 Rendering buttons check:', {
                    userRole: user?.role,
                    isAdmin: user?.role === 'admin',
                    selectedTeam,
                    isProcessing,
                    confirmSaleDisabled: !selectedTeam || isProcessing,
                    markUnsoldDisabled: isProcessing,
                    teamsLength: teams.length
                  });
                  return null;
                })()}
                <div className="space-y-4">
                  {isPlayerTransitioning ? (
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
                      <Shimmer height="h-6" width="w-32" className="mb-2" />
                      <Shimmer height="h-12" width="w-full" className="mb-4" />
                      <Shimmer height="h-6" width="w-40" className="mb-2" />
                      <Shimmer height="h-12" width="w-full" />
                    </div>
                  ) : (
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
                      {(user?.role === 'admin' || user?.role === 'owner') && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-primary block text-lg font-medium">WINNING TEAM</Label>
                              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                                <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50 h-12">
                                  <SelectValue placeholder="Select team" className="text-white" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-600">
                                  {teamOptions.map((team) => (
                                    <SelectItem key={team.id} value={team.name} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                                      {team.displayText}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          
                            <div className="space-y-2 mt-4">
                              <Label className="text-primary block text-lg font-medium">
                                FINAL PRICE (Min: {formatCurrency(currentPlayer.basePrice)})
                              </Label>
                              <Input
                                type="text"
                                value={soldPrice}
                                onChange={(e) => setSoldPrice(e.target.value)}
                                placeholder={`Enter price (minimum ${currentPlayer.basePrice})`}
                                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 h-12 text-lg"
                              />
                            </div>
                          </>
                        )}
                    </div>
                  )}

                  <div className="space-y-3 relative z-10">
                    {isPlayerTransitioning ? (
                       <>
                         <ShimmerButton className="w-full h-14" />
                         <ShimmerButton className="w-full h-14" />
                       </>
                    ) : (
                      <>
                        {(user?.role === 'admin' || user?.role === 'owner') && (
                          <>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                console.log('🎯 CONFIRM SALE button clicked!', {
                                  event: e,
                                  disabled: !selectedTeam || !soldPrice || isProcessing,
                                  selectedTeam,
                                  soldPrice,
                                  isProcessing,
                                  currentPlayer: currentPlayer?.name,
                                  timestamp: new Date().toISOString()
                                });
                                if (!selectedTeam || !soldPrice || isProcessing) {
                                  console.log('❌ Button click blocked - disabled state');
                                  return;
                                }
                                console.log('✅ Calling handleMarkAsSold...');
                                handleMarkAsSold();
                              }}
                              onMouseDown={() => console.log('🖱️ CONFIRM SALE mouseDown detected')}
                              onMouseUp={() => console.log('🖱️ CONFIRM SALE mouseUp detected')}
                              onMouseEnter={() => console.log('🖱️ CONFIRM SALE mouseEnter detected')}
                              onMouseLeave={() => console.log('🖱️ CONFIRM SALE mouseLeave detected')}
                              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-500 disabled:cursor-not-allowed text-white text-lg py-6 h-14 rounded-md cursor-pointer flex items-center justify-center font-semibold relative z-20"
                              disabled={!selectedTeam}
                              style={{ pointerEvents: 'auto' }}
                            >
                              CONFIRM SALE
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                console.log('🎯 MARK UNSOLD button clicked!', {
                                  event: e,
                                  currentPlayer: currentPlayer?.name,
                                  timestamp: new Date().toISOString()
                                });
                                console.log('✅ Calling handleMarkAsUnsold...');
                                handleMarkAsUnsold();
                              }}
                              onMouseDown={() => console.log('🖱️ MARK UNSOLD mouseDown detected')}
                              onMouseUp={() => console.log('🖱️ MARK UNSOLD mouseUp detected')}
                              onMouseEnter={() => console.log('🖱️ MARK UNSOLD mouseEnter detected')}
                              onMouseLeave={() => console.log('🖱️ MARK UNSOLD mouseLeave detected')}
                              className="w-full bg-red-600/20 border border-red-500 text-red-400 hover:bg-red-600/30 active:bg-red-600/50 disabled:bg-gray-500 disabled:cursor-not-allowed text-lg py-6 h-14 rounded-md cursor-pointer flex items-center justify-center font-semibold relative z-20"
                              disabled={false}
                              style={{ pointerEvents: 'auto' }}
                            >
                              MARK UNSOLD
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player Stats Cards - Bottom */}
        <div className="absolute bottom-2 left-2.5 right-2.5 z-10">
          <div className="grid grid-cols-1 gap-3">
            {/* Stats Cards Row */}
            <div className="grid grid-cols-3 gap-3">
              {/* Batting Stats Card */}
              <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50">
                {isPlayerTransitioning ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Shimmer width="w-2" height="h-2" className="rounded-full" />
                      <Shimmer width="w-16" height="h-4" />
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <Shimmer width="w-8" height="h-5" className="mx-auto mb-1" />
                        <Shimmer width="w-12" height="h-3" className="mx-auto" />
                      </div>
                      <div>
                        <Shimmer width="w-8" height="h-5" className="mx-auto mb-1" />
                        <Shimmer width="w-8" height="h-3" className="mx-auto" />
                      </div>
                      <div>
                        <Shimmer width="w-8" height="h-5" className="mx-auto mb-1" />
                        <Shimmer width="w-12" height="h-3" className="mx-auto" />
                      </div>
                      <div>
                        <Shimmer width="w-8" height="h-5" className="mx-auto mb-1" />
                        <Shimmer width="w-16" height="h-3" className="mx-auto" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <h3 className="text-green-500 text-sm font-bold">BATTING</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <div className="text-white text-sm font-bold">{currentPlayer?.matches || 0}</div>
                        <div className="text-gray-400 text-xs">MATCHES</div>
                      </div>
                      <div>
                        <div className="text-white text-sm font-bold">{currentPlayer?.runs || 0}</div>
                        <div className="text-gray-400 text-xs">RUNS</div>
                      </div>
                      <div>
                        <div className="text-white text-sm font-bold">{currentPlayer?.battingAvg || 0}</div>
                        <div className="text-gray-400 text-xs">AVERAGE</div>
                      </div>
                      <div>
                        <div className="text-white text-sm font-bold">{currentPlayer?.strikeRate || 0}</div>
                        <div className="text-gray-400 text-xs">STRIKE RATE</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Base Price Card */}
              <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50">
                {isPlayerTransitioning ? (
                  <div className="text-center">
                    <Shimmer width="w-20" height="h-4" className="mx-auto mb-2" />
                    <Shimmer width="w-24" height="h-8" className="mx-auto" />
                  </div>
                ) : (
                  <div className="text-center">
                    <h3 className="text-gray-400 text-sm font-medium mb-2">BASE PRICE</h3>
                    <div className="text-white text-2xl font-bold">
                      {formatCurrency(currentPlayer.basePrice)}
                    </div>
                  </div>
                )}
              </div>

              {/* Bowling Stats Card */}
              <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50">
                {isPlayerTransitioning ? (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Shimmer width="w-2" height="h-2" className="rounded-full" />
                      <Shimmer width="w-16" height="h-4" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <Shimmer width="w-8" height="h-5" className="mx-auto mb-1" />
                        <Shimmer width="w-10" height="h-3" className="mx-auto" />
                      </div>
                      <div>
                        <Shimmer width="w-8" height="h-5" className="mx-auto mb-1" />
                        <Shimmer width="w-12" height="h-3" className="mx-auto" />
                      </div>
                      <div>
                        <Shimmer width="w-8" height="h-5" className="mx-auto mb-1" />
                        <Shimmer width="w-12" height="h-3" className="mx-auto" />
                      </div>
                     </div>
                   </div>
                 ) : (
                   <div className="text-center">
                     <div className="flex items-center justify-center gap-2 mb-3">
                       <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                       <h3 className="text-green-500 text-sm font-bold">BOWLING</h3>
                     </div>
                     <div className="grid grid-cols-3 gap-2 text-xs">
                       <div>
                         <div className="text-white text-sm font-bold">{currentPlayer?.overs || 0}</div>
                         <div className="text-gray-400 text-xs">OVERS</div>
                       </div>
                       <div>
                         <div className="text-white text-sm font-bold">{currentPlayer?.wickets || 0}</div>
                         <div className="text-gray-400 text-xs">WICKETS</div>
                       </div>
                       <div>
                         <div className="text-white text-sm font-bold">{currentPlayer?.economy || 0}</div>
                         <div className="text-gray-400 text-xs">ECONOMY</div>
                       </div>
                     </div>
                   </div>
                 )}
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
});

export default LiveAuctionPage;