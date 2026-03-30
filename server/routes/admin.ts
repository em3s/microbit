import { Router } from 'express';
import { resetScores, totalCount } from '../db.js';

export function adminRouter(): Router {
  const router = Router();

  router.get('/status', (_req, res) => {
    res.json({ activeGame: 'runner', totalScores: totalCount() });
  });

  router.delete('/scores/:gameId', (req, res) => {
    resetScores(req.params.gameId);
    res.json({ ok: true });
  });

  return router;
}
