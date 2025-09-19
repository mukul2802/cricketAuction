import React, { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { PageType } from '../../src/components/Router';
import { useAuth } from '../../contexts/AuthContext';
import { teamService, playerService, Team, Player } from '../../lib/firebaseServices';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Filter,
  Trophy,
  Star,
  Activity,
  Target
} from 'lucide-react';

interface SquadListPageProps {
  onNavigate: (page: PageType) => void;
}

export function SquadListPage({ onNavigate }: SquadListPageProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Load teams and players data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [teamsData, playersData] = await Promise.all([
          teamService.getAllTeams(),
          playerService.getAllPlayers()
        ]);
        
        setTeams(teamsData);
        setPlayers(playersData.filter(player => player.status === 'sold'));
      } catch (error) {
        console.error('Error loading squad data:', error);
        toast.error('Failed to load squad data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    // Set up real-time listeners
    const unsubscribeTeams = teamService.subscribeToTeams(() => {
      loadData();
    });
    
    const unsubscribePlayers = playerService.subscribeToPlayers(() => {
      loadData();
    });
    
    return () => {
      unsubscribeTeams();
      unsubscribePlayers();
    };
  }, []);

  // Get players with team information
  const playersWithTeams = useMemo(() => {
    return players.map(player => {
      const team = teams.find(t => t.id === player.teamId);
      return {
        ...player,
        teamName: team?.name || 'Unknown Team',
        teamInitials: team?.initials || 'UK'
      };
    });
  }, [players, teams]);

  // Filter players based on search and filters
  const filteredPlayers = useMemo(() => {
    return playersWithTeams.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           player.teamName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTeam = filterTeam === 'all' || player.teamName === filterTeam;
      const matchesRole = filterRole === 'all' || player.role.toLowerCase() === filterRole.toLowerCase();
      
      return matchesSearch && matchesTeam && matchesRole;
    });
  }, [playersWithTeams, searchQuery, filterTeam, filterRole]);

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'batsman': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'bowler': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'wicket-keeper': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'all-rounder': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getPlayerStats = (player: Player) => {
    const stats = [];
    if (player.matches) stats.push(`${player.matches} matches`);
    if (player.runs) stats.push(`${player.runs} runs`);
    if (player.wickets) stats.push(`${player.wickets} wickets`);
    if (player.battingAvg) stats.push(`${player.battingAvg} avg`);
    if (player.bowlingAvg) stats.push(`${player.bowlingAvg} bowl avg`);
    if (player.strikeRate) stats.push(`${player.strikeRate} SR`);
    if (player.economy) stats.push(`${player.economy} econ`);
    return stats.slice(0, 3); // Show only first 3 stats
  };

  // Get unique team names for filter
  const teamNames = useMemo(() => {
    return Array.from(new Set(teams.map(team => team.name))).sort();
  }, [teams]);

  // Get unique roles for filter
  const roles = useMemo(() => {
    return Array.from(new Set(players.map(player => player.role))).sort();
  }, [players]);

  if (loading) {
    return (
      <MainLayout currentPage="squads" onNavigate={onNavigate}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading squad data...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout currentPage="squads" onNavigate={onNavigate}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">All Team Squads</h1>
          <p className="text-muted-foreground">View all players across all teams</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Players or Teams</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by player or team name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Team</label>
                <Select value={filterTeam} onValueChange={setFilterTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teamNames.map(teamName => (
                      <SelectItem key={teamName} value={teamName}>
                        {teamName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map(role => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players Grid */}
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No players found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try adjusting your search criteria' : 'No players have been sold yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlayers.map((player) => (
              <Card key={player.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Player Image and Basic Info */}
                    <div className="flex items-center gap-3">
                      <ImageWithFallback
                        src={player.image || ''}
                        alt={player.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{player.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-xs ${getRoleColor(player.role)}`}>
                            {player.role}
                          </Badge>
                          {player.age && (
                            <span className="text-xs text-muted-foreground">{player.age}y</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Team Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{player.teamName}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-primary">
                          ₹{((player.finalPrice || player.basePrice) / 10000000).toFixed(1)}Cr
                        </p>
                      </div>
                    </div>

                    {/* Player Stats */}
                    {getPlayerStats(player).length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Stats</p>
                        <div className="flex flex-wrap gap-1">
                          {getPlayerStats(player).map((stat, index) => (
                            <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
                              {stat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{filteredPlayers.length}</div>
                <div className="text-sm text-muted-foreground">Total Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{teamNames.length}</div>
                <div className="text-sm text-muted-foreground">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  ₹{(filteredPlayers.reduce((sum, p) => sum + (p.finalPrice || p.basePrice), 0) / 10000000).toFixed(1)}Cr
                </div>
                <div className="text-sm text-muted-foreground">Total Value</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  ₹{filteredPlayers.length > 0 ? (filteredPlayers.reduce((sum, p) => sum + (p.finalPrice || p.basePrice), 0) / filteredPlayers.length / 10000000).toFixed(1) : '0'}Cr
                </div>
                <div className="text-sm text-muted-foreground">Avg Price</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}