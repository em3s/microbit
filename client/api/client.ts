const BASE = '/api';

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export function submitScore(playerName: string, gameId: string, score: number) {
  return fetchJSON<{ rank: number; isNewBest: boolean }>(`${BASE}/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, gameId, score: Math.floor(score) }),
  });
}

export function getLeaderboard(gameId: string, limit = 20) {
  return fetchJSON<Array<{ playerName: string; score: number; createdAt: string }>>(
    `${BASE}/leaderboard/${gameId}?limit=${limit}`
  );
}

export function getAdminStatus() {
  return fetchJSON<{ totalScores: number }>(`${BASE}/admin/status`);
}

export function resetScores(gameId: string) {
  return fetchJSON<{ ok: boolean }>(`${BASE}/admin/scores/${gameId}`, { method: 'DELETE' });
}
