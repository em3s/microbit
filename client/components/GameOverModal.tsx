import { useState, useEffect } from 'react';
import { submitScore } from '../api/client';

interface Props {
  score: number;
  gameId: string;
  playerName: string;
  onRestart: () => void;
}

export function GameOverModal({ score, gameId, playerName, onRestart }: Props) {
  const [rank, setRank] = useState<number | null>(null);
  const [isNewBest, setIsNewBest] = useState(false);

  // 자동 등록
  useEffect(() => {
    submitScore(playerName, gameId, score)
      .then(result => {
        setRank(result.rank);
        setIsNewBest(result.isNewBest);
      })
      .catch(() => {});
  }, [playerName, gameId, score]);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.8)', gap: 16,
    }}>
      <h2 style={{ fontSize: 36, color: '#ff4a6a' }}>GAME OVER</h2>
      <p style={{ fontSize: 24, fontFamily: 'monospace' }}>
        점수: <strong>{Math.floor(score).toLocaleString()}</strong>
      </p>
      {rank !== null && (
        <p style={{ fontSize: 18, color: '#ffd700' }}>
          {rank}등{isNewBest ? ' (최고 기록!)' : ''}
        </p>
      )}
      <button onClick={onRestart} style={{
        padding: '10px 28px', fontSize: 16, borderRadius: 8,
        border: 'none', background: '#4aff9e', color: '#1a1a2e',
        cursor: 'pointer', fontWeight: 'bold',
      }}>
        다시 시작
      </button>
    </div>
  );
}
