import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { teamService, playerService, Team, Player } from '../../../lib/firebaseServices';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { formatCurrency } from '@/utils';
import { Eye, Users, IndianRupee } from 'lucide-react';

/**
 * PublicSquadsPage
 * A public, view-only page that lists all teams and lets visitors
 * view each squad without requiring login. No edit or delete actions.
 */
export function PublicSquadsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const [showSquadModal, setShowSquadModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [squadPlayers, setSquadPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const allTeams = await teamService.getAllTeams();
        const allPlayers = await playerService.getAllPlayers();
        setTeams(allTeams);
        // Only show sold players in squads; fall back to all if not set
        setPlayers(allPlayers);
      } catch (error) {
        console.error('Error loading public squads data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const unsubTeams = teamService.subscribeToTeams(() => loadData());
    const unsubPlayers = playerService.subscribeToPlayers(() => loadData());

    return () => {
      unsubTeams && unsubTeams();
      unsubPlayers && unsubPlayers();
    };
  }, []);

  const openSquadView = async (team: Team) => {
    try {
      setSelectedTeam(team);
      const teamPlayers = players.filter((p) => team.players && team.players.includes(p.id));
      setSquadPlayers(teamPlayers);
      setShowSquadModal(true);
    } catch (error) {
      console.error('Error loading squad:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'batsman':
        return 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10';
      case 'bowler':
        return 'text-blue-400 border-blue-400/30 bg-blue-500/10';
      case 'all-rounder':
        return 'text-green-400 border-green-400/30 bg-green-500/10';
      case 'wk':
      case 'wicketkeeper':
        return 'text-purple-400 border-purple-400/30 bg-purple-500/10';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Thoughtwin Premier League — Team Squads</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Loading squads…</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      {team.logo ? (
                        <ImageWithFallback src={team.logo} alt={team.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                          {team.name.split(' ').map((w: string) => w[0]).join('').slice(0,2)}
                        </div>
                      )}
                      {team.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openSquadView(team)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <div className="font-bold text-base sm:text-lg">{team.players?.length || 0}</div>
                      <div className="text-xs text-muted-foreground">Players</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-base sm:text-lg">{formatCurrency((team.budget || 120000000) - (team.remainingBudget || 0))}</div>
                      <div className="text-xs text-muted-foreground">Spent</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-base sm:text-lg">{formatCurrency(team.remainingBudget || 0)}</div>
                      <div className="text-xs text-muted-foreground">Remaining</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Budget bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Budget Remaining</span>
                      <span className="font-bold text-primary">{formatCurrency(team.remainingBudget || 0)}</span>
                    </div>
                    <Progress value={Math.max(0, Math.min(100, ((team.remainingBudget || 0) / (team.budget || 1)) * 100))} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {Math.round(((team.remainingBudget || 0) / (team.budget || 1)) * 100)}% remaining
                      </span>
                      <span>Total: {formatCurrency(team.budget || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Squad Modal (view-only) */}
      <Dialog open={showSquadModal} onOpenChange={setShowSquadModal}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTeam?.name} Squad</DialogTitle>
            <DialogDescription>View-only roster of players for this team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {squadPlayers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No players in this team yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {squadPlayers.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-3 rounded-md border">
                    <div className="flex items-center gap-3">
                      <ImageWithFallback src={player.image} alt={player.name} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <div className="font-medium">{player.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${getRoleColor(player.role)}`}>{player.role}</Badge>
                          <Badge variant="outline" className="text-xs">{player.status}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary flex items-center justify-end gap-1">
                        <IndianRupee className="w-3 h-3" />
                        {(player.finalPrice ? formatCurrency(player.finalPrice) : '-')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}