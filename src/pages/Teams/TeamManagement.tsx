import React, { useState, useMemo } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useTeams, usePlayers } from '@/hooks';
import { teamsApi } from '@/api/teams';
import { Team, Player } from '@/types';
import { PageType } from '@/components/Router';
import { formatCurrency } from '@/utils';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  Trophy,
  IndianRupee,
  Star,
  Target,
  Crown,
  Shield
} from 'lucide-react';

interface TeamManagementProps {
  onNavigate: (page: PageType) => void;
}

export function TeamManagement({ onNavigate }: TeamManagementProps) {
  const { teams, loading: teamsLoading, refetch: refetchTeams } = useTeams();
  const { players, loading: playersLoading } = usePlayers();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState({
    name: '',
    initials: '',
    budget: 1000000
  });

  const loading = teamsLoading || playersLoading;

  // Filter teams based on search
  const filteredTeams = useMemo(() => {
    return teams.filter(team => 
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.initials.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teams, searchTerm]);

  // Get team statistics
  const getTeamStats = (team: Team) => {
    const teamPlayers = players.filter(p => p.teamId === team.id);
    const totalSpent = team.budget - team.remainingBudget;
    const avgPlayerCost = teamPlayers.length > 0 ? totalSpent / teamPlayers.length : 0;
    
    return {
      playerCount: teamPlayers.length,
      totalSpent,
      avgPlayerCost,
      budgetUsedPercentage: (totalSpent / team.budget) * 100
    };
  };

  const handleAddTeam = async () => {
    try {
      await teamsApi.createTeam({
        ...newTeam,
        remainingBudget: newTeam.budget,
        players: []
      });
      
      setNewTeam({
        name: '',
        initials: '',
        budget: 1000000
      });
      setIsAddDialogOpen(false);
      refetchTeams();
    } catch (error) {
      console.error('Error adding team:', error);
    }
  };

  const handleEditTeam = async () => {
    if (!editingTeam) return;
    
    try {
      await teamsApi.updateTeam(editingTeam.id, editingTeam);
      setEditingTeam(null);
      refetchTeams();
    } catch (error) {
      console.error('Error updating team:', error);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (window.confirm('Are you sure you want to delete this team? This will also remove all players from the team.')) {
      try {
        await teamsApi.deleteTeam(teamId);
        refetchTeams();
      } catch (error) {
        console.error('Error deleting team:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout currentPage="teams" onNavigate={onNavigate}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
            <p className="text-muted-foreground">Manage all teams in the auction</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Team
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Team</DialogTitle>
                <DialogDescription>
                  Create a new team for the auction.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Team Name
                  </Label>
                  <Input
                    id="name"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                    className="col-span-3"
                    placeholder="e.g., Mumbai Indians"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="initials" className="text-right">
                    Initials
                  </Label>
                  <Input
                    id="initials"
                    value={newTeam.initials}
                    onChange={(e) => setNewTeam({...newTeam, initials: e.target.value.toUpperCase()})}
                    className="col-span-3"
                    placeholder="e.g., MI"
                    maxLength={4}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="budget" className="text-right">
                    Budget (₹)
                  </Label>
                  <Input
                    id="budget"
                    type="number"
                    value={newTeam.budget}
                    onChange={(e) => setNewTeam({...newTeam, budget: parseInt(e.target.value) || 0})}
                    className="col-span-3"
                    placeholder="1000000"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTeam}>
                  Add Team
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teams.length}</div>
              <p className="text-xs text-muted-foreground">Registered teams</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(teams.reduce((sum, team) => sum + team.budget, 0))}
              </div>
              <p className="text-xs text-muted-foreground">Combined budget</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Players Signed</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{players.filter(p => p.teamId).length}</div>
              <p className="text-xs text-muted-foreground">Across all teams</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Team Size</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teams.length > 0 ? Math.round(players.filter(p => p.teamId).length / teams.length) : 0}
              </div>
              <p className="text-xs text-muted-foreground">Players per team</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search teams by name or initials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Teams List */}
        <Card>
          <CardHeader>
            <CardTitle>Teams ({filteredTeams.length})</CardTitle>
            <CardDescription>
              {searchTerm 
                ? `Showing ${filteredTeams.length} of ${teams.length} teams`
                : `All ${teams.length} teams`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTeams.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Teams Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'No teams have been created yet'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Team
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeams.map((team) => {
                  const stats = getTeamStats(team);
                  return (
                    <div key={team.id} className="border rounded-lg p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Crown className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{team.name}</h3>
                            <Badge variant="outline">{team.initials}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingTeam(team)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTeam(team.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Budget</span>
                          </div>
                          <div className="font-medium">{formatCurrency(team.budget)}</div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Remaining</span>
                          </div>
                          <div className="font-medium text-green-600">{formatCurrency(team.remainingBudget)}</div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Players</span>
                          </div>
                          <div className="font-medium">{stats.playerCount}</div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Spent</span>
                          </div>
                          <div className="font-medium">{formatCurrency(stats.totalSpent)}</div>
                        </div>
                      </div>
                      
                      {/* Budget Usage Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Budget Used</span>
                          <span className="font-medium">{Math.round(stats.budgetUsedPercentage)}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(stats.budgetUsedPercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {stats.playerCount > 0 && (
                        <div className="pt-2 border-t">
                          <div className="text-sm text-muted-foreground">
                            Avg per player: {formatCurrency(Math.round(stats.avgPlayerCost))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Team Dialog */}
        {editingTeam && (
          <Dialog open={!!editingTeam} onOpenChange={() => setEditingTeam(null)}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Team</DialogTitle>
                <DialogDescription>
                  Update team information.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Team Name
                  </Label>
                  <Input
                    id="edit-name"
                    value={editingTeam.name}
                    onChange={(e) => setEditingTeam({...editingTeam, name: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-initials" className="text-right">
                    Initials
                  </Label>
                  <Input
                    id="edit-initials"
                    value={editingTeam.initials}
                    onChange={(e) => setEditingTeam({...editingTeam, initials: e.target.value.toUpperCase()})}
                    className="col-span-3"
                    maxLength={4}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-budget" className="text-right">
                    Budget (₹)
                  </Label>
                  <Input
                    id="edit-budget"
                    type="number"
                    value={editingTeam.budget}
                    onChange={(e) => setEditingTeam({...editingTeam, budget: parseInt(e.target.value) || 0})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-remaining" className="text-right">
                    Remaining (₹)
                  </Label>
                  <Input
                    id="edit-remaining"
                    type="number"
                    value={editingTeam.remainingBudget}
                    onChange={(e) => setEditingTeam({...editingTeam, remainingBudget: parseInt(e.target.value) || 0})}
                    className="col-span-3"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingTeam(null)}>
                  Cancel
                </Button>
                <Button onClick={handleEditTeam}>
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}      </div>
    </MainLayout>
  );
}