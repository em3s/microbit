import { Router } from 'express';
import { upsertScore, getRank, getLeaderboard } from '../db.js';

export function scoresRouter(): Router {
  const router = Router();

  router.post('/scores', (req, res) => {
    const { playerName, gameId, score } = req.body;
    if (!playerName || !gameId || score == null) {
      res.status(400).json({ error: 'playerName, gameId, score 필수' });
      return;
    }

    const { isNewBest } = upsertScore(playerName, gameId, score);
    const rank = getRank(gameId, score);
    res.json({ rank, isNewBest });
  });

  router.get('/leaderboard/:gameId', (req, res) => {
    const limit = Number(req.query.limit) || 20;
    res.json(getLeaderboard(req.params.gameId, limit));
  });

  return router;
}
