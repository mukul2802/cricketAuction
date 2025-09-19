import React, { useState, useEffect } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { PageType } from '../../src/components/Router';
import { useAuth } from '../../contexts/AuthContext';
import { teamService, userService, adminResetService, playerService, Team, User, Player } from '../../lib/firebaseServices';
import { toast } from 'sonner';
import {
  Trophy,
  IndianRupee,
  Users,
  Star,
  Eye,
  Plus,
  Edit,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ConfirmationDialog } from '../ui/confirmation-dialog';

interface TeamsPageProps {
  onNavigate: (page: PageType) => void;
}

export function TeamsPage({ onNavigate }: TeamsPageProps) {
  const { user, refreshTeams } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [owners, setOwners] = useState<User[]>([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState({
    name: '',
    logo: '',
    ownerId: '',
    budget: 1000000000,
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetType, setResetType] = useState<'teams' | 'players' | 'deleteAll' | 'fullReset'>('teams');
  const [isResetting, setIsResetting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [squadPlayers, setSquadPlayers] = useState<Player[]>([]);

  useEffect(() => {
    loadTeams();
    loadOwners();
  }, []);

  // Set up real-time listener for teams
  useEffect(() => {
    const unsubscribe = teamService.subscribeToTeams((teamsData: Team[]) => {
      setTeams(teamsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const teamsData = await teamService.getAllTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const loadOwners = async () => {
    try {
      const allUsers = await userService.getAllUsers();
      setOwners(allUsers.filter(u => u.role === 'owner'));
    } catch (e) {
      // ignore
    }
  };

  const handleReset = async (type: 'teams' | 'players' | 'deleteAll' | 'fullReset') => {
    setResetType(type);
    setShowResetConfirm(true);
  };

  const confirmReset = async () => {
    setIsResetting(true);
    try {
      switch (resetType) {
        case 'teams':
          await adminResetService.resetAllTeamsToInitialState();
          toast.success('All teams reset to initial state!');
          break;
        case 'players':
          await adminResetService.resetAllPlayersToAuctionState();
          toast.success('All players made available for auction!');
          break;
        case 'deleteAll':
          await adminResetService.deleteAllPlayers();
          toast.success('All players deleted!');
          break;
        case 'fullReset':
          await adminResetService.performFullReset();
          toast.success('Complete auction reset performed!');
          break;
      }
      loadTeams();
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Reset failed. Please try again.');
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  const openSquadView = async (team: Team) => {
    try {
      setSelectedTeam(team);
      const allPlayers = await playerService.getAllPlayers();
      const teamPlayers = allPlayers.filter(player => 
        team.players && team.players.includes(player.id)
      );
      setSquadPlayers(teamPlayers);
      setShowSquadModal(true);
    } catch (error) {
      console.error('Error loading squad:', error);
      toast.error('Failed to load squad');
    }
  };

  const openAddTeam = () => {
    setEditingTeam(null);
    setTeamForm({ name: '', logo: '', ownerId: '', budget: 1000000000 });
    setShowTeamModal(true);
  };

  const openEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamForm({
      name: team.name || '',
      logo: (team as any).logo || '',
      ownerId: team.ownerId || '',
      budget: team.budget || 1000000000,
    });
    setShowTeamModal(true);
  };

  const saveTeam = async () => {
    try {
      if (!teamForm.name) return toast.error('Team name is required');
      if (editingTeam) {
        await teamService.updateTeam(editingTeam.id, {
          name: teamForm.name,
          budget: teamForm.budget,
          remainingBudget: editingTeam.remainingBudget ?? teamForm.budget,
          ownerId: teamForm.ownerId || undefined,
          // @ts-ignore
          logo: teamForm.logo || undefined,
        } as any);
        toast.success('Team updated');
      } else {
        await teamService.createTeam({
          name: teamForm.name,
          initials: teamForm.name.substring(0, 3).toUpperCase(),
          budget: teamForm.budget,
          remainingBudget: teamForm.budget,
          players: [],
          ownerId: teamForm.ownerId || undefined,
          // @ts-ignore
          logo: teamForm.logo || undefined,
        } as any);
        toast.success('Team created');
      }
      setShowTeamModal(false);
      await loadTeams();
      toast.success(editingTeam ? 'Team updated successfully' : 'Team created successfully');
    } catch (e) {
      toast.error('Failed to save team');
    }
  };

  const handleDeleteTeam = (team: Team) => {
    setDeletingTeam(team);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTeam = async () => {
    if (!deletingTeam) return;
    try {
      await teamService.deleteTeam(deletingTeam.id);
      toast.success('Team deleted');
      await loadTeams();
      setDeletingTeam(null);
    } catch (e) {
      toast.error('Failed to delete team');
    }
  };

  return (
    <MainLayout currentPage="teams" onNavigate={onNavigate}>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Teams Management</h1>
            <p className="text-muted-foreground">View and manage all participating teams</p>
          </div>
          {user?.role === 'admin' && (
            <div className="flex gap-2">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  handleReset('fullReset');
                }}
                variant="destructive"
                size="sm"
                disabled={isResetting}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Full Reset
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  handleReset('teams');
                }}
                className="bg-orange-600 hover:bg-orange-700"
                size="sm"
                disabled={isResetting}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Teams
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  handleReset('players');
                }}
                className="bg-yellow-600 hover:bg-yellow-700"
                size="sm"
                disabled={isResetting}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Players
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  handleReset('deleteAll');
                }}
                className="bg-red-800 hover:bg-red-900"
                size="sm"
                disabled={isResetting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All Players
              </Button>
              <Button onClick={(e) => {
                e.preventDefault();
                openAddTeam();
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Team
              </Button>
            </div>
          )}
        </div>

        {teams.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No teams found. Use "Add Team" to create your first team.
            </CardContent>
          </Card>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {((team as any).logo) ? (
                      <img src={(team as any).logo} alt={team.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <div className="text-sm text-muted-foreground">{(team.players || []).length} players</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.preventDefault();
                      openSquadView(team);
                    }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {user?.role === 'admin' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={(e) => {
                          e.preventDefault();
                          openEditTeam(team);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={(e) => {
                          e.preventDefault();
                          handleDeleteTeam(team);
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Budget Remaining</span>
                    <span className="font-bold text-primary">
                      ₹{((team.remainingBudget || 0) / 10000000).toFixed(1)}Cr
                    </span>
                  </div>
                  <Progress 
                    value={((team.remainingBudget || 0) / (team.budget || 1)) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{(((team.remainingBudget || 0) / (team.budget || 1)) * 100).toFixed(0)}% remaining</span>
                    <span>Total: ₹{((team.budget || 0) / 10000000).toFixed(1)}Cr</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold">{(team.players || []).length}</p>
                    <p className="text-xs text-muted-foreground">Squad Size</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">
                      {(((team.budget || 0) - (team.remainingBudget || 0)) / 10000000).toFixed(1)}Cr
                    </p>
                    <p className="text-xs text-muted-foreground">Spent</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                    Active
                  </Badge>
                  {(team.players || []).length >= 18 && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                      Min Squad ✓
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}
        <Dialog open={showTeamModal} onOpenChange={setShowTeamModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTeam ? 'Edit Team' : 'Add Team'}</DialogTitle>
              <DialogDescription>
                Set team name, optional logo URL, and assign an owner from existing users.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input id="team-name" value={teamForm.name} onChange={(e) => setTeamForm({...teamForm, name: e.target.value})} placeholder="Enter team name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-logo">Team Logo URL</Label>
                <Input id="team-logo" value={teamForm.logo} onChange={(e) => setTeamForm({...teamForm, logo: e.target.value})} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-owner">Team Owner</Label>
                <select id="team-owner" className="w-full h-10 rounded-md border bg-transparent px-3 text-sm" value={teamForm.ownerId} onChange={(e) => setTeamForm({...teamForm, ownerId: e.target.value})}>
                  <option value="">No Owner</option>
                  {owners.map(o => (
                    <option key={o.id} value={o.id}>{o.name} ({o.email})</option>
                  ))}
                </select>
                <div className="text-xs text-muted-foreground">Need to create an owner? Use Add User on Users page and select Team Owner role.</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-budget">Team Budget (₹)</Label>
                <Input id="team-budget" type="number" value={teamForm.budget} onChange={(e) => setTeamForm({...teamForm, budget: parseInt(e.target.value || '0', 10)})} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={(e) => {
                  e.preventDefault();
                  setShowTeamModal(false);
                }}>Cancel</Button>
                <Button onClick={(e) => {
                  e.preventDefault();
                  saveTeam();
                }}>{editingTeam ? 'Update Team' : 'Create Team'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        <ConfirmationDialog
           open={showResetConfirm}
           onOpenChange={setShowResetConfirm}
           title="Confirm Reset Action"
           description={
             resetType === 'fullReset' ? 'This will reset all teams to initial state AND make all players available for auction. This action cannot be undone.' :
             resetType === 'teams' ? 'This will reset all teams to their initial state (empty rosters, full budgets). This action cannot be undone.' :
             resetType === 'players' ? 'This will make all players available for auction again. This action cannot be undone.' :
             'This will permanently delete all players from the database. This action cannot be undone.'
           }
           onConfirm={confirmReset}
           confirmText="Confirm Reset"
           variant="destructive"
           loading={isResetting}
         />
        
        <ConfirmationDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete Team"
          description={`Are you sure you want to delete team "${deletingTeam?.name}"? This action cannot be undone.`}
          onConfirm={confirmDeleteTeam}
          confirmText="Delete Team"
          variant="destructive"
        />

        <Dialog open={showSquadModal} onOpenChange={setShowSquadModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                {selectedTeam?.name} Squad
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Players List */}
              <div className="space-y-3">
                {squadPlayers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No players in this squad yet</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {squadPlayers.map((player) => {
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
                        <div key={player.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h5 className="font-medium">{player.name}</h5>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={`text-xs ${getRoleColor(player.role)}`}>
                                   {player.role}
                                 </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary">
                              ₹{((player.finalPrice || 0) / 10000000).toFixed(1)}Cr
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Base: ₹{((player.basePrice || 0) / 10000000).toFixed(1)}Cr
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}