import React from 'react';
import { Card, CardContent } from '../../src/components/ui/card';
import { Badge } from '../../src/components/ui/badge';
import { Button } from '../../src/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Player } from '../../lib/firebaseServices';
import { formatCurrency } from '../../src/utils';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface PlayerDisplayProps {
  player: Player | null;
  currentPlayerIndex: number;
  totalPlayers: number;
  isPlayerTransitioning: boolean;
  onPreviousPlayer: () => void;
  onNextPlayer: () => void;
  onSoldClick: () => void;
  onUnsoldClick: () => void;
  canNavigate: boolean;
}

export const PlayerDisplay: React.FC<PlayerDisplayProps> = ({
  player,
  currentPlayerIndex,
  totalPlayers,
  isPlayerTransitioning,
  onPreviousPlayer,
  onNextPlayer,
  onSoldClick,
  onUnsoldClick,
  canNavigate
}) => {
  if (!player) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">No player selected</div>
        </CardContent>
      </Card>
    );
  }

  const getPositionColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'batsman':
      case 'batter':
        return 'bg-blue-100 text-blue-800';
      case 'bowler':
        return 'bg-red-100 text-red-800';
      case 'all-rounder':
      case 'allrounder':
        return 'bg-green-100 text-green-800';
      case 'wicket-keeper':
      case 'wicketkeeper':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Navigation Controls */}
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousPlayer}
          disabled={currentPlayerIndex === 0 || !canNavigate}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        
        <div className="text-sm text-gray-600">
          Player {currentPlayerIndex + 1} of {totalPlayers}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPlayer}
          disabled={currentPlayerIndex >= totalPlayers - 1 || !canNavigate}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Player Card */}
      <Card className={`transition-all duration-300 ${isPlayerTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Player Image */}
            <div className="flex justify-center">
              <div className="relative">
                <ImageWithFallback
                  src={player.image || ''}
                  alt={player.name}
                  className="w-64 h-64 object-cover rounded-lg shadow-lg"
                  enhancedClassName="w-64 h-64 rounded-lg shadow-lg"
                />
              </div>
            </div>

            {/* Player Details */}
            <div className="space-y-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{player.name}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getPositionColor(player.role)}>
                    {player.role}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Base Price:</span>
                  <div className="text-lg font-semibold text-green-600">
                    {player.basePrice ? formatCurrency(player.basePrice) : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <div className="text-lg font-semibold">
                    <Badge variant={player.status === 'sold' ? 'default' : 'secondary'}>
                      {player.status || 'Available'}
                    </Badge>
                  </div>
                </div>
              </div>

              {player.finalPrice && (
                <div>
                  <span className="font-medium text-gray-600">Final Price:</span>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(player.finalPrice)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              onClick={onSoldClick}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
              disabled={player.status === 'sold'}
            >
              Mark as Sold
            </Button>
            <Button
              onClick={onUnsoldClick}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50 px-8 py-3 text-lg"
              disabled={player.status === 'sold'}
            >
              Mark as Unsold
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};