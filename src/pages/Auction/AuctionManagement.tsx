// React hooks for component state and performance optimization
import React, { useState, useMemo, useCallback } from 'react';

// UI components for the auction management interface
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Custom hooks and API services
import { useAuth, useTeams, usePlayers } from '@/hooks';
import { auctionApi } from '@/api/auction';
import { Auction, AuctionStatus, Player, Team } from '@/types';

// Icons for the auction management interface
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Gavel,
  Play,
  Pause,
  Square,
  Clock,
  Users,
  Trophy,
  DollarSign,
  Calendar,
  Timer
} from 'lucide-react';

// Props interface for the AuctionManagement component
interface AuctionManagementProps {
  onNavigate?: (page: string) => void; // Optional navigation function to switch between pages
}

/**
 * AuctionManagement Component
 * 
 * This component provides a comprehensive interface for managing cricket auctions:
 * - View all created auctions with their status and details
 * - Create new auctions with customizable parameters
 * - Edit existing auction configurations
 * - Delete auctions that are no longer needed
 * - Filter and search through auctions
 * - Monitor auction progress and statistics
 * 
 * Only accessible to admin users who have permission to manage auctions.
 */
export function AuctionManagement({ onNavigate }: AuctionManagementProps) {
  // Authentication and data hooks
  const { user } = useAuth(); // Current logged-in user information
  const { teams } = useTeams(); // All teams participating in auctions
  const { players } = usePlayers(); // All players available for auctions
  
  // Auction data state
  const [auctions, setAuctions] = useState<Auction[]>([]); // List of all auctions
  const [loading, setLoading] = useState(true); // Loading state for initial data fetch
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState(''); // Search query for auction titles/descriptions
  const [statusFilter, setStatusFilter] = useState<string>('all'); // Filter auctions by status
  
  // Dialog and form state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false); // Controls "Add Auction" dialog visibility
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null); // Auction currently being edited
  
  // New auction form data with default values
  const [newAuction, setNewAuction] = useState({
    title: '', // Auction name/title
    description: '', // Detailed auction description
    startTime: '', // Scheduled start date and time
    endTime: '', // Scheduled end date and time
    playerIds: [] as string[], // List of player IDs to include in this auction
    maxTeams: 8, // Maximum number of teams that can participate
    baseBudget: 100000000, // Starting budget for each team (10 crores in rupees)
    status: 'scheduled' as AuctionStatus // Initial status when creating new auction
  });

  // Load auctions when component first mounts
  React.useEffect(() => {
    loadAuctions();
  }, []);

  /**
   * Loads all auctions from the database
   * 
   * This function fetches the complete list of auctions and updates the component state.
   * It handles loading states and error scenarios gracefully.
   */
  const loadAuctions = useCallback(async () => {
    try {
      setLoading(true); // Show loading indicator while fetching data
      const auctionsData = await auctionApi.getAllAuctions(); // Fetch auctions from API
      setAuctions(auctionsData); // Update state with fetched auctions
    } catch (error) {
      console.error('Error loading auctions:', error); // Log any errors for debugging
    } finally {
      setLoading(false); // Hide loading indicator regardless of success/failure
    }
  }, []);

  // Memoize search and filter operations for better performance
  const searchTermLower = useMemo(() => searchTerm.toLowerCase(), [searchTerm]);
  
  /**
   * Memoized search and filter logic for auctions
   * 
   * This optimized function filters the auction list based on:
   * - Search term: matches auction title or description (case-insensitive)
   * - Status filter: shows all auctions or filters by specific status
   * 
   * Uses useMemo to prevent unnecessary recalculations on every render.
   */
  const filteredAuctions = useMemo(() => {
    return auctions.filter(auction => {
      // Check if auction title or description contains the search term
      const matchesSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          auction.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Check if auction status matches the selected filter (or show all)
      const matchesStatus = statusFilter === 'all' || auction.status === statusFilter;
      
      // Return auctions that match both search and status criteria
      return matchesSearch && matchesStatus;
    });
  }, [auctions, searchTerm, statusFilter]); // Recalculate only when these dependencies change

  // Get status badge color
  const getStatusBadgeVariant = (status: AuctionStatus) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'scheduled': return 'outline';
      case 'paused': return 'destructive';
      default: return 'outline';
    }
  };

  // Get status icon
  const getStatusIcon = (status: AuctionStatus) => {
    switch (status) {
      case 'active': return Play;
      case 'completed': return Trophy;
      case 'scheduled': return Clock;
      case 'paused': return Pause;
      default: return Square;
    }
  };

  const handleAddAuction = async () => {
    try {
      await auctionApi.createAuction({
        title: newAuction.title,
        description: newAuction.description,
        startTime: new Date(newAuction.startTime),
        endTime: new Date(newAuction.endTime),
        playerIds: newAuction.playerIds,
        maxTeams: newAuction.maxTeams,
        baseBudget: newAuction.baseBudget,
        status: newAuction.status,
        createdBy: user?.id || '',
        teams: [],
        currentPlayerIndex: 0,
        bids: []
      });
      
      setNewAuction({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        playerIds: [],
        maxTeams: 8,
        baseBudget: 100000000,
        status: 'scheduled'
      });
      setIsAddDialogOpen(false);
      loadAuctions();
    } catch (error) {
      console.error('Error adding auction:', error);
    }
  };

  const handleEditAuction = async () => {
    if (!editingAuction) return;
    
    try {
      await auctionApi.updateAuction(editingAuction.id, editingAuction);
      setEditingAuction(null);
      loadAuctions();
    } catch (error) {
      console.error('Error updating auction:', error);
    }
  };

  const handleDeleteAuction = async (auctionId: string) => {
    if (window.confirm('Are you sure you want to delete this auction?')) {
      try {
        await auctionApi.deleteAuction(auctionId);
        loadAuctions();
      } catch (error) {
        console.error('Error deleting auction:', error);
      }
    }
  };

  const handleStartAuction = async (auctionId: string) => {
    try {
      await auctionApi.startAuction(auctionId);
      loadAuctions();
    } catch (error) {
      console.error('Error starting auction:', error);
    }
  };

  const handlePauseAuction = async (auctionId: string) => {
    try {
      await auctionApi.pauseAuction(auctionId);
      loadAuctions();
    } catch (error) {
      console.error('Error pausing auction:', error);
    }
  };

  const handleEndAuction = async (auctionId: string) => {
    try {
      await auctionApi.endAuction(auctionId);
      loadAuctions();
    } catch (error) {
      console.error('Error ending auction:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading auctions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Auction Management</h1>
            <p className="text-muted-foreground">Create and manage cricket player auctions</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Auction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Auction</DialogTitle>
                <DialogDescription>
                  Set up a new cricket player auction.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={newAuction.title}
                    onChange={(e) => setNewAuction({...newAuction, title: e.target.value})}
                    className="col-span-3"
                    placeholder="IPL 2024 Auction"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={newAuction.description}
                    onChange={(e) => setNewAuction({...newAuction, description: e.target.value})}
                    className="col-span-3"
                    placeholder="Annual player auction for IPL 2024 season"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startTime" className="text-right">
                    Start Time
                  </Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={newAuction.startTime}
                    onChange={(e) => setNewAuction({...newAuction, startTime: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endTime" className="text-right">
                    End Time
                  </Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={newAuction.endTime}
                    onChange={(e) => setNewAuction({...newAuction, endTime: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="maxTeams" className="text-right">
                    Max Teams
                  </Label>
                  <Input
                    id="maxTeams"
                    type="number"
                    value={newAuction.maxTeams}
                    onChange={(e) => setNewAuction({...newAuction, maxTeams: parseInt(e.target.value) || 8})}
                    className="col-span-3"
                    min="2"
                    max="16"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="baseBudget" className="text-right">
                    Base Budget
                  </Label>
                  <Input
                    id="baseBudget"
                    type="number"
                    value={newAuction.baseBudget}
                    onChange={(e) => setNewAuction({...newAuction, baseBudget: parseInt(e.target.value) || 100000000})}
                    className="col-span-3"
                    placeholder="100000000"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAuction}>
                  Create Auction
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Auctions</CardTitle>
              <Gavel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auctions.length}</div>
              <p className="text-xs text-muted-foreground">All time auctions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auctions.filter(a => a.status === 'active').length}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auctions.filter(a => a.status === 'scheduled').length}</div>
              <p className="text-xs text-muted-foreground">Upcoming auctions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auctions.filter(a => a.status === 'completed').length}</div>
              <p className="text-xs text-muted-foreground">Finished auctions</p>
            </CardContent>
          </Card>
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
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search auctions by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Auctions List */}
        <Card>
          <CardHeader>
            <CardTitle>Auctions ({filteredAuctions.length})</CardTitle>
            <CardDescription>
              {searchTerm || statusFilter !== 'all' 
                ? `Showing ${filteredAuctions.length} of ${auctions.length} auctions`
                : `All ${auctions.length} auctions`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAuctions.length === 0 ? (
              <div className="text-center py-8">
                <Gavel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Auctions Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'No auctions have been created yet'
                  }
                </p>
                {(!searchTerm && statusFilter === 'all') && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Auction
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredAuctions.map((auction) => {
                  const StatusIcon = getStatusIcon(auction.status);
                  return (
                    <div key={auction.id} className="border rounded-lg p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <StatusIcon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{auction.title}</h3>
                            <Badge variant={getStatusBadgeVariant(auction.status)} className="mt-1">
                              {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {auction.status === 'scheduled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartAuction(auction.id)}
                              title="Start Auction"
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          )}
                          {auction.status === 'active' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePauseAuction(auction.id)}
                                title="Pause Auction"
                              >
                                <Pause className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEndAuction(auction.id)}
                                title="End Auction"
                              >
                                <Square className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          {auction.status === 'paused' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartAuction(auction.id)}
                              title="Resume Auction"
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingAuction(auction)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteAuction(auction.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{auction.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Start</p>
                            <p className="text-muted-foreground">{formatDateTime(auction.startTime)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">End</p>
                            <p className="text-muted-foreground">{formatDateTime(auction.endTime)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Teams</p>
                            <p className="text-muted-foreground">{auction.teams.length}/{auction.maxTeams}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Budget</p>
                            <p className="text-muted-foreground">{formatCurrency(auction.baseBudget)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {auction.playerIds.length} players • {auction.bids.length} bids
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onNavigate?.(`auction/${auction.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Auction Dialog */}
        {editingAuction && (
          <Dialog open={!!editingAuction} onOpenChange={() => setEditingAuction(null)}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Auction</DialogTitle>
                <DialogDescription>
                  Update auction information.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="edit-title"
                    value={editingAuction.title}
                    onChange={(e) => setEditingAuction({...editingAuction, title: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={editingAuction.description}
                    onChange={(e) => setEditingAuction({...editingAuction, description: e.target.value})}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-maxTeams" className="text-right">
                    Max Teams
                  </Label>
                  <Input
                    id="edit-maxTeams"
                    type="number"
                    value={editingAuction.maxTeams}
                    onChange={(e) => setEditingAuction({...editingAuction, maxTeams: parseInt(e.target.value) || 8})}
                    className="col-span-3"
                    min="2"
                    max="16"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-baseBudget" className="text-right">
                    Base Budget
                  </Label>
                  <Input
                    id="edit-baseBudget"
                    type="number"
                    value={editingAuction.baseBudget}
                    onChange={(e) => setEditingAuction({...editingAuction, baseBudget: parseInt(e.target.value) || 100000000})}
                    className="col-span-3"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingAuction(null)}>
                  Cancel
                </Button>
                <Button onClick={handleEditAuction}>
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}