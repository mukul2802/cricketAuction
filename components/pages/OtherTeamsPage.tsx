import React, { useState, useEffect } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { PageType } from '../../src/components/Router';
import { useAuth } from '../../contexts/AuthContext';
import { teamService, playerService, Team, Player } from '../../lib/firebaseServices';
import { toast } from 'sonner';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import {
  Trophy,
  IndianRupee,
  Users,
  Star,
  Search,
  Filter
} from 'lucide-react';

interface OtherTeamsPageProps {
  onNavigate: (page: PageType) => void;
}

export function OtherTeamsPage({ onNavigate }: OtherTeamsPageProps) {
  const { user, teams } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [teamsData, setTeamsData] = useState<Team[]>([]);
  const [playersData, setPlayersData] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Load teams and their players from Firebase
  useEffect(() => {
    const loadTeamsData = async () => {
      try {
        setLoading(true);
        const allTeams = await teamService.getAllTeams();
        const allPlayers = await playerService.getAllPlayers();
        
        setTeamsData(allTeams);
        setPlayersData(allPlayers.filter(player => player.status === 'sold'));
      } catch (error) {
        console.error('Error loading teams data:', error);
        toast.error('Failed to load teams data');
      } finally {
        setLoading(false);
      }
    };
    
    loadTeamsData();
    
    // Set up real-time listeners
    const unsubscribeTeams = teamService.subscribeToTeams((teams) => {
      loadTeamsData(); // Reload when teams change
    });
    
    const unsubscribePlayers = playerService.subscribeToPlayers((players) => {
      loadTeamsData(); // Reload when players change
    });
    
    return () => {
      unsubscribeTeams();
      unsubscribePlayers();
    };
  }, []);

  // Filter out the user's own team
  const otherTeams = teamsData.filter(team => team.id !== user?.teamId);

  const filteredTeams = otherTeams.filter(team => {
    const teamPlayers = playersData.filter(player => 
      team.players && team.players.includes(player.id)
    );
    
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         teamPlayers.some(player => 
                           player.name.toLowerCase().includes(searchQuery.toLowerCase())
                         );
    const matchesFilter = filterTeam === 'all' || team.name === filterTeam;
    
    return matchesSearch && matchesFilter;
  });

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'batsman': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'bowler': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'wicket-keeper': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'all-rounder': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <MainLayout currentPage="teams" onNavigate={onNavigate}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Other Teams</h1>
          <p className="text-muted-foreground">View other teams and their players</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Teams or Players</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by team or player name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Team</label>
                <Select value={filterTeam} onValueChange={setFilterTeam}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {otherTeams.map(team => (
                      <SelectItem key={team.id} value={team.name}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teams Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading teams...</p>
            </div>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No teams found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try adjusting your search criteria' : 'No other teams available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTeams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    {team.name}
                  </CardTitle>
                  <div className="text-right">
                    <div className="font-bold text-primary">
                      ₹{(team.remainingBudget / 10000000).toFixed(1)}Cr
                    </div>
                    <div className="text-xs text-muted-foreground">remaining</div>
                  </div>
                </div>
                
                {/* Team Stats */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-lg font-bold">{playersData.filter(p => team.players && team.players.includes(p.id)).length}</div>
                    <div className="text-xs text-muted-foreground">Players</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      ₹{(((team.budget || 120000000) - team.remainingBudget) / 10000000).toFixed(1)}Cr
                    </div>
                    <div className="text-xs text-muted-foreground">Spent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {((team.remainingBudget / (team.budget || 120000000)) * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Budget Left</div>
                  </div>
                </div>

                <Progress 
                  value={(((team.budget || 120000000) - team.remainingBudget) / (team.budget || 120000000)) * 100} 
                  className="h-2 mt-2"
                />
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Key Players ({playersData.filter(p => team.players && team.players.includes(p.id)).length})
                  </h4>
                  
                  {playersData
                    .filter(player => team.players && team.players.includes(player.id))
                    .map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ImageWithFallback
                          src={player.image || ''}
                          alt={player.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-sm">{player.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-xs ${getRoleColor(player.role)}`}>
                              {player.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-primary">
                          ₹{((player.finalPrice || 0) / 10000000).toFixed(1)}Cr
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {playersData.filter(p => team.players && team.players.includes(p.id)).length === 0 && (
                    <div className="text-center py-4">
                      <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No players in this team yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}