import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { TeamBudgetCompact } from '../ui/team-budget-compact';
import { IndianRupee } from 'lucide-react';
import { auctionService, playerService, teamService, Player, Team, AuctionRound } from '../../lib/firebaseServices';
import { toast } from 'sonner';

export const PublicAuctionDisplay = React.memo(function PublicAuctionDisplay() {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentRound, setCurrentRound] = useState<AuctionRound | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoized handlers to prevent unnecessary re-renders
  const handleAuctionUpdate = useCallback(async (round: AuctionRound | null) => {
    console.log('PublicAuctionDisplay: Auction update received:', round);
    setCurrentRound(round);
    
    // Load current player if round is active and has a current player
     if (round?.status === 'active' && round.currentPlayerId) {
       try {
         const player = await playerService.getPlayerById(round.currentPlayerId);
         if (player) {
           console.log('PublicAuctionDisplay: Current player updated:', player.name);
           setCurrentPlayer(player);
         } else {
           console.log('PublicAuctionDisplay: Player not found for ID:', round.currentPlayerId);
           setCurrentPlayer(null);
         }
       } catch (err) {
         console.error('Failed to load current player:', err);
         setCurrentPlayer(null);
       }
     } else {
       console.log('PublicAuctionDisplay: No active round or current player, clearing current player');
       setCurrentPlayer(null);
     }
  }, []);

  const handleTeamsUpdate = useCallback((teamsData: Team[]) => {
    console.log('PublicAuctionDisplay: Teams update received');
    setTeams(teamsData);
  }, []);

  const handlePlayersUpdate = useCallback((playersData: Player[]) => {
    console.log('PublicAuctionDisplay: Players update received');
    // If we have a current player, update it with the latest data
    if (currentPlayer) {
      const updatedCurrentPlayer = playersData.find(p => p.id === currentPlayer.id);
      if (updatedCurrentPlayer) {
        console.log('PublicAuctionDisplay: Current player data updated:', updatedCurrentPlayer.name, updatedCurrentPlayer.status);
        setCurrentPlayer(updatedCurrentPlayer);
      }
    }
  }, [currentPlayer]);

  useEffect(() => {
    let mounted = true;
    
    const initializeSubscriptions = async () => {
      try {
        // Subscribe to auction updates
        const unsub = auctionService.subscribeToAuctionUpdates(handleAuctionUpdate);
        
        // Subscribe to player updates for real-time player status changes
        const playerUnsub = playerService.subscribeToPlayers(handlePlayersUpdate);
        
        // Subscribe to team updates for real-time budget display
        // Handle permission errors gracefully for public display
        let teamUnsub: (() => void) | null = null;
        try {
          teamUnsub = teamService.subscribeToTeams(handleTeamsUpdate);
        } catch (teamError) {
          console.log('PublicAuctionDisplay: Teams subscription not available (permission denied), continuing without team data');
          if (mounted) {
            setTeams([]);
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
        
        return () => {
          mounted = false;
          unsub();
          playerUnsub();
          if (teamUnsub) {
            teamUnsub();
          }
        };
      } catch (error) {
        console.error('Failed to subscribe to updates:', error);
        toast.error('Failed to get real-time updates');
        if (mounted) {
          setLoading(false);
        }
        return () => {
          mounted = false;
        };
      }
    };

    const cleanup = initializeSubscriptions();
    
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [handleAuctionUpdate, handleTeamsUpdate]);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="dark min-h-screen relative bg-gradient-to-br from-background via-slate-900 to-emerald-900/20">
      {/* Remaining Players Counter - Top Left */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="bg-background/80 backdrop-blur-sm border-2 border-primary/20">
          <CardContent className="p-2">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{currentRound?.playersLeft || 0}</div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Budgets - Top Right - Compact */}
      <div className="absolute top-4 right-4 z-10">
        <TeamBudgetCompact teams={teams} />
      </div>

      {/* Header */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 text-center">
        <h1 className="text-2xl font-bold text-primary">Cricket Player Auction</h1>
        <p className="text-sm text-muted-foreground">Live Public Display</p>
      </div>

      {/* Main Player Display - Full Screen */}
      <div className="flex items-center justify-center min-h-screen">
        {loading ? (
          <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-4">Loading Auction</h2>
            <p className="text-gray-300">Please wait while we load the auction data...</p>
          </div>
        ) : !currentPlayer ? (
          <div className="text-center text-white">
            <h2 className="text-2xl">Waiting for auction to start...</h2>
            <p className="text-muted-foreground mt-2">No player currently being auctioned</p>
          </div>
        ) : (
          <div className="relative w-full h-screen">
            {/* Full Screen Player Image */}
            <ImageWithFallback
              src={currentPlayer.image || '/placeholder-player.png'}
              alt={currentPlayer.name}
              className="w-full h-full object-cover"
            />
            
            {/* Player Info Overlay - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
              <div className="text-center text-white">
                <h1 className="text-5xl font-bold mb-4">{currentPlayer.name}</h1>
                <div className="flex items-center justify-center gap-4 mb-6">
                  <Badge variant="outline" className="text-lg px-4 py-2 bg-orange-500/20 text-orange-300 border-orange-500/40">
                    {currentPlayer.role || 'Player'}
                  </Badge>
                </div>
                
                {/* Base Price */}
                <div className="text-center mb-4">
                  <div className="text-sm text-gray-300 mb-2">Base Price</div>
                  <div className="text-3xl font-bold text-green-400 flex items-center justify-center gap-2">
                    <IndianRupee className="w-8 h-8" />
                    {formatCurrency(currentPlayer.basePrice || 0)}
                  </div>
                </div>

                {/* Compact Stats */}
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="bg-black/40 rounded-lg p-3">
                    <div className="text-xs text-gray-300 mb-1">Batting</div>
                    <div className="text-sm">
                      {currentPlayer.runs || 0} runs • Avg {currentPlayer.battingAvg || 0}
                    </div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3">
                    <div className="text-xs text-gray-300 mb-1">Bowling</div>
                    <div className="text-sm">
                      {currentPlayer.wickets || 0} wickets • Economy {currentPlayer.economy || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});