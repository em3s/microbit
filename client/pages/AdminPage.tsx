import { useState, useEffect } from 'react';
import { Leaderboard } from '../components/Leaderboard';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { getAdminStatus, resetScores } from '../api/client';

export function AdminPage() {
  const [gameId] = useState('runner');
  const { entries, refresh } = useLeaderboard(gameId);
  const [status, setStatus] = useState({ activeGame: '', totalScores: 0 });

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
    await resetScores(gameId);
    refresh();
  };

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 8 }}>관리자 대시보드</h1>
      <p style={{ color: '#888', marginBottom: 24 }}>
        활성 게임: <strong>{status.activeGame}</strong> | 총 기록: {status.totalScores}
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button onClick={handleReset} style={{
          padding: '6px 16px', borderRadius: 6, border: '1px solid #ff4a6a',
          background: 'transparent', color: '#ff4a6a', cursor: 'pointer',
        }}>
          리더보드 초기화
        </button>
        <button onClick={refresh} style={{
          padding: '6px 16px', borderRadius: 6, border: '1px solid #4a9eff',
          background: 'transparent', color: '#4a9eff', cursor: 'pointer',
        }}>
          새로고침
        </button>
      </div>

      <Leaderboard entries={entries} title={`${gameId} 리더보드`} />
    </div>
  );
}
