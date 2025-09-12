import React, { useState, useEffect } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { PlayerForm } from '../ui/player-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { PageType } from '../Router';
import { useAuth } from '../../contexts/AuthContext';
import { playerService, Player, targetPlayerService } from '../../lib/firebaseServices';
import { toast } from 'sonner';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import {
  Search,
  Filter,
  Plus,
  Star,
  TrendingUp,
  IndianRupee,
  Eye,
  Edit,
  Target,
  MoreHorizontal,
  Trash2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface PlayersPageProps {
  onNavigate: (page: PageType) => void;
}

export function PlayersPage({ onNavigate }: PlayersPageProps) {
  const { user, teams } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [targetPlayers, setTargetPlayers] = useState<string[]>([]);
  const [myTeam, setMyTeam] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);

  // Load players from Firebase
  useEffect(() => {
    loadPlayers();
  }, []);

  // Load user's team for target players functionality
  useEffect(() => {
    if (user?.role === 'owner') {
      // Find team by ownerId instead of user.teamId
      const team = teams.find(t => t.ownerId === user.id);
      setMyTeam(team);
      
      // Load existing target players for this team
       if (team) {
         targetPlayerService.getTargetPlayersByTeam(team.id).then((targets) => {
           setTargetPlayers(targets.map((t) => t.playerId));
         }).catch((error) => {
           console.error('Error loading target players:', error);
         });
       }
    }
  }, [user, teams]);

  // Set up real-time listener for players
  useEffect(() => {
    const unsubscribe = playerService.subscribeToPlayers((playersData: Player[]) => {
      setPlayers(playersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const playersData = await playerService.getAllPlayers();
      setPlayers(playersData);
    } catch (error) {
      console.error('Error loading players:', error);
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };
  
  // Form state for adding/editing players
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    basePrice: '',
    imageUrl: '',
    team: '',
    soldPrice: '',
    status: '',
    matches: '',
    runs: '',
    wickets: '',
    average: '',
    strikeRate: '',
    economyRate: '',
    overs: '',
    battingHand: '',
    bowlingHand: ''
  });

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || player.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || player.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sold': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'unsold': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'available': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'batsman': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'bowler': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'wicket-keeper': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'all-rounder': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      role: '',
      basePrice: '',
      imageUrl: '',
      team: '',
      soldPrice: '',
      status: '',
      matches: '',
      runs: '',
      wickets: '',
      average: '',
      strikeRate: '',
      economyRate: '',
      overs: '',
      battingHand: '',
      bowlingHand: ''
    });
  };

  const handleAddPlayer = async () => {
    try {
      if (formData.soldPrice && isNaN(Number(formData.soldPrice))) {
        toast.error('Sold Price must be a number');
        return;
      }
      const playerData = {
        name: formData.name,
        role: formData.role,
        basePrice: parseInt(formData.basePrice),
        status: 'active' as const,
        image: formData.imageUrl,
        age: 0,
        matches: parseInt(formData.matches) || 0,
        runs: parseInt(formData.runs) || 0,
        wickets: parseInt(formData.wickets) || 0,
        battingAvg: parseFloat(formData.average) || 0,
        bowlingAvg: 0,
        economy: parseFloat(formData.economyRate) || 0,
        strikeRate: parseFloat(formData.strikeRate) || 0
      };

      await playerService.createPlayer(playerData);
      toast.success('Player added successfully');
      setShowAddDialog(false);
      resetFormData();
      loadPlayers();
    } catch (error) {
      console.error('Error adding player:', error);
      toast.error('Failed to add player');
    }
  };

  const handleOpenAddDialog = () => {
    resetFormData();
    setShowAddDialog(true);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      role: player.role,
      basePrice: player.basePrice.toString(),
      imageUrl: player.image || '',
      team: getTeamName(player.teamId) || '',
      soldPrice: player.finalPrice?.toString() || '',
      status: player.status || '',
      matches: player.matches?.toString() || '',
      runs: player.runs?.toString() || '',
      wickets: player.wickets?.toString() || '',
      average: player.battingAvg?.toString() || '',
      strikeRate: player.strikeRate?.toString() || '',
      economyRate: player.economy?.toString() || '',
      overs: '',
      battingHand: '',
      bowlingHand: ''
    });
    setShowEditDialog(true);
  };

  const handleUpdatePlayer = async () => {
    if (!editingPlayer) return;

    try {
      if (formData.soldPrice && isNaN(Number(formData.soldPrice))) {
        toast.error('Sold Price must be a number');
        return;
      }
      const playerData = {
        name: formData.name,
        role: formData.role,
        basePrice: parseInt(formData.basePrice),
        image: formData.imageUrl,
        matches: parseInt(formData.matches) || 0,
        runs: parseInt(formData.runs) || 0,
        wickets: parseInt(formData.wickets) || 0,
        battingAvg: parseFloat(formData.average) || 0,
        economy: parseFloat(formData.economyRate) || 0,
        strikeRate: parseFloat(formData.strikeRate) || 0
      };

      await playerService.updatePlayer(editingPlayer.id, playerData);
      toast.success('Player updated successfully');
      setShowEditDialog(false);
      setEditingPlayer(null);
      resetFormData();
      loadPlayers();
    } catch (error) {
      console.error('Error updating player:', error);
      toast.error('Failed to update player');
    }
  };

  const handleDeletePlayer = (player: Player) => {
    setDeletingPlayer(player);
    setShowDeleteDialog(true);
  };

  const confirmDeletePlayer = async () => {
    if (!deletingPlayer) return;

    try {
      await playerService.deletePlayer(deletingPlayer.id);
      toast.success('Player deleted successfully');
      setShowDeleteDialog(false);
      setDeletingPlayer(null);
      loadPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
      toast.error('Failed to delete player');
    }
  };

  const toggleTargetPlayer = async (playerId: string) => {
    // For team owners, use their team ID. For admins/managers, allow them to select a team
    let teamId = myTeam?.id;
    
    if (!teamId && (user?.role === 'admin' || user?.role === 'manager')) {
      // For admin/manager without a team, use the first available team or prompt for selection
      if (teams.length > 0) {
        teamId = teams[0].id;
      } else {
        toast.error('No teams available');
        return;
      }
    }
    
    if (!teamId) {
      toast.error('Team information not available');
      return;
    }

    try {
      if (targetPlayers.includes(playerId)) {
        // Remove from target players
        await targetPlayerService.removeTargetPlayerByPlayerAndTeam(teamId, playerId);
        setTargetPlayers(targetPlayers.filter(id => id !== playerId));
        toast.success('Player removed from target list');
      } else {
        // Add to target players with medium priority by default
        await targetPlayerService.addTargetPlayer(teamId, playerId, 'medium');
        setTargetPlayers([...targetPlayers, playerId]);
        toast.success('Player added to target list');
      }
    } catch (error) {
      console.error('Error updating target player:', error);
      toast.error('Failed to update target player');
    }
  };

  const getTeamName = (teamId?: string) => {
    if (!teamId) return null;
    const team = teams.find(t => t.id === teamId);
    return team?.name;
  };

  return (
    <MainLayout currentPage="players" onNavigate={onNavigate}>
      <div className="p-6 space-y-6">
        {/* Header and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Players Database</h1>
            <p className="text-muted-foreground">Manage and view all cricket players</p>
          </div>
          {user?.role === 'admin' && (
            <div className="flex items-center gap-2">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={(e) => {
                    e.preventDefault();
                    handleOpenAddDialog();
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Player
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Player</DialogTitle>
                    <DialogDescription>
                      Enter the details for the new player including their basic information and statistics.
                    </DialogDescription>
                  </DialogHeader>
                  <PlayerForm
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleAddPlayer}
                    onCancel={() => setShowAddDialog(false)}
                    showStats={user?.role === 'admin'}
                    showTeamFields={user?.role === 'admin'}
                    teams={teams}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Players</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or country..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="batsman">Batsman</SelectItem>
                    <SelectItem value="bowler">Bowler</SelectItem>
                    <SelectItem value="wicket-keeper">Wicket-Keeper</SelectItem>
                    <SelectItem value="all-rounder">All-Rounder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="unsold">Unsold</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>


            </div>
          </CardContent>
        </Card>

        {/* Players Table */}
        <Card>
          <CardHeader>
            <CardTitle>Players ({filteredPlayers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2">Loading players...</span>
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6">No players match your filters or the database is empty. Add players or adjust filters.</div>
            ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Sold Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Team</TableHead>
                    {user?.role !== 'manager' && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ImageWithFallback
                            src={player.image}
                            alt={player.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(player as any).nationality || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRoleColor(player.role)}>
                          {player.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            {(player as any).rating || 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {player.matches || 0} matches
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(player.runs || 0) > 0 && `${player.runs} runs`}
                            {(player.runs || 0) > 0 && (player.wickets || 0) > 0 && ', '}
                            {(player.wickets || 0) > 0 && `${player.wickets} wickets`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" />
                          {(player.basePrice / 100000).toFixed(1)}L
                        </div>
                      </TableCell>
                      <TableCell>
                        {player.finalPrice ? (
                          <div className="flex items-center gap-1 text-green-400">
                            <IndianRupee className="w-3 h-3" />
                            {(player.finalPrice / 10000000).toFixed(1)}Cr
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(player.status)}>
                          {player.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getTeamName(player.teamId) || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      {user?.role !== 'manager' && (
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1">
                            {user?.role === 'owner' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleTargetPlayer(player.id);
                                }}
                                className={targetPlayers.includes(player.id) ? 'text-yellow-500' : ''}
                              >
                                <Target className="w-4 h-4" />
                              </Button>
                            )}
                            
                            {(user?.role === 'admin') && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleEditPlayer(player);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDeletePlayer(player);
                                  }}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Player Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Player</DialogTitle>
              <DialogDescription>
                Update the player's information, team assignment, and statistics.
              </DialogDescription>
            </DialogHeader>
            <PlayerForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleUpdatePlayer}
              onCancel={() => setShowEditDialog(false)}
              isEditing={true}
              showStats={user?.role === 'admin'}
              showTeamFields={user?.role === 'admin'}
              teams={teams}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Player Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Player</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {deletingPlayer?.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={(e) => {
                e.preventDefault();
                confirmDeletePlayer();
              }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Player
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}