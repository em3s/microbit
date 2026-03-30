import { useState, useEffect, useCallback } from 'react';
import { getLeaderboard } from '../api/client';

export interface LeaderboardEntry {
  playerName: string;
  score: number;
  createdAt: string;
}

export function useLeaderboard(gameId: string, pollInterval = 3000) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  const refresh = useCallback(async () => {
    try {
      const data = await getLeaderboard(gameId);
      setEntries(data);
    } catch {}
  }, [gameId]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollInterval);
    return () => clearInterval(id);
  }, [refresh, pollInterval]);

  return { entries, refresh };
}
