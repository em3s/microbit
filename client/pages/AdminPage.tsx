import { useState, useEffect } from 'react';
import { Leaderboard } from '../components/Leaderboard';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { getAdminStatus, resetScores } from '../api/client';
import { GAME_REGISTRY } from '../games/GameRegistry';

const gameIds = Object.keys(GAME_REGISTRY);

export function AdminPage() {
  const [gameId, setGameId] = useState(gameIds[0] || 'dodge');
  const { entries: lbMicrobit, refresh: refreshMicrobit } = useLeaderboard(`${gameId}_microbit`);
  const { entries: lbKeyboard, refresh: refreshKeyboard } = useLeaderboard(`${gameId}_keyboard`);
  const [status, setStatus] = useState({ totalScores: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        setStatus(await getAdminStatus());
      } catch {}
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const handleReset = async () => {
    if (!confirm('리더보드를 초기화하시겠습니까?')) return;
    try {
      await resetScores(`${gameId}_microbit`);
      await resetScores(`${gameId}_keyboard`);
      refreshMicrobit();
      refreshKeyboard();
    } catch {}
  };

  const refreshAll = () => { refreshMicrobit(); refreshKeyboard(); };

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 8 }}>관리자 대시보드</h1>
      <p style={{ color: '#888', marginBottom: 24 }}>
        총 기록: {status.totalScores}
      </p>

      {/* 게임 선택 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {gameIds.map(id => (
          <button
            key={id}
            onClick={() => setGameId(id)}
            style={{
              padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: id === gameId ? '#ffd700' : '#3a3a5a',
              color: id === gameId ? '#1a1a2e' : '#aaa',
              fontWeight: id === gameId ? 'bold' : 'normal',
            }}
          >
            {GAME_REGISTRY[id].name}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={handleReset} style={{
          padding: '6px 16px', borderRadius: 6, border: '1px solid #ff4a6a',
          background: 'transparent', color: '#ff4a6a', cursor: 'pointer',
        }}>
          초기화
        </button>
        <button onClick={refreshAll} style={{
          padding: '6px 16px', borderRadius: 6, border: '1px solid #4a9eff',
          background: 'transparent', color: '#4a9eff', cursor: 'pointer',
        }}>
          새로고침
        </button>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1, background: '#2a2a4a', borderRadius: 8, padding: 16 }}>
          <Leaderboard entries={lbMicrobit} title="micro:bit 리더보드" />
        </div>
        <div style={{ flex: 1, background: '#2a2a4a', borderRadius: 8, padding: 16 }}>
          <Leaderboard entries={lbKeyboard} title="키보드 리더보드" />
        </div>
      </div>
    </div>
  );
}
