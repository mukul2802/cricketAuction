import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { Play, Trophy, Target, Home, Users, FileSpreadsheet, Maximize, Minimize } from 'lucide-react';
import { auctionService, playerService, teamService, Player, Team, AuctionRound } from '../../lib/firebaseServices';
import { toast } from 'sonner';
import { PageType } from './Router';
import { formatCurrency } from '../utils';

interface PublicAuctionDisplayProps {
  onNavigate?: (page: PageType) => void;
}

export const PublicAuctionDisplay = React.memo(function PublicAuctionDisplay({ onNavigate }: PublicAuctionDisplayProps) {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [currentRound, setCurrentRound] = useState<AuctionRound | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    setShowSidebar(prev => !prev);
  }, []);

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
    console.log('PublicAuctionDisplay: Teams updated:', teamsData.length);
    setTeams(teamsData);
  }, []);

  const handlePlayersUpdate = useCallback((playersData: Player[]) => {
    // Update current player if it exists in the updated players list
    if (currentPlayer) {
      const updatedCurrentPlayer = playersData.find(p => p.id === currentPlayer.id);
      if (updatedCurrentPlayer) {
        setCurrentPlayer(updatedCurrentPlayer);
      }
    }
  }, [currentPlayer]);

  useEffect(() => {
    let cleanupFunctions: (() => void)[] = [];
    
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Subscribe to auction updates
        const auctionCleanup = await auctionService.subscribeToAuctionUpdates(handleAuctionUpdate);
        if (auctionCleanup) cleanupFunctions.push(auctionCleanup);
        
        // Subscribe to teams updates
        const teamsCleanup = teamService.subscribeToTeams(handleTeamsUpdate);
        cleanupFunctions.push(teamsCleanup);
        
        // Subscribe to players updates
        const playersCleanup = playerService.subscribeToPlayers(handlePlayersUpdate);
        cleanupFunctions.push(playersCleanup);
        
        // Get initial data
        const [initialRound, initialTeams] = await Promise.all([
          auctionService.getCurrentRound(),
          teamService.getAllTeams()
        ]);
        
        setTeams(initialTeams);
        await handleAuctionUpdate(initialRound);
        
      } catch (error) {
        console.error('Failed to initialize auction data:', error);
        toast.error('Failed to load auction data');
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
    
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [handleAuctionUpdate, handleTeamsUpdate]);



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden auction-dark flex">
      {/* Sidebar */}
      {showSidebar && !isFullscreen && onNavigate && (
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
        <div className="flex items-center justify-center min-h-screen w-full">
          {loading ? (
            <div className="text-center text-white">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold mb-4">Loading Auction</h2>
              <p className="text-gray-300">Please wait while we load the auction data...</p>
            </div>
          ) : !currentRound ? (
            <div className="h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 auction-dark flex items-center justify-center">
              <div className="text-center text-white max-w-2xl w-full px-8">
                <Play className="w-24 h-24 text-primary mx-auto mb-8" />
                <h2 className="text-4xl font-bold mb-6 text-white">Auction Not Started</h2>
                <p className="text-xl text-gray-300 mb-8">
                  No auction is currently active. Waiting for admin to start the first round.
                </p>
                <p className="text-lg text-gray-400">
                  Waiting for admin to start the auction...
                </p>
              </div>
            </div>
          ) : !currentPlayer ? (
            <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 auction-dark flex items-center justify-center">
              <div className="text-center text-white max-w-2xl w-full px-8">
                <Trophy className="w-24 h-24 text-primary mx-auto mb-8" />
                <h2 className="text-4xl font-bold mb-6 text-white">No More Players</h2>
                <p className="text-xl text-gray-300 mb-8">
                  Waiting for admin to start the next round or end auction...
                </p>
                <p className="text-lg text-gray-400">
                  Waiting for admin action...
                </p>
              </div>
            </div>
          ) : (
            <div className="h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 auction-dark overflow-hidden">
              {/* Cricket Auction Header - Top Center */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
                <div className="bg-black/30 backdrop-blur-sm rounded-lg px-8 py-4 border border-gray-700/50 flex flex-col items-center gap-2">
                  <ImageWithFallback src="https://res.cloudinary.com/dsvzjigqx/image/upload/v1762244816/Asset_2_4x_wyrtd5.png" alt="Thoughtwin Premier League (TPL) Logo" className="w-16 h-16 object-contain" />
                  <span className="text-primary font-bold text-lg">THOUGHTWIN PREMIER LEAGUE</span>
                  <span className="text-primary font-bold text-lg">AUCTION - 2025</span>
                </div>
              </div>

              {/* Teams Budget Display - Top Right */}
              <div className="absolute top-4 right-4 z-20">
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

              {/* Players Left Counter - Top Left */}
              <div className="absolute top-4 left-4 z-20">
                <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 text-center border border-gray-700/50">
                  <div className="text-xs text-gray-400">PLAYERS LEFT</div>
                  <div className="text-xl font-bold text-primary">{currentRound?.playersLeft || 0}</div>
                </div>
              </div>

              {/* Main Player Display */}
              <div className="pt-20 pb-28 h-screen w-full overflow-hidden flex flex-col">
                <div className="w-full flex-1 flex items-center">
                  {/* Player Info and Image */}
                  <div className="w-full flex items-center justify-between px-8">
                    {/* Player Name and Role - Left Side */}
                    <div className="flex-1 text-left pr-8 pl-16">
                      <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4 tracking-tight leading-tight">
                        {currentPlayer.name.toUpperCase()}
                      </h1>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xl px-6 py-3">
                        {currentPlayer.role}
                      </Badge>

                      <div className="flex flex-col lg:flex-row gap-4 mt-6">
                        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700/50">
                          <div className="text-xs text-gray-400 mb-1">BATTING HAND</div>
                          <div className="text-lg font-semibold text-white">{(currentPlayer as any).battingHand || 'N/A'}</div>
                        </div>
                        <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700/50">
                          <div className="text-xs text-gray-400 mb-1">BOWLING HAND</div>
                          <div className="text-lg font-semibold text-white">{(currentPlayer as any).bowlingHand || 'N/A'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Player Image - Right Side */}
                    <div className="flex-shrink-0 pr-16">
                      <div className="relative">
                        <div className="w-[28rem] h-[28rem] rounded-full border-4 border-primary overflow-hidden">
                          <ImageWithFallback
                            src={currentPlayer.image}
                            alt={currentPlayer.name}
                            className="w-full h-full rounded-full object-cover object-top"
                          />
                        </div>
                        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                          <div className="bg-primary/20 backdrop-blur-sm rounded-full px-8 py-3 border border-primary/30">
                            <span className="text-primary font-bold text-lg">ON AUCTION</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player Stats Cards - Bottom */}
                <div className="absolute bottom-2 left-2.5 right-2.5 z-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {/* Batting Stats */}
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-green-400 font-semibold text-lg">BATTING</span>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                          <div className="text-xl font-bold text-white">{currentPlayer.matches || 0}</div>
                          <div className="text-xs text-gray-400">MATCHES</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-white">{currentPlayer.runs || 0}</div>
                          <div className="text-xs text-gray-400">RUNS</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-white">{currentPlayer.battingAvg || 0}</div>
                          <div className="text-xs text-gray-400">AVERAGE</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-white">{currentPlayer.strikeRate || 0}</div>
                          <div className="text-xs text-gray-400">STRIKE RATE</div>
                        </div>
                      </div>
                    </div>

                    {/* Base Price */}
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
                      <div className="text-center space-y-4">
                        <div className="text-primary text-xl font-semibold">BASE PRICE</div>
                        <div className="text-white text-4xl font-bold">
                          {formatCurrency(currentPlayer.basePrice)}
                        </div>
                      </div>
                    </div>

                    {/* Bowling Stats */}
                    <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-green-400 font-semibold text-lg">BOWLING</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-xl font-bold text-white">{currentPlayer.overs || 0}</div>
                          <div className="text-xs text-gray-400">OVERS</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-white">{currentPlayer.wickets || 0}</div>
                          <div className="text-xs text-gray-400">WICKETS</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-white">{currentPlayer.economy || 0}</div>
                          <div className="text-xs text-gray-400">ECONOMY</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});