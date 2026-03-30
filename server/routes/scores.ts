import { Router } from 'express';
import { upsertScore, getRank, getLeaderboard } from '../db.js';

function sanitizeName(name: string): string {
  return name.replace(/[,\n\r]/g, '').trim().substring(0, 20);
}

export function scoresRouter(): Router {
  const router = Router();

  router.post('/scores', (req, res) => {
    const { playerName, gameId, score } = req.body;

    if (!playerName || !gameId || score == null) {
      res.status(400).json({ error: 'playerName, gameId, score 필수' });
      return;
    }

    if (typeof score !== 'number' || !isFinite(score) || score < 0) {
      res.status(400).json({ error: 'score는 0 이상 숫자' });
      return;
    }

    const safeName = sanitizeName(String(playerName));
    if (!safeName) {
      res.status(400).json({ error: '유효한 이름 필요' });
      return;
    }

    const { isNewBest } = upsertScore(safeName, gameId, Math.floor(score));
    const rank = getRank(gameId, Math.floor(score));
    res.json({ rank, isNewBest });
  });

  router.get('/leaderboard/:gameId', (req, res) => {
    const limit = Number(req.query.limit) || 20;
    res.json(getLeaderboard(req.params.gameId, limit));
  });

  return router;
}
