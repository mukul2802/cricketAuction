import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTeams, usePlayers, useUsers } from '@/hooks';
import { teamApi, playerApi, userApi } from '@/api';
import { PageType } from '@/components/Router';
import { Team, Player, User } from '@/types';
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

interface AdminDashboardProps {
  onNavigate: (page: PageType) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { teams, loading: teamsLoading } = useTeams();
  const { players, loading: playersLoading } = usePlayers();
  const { users, loading: usersLoading } = useUsers();
  
  const [currentRound, setCurrentRound] = useState<any | null>(null);
  const [showStartAuction, setShowStartAuction] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalTeams: 0,
    totalUsers: 0,
    totalPurse: 0,
    usedPurse: 0
  });

  useEffect(() => {
    if (!teamsLoading && !playersLoading && !usersLoading) {
      const totalPurse = teams.reduce((sum, team) => sum + (team.budget || 0), 0);
      const usedPurse = teams.reduce((sum, team) => sum + ((team.budget || 0) - (team.remainingBudget || 0)), 0);
      
      setStats({
        totalPlayers: players.length,
        totalTeams: teams.length,
        totalUsers: users.length,
        totalPurse,
        usedPurse
      });
      setLoading(false);
    }
  }, [teams, players, users, teamsLoading, playersLoading, usersLoading]);

  const handleStartAuction = async () => {
    try {
      // Implementation for starting auction
      console.log('Starting auction...');
      setShowStartAuction(false);
    } catch (error) {
      console.error('Error starting auction:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout currentPage="dashboard" onNavigate={onNavigate}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your cricket auction system</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onNavigate('users')} variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Users
            </Button>
            <Button onClick={() => onNavigate('teams')} variant="outline">
              <Trophy className="w-4 h-4 mr-2" />
              Teams
            </Button>
            <Button onClick={() => onNavigate('players')} variant="outline">
              <Star className="w-4 h-4 mr-2" />
              Players
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlayers}</div>
              <p className="text-xs text-muted-foreground">Registered players</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTeams}</div>
              <p className="text-xs text-muted-foreground">Active teams</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">System users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalPurse > 0 ? Math.round((stats.usedPurse / stats.totalPurse) * 100) : 0}%
              </div>
              <Progress 
                value={stats.totalPurse > 0 ? (stats.usedPurse / stats.totalPurse) * 100 : 0} 
                className="mt-2" 
              />
            </CardContent>
          </Card>
        </div>

        {/* Auction Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="w-5 h-5" />
              Auction Control
            </CardTitle>
            <CardDescription>
              Manage auction rounds and player bidding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!currentRound ? (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">No Active Auction</h3>
                  <p className="text-sm text-muted-foreground">Start a new auction round</p>
                </div>
                <Dialog open={showStartAuction} onOpenChange={setShowStartAuction}>
                  <DialogTrigger asChild>
                    <Button>
                      <Play className="w-4 h-4 mr-2" />
                      Start Auction
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start New Auction Round</DialogTitle>
                      <DialogDescription>
                        This will start a new auction round. Make sure all teams are ready.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => setShowStartAuction(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleStartAuction}>
                        Start Auction
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div>
                    <h3 className="font-medium text-green-800 dark:text-green-200">
                      Auction Active
                    </h3>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      Round {currentRound.round} in progress
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Activity className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={() => onNavigate('auction')} className="flex-1">
                    <Gavel className="w-4 h-4 mr-2" />
                    Manage Auction
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('?display=auction', '_blank')}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Public Display
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('import')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Import Players
              </CardTitle>
              <CardDescription>
                Upload player data from CSV or Excel files
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('teams')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Manage Teams
              </CardTitle>
              <CardDescription>
                View and manage team information and budgets
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Reports
              </CardTitle>
              <CardDescription>
                Generate auction reports and analytics
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}