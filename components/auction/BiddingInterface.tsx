import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Timer, Users, DollarSign } from 'lucide-react';
import { Team, Player } from '../../lib/firebaseServices';

interface BiddingInterfaceProps {
  currentPlayer: Player | null;
  teams: Team[];
  currentBid: number;
  bidIncrement: number;
  timeLeft: number;
  customBidAmount: string;
  userTeam: Team | null;
  isOwner: boolean;
  onBidClick: (amount: number) => void;
  onCustomBidChange: (value: string) => void;
  onCustomBidSubmit: () => void;
}

export const BiddingInterface: React.FC<BiddingInterfaceProps> = ({
  currentPlayer,
  teams,
  currentBid,
  bidIncrement,
  timeLeft,
  customBidAmount,
  userTeam,
  isOwner,
  onBidClick,
  onCustomBidChange,
  onCustomBidSubmit
}) => {
  if (!currentPlayer) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">No active bidding</div>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 10) return 'text-red-600';
    if (timeLeft <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const canBid = (amount: number) => {
    if (!isOwner || !userTeam) return false;
    return userTeam.remainingBudget >= amount && amount > currentBid;
  };

  const quickBidAmounts = [
    currentBid + bidIncrement,
    currentBid + bidIncrement * 2,
    currentBid + bidIncrement * 5,
    currentBid + bidIncrement * 10
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Bidding Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Current Bidding
            </span>
            <div className={`flex items-center gap-2 font-mono text-lg ${getTimeColor()}`}>
              <Timer className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Current Bid</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(currentBid)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Base Price</div>
              <div className="text-lg font-semibold">
                {formatCurrency(currentPlayer.basePrice)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Bid Increment</div>
              <div className="text-lg font-semibold">
                {formatCurrency(bidIncrement)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Budgets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Budgets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div key={team.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{team.name}</div>
                    <div className="text-sm text-gray-600">{team.initials}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      {formatCurrency(team.remainingBudget)}
                    </div>
                    <div className="text-xs text-gray-500">
                      of {formatCurrency(team.budget)}
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(team.remainingBudget / team.budget) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bidding Controls */}
      {isOwner && userTeam && (
        <Card>
          <CardHeader>
            <CardTitle>Place Your Bid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">
                  Your Team: {userTeam.name}
                </Badge>
                <Badge variant="outline">
                  Available: {formatCurrency(userTeam.remainingBudget)}
                </Badge>
              </div>

              {/* Quick Bid Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {quickBidAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant={canBid(amount) ? "default" : "outline"}
                    disabled={!canBid(amount)}
                    onClick={() => onBidClick(amount)}
                    className="h-12"
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>

              {/* Custom Bid */}
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Enter custom bid amount"
                  value={customBidAmount}
                  onChange={(e) => onCustomBidChange(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={onCustomBidSubmit}
                  disabled={!customBidAmount || !canBid(parseInt(customBidAmount) || 0)}
                >
                  Bid {customBidAmount ? formatCurrency(parseInt(customBidAmount) || 0) : ''}
                </Button>
              </div>

              {/* Bid Validation Messages */}
              {customBidAmount && (
                <div className="text-sm">
                  {parseInt(customBidAmount) <= currentBid && (
                    <div className="text-red-600">
                      Bid must be higher than current bid of {formatCurrency(currentBid)}
                    </div>
                  )}
                  {parseInt(customBidAmount) > userTeam.remainingBudget && (
                    <div className="text-red-600">
                      Insufficient budget. Available: {formatCurrency(userTeam.remainingBudget)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Non-owner message */}
      {!isOwner && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-gray-600">
              Only team owners can place bids during the auction.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};