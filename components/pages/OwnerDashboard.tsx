import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { PageType } from '../../src/components/Router';
import { useAuth } from '../../contexts/AuthContext';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { playerService, Player, targetPlayerService, TargetPlayer, auctionService, AuctionRound } from '../../lib/firebaseServices';
import { toast } from 'sonner';
import {
  Trophy,
  Users,
  DollarSign,
  TrendingUp,
  Award,
  Star,
  Eye,
  Activity,
  Target,
  Zap
} from 'lucide-react';

interface OwnerDashboardProps {
  onNavigate: (page: PageType) => void;
}

export const OwnerDashboard = React.memo(function OwnerDashboard({ onNavigate }: OwnerDashboardProps) {
  const { user, teams } = useAuth();
  const [myPlayers, setMyPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRound, setCurrentRound] = useState<AuctionRound | null>(null);
  
  // Find the team owned by the current user (memoized to prevent re-renders)
  const myTeam = useMemo(() => teams.find(team => team.ownerId === user?.id), [teams, user?.id]);

  // Load team players with real-time updates
  useEffect(() => {
    if (!myTeam) {
      setLoading(false);
      return;
    }

    // Subscribe to real-time player updates
    const unsubscribe = playerService.subscribeToPlayers((allPlayers) => {
      const teamPlayers = allPlayers.filter(player => player.teamId === myTeam.id && player.status === 'sold');
      setMyPlayers(teamPlayers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [myTeam]);

  // Memoized auction update handler to prevent unnecessary re-renders
  const handleAuctionUpdate = useCallback((round: AuctionRound | null) => {
    setCurrentRound(prevRound => {
      const wasNoAuction = !prevRound;
      const isNewAuction = round && round.status === 'active';
      
      // If auction just started (was no auction before, now there is an active one), show notification
      if (wasNoAuction && isNewAuction) {
        toast.success('Auction has started!');
      }
      
      return round;
    });
  }, []);

  // Subscribe to auction updates for auto-reload when auction starts
  useEffect(() => {
    const unsubscribe = auctionService.subscribeToAuctionUpdates(handleAuctionUpdate);
    return () => unsubscribe();
  }, [handleAuctionUpdate]);
  
  // Memoize team stats to prevent recalculation on every render
  const teamStats = useMemo(() => ({
    totalSpent: myPlayers.reduce((sum, player) => sum + (player.finalPrice || 0), 0),
    totalRuns: myPlayers.reduce((sum, player) => sum + (player.runs || 0), 0),
    totalWickets: myPlayers.reduce((sum, player) => sum + (player.wickets || 0), 0)
  }), [myPlayers]);

  const [targetPlayers, setTargetPlayers] = useState<TargetPlayer[]>([]);
  const [targetPlayersData, setTargetPlayersData] = useState<(TargetPlayer & { player: Player })[]>([]);
  
  // Load target players for the team
  useEffect(() => {
    if (!myTeam?.id) return;
    
    const unsubscribe = targetPlayerService.subscribeToTargetPlayers(myTeam.id, async (targets) => {
      setTargetPlayers(targets);
      
      // Load player details for each target
      try {
        const playersData = await Promise.all(
          targets.map(async (target) => {
            const player = await playerService.getPlayerById(target.playerId);
            return player ? { ...target, player } : null;
          })
        );
        
        // Filter out null values and show all target players regardless of status
        const validTargets = playersData
          .filter((item): item is TargetPlayer & { player: Player } => 
            item !== null
          )
          .sort((a, b) => {
            // Sort by priority: high -> medium -> low
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          });
        
        setTargetPlayersData(validTargets);
      } catch (error) {
        console.error('Error loading target players data:', error);
      }
    });
    
    return () => unsubscribe();
  }, [myTeam?.id]);

  // Memoize getRoleColor function to prevent recreation on every render
  const getRoleColor = useCallback((role: string) => {
    switch (role.toLowerCase()) {
      case 'batsman': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'bowler': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'wicket-keeper': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'all-rounder': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  }, []);

  // Memoize getPriorityColor function to prevent recreation on every render
  const getPriorityColor = useCallback((priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  }, []);

  return (
    <MainLayout currentPage="dashboard" onNavigate={onNavigate}>
      <div className="p-6 space-y-6">
        {/* Team Overview */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              {myTeam?.name || 'No Team Assigned'}
            </h1>
            <p className="text-muted-foreground">Your team dashboard and insights</p>
          </div>
          <Button onClick={(e) => {
            e.preventDefault();
            onNavigate('auction');
          }}>
            Join Live Auction
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Squad Size</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myPlayers.length}</div>
              <p className="text-xs text-muted-foreground">
                {25 - myPlayers.length} slots remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Purse Remaining</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{((myTeam?.remainingBudget || 0) / 10000000).toFixed(1)}Cr
              </div>
              <p className="text-xs text-muted-foreground">
                {((((myTeam?.remainingBudget || 0) / (myTeam?.budget || 1)) * 100)).toFixed(0)}% remaining
              </p>
            </CardContent>
          </Card>



          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{(teamStats.totalSpent / 10000000).toFixed(1)}Cr
              </div>
              <p className="text-xs text-muted-foreground">
                Invested in squad
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Squad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                My Squad
              </CardTitle>
              <CardDescription>Your current players</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading your squad...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myPlayers.map((player) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ImageWithFallback
                          src={player.image || 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=100&h=100&fit=crop&crop=face'}
                          alt={player.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getRoleColor(player.role)}>
                              {player.role}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-sm">{(((player.battingAvg || 0) + (player.bowlingAvg || 0)) / 20 || 7.5).toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-primary">
                          ₹{((player.finalPrice || player.basePrice) / 10000000).toFixed(1)}Cr
                        </p>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {myPlayers.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No players in your squad yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Join the auction to build your team</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Target Players */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Target Players
              </CardTitle>
              <CardDescription>Players you might want to bid on</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {targetPlayersData.map((target) => (
                  <div key={target.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Star className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{target.player.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Badge variant="outline" className={getRoleColor(target.player.role)}>
                            {target.player.role}
                          </Badge>
                          <span>₹{(target.player.basePrice / 100000).toFixed(1)}L</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {(((target.player.battingAvg || 0) + (target.player.bowlingAvg || 0)) / 20 || 7.5).toFixed(1)}/10
                      </div>
                      <Badge variant="outline" className={getPriorityColor(target.priority)}>
                        {target.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
                {targetPlayersData.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No target players set</p>
                    <p className="text-xs mt-1">Add players to your target list from the Players page</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Budget Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Purse</span>
                <span className="font-bold">₹{((myTeam?.budget || 120000000) / 10000000).toFixed(1)}Cr</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Amount Spent</span>
                <span className="font-bold text-destructive">₹{(teamStats.totalSpent / 10000000).toFixed(1)}Cr</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Remaining Budget</span>
                <span className="font-bold text-primary">₹{((myTeam?.remainingBudget || 0) / 10000000).toFixed(1)}Cr</span>
              </div>
              <Progress 
                value={((teamStats.totalSpent / (myTeam?.budget || 120000000)) * 100)} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{((teamStats.totalSpent / (myTeam?.budget || 120000000)) * 100).toFixed(1)}% utilized</span>
                <span>Can buy {Math.floor((myTeam?.remainingBudget || 0) / 2000000)} players at base price</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
});