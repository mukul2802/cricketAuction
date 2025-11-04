import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '../../src/components/ui/card';
import { Badge } from '../../src/components/ui/badge';
import { Progress } from '../../src/components/ui/progress';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { TeamBudgetCompact } from '../../src/components/ui/team-budget-compact';
import { IndianRupee, Timer, Users, Trophy } from 'lucide-react';
import { auctionService, playerService, teamService, Player, Team, AuctionRound } from '../../lib/firebaseServices';
import { toast } from 'sonner';
import { formatCurrency } from '../../src/utils';

export const OpenAuctionDisplay = React.memo(function OpenAuctionDisplay() {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentRound, setCurrentRound] = useState<AuctionRound | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(25);

  // Memoized handlers to prevent unnecessary re-renders
  const handleAuctionUpdate = useCallback((round: AuctionRound | null) => {
    console.log('OpenAuctionDisplay: Auction update received:', round);
    setCurrentRound(round);
    
    // Fetch current player if available - avoid race conditions
    if (round && round.currentPlayerId) {
      playerService.getPlayerById(round.currentPlayerId)
        .then(player => {
          setCurrentPlayer(player);
        })
        .catch(error => {
          console.error('Error fetching current player:', error);
        });
    } else {
      setCurrentPlayer(null);
    }
  }, []);

  const handleTeamsUpdate = useCallback((teamsData: Team[]) => {
    console.log('OpenAuctionDisplay: Teams update received');
    setTeams(teamsData);
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const initializeSubscriptions = async () => {
      try {
        // Subscribe to auction updates
        const unsubscribe = auctionService.subscribeToAuctionUpdates(handleAuctionUpdate);

        // Load initial teams data
        try {
          const teamsData = await teamService.getAllTeams();
          if (mounted) {
            setTeams(teamsData);
          }
        } catch (error) {
          console.error('Error loading teams:', error);
          toast.error('Failed to load teams data');
        }

        // Subscribe to team updates for real-time budget changes
        const teamUnsubscribe = teamService.subscribeToTeams(handleTeamsUpdate);

        if (mounted) {
          setLoading(false);
        }

        // Cleanup subscriptions on unmount
        return () => {
          mounted = false;
          if (unsubscribe) unsubscribe();
          if (teamUnsubscribe) teamUnsubscribe();
        };
      } catch (error) {
        console.error('Failed to initialize subscriptions:', error);
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



  // Timer countdown effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden auction-dark">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>

      {/* Cricket Auction Logo - Top Center */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex flex-col items-center gap-2 bg-black/30 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-700/50">
          <ImageWithFallback
              src="https://res.cloudinary.com/dsvzjigqx/image/upload/v1762244816/Asset_2_4x_wyrtd5.png"
              alt="Thoughtwin Premier League Auction - 2025 Logo"
              className="w-16 h-16 object-contain"
            />
          <span className="text-primary font-bold text-lg">THOUGHTWIN PREMIER LEAGUE</span>
          <span className="text-primary font-bold text-lg">AUCTION - 2025</span>
        </div>
      </div>

      {/* Team Budgets - Top Right */}
      <div className="absolute top-4 right-4 z-10 max-w-2xl overflow-hidden">
        {/* Display 4-5 teams in single row */}
        <div className="grid grid-cols-4 lg:grid-cols-5 gap-2">
          {teams.slice(0, 5).map((team) => (
            <div key={team.id} className="bg-black/30 backdrop-blur-sm rounded-lg px-2 py-1 border border-gray-700/50 text-center">
              <div className="text-xs font-bold text-primary mb-1">
                {team.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
              </div>
              <div className="text-xs text-white">
                {formatCurrency(team.remainingBudget)}
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
      <div className="flex items-center justify-center px-8 pt-24 pb-8">
        {loading ? (
          <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-4">Loading Auction</h2>
            <p className="text-gray-300">Please wait while we load the auction data...</p>
          </div>
        ) : !currentPlayer ? (
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Waiting for auction to start...</h2>
            <p className="text-gray-300 mt-2">No player currently being auctioned</p>
          </div>
        ) : (
          <div className="max-w-6xl w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              
              {/* Player Info - Left */}
              <div className="text-center lg:text-left space-y-6">
                <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
                  {currentPlayer.name.toUpperCase()}
                </h1>
                
                <div className="mb-6">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-lg px-4 py-2">
                    {currentPlayer.role}
                  </Badge>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 justify-center lg:justify-start mb-6">
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700/50">
                    <div className="text-xs text-gray-400 mb-1">BATTING HAND</div>
                    <div className="text-sm font-semibold text-white">{(currentPlayer as any).battingHand || 'N/A'}</div>
                  </div>
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700/50">
                    <div className="text-xs text-gray-400 mb-1">BOWLING HAND</div>
                    <div className="text-sm font-semibold text-white">{(currentPlayer as any).bowlingHand || 'N/A'}</div>
                  </div>
                </div>

                {/* Base Price Display */}
                <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
                  <div className="space-y-3 text-center">
                    <div>
                      <span className="text-primary text-lg">BASE PRICE:</span>
                    </div>
                    <div className="text-white text-4xl font-bold">
                      {formatCurrency(currentPlayer.basePrice)}
                    </div>
                  </div>
                </div>

                {/* Player Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 text-center">
                    <div className="text-xs text-gray-400 mb-1">Matches</div>
                    <div className="text-lg font-bold text-white">{currentPlayer.matches || 0}</div>
                  </div>
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 text-center">
                    <div className="text-xs text-gray-400 mb-1">Runs</div>
                    <div className="text-lg font-bold text-white">{currentPlayer.runs || 0}</div>
                  </div>
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 text-center">
                    <div className="text-xs text-gray-400 mb-1">Wickets</div>
                    <div className="text-lg font-bold text-white">{currentPlayer.wickets || 0}</div>
                  </div>
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 text-center">
                    <div className="text-xs text-gray-400 mb-1">Strike Rate</div>
                    <div className="text-lg font-bold text-white">{currentPlayer.strikeRate?.toFixed(1) || '0.0'}%</div>
                  </div>
                </div>
              </div>

              {/* Player Image - Center */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-80 h-80 rounded-full border-4 border-primary shadow-[0_0_50px_rgba(16,185,129,0.3)] overflow-hidden">
                    <ImageWithFallback
                      src={currentPlayer.image || 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop&crop=face'}
                      alt={currentPlayer.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary/20 backdrop-blur-sm rounded-full px-6 py-2 border border-primary/30">
                      <span className="text-primary font-bold">ON AUCTION</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Display - Right */}
              <div className="text-center lg:text-right space-y-6">
                <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
                  <div className="text-center">
                    <div className="text-primary text-lg font-medium mb-3">AUCTION STATUS</div>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 font-bold">LIVE</span>
                    </div>
                    <div className="text-gray-300 text-sm">
                      Player Status: <span className="text-white font-medium">{currentPlayer.status}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Player Info */}
                <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
                  <div className="text-center space-y-2">
                    <div className="text-primary text-sm font-medium">PLAYER DETAILS</div>
                    <div className="text-gray-300 text-sm">
                      Age: <span className="text-white">{currentPlayer.age || 'N/A'}</span>
                    </div>
                    <div className="text-gray-300 text-sm">
                      Batting Avg: <span className="text-white">{currentPlayer.battingAvg?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div className="text-gray-300 text-sm">
                      Bowling Avg: <span className="text-white">{currentPlayer.bowlingAvg?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <div className="text-gray-300 text-sm">
                      Economy: <span className="text-white">{currentPlayer.economy?.toFixed(1) || 'N/A'}</span>
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