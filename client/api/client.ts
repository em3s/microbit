const BASE = '/api';

export async function submitScore(playerName: string, gameId: string, score: number) {
  const res = await fetch(`${BASE}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, gameId, score: Math.floor(score) }),
  });
  return res.json() as Promise<{ rank: number; isNewBest: boolean }>;
}

export async function getLeaderboard(gameId: string, limit = 20) {
  const res = await fetch(`${BASE}/leaderboard/${gameId}?limit=${limit}`);
  return res.json() as Promise<Array<{ playerName: string; score: number; createdAt: string }>>;
}

export async function getAdminStatus() {
  const res = await fetch(`${BASE}/admin/status`);
  return res.json() as Promise<{ activeGame: string; totalScores: number }>;
}

export async function resetScores(gameId: string) {
  const res = await fetch(`${BASE}/admin/scores/${gameId}`, { method: 'DELETE' });
  return res.json();
}
