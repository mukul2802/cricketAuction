import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';
import { Team, Player } from '../../lib/firebaseServices';

interface AuctionStatsProps {
  teams: Team[];
  players: Player[];
  currentRound: number;
  totalRounds: number;
  auctionStartTime?: Date;
  totalBudget: number;
  totalSpent: number;
}

export const AuctionStats: React.FC<AuctionStatsProps> = ({
  teams,
  players,
  currentRound,
  totalRounds,
  auctionStartTime,
  totalBudget,
  totalSpent
}) => {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDuration = (startTime: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const soldPlayers = players.filter(p => p.status === 'sold');
  const unsoldPlayers = players.filter(p => p.status === 'unsold');
  const remainingPlayers = players.filter(p => p.status === 'active');

  const averageSoldPrice = soldPlayers.length > 0 
    ? soldPlayers.reduce((sum, p) => sum + (p.finalPrice || 0), 0) / soldPlayers.length
    : 0;

  const highestSoldPrice = soldPlayers.length > 0
    ? Math.max(...soldPlayers.map(p => p.finalPrice || 0))
    : 0;

  const mostExpensivePlayer = soldPlayers.find(p => p.finalPrice === highestSoldPrice);

  const teamStats = teams.map(team => {
    const teamPlayers = soldPlayers.filter(p => p.teamId === team.id);
    const spent = team.budget - team.remainingBudget;
    return {
      ...team,
      playersCount: teamPlayers.length,
      spent,
      spentPercentage: (spent / team.budget) * 100
    };
  }).sort((a, b) => b.spent - a.spent);

  const progressPercentage = totalRounds > 0 ? (currentRound / totalRounds) * 100 : 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Players Sold</p>
                <p className="text-2xl font-bold text-green-600">{soldPlayers.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Players Unsold</p>
                <p className="text-2xl font-bold text-red-600">{unsoldPlayers.length}</p>
              </div>
              <Users className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-blue-600">{remainingPlayers.length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auction Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Auction Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Round {currentRound} of {totalRounds}</span>
              <span className="text-sm text-gray-600">{progressPercentage.toFixed(1)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            
            {auctionStartTime && (
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Duration: {formatDuration(auctionStartTime)}</span>
                <span>Started: {auctionStartTime.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Price Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Price Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Average Sold Price:</span>
                <span className="font-semibold">{formatCurrency(averageSoldPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Highest Sold Price:</span>
                <span className="font-semibold text-green-600">{formatCurrency(highestSoldPrice)}</span>
              </div>
              {mostExpensivePlayer && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Most Expensive:</span>
                  <span className="font-semibold">{mostExpensivePlayer.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Total Budget:</span>
                <span className="font-semibold">{formatCurrency(totalBudget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Budget Utilized:</span>
                <span className="font-semibold">
                  {((totalSpent / totalBudget) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Team Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamStats.map((team) => (
                <div key={team.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{team.name}</span>
                      <Badge variant="outline">{team.playersCount} players</Badge>
                    </div>
                    <span className="font-semibold">{formatCurrency(team.spent)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${team.spentPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{team.spentPercentage.toFixed(1)}% of budget</span>
                    <span>Remaining: {formatCurrency(team.remainingBudget)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Player Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Player Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{soldPlayers.length}</div>
              <div className="text-sm text-green-700">Players Sold</div>
              <div className="text-xs text-gray-600 mt-1">
                {players.length > 0 ? ((soldPlayers.length / players.length) * 100).toFixed(1) : 0}% of total
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{unsoldPlayers.length}</div>
              <div className="text-sm text-red-700">Players Unsold</div>
              <div className="text-xs text-gray-600 mt-1">
                {players.length > 0 ? ((unsoldPlayers.length / players.length) * 100).toFixed(1) : 0}% of total
              </div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{remainingPlayers.length}</div>
              <div className="text-sm text-blue-700">Players Remaining</div>
              <div className="text-xs text-gray-600 mt-1">
                {players.length > 0 ? ((remainingPlayers.length / players.length) * 100).toFixed(1) : 0}% of total
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};