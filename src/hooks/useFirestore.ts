import { useState, useEffect, useCallback } from 'react';
import { playerApi, teamApi, userApi } from '@/api';
import { Player, Team, User } from '@/types';

/**
 * Custom hook for managing players data
 */
export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const playersData = await playerApi.getAllPlayers();
      setPlayers(playersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch players');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = playerApi.subscribeToPlayers((updatedPlayers) => {
      setPlayers(updatedPlayers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    players,
    loading,
    error,
    refetch: fetchPlayers
  };
}

/**
 * Custom hook for managing teams data
 */
export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const teamsData = await teamApi.getAllTeams();
      setTeams(teamsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = teamApi.subscribeToTeams((updatedTeams) => {
      setTeams(updatedTeams);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    teams,
    loading,
    error,
    refetch: fetchTeams
  };
}

/**
 * Custom hook for managing users data
 */
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await userApi.getAllUsers();
      setUsers(usersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers
  };
}

/**
 * Custom hook for managing a single player
 */
export function usePlayer(playerId: string | null) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) {
      setPlayer(null);
      setLoading(false);
      return;
    }

    const fetchPlayer = async () => {
      try {
        setLoading(true);
        setError(null);
        const playerData = await playerApi.getPlayerById(playerId);
        setPlayer(playerData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch player');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [playerId]);

  return {
    player,
    loading,
    error
  };
}

/**
 * Custom hook for managing team players
 */
export function useTeamPlayers(teamId: string | null) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    const fetchTeamPlayers = async () => {
      try {
        setLoading(true);
        setError(null);
        const playersData = await playerApi.getPlayersByTeam(teamId);
        setPlayers(playersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch team players');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamPlayers();
  }, [teamId]);

  return {
    players,
    loading,
    error
  };
}