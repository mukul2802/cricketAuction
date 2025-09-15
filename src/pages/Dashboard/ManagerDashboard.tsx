import React, { useEffect, useState } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth, useTeams, usePlayers } from '@/hooks';
import { PageType } from '@/components/Router';
import { Team, Player } from '@/types';
import {
  Trophy,
  IndianRupee,
  Star,
  Users,
  Target,
  TrendingUp,
  Activity,
  BarChart3
} from 'lucide-react';

interface ManagerDashboardProps {
  onNavigate: (page: PageType) => void;
}

export function ManagerDashboard({ onNavigate }: ManagerDashboardProps) {
  const { user } = useAuth();
  const { teams, loading: teamsLoading } = useTeams();
  const { players, loading: playersLoading } = usePlayers();
  
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [myPlayers, setMyPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamsLoading && !playersLoading && user) {
      // Find the team this manager belongs to
      const userTeam = teams.find(team => team.id === user.teamId);
      setMyTeam(userTeam || null);
      
      // Find players belonging to this team
      if (userTeam) {
        const teamPlayers = players.filter(player => player.teamId === userTeam.id);
        setMyPlayers(teamPlayers);
      }
      
      setLoading(false);
    }
  }, [teams, players, user, teamsLoading, playersLoading]);

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

  if (!myTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold">No Team Assigned</h2>
          <p className="text-muted-foreground">You don't have a team assigned to your account.</p>
        </div>
      </div>
    );
  }

  const budgetUsed = myTeam.budget - myTeam.remainingBudget;
  const budgetPercentage = (budgetUsed / myTeam.budget) * 100;

  // Group players by role
  const playersByRole = myPlayers.reduce((acc, player) => {
    if (!acc[player.role]) {
      acc[player.role] = [];
    }
    acc[player.role].push(player);
    return acc;
  }, {} as Record<string, Player[]>);

  return (
    <MainLayout currentPage="dashboard" onNavigate={onNavigate}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manager Dashboard</h1>
            <p className="text-muted-foreground">Managing team: {myTeam.name}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onNavigate('players')} variant="outline">
              <Star className="w-4 h-4 mr-2" />
              All Players
            </Button>
            <Button onClick={() => onNavigate('auction')} variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              Live Auction
            </Button>
          </div>
        </div>

        {/* Team Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Remaining</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{myTeam.remainingBudget.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                of ₹{myTeam.budget.toLocaleString()} total
              </p>
              <Progress value={budgetPercentage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Squad Size</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myPlayers.length}</div>
              <p className="text-xs text-muted-foreground">Players acquired</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Player Cost</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{myPlayers.length > 0 ? Math.round(budgetUsed / myPlayers.length).toLocaleString() : '0'}
              </div>
              <p className="text-xs text-muted-foreground">Per player</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(budgetPercentage)}%</div>
              <p className="text-xs text-muted-foreground">₹{budgetUsed.toLocaleString()} spent</p>
            </CardContent>
          </Card>
        </div>

        {/* Squad Composition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Squad Composition
            </CardTitle>
            <CardDescription>
              Players organized by role
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(playersByRole).length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Players Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Your team hasn't acquired any players yet. Participate in the auction to build your squad!
                </p>
                <Button onClick={() => onNavigate('auction')}>
                  <Activity className="w-4 h-4 mr-2" />
                  Join Auction
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(playersByRole).map(([role, rolePlayers]) => (
                  <div key={role}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">{role}</Badge>
                      <span className="text-sm text-muted-foreground">({rolePlayers.length} players)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {rolePlayers.map((player) => (
                        <div key={player.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{player.name}</h4>
                            <span className="text-xs text-muted-foreground">
                              ₹{player.finalPrice?.toLocaleString() || 'N/A'}
                            </span>
                          </div>
                          {player.age && (
                            <div className="text-xs text-muted-foreground">
                              Age: {player.age} years
                            </div>
                          )}
                          {player.matches && (
                            <div className="text-xs text-muted-foreground">
                              Matches: {player.matches}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('auction')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Live Auction
              </CardTitle>
              <CardDescription>
                Participate in the ongoing auction and bid for players
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('players')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Player Database
              </CardTitle>
              <CardDescription>
                Browse all available players and their statistics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Strategy & Analysis
              </CardTitle>
              <CardDescription>
                Analyze team performance and plan strategies
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}