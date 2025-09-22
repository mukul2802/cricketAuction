import React, { useState, useMemo } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatsCard, SearchBar, DataTable, LoadingState, EmptyState, AddButton, EditButton, DeleteButton, type Column, type Action } from '@/components/common';
import { usePlayers } from '@/hooks';
import { Player } from '@/types';
import { PageType } from '@/components/Router';
import {
  Plus,
  Edit,
  Trash2,
  Star,
  Users,
  Trophy,
  IndianRupee,
  Calendar,
  MapPin
} from 'lucide-react';

interface PlayerManagementProps {
  onNavigate: (page: PageType) => void;
}

export function PlayerManagement({ onNavigate }: PlayerManagementProps) {
  const { players, loading, refetch } = usePlayers();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    role: '',
    basePrice: 0,
    age: 0,
    matches: 0,
    description: ''
  });

  // Filter and search players
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           player.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || player.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'sold' && player.teamId) ||
                           (statusFilter === 'unsold' && !player.teamId);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [players, searchTerm, roleFilter, statusFilter]);

  // Get unique roles for filter
  const roles = useMemo(() => {
    const uniqueRoles = [...new Set(players.map(p => p.role))];
    return uniqueRoles.sort();
  }, [players]);

  const handleAddPlayer = async () => {
    if (!newPlayer.name || !newPlayer.role) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // TODO: Implement playersApi.add when API is ready
      console.log('Adding player:', newPlayer);
      
      setNewPlayer({
        name: '',
        role: '',
        basePrice: 0,
        age: 0,
        matches: 0,
        description: ''
      });
      setIsAddDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Error adding player:', error);
      alert('Failed to add player');
    }
  };

  const handleEditPlayer = async () => {
    if (!editingPlayer) return;

    try {
      // TODO: Implement playersApi.update when API is ready
      console.log('Updating player:', editingPlayer);
      setEditingPlayer(null);
      refetch();
    } catch (error) {
      console.error('Error updating player:', error);
      alert('Failed to update player');
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('Are you sure you want to delete this player?')) {
      return;
    }

    try {
      // TODO: Implement playersApi.delete when API is ready
      console.log('Deleting player:', playerId);
      refetch();
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Failed to delete player');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading players...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout currentPage="players" onNavigate={onNavigate}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Player Management</h1>
            <p className="text-muted-foreground">Manage all players in the auction pool</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Player</DialogTitle>
                <DialogDescription>
                  Add a new player to the auction pool.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Role
                  </Label>
                  <Select value={newPlayer.role} onValueChange={(value) => setNewPlayer({...newPlayer, role: value})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Batsman">Batsman</SelectItem>
                      <SelectItem value="Bowler">Bowler</SelectItem>
                      <SelectItem value="All-rounder">All-rounder</SelectItem>
                      <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="basePrice" className="text-right">
                    Base Price
                  </Label>
                  <Input
                    id="basePrice"
                    type="number"
                    value={newPlayer.basePrice}
                    onChange={(e) => setNewPlayer({...newPlayer, basePrice: parseInt(e.target.value) || 0})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="age" className="text-right">
                    Age
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    value={newPlayer.age}
                    onChange={(e) => setNewPlayer({...newPlayer, age: parseInt(e.target.value) || 0})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="matches" className="text-right">
                    Matches
                  </Label>
                  <Input
                    id="matches"
                    type="number"
                    value={newPlayer.matches}
                    onChange={(e) => setNewPlayer({...newPlayer, matches: parseInt(e.target.value) || 0})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={newPlayer.description}
                    onChange={(e) => setNewPlayer({...newPlayer, description: e.target.value})}
                    className="col-span-3"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPlayer}>
                  Add Player
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Players"
            value={players.length}
            description="In auction pool"
            icon={Users}
          />
          <StatsCard
            title="Sold Players"
            value={players.filter(p => p.teamId).length}
            description="Have teams"
            icon={Trophy}
          />
          <StatsCard
            title="Unsold Players"
            value={players.filter(p => !p.teamId).length}
            description="Available"
            icon={Star}
          />
          <StatsCard
            title="Avg Base Price"
            value={`₹${players.length > 0 ? Math.round(players.reduce((sum, p) => sum + p.basePrice, 0) / players.length).toLocaleString() : '0'}`}
            description="Per player"
            icon={IndianRupee}
          />
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Player Management</CardTitle>
            <CardDescription>Manage cricket players and their auction details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <SearchBar
                searchQuery={searchTerm}
                onSearchChange={setSearchTerm}
                placeholder="Search players by name or role..."
                filters={[
                  {
                    label: 'Role',
                    value: roleFilter,
                    onChange: setRoleFilter,
                    options: [
                      { value: 'all', label: 'All Roles' },
                      ...roles.map(role => ({ value: role, label: role }))
                    ]
                  },
                  {
                    label: 'Status',
                    value: statusFilter,
                    onChange: setStatusFilter,
                    options: [
                      { value: 'all', label: 'All Status' },
                      { value: 'sold', label: 'Sold' },
                      { value: 'unsold', label: 'Unsold' }
                    ]
                  }
                ]}
                actions={
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <AddButton>Add Player</AddButton>
                    </DialogTrigger>
                  </Dialog>
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Players Table */}
        {filteredPlayers.length === 0 ? (
           <EmptyState
             icon={Star}
             title="No Players Found"
             description={
               searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                 ? 'Try adjusting your search or filters'
                 : 'No players have been added yet'
             }
             action={
               (!searchTerm && roleFilter === 'all' && statusFilter === 'all') ? {
                 label: 'Add First Player',
                 onClick: () => setIsAddDialogOpen(true)
               } : undefined
             }
           />
        ) : (
          <DataTable
            data={filteredPlayers}
            columns={[
              {
                key: 'name',
                header: 'Name',
                sortable: true,
                render: (player: Player) => (
                  <div>
                    <div className="font-medium">{player.name}</div>
                    <Badge variant="outline" className="mt-1">{player.role}</Badge>
                  </div>
                )
              },
              {
                key: 'basePrice',
                header: 'Base Price',
                sortable: true,
                render: (player: Player) => `₹${player.basePrice.toLocaleString()}`
              },
              {
                key: 'finalPrice',
                header: 'Final Price',
                sortable: true,
                render: (player: Player) => player.finalPrice ? `₹${player.finalPrice.toLocaleString()}` : '-'
              },
              {
                key: 'age',
                header: 'Age',
                sortable: true,
                render: (player: Player) => player.age ? `${player.age} years` : '-'
              },
              {
                key: 'matches',
                header: 'Matches',
                sortable: true,
                render: (player: Player) => player.matches || '-'
              },
              {
                key: 'status',
                header: 'Status',
                sortable: true,
                render: (player: Player) => (
                  <Badge variant={player.teamId ? 'default' : 'secondary'}>
                    {player.teamId ? 'Sold' : 'Available'}
                  </Badge>
                )
              }
            ]}
            actions={[
              {
                label: 'Edit',
                icon: <Edit className="w-4 h-4" />,
                onClick: (player: Player) => setEditingPlayer(player)
              },
              {
                label: 'Delete',
                icon: <Trash2 className="w-4 h-4" />,
                onClick: (player: Player) => handleDeletePlayer(player.id),
                variant: 'destructive'
              }
            ]}
          />
        )}

        {/* Edit Player Dialog */}
        {editingPlayer && (
          <Dialog open={!!editingPlayer} onOpenChange={() => setEditingPlayer(null)}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Player</DialogTitle>
                <DialogDescription>
                  Update player information.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="edit-name"
                    value={editingPlayer.name}
                    onChange={(e) => setEditingPlayer({...editingPlayer, name: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-role" className="text-right">
                    Role
                  </Label>
                  <Select 
                    value={editingPlayer.role} 
                    onValueChange={(value) => setEditingPlayer({...editingPlayer, role: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Batsman">Batsman</SelectItem>
                      <SelectItem value="Bowler">Bowler</SelectItem>
                      <SelectItem value="All-rounder">All-rounder</SelectItem>
                      <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-basePrice" className="text-right">
                    Base Price
                  </Label>
                  <Input
                    id="edit-basePrice"
                    type="number"
                    value={editingPlayer.basePrice}
                    onChange={(e) => setEditingPlayer({...editingPlayer, basePrice: parseInt(e.target.value) || 0})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-age" className="text-right">
                    Age
                  </Label>
                  <Input
                    id="edit-age"
                    type="number"
                    value={editingPlayer.age || ''}
                    onChange={(e) => setEditingPlayer({...editingPlayer, age: parseInt(e.target.value) || undefined})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-matches" className="text-right">
                    Matches
                  </Label>
                  <Input
                    id="edit-matches"
                    type="number"
                    value={editingPlayer.matches || ''}
                    onChange={(e) => setEditingPlayer({...editingPlayer, matches: parseInt(e.target.value) || undefined})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={editingPlayer.description || ''}
                    onChange={(e) => setEditingPlayer({...editingPlayer, description: e.target.value})}
                    className="col-span-3"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingPlayer(null)}>
                  Cancel
                </Button>
                <Button onClick={handleEditPlayer}>
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}      </div>
    </MainLayout>
  );
}