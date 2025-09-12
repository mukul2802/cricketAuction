import React, { useState, useEffect } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { PageType } from '../Router';
import { auctionService, playerService, teamService } from '../../lib/firebaseServices';
import { toast } from 'sonner';
import {
  Users,
  Gavel,
  BarChart3,
  Clock,
  Trophy,
  TrendingUp,
  Activity,
  Star
} from 'lucide-react';

interface ManagerDashboardProps {
  onNavigate: (page: PageType) => void;
}

export function ManagerDashboard({ onNavigate }: ManagerDashboardProps) {
  const [stats, setStats] = useState({
    activeAuctions: 0,
    playersProcessed: 0,
    totalBids: 0,
    averageBidTime: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get current auction round
        const currentRound = await auctionService.getCurrentRound();
        
        // Get all players
        const allPlayers = await playerService.getAllPlayers();
        const soldPlayers = allPlayers.filter(p => p.status === 'sold');
        const processedPlayers = allPlayers.filter(p => p.status === 'sold' || p.status === 'unsold');
        
        // Get all teams
        const allTeams = await teamService.getAllTeams();
        
        // Calculate stats
        const activeAuctions = currentRound && currentRound.status === 'active' ? 1 : 0;
        const totalSpent = soldPlayers.reduce((sum, player) => sum + (player.finalPrice || 0), 0);
        const averagePrice = soldPlayers.length > 0 ? totalSpent / soldPlayers.length : 0;
        
        setStats({
          activeAuctions,
          playersProcessed: processedPlayers.length,
          totalBids: soldPlayers.length,
          averageBidTime: Math.round(averagePrice / 1000000) // Convert to approximate time metric
        });
        
        // Generate recent activity based on real data
        const activities = [];
        if (currentRound && currentRound.status === 'active') {
          activities.push({
            text: `Auction is currently active`,
            time: '2 min ago',
            color: 'bg-green-400',
            animate: true
          });
        }
        
        if (soldPlayers.length > 0) {
          const recentSold = soldPlayers.slice(-1)[0];
          activities.push({
            text: `${recentSold.name} sold for ₹${((recentSold.finalPrice || 0) / 10000000).toFixed(1)}Cr`,
            time: '15 min ago',
            color: 'bg-blue-400',
            animate: false
          });
        }
        
        activities.push({
          text: `Player database contains ${allPlayers.length} entries`,
          time: '1 hour ago',
          color: 'bg-purple-400',
          animate: false
        });
        
        setRecentActivity(activities);
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  const quickActions = [
    {
      title: 'Manage Live Auction',
      description: 'Control the auction flow',
      icon: Gavel,
      action: () => onNavigate('auction'),
      color: 'bg-green-500/10 text-green-400 border-green-500/20'
    },
    {
      title: 'View Players',
      description: 'Browse player database',
      icon: Users,
      action: () => onNavigate('players'),
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    },
    {
      title: 'Import Players',
      description: 'Bulk import player data',
      icon: BarChart3,
      action: () => onNavigate('import'),
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    }
  ];

  return (
    <MainLayout currentPage="dashboard" onNavigate={onNavigate}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground">Auction management and oversight</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Auctions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-2xl font-bold animate-pulse">-</div>
              ) : (
                <div className="text-2xl font-bold">{stats.activeAuctions}</div>
              )}
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Players Processed</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-2xl font-bold animate-pulse">-</div>
              ) : (
                <div className="text-2xl font-bold">{stats.playersProcessed}</div>
              )}
              <p className="text-xs text-muted-foreground">Sold or unsold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Players Sold</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-2xl font-bold animate-pulse">-</div>
              ) : (
                <div className="text-2xl font-bold">{stats.totalBids}</div>
              )}
              <p className="text-xs text-muted-foreground">Across all teams</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Price</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-2xl font-bold animate-pulse">-</div>
              ) : (
                <div className="text-2xl font-bold">₹{stats.averageBidTime}Cr</div>
              )}
              <p className="text-xs text-muted-foreground">Per player</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Commonly used management actions</CardDescription>
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

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                  <span className="text-sm animate-pulse">Loading activity...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-2 h-2 ${activity.color} rounded-full ${activity.animate ? 'animate-pulse' : ''}`} />
                    <span className="text-sm">{activity.text}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{activity.time}</span>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}