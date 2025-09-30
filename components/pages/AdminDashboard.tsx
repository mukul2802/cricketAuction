import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageType } from '@/components/Router';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { auctionService, teamService, playerService, Team } from '../../lib/firebaseServices';
import { toast } from 'sonner';
import {
  Users,
  Trophy,
  IndianRupee,
  Gavel,
  TrendingUp,
  Clock,
  Star,
  Upload,
  BarChart3,
  Play,
  Activity
} from 'lucide-react';
import { formatCurrency } from '../../src/utils';

interface AdminDashboardProps {
  onNavigate: (page: PageType) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [currentRound, setCurrentRound] = useState<any | null>(null);
  const [showStartAuction, setShowStartAuction] = useState(false);
  const [showEndAuction, setShowEndAuction] = useState(false);
  const [showEndRound, setShowEndRound] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRound, setLoadingRound] = useState(false);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalTeams: 0,
    totalUsers: 0,
    totalPurse: 0,
    usedPurse: 0
  });

  // Memoized handlers to prevent unnecessary re-renders
  const handleAuctionUpdate = useCallback((round: any) => {
    console.log('🎯 AdminDashboard: Auction update received:', round);
    console.log('🎯 AdminDashboard: Setting currentRound to:', round);
    setCurrentRound(round as any);
  }, []);

  const handleTeamsUpdate = useCallback((teamsData: Team[]) => {
    console.log('AdminDashboard: Teams update received');
    setTeams(teamsData);
    
    // Update stats when teams change
    const totalPurse = teamsData.reduce((sum: number, team) => sum + team.budget, 0);
    const usedPurse = teamsData.reduce((sum: number, team) => sum + (team.budget - team.remainingBudget), 0);
    
    setStats(prev => ({
      ...prev,
      totalPurse,
      usedPurse
    }));
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const initializeSubscriptions = async () => {
      try {
        // Subscribe to auction updates with enhanced logging
        const unsub = auctionService.subscribeToAuctionUpdates(handleAuctionUpdate);
        
        // Subscribe to team updates for real-time budget tracking
        const teamUnsub = teamService.subscribeToTeams(handleTeamsUpdate);
        
        return () => {
          mounted = false;
          unsub();
          teamUnsub();
        };
      } catch (error) {
        console.error('Failed to subscribe to updates:', error);
        toast.error('Failed to get real-time updates');
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [teamsData, playersData] = await Promise.all([
          teamService.getAllTeams(),
          playerService.getAllPlayers()
        ]);
        
        setTeams(teamsData);
        // Mock recent transactions for now
        setRecentTransactions([]);
        
        const totalPurse = teamsData.reduce((sum: number, team) => sum + team.budget, 0);
        const usedPurse = teamsData.reduce((sum: number, team) => sum + (team.budget - team.remainingBudget), 0);
        
        setStats({
          totalPlayers: playersData.length,
          totalTeams: teamsData.length,
          totalUsers: 0, // Will be loaded separately if needed
          totalPurse,
          usedPurse
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const refreshRound = async () => {
    setLoadingRound(true);
    try {
      const round = await auctionService.getCurrentRound();
      setCurrentRound(round);
    } catch (error) {
      console.error('Failed to refresh auction round:', error);
      toast.error('Failed to refresh auction round');
    } finally {
      setLoadingRound(false);
    }
  };

  const startAuction = async () => {
    console.log('🚀 Start Auction function called from AdminDashboard', {
      timestamp: new Date().toISOString()
    });
    
    setLoadingRound(true);
    try {
      // Reset all unsold players to active status before starting auction
      const players = await playerService.getAllPlayers();
      const unsoldPlayers = players.filter(p => p.status === 'unsold');
      
      console.log('🔄 Resetting unsold players to active before auction start', {
        totalPlayers: players.length,
        unsoldPlayersCount: unsoldPlayers.length,
        unsoldPlayerNames: unsoldPlayers.map(p => p.name)
      });
      
      // Reset unsold players to active status
      for (const player of unsoldPlayers) {
        await playerService.updatePlayer(player.id, { status: 'active' });
      }
      
      // Get all eligible players (active, pending, and now reset unsold players)
      const updatedPlayers = await playerService.getAllPlayers();
      const eligiblePlayers = updatedPlayers.filter(p => p.status === 'active' || p.status === 'pending');
      
      console.log('📊 Eligible players for auction', {
        eligiblePlayersCount: eligiblePlayers.length,
        eligiblePlayerNames: eligiblePlayers.map(p => p.name)
      });
      
      if (eligiblePlayers.length === 0) {
        console.log('❌ No eligible players found for auction');
        toast.error('No eligible players found. Please add players before starting the auction.');
        return;
      }
      
      console.log(`✅ Reset ${unsoldPlayers.length} unsold players to active status for auction start`);
      
      // Create auction round with proper player counts
      await auctionService.createAuctionRound({
        round: 1,
        status: 'active',
        playersLeft: eligiblePlayers.length,
        totalPlayers: eligiblePlayers.length,
        currentPlayerId: eligiblePlayers[0]?.id || null
      } as any);
      
      setShowStartAuction(false);
      toast.success(`Auction started successfully with ${eligiblePlayers.length} players`);
      console.log('🎉 Auction started successfully from AdminDashboard');
      await refreshRound();
      
      // Navigate to live auction page after starting auction
      setTimeout(() => {
        onNavigate('auction');
      }, 1000);
    } catch (e) {
      console.error('Failed to start auction:', e);
      toast.error('Failed to start auction');
    } finally {
      setLoadingRound(false);
    }
  };

  const endRound = async () => {
    try {
      if (!currentRound) return;
      await auctionService.updateAuctionRound(currentRound.id, { status: 'completed' } as any);
      setShowEndRound(false);
      toast.success('Round ended');
      await refreshRound();
    } catch (e) {
      toast.error('Failed to end round');
    }
  };

  const endAuction = async () => {
    try {
      if (currentRound) {
        await auctionService.endAuction();
        setShowEndAuction(false);
        toast.success('Auction ended successfully');
        await refreshRound();
        // Redirect to dashboard after ending auction
        setTimeout(() => {
          onNavigate('dashboard');
        }, 1000);
      } else {
        toast.error('No active auction round found');
      }
    } catch (e) {
      console.error('Failed to end auction:', e);
      toast.error('Failed to end auction');
    }
  };


  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const quickActions = [
    {
      title: 'Start Live Auction',
      description: 'Begin the auction process',
      icon: Play,
      action: () => onNavigate('auction'),
      color: 'bg-green-500/10 text-green-400 border-green-500/20'
    },
    {
      title: 'Public Auction Display',
      description: 'Open auction display for audience',
      icon: Activity,
      action: () => window.open('?display=auction', '_blank'),
      color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
    },
    {
      title: 'Import Players',
      description: 'Upload player data from CSV/XLSX',
      icon: Upload,
      action: () => onNavigate('import'),
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    }
  ];

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <MainLayout currentPage="dashboard" onNavigate={onNavigate}>
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-gray-100 animate-pulse">
                <CardContent className="p-6 h-32"></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Show header with action buttons
  const headerSection = (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="flex space-x-2">
        {!currentRound && (
          <Button 
            onClick={(e) => {
              e.preventDefault();
              setShowStartAuction(true);
            }} 
            className="bg-primary hover:bg-primary/90"
            disabled={loadingRound}
          >
            {loadingRound ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Loading...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Auction
              </>
            )}
          </Button>
        )}
        {currentRound && (
          <Button 
            onClick={(e) => {
              e.preventDefault();
              onNavigate('auction');
            }} 
            className="bg-primary hover:bg-primary/90"
            disabled={loadingRound}
          >
            {loadingRound ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Loading...
              </>
            ) : (
              <>
                <Gavel className="w-4 h-4 mr-2" />
                Go to Live Auction
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
  


  return (
    <MainLayout currentPage="dashboard" onNavigate={onNavigate}>
      <div className="p-6 space-y-6">
        {headerSection}
        {/* Auction Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Auction Controls</CardTitle>
            <CardDescription>Start or end the live auction and manage rounds</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {!currentRound || currentRound.status === 'completed' ? (
              <>
                <Button onClick={(e) => {
                  e.preventDefault();
                  setShowStartAuction(true);
                }}>Start Auction</Button>
              </>
            ) : currentRound.status === 'active' || currentRound.status === 'waiting_for_admin' ? (
              <>
                <Button className="bg-red-600 hover:bg-red-700" onClick={(e) => {
                  e.preventDefault();
                  setShowEndAuction(true);
                }}>End Auction</Button>
              </>
            ) : (
              <>
                <Button onClick={(e) => {
                  e.preventDefault();
                  setShowStartAuction(true);
                }}>Start Auction</Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Confirm Start Auction */}
        <Dialog open={showStartAuction} onOpenChange={setShowStartAuction}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start Live Auction?</DialogTitle>
              <DialogDescription>This will make the auction live for all users.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={(e) => {
                  e.preventDefault();
                  setShowStartAuction(false);
                }}>Cancel</Button>
                <Button onClick={(e) => {
                  e.preventDefault();
                  startAuction();
                }}>Start Auction</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirm End Round */}
        <Dialog open={showEndRound} onOpenChange={setShowEndRound}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>End Current Round?</DialogTitle>
              <DialogDescription>This will complete the current round.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={(e) => {
                  e.preventDefault();
                  setShowEndRound(false);
                }}>Cancel</Button>
                <Button onClick={(e) => {
                  e.preventDefault();
                  endRound();
                }}>End Round</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirm End Auction */}
        <Dialog open={showEndAuction} onOpenChange={setShowEndAuction}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>End Auction?</DialogTitle>
              <DialogDescription>This will end the auction for everyone.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={(e) => {
                  e.preventDefault();
                  setShowEndAuction(false);
                }}>Cancel</Button>
                <Button className="bg-red-600 hover:bg-red-700" onClick={(e) => {
                  e.preventDefault();
                  endAuction();
                }}>End Auction</Button>
            </div>
          </DialogContent>
        </Dialog>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlayers}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last auction
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teams</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTeams}</div>
              <p className="text-xs text-muted-foreground">
                All teams active
              </p>
            </CardContent>
          </Card>

          
        </div>

        {/* All Teams Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              All Teams Overview
            </CardTitle>
            <CardDescription>View all teams' budget and player status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No teams found. Create teams to see them here.
                </div>
              ) : (
                teams.map((team) => (
                <Card key={team.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{team.name}</h4>
                      <Badge className="bg-primary/10 text-primary">
                        {team.players ? team.players.length : 0} players
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Budget Used:</span>
                        <span className="font-medium">
                          {formatCurrency(team.budget - team.remainingBudget)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Remaining:</span>
                        <span className="font-medium text-primary">
                          {formatCurrency(team.remainingBudget)}
                        </span>
                      </div>
                      <Progress 
                        value={((team.budget - team.remainingBudget) / team.budget) * 100} 
                        className="h-2"
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {team.players?.length || 0} players
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Commonly used administrative actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => (
                <Button
                  key={action.title}
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto p-3"
                  onClick={action.action}
                >
                  <div className={`p-2 rounded-lg border ${action.color}`}>
                    <action.icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
              <CardDescription>Latest player acquisitions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent transactions. Start an auction to see activity here.
                  </div>
                ) : (
                  recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                          transaction.type === 'sold' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="font-medium">{transaction.playerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.type === 'sold' ? transaction.teamName : 'Unsold'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          transaction.type === 'sold' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {transaction.type === 'sold' 
                            ? formatCurrency(transaction.amount) 
                            : 'Unsold'
                          }
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(transaction.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}