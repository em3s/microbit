import path from 'path';
import fs from 'fs';

let DATA_DIR: string;
let SCORES_PATH: string;

export interface ScoreEntry {
  playerName: string;
  gameId: string;
  score: number;
  createdAt: string;
}

let scores: ScoreEntry[] = [];

export function initDB(baseDir: string) {
  DATA_DIR = path.join(baseDir, 'data');
  SCORES_PATH = path.join(DATA_DIR, 'scores.csv');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(SCORES_PATH)) {
    const lines = fs.readFileSync(SCORES_PATH, 'utf-8').trim().split('\n');
    // 첫 줄 헤더 스킵
    for (let i = 1; i < lines.length; i++) {
      const [playerName, gameId, score, createdAt] = lines[i].split(',');
      if (playerName) {
        scores.push({ playerName, gameId, score: Number(score), createdAt });
      }
    }
  }
}

function save() {
  const header = 'playerName,gameId,score,createdAt';
  const rows = scores.map(s => `${s.playerName},${s.gameId},${s.score},${s.createdAt}`);
  fs.writeFileSync(SCORES_PATH, [header, ...rows].join('\n') + '\n');
}

/** 1인 1건 최고점 upsert. 갱신 여부 반환 */
export function upsertScore(playerName: string, gameId: string, score: number): { isNewBest: boolean } {
  const existing = scores.find(s => s.playerName === playerName && s.gameId === gameId);
  const now = new Date().toISOString();

  if (existing) {
    if (score > existing.score) {
      existing.score = score;
      existing.createdAt = now;
      save();
      return { isNewBest: true };
    }
    return { isNewBest: false };
  }

  scores.push({ playerName, gameId, score, createdAt: now });
  save();
  return { isNewBest: true };
}

/** 순위 반환 */
export function getRank(gameId: string, score: number): number {
  return scores.filter(s => s.gameId === gameId && s.score > score).length + 1;
}

/** 리더보드 (점수 내림차순) */
export function getLeaderboard(gameId: string, limit = 20): ScoreEntry[] {
  return scores
    .filter(s => s.gameId === gameId)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** 게임별 점수 초기화 */
export function resetScores(gameId: string) {
  scores = scores.filter(s => s.gameId !== gameId);
  save();
}

/** 총 기록 수 */
export function totalCount(): number {
  return scores.length;
}
