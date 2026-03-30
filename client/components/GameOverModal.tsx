import { useEffect } from 'react';
import { submitScore } from '../api/client';

interface Props {
  score: number;
  gameId: string;
  playerName: string;
  email: string;
  inputMode: string;
  onRestart: () => void;
}

export function GameOverModal({ score, gameId, playerName, email, inputMode, onRestart }: Props) {
  useEffect(() => {
    submitScore(playerName, email, gameId, score, inputMode);
  }, [playerName, email, gameId, score, inputMode]);

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
      <button onClick={onRestart} style={{
        padding: '10px 28px', fontSize: 16, borderRadius: 8,
        border: 'none', background: '#4aff9e', color: '#1a1a2e',
        cursor: 'pointer', fontWeight: 'bold',
      }}>
        다시 시작
      </button>
      <p style={{ color: '#666', fontSize: 12 }}>space</p>
    </div>
  );
}
