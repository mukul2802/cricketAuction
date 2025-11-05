import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { Play, Trophy, Target, Home, Users, FileSpreadsheet, Maximize, Minimize } from 'lucide-react';
import { auctionService, playerService, teamService, Player, Team, AuctionRound } from '../../lib/firebaseServices';
import { toast } from 'sonner';
import { PageType } from './Router';
import { formatCurrency } from '../utils';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

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

  // Determine if the squads button should be shown (public auction view and active round)
  const showSquadsButton = (typeof window !== 'undefined') 
    && window.location.search.includes('display=auction') 
    && currentRound?.status === 'active';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative auction-dark flex">
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
            <div className="h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 auction-dark overflow-y-auto lg:overflow-hidden">
              {/* Cricket Auction Header - Top Center */}
              <div className="block lg:absolute lg:top-4 lg:left-1/2 lg:transform lg:-translate-x-1/2 z-20 px-4 lg:px-0">
                <div className="bg-black/30 backdrop-blur-sm rounded-lg px-6 py-3 lg:px-8 lg:py-4 border border-gray-700/50 flex flex-col items-center gap-1 lg:gap-2">
                  <ImageWithFallback src="https://res.cloudinary.com/dsvzjigqx/image/upload/v1762244816/Asset_2_4x_wyrtd5.png" alt="Thoughtwin Premier League (TPL) Logo" className="w-12 h-12 lg:w-16 lg:h-16 object-contain" />
                  <span className="text-primary font-bold text-base lg:text-lg">THOUGHTWIN PREMIER LEAGUE</span>
                  <span className="text-primary font-bold text-base lg:text-lg">AUCTION - 2025</span>
                </div>
              </div>

              {/* Desktop Teams Budget Display - Top Right */}
              <div className="hidden lg:flex lg:absolute lg:top-4 lg:right-4 z-20 items-center gap-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
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
                {showSquadsButton && (
                  <Button
                    className="whitespace-nowrap"
                    variant="secondary"
                    onClick={() => window.location.assign('/public-squads')}
                  >
                    View Team Squads
                  </Button>
                )}
              </div>

              {/* Desktop Players Left Counter - Top Left */}
              <div className="hidden lg:block lg:absolute lg:top-4 lg:left-4 z-20">
                <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1.5 text-center border border-gray-700/50">
                  <div className="text-xs text-gray-400">PLAYERS LEFT</div>
                  <div className="font-bold text-primary text-lg sm:text-xl">{currentRound?.playersLeft || 0}</div>
                </div>
              </div>

              {/* Mobile Top Bar: Players left and budgets */}
              <div className="block lg:hidden sticky top-0 z-30 px-4 py-2 bg-black/40 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-1.5 text-center border border-gray-700/50">
                    <div className="text-xs text-gray-400">PLAYERS LEFT</div>
                    <div className="font-bold text-primary text-base">{currentRound?.playersLeft || 0}</div>
                  </div>
                  <div className="flex-1 overflow-x-auto">
                    <div className="flex gap-2">
                      {teams.slice(0, 8).map((team) => (
                        <div key={team.id} className="bg-black/30 backdrop-blur-sm rounded-lg px-2 py-1 border border-gray-700/50 text-center min-w-[60px]">
                          <div className="text-[10px] font-bold text-primary mb-0.5">
                            {team.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                          </div>
                          <div className="text-[10px] text-white">
                            {formatCurrency(team.remainingBudget)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Player Display */}
              <div className="pt-2 lg:pt-20 pb-4 lg:pb-28 w-full lg:h-screen overflow-visible lg:overflow-hidden flex flex-col">
                <div className="w-full flex-1 flex flex-col items-center justify-center">
                               {/* Player Info and Image */}
                               <div className="w-full flex flex-col lg:flex-row items-start lg:items-center justify-start lg:justify-between px-4 lg:px-8">
                    {/* Player Image - Right Side (mobile first) */}
                    <div className="order-1 lg:order-2 w-full lg:w-auto flex-shrink-0 mt-2 lg:mt-0 lg:pr-16 flex justify-center">
                      <div className="relative">
                        <div className="rounded-full border-4 border-primary overflow-hidden w-56 h-56 sm:w-72 sm:h-72 lg:w-[28rem] lg:h-[28rem]">
                          <ImageWithFallback
                            src={currentPlayer.image}
                            alt={currentPlayer.name}
                            className="w-full h-full rounded-full object-cover object-top"
                          />
                        </div>
                        {/* ON AUCTION badge only on desktop to avoid overlap */}
                        <div className="hidden lg:block lg:absolute lg:-bottom-4 lg:left-1/2 lg:transform lg:-translate-x-1/2">
                          <div className="bg-primary/20 backdrop-blur-sm rounded-full px-8 py-3 border border-primary/30">
                            <span className="text-primary font-bold text-lg">ON AUCTION</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Player Name and Role - Left Side */}
                    <div className="order-2 lg:order-1 w-full lg:flex-1 text-center lg:text-left lg:pr-8 lg:pl-16">
                      <h1 className="font-bold text-white mb-4 tracking-tight leading-tight text-2xl sm:text-4xl lg:text-6xl mt-6 lg:mt-0">
                        {currentPlayer.name.toUpperCase()}
                      </h1>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-sm sm:text-base lg:text-xl px-3 sm:px-4 lg:px-6 py-2 lg:py-3 mx-auto lg:mx-0">
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

                      
                      {showSquadsButton && (
                        <div className="mt-6 lg:hidden">
                          <Button className="w-full sm:w-auto mx-auto" variant="secondary" onClick={() => window.location.assign('/public-squads')}>
                            View Team Squads
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  
                  {/* Player Stats Cards - Bottom */}
                  <div className="order-3 px-4 pb-4 mt-4 lg:mt-0 lg:absolute lg:bottom-2 lg:left-2.5 lg:right-2.5 lg:z-0">
                    {/* Mobile: Base price + accordion stats */}
                    <div className="block lg:hidden space-y-3">
                      {/* Base Price (always visible) */}
                      <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
                        <div className="text-center space-y-3">
                          <div className="text-primary text-lg font-semibold">BASE PRICE</div>
                          <div className="font-bold text-white text-2xl">
                            {formatCurrency(currentPlayer.basePrice)}
                          </div>
                        </div>
                      </div>

                      <Accordion type="single" collapsible className="bg-black/20 rounded-lg border border-gray-700/50">
                        <AccordionItem value="batting" className="px-4">
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full" />
                              <span className="text-green-400 font-semibold">Batting</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-2 gap-3 text-center">
                              <div>
                                <div className="font-bold text-white">{currentPlayer.matches || 0}</div>
                                <div className="text-xs text-gray-400">MATCHES</div>
                              </div>
                              <div>
                                <div className="font-bold text-white">{currentPlayer.runs || 0}</div>
                                <div className="text-xs text-gray-400">RUNS</div>
                              </div>
                              <div>
                                <div className="font-bold text-white">{currentPlayer.battingAvg || 0}</div>
                                <div className="text-xs text-gray-400">AVERAGE</div>
                              </div>
                              <div>
                                <div className="font-bold text-white">{currentPlayer.strikeRate || 0}</div>
                                <div className="text-xs text-gray-400">STRIKE RATE</div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="bowling" className="px-4">
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full" />
                              <span className="text-green-400 font-semibold">Bowling</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div>
                                <div className="font-bold text-white">{currentPlayer.overs || 0}</div>
                                <div className="text-xs text-gray-400">OVERS</div>
                              </div>
                              <div>
                                <div className="font-bold text-white">{currentPlayer.wickets || 0}</div>
                                <div className="text-xs text-gray-400">WICKETS</div>
                              </div>
                              <div>
                                <div className="font-bold text-white">{currentPlayer.economy || 0}</div>
                                <div className="text-xs text-gray-400">ECONOMY</div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>

                    {/* Desktop: original 3-column stats */}
                    <div className="hidden lg:grid grid-cols-3 gap-3">
                      {/* Batting Stats */}
                      <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-green-400 font-semibold text-lg">BATTING</span>
                        </div>
                        <div className="grid grid-cols-4 gap-3 text-center">
                          <div>
                            <div className="font-bold text-white text-xl">{currentPlayer.matches || 0}</div>
                            <div className="text-xs text-gray-400">MATCHES</div>
                          </div>
                          <div>
                            <div className="font-bold text-white text-xl">{currentPlayer.runs || 0}</div>
                            <div className="text-xs text-gray-400">RUNS</div>
                          </div>
                          <div>
                            <div className="font-bold text-white text-xl">{currentPlayer.battingAvg || 0}</div>
                            <div className="text-xs text-gray-400">AVERAGE</div>
                          </div>
                          <div>
                            <div className="font-bold text-white text-xl">{currentPlayer.strikeRate || 0}</div>
                            <div className="text-xs text-gray-400">STRIKE RATE</div>
                          </div>
                        </div>
                      </div>

                      {/* Base Price */}
                      <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
                        <div className="text-center space-y-4">
                          <div className="text-primary text-xl font-semibold">BASE PRICE</div>
                          <div className="font-bold text-white text-4xl">
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
                            <div className="font-bold text-white text-xl">{currentPlayer.overs || 0}</div>
                            <div className="text-xs text-gray-400">OVERS</div>
                          </div>
                          <div>
                            <div className="font-bold text-white text-xl">{currentPlayer.wickets || 0}</div>
                            <div className="text-xs text-gray-400">WICKETS</div>
                          </div>
                          <div>
                            <div className="font-bold text-white text-xl">{currentPlayer.economy || 0}</div>
                            <div className="text-xs text-gray-400">ECONOMY</div>
                          </div>
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