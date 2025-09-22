import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Home, Users, FileSpreadsheet } from 'lucide-react';
import { PageType } from '@/components/Router';
import { AuctionRound } from '../../lib/firebaseServices';

interface AuctionControlsProps {
  currentRound: AuctionRound | null;
  auctionStarted: boolean;
  isProcessing: boolean;
  hasPlayersForNextRound: boolean;
  allPlayersSold: boolean;
  remainingPlayersCount: { unsold: number; active: number; total: number };
  onStartAuction: () => void;
  onStartNextRound: () => void;
  onEndAuction: () => void;
  onNavigate: (page: PageType) => void;
}

export const AuctionControls: React.FC<AuctionControlsProps> = ({
  currentRound,
  auctionStarted,
  isProcessing,
  hasPlayersForNextRound,
  allPlayersSold,
  remainingPlayersCount,
  onStartAuction,
  onStartNextRound,
  onEndAuction,
  onNavigate
}) => {
  const renderRoundInfo = () => {
    if (!currentRound) return null;

    return (
      <div className="flex items-center gap-4 mb-4">
        <Badge variant="outline" className="text-lg px-3 py-1">
          Round {currentRound.round}
        </Badge>
        <Badge 
          variant={currentRound.status === 'active' ? 'default' : 'secondary'}
          className="px-3 py-1"
        >
          {currentRound.status === 'active' ? 'Active' : 'Waiting'}
        </Badge>
        <div className="text-sm text-gray-600">
          Players Left: {remainingPlayersCount.active} | 
          Unsold: {remainingPlayersCount.unsold} | 
          Total: {remainingPlayersCount.total}
        </div>
      </div>
    );
  };

  const renderActionButtons = () => {
    if (!currentRound) return null;

    if (!auctionStarted && currentRound.status !== 'active') {
      return (
        <Button 
          onClick={onStartAuction}
          disabled={isProcessing}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
        >
          <Play className="w-4 h-4 mr-2" />
          {isProcessing ? 'Starting...' : 'Start Auction'}
        </Button>
      );
    }

    if (allPlayersSold) {
      return (
        <Button 
          onClick={onEndAuction}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
        >
          <Pause className="w-4 h-4 mr-2" />
          End Auction
        </Button>
      );
    }

    if (!hasPlayersForNextRound && remainingPlayersCount.active === 0) {
      return (
        <div className="flex gap-2">
          <Button 
            onClick={onStartNextRound}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            Start Next Round
          </Button>
          <Button 
            onClick={onEndAuction}
            variant="outline"
            className="px-6 py-2"
          >
            End Auction
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
      {renderRoundInfo()}
      
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {renderActionButtons()}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onNavigate('dashboard')}
          >
            <Home className="w-4 h-4 mr-1" />
            Dashboard
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onNavigate('teams')}
          >
            <Users className="w-4 h-4 mr-1" />
            Teams
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onNavigate('reports')}
          >
            <FileSpreadsheet className="w-4 h-4 mr-1" />
            Reports
          </Button>
        </div>
      </div>
    </div>
  );
};