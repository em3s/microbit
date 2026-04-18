import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAME_REGISTRY, type GameCategory } from '../games/GameRegistry';
import { useSerial } from '../hooks/useSerial';
import { WebSerialManager } from '../serial/WebSerialManager';

const GAME_DESCRIPTIONS: Record<string, string> = {
  runner: '장애물을 피해 최대한 오래 달리세요',
  dodge: '위에서 떨어지는 블록을 피하세요',
  hanoi: '모든 디스크를 오른쪽 기둥으로 옮기세요',
  updown: '컴퓨터가 고른 숫자 맞추기 (이분탐색)',
};

const CATEGORY_META: Record<GameCategory, { label: string; icon: string; color: string }> = {
  microbit: { label: '마이크로비트 게임', icon: '🎮', color: '#4aff9e' },
  algorithm: { label: '알고리즘', icon: '🧩', color: '#c89aff' },
};

const CATEGORY_ORDER: GameCategory[] = ['microbit', 'algorithm'];

// 알고리즘 계열은 마우스/키보드로만 플레이 → micro:bit 입력 선택 숨김
const isStandaloneGame = (id: string) => GAME_REGISTRY[id]?.category === 'algorithm';

export function LobbyPage() {
  const navigate = useNavigate();
  const playerName = localStorage.getItem('playerName');
  const playerEmail = localStorage.getItem('playerEmail');
  const playerPicture = localStorage.getItem('playerPicture');
  const { connected, connect } = useSerial();
  const serialSupported = WebSerialManager.isSupported();

  const [gameId, setGameId] = useState(() => Object.keys(GAME_REGISTRY)[0] || 'dodge');
  const [inputMode, setInputMode] = useState<'microbit' | 'keyboard'>('microbit');
  useEffect(() => {
    if (!playerName) navigate('/');
  }, [playerName, navigate]);

  const handleStart = () => {
    const input = isStandaloneGame(gameId) ? 'mouse' : inputMode;
    const params = new URLSearchParams({ game: gameId, input });
    navigate(`/play?${params}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('playerName');
    localStorage.removeItem('playerEmail');
    localStorage.removeItem('playerPicture');
    navigate('/');
  };

  // 카테고리별 그룹화
  const grouped = CATEGORY_ORDER
    .map(cat => ({
      cat,
      games: Object.entries(GAME_REGISTRY).filter(([, def]) => def.category === cat),
    }))
    .filter(g => g.games.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 28, padding: 24 }}>

      {/* 프로필 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {playerPicture && (
          <img
            src={playerPicture}
            alt=""
            style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid #444' }}
            referrerPolicy="no-referrer"
          />
        )}
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>{playerName}</h2>
          <p style={{ color: '#888', fontSize: 12, margin: 0 }}>{playerEmail}</p>
        </div>
        <button onClick={handleLogout} style={{
          padding: '4px 12px', borderRadius: 6, border: '1px solid #555',
          background: 'transparent', color: '#888', cursor: 'pointer', fontSize: 12, marginLeft: 8,
        }}>
          로그아웃
        </button>
      </div>

      {/* 게임 선택 — 카테고리별 그룹 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        {grouped.map(({ cat, games }) => {
          const meta = CATEGORY_META[cat];
          return (
            <div key={cat} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <h3 style={{
                color: meta.color, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2,
                display: 'flex', alignItems: 'center', gap: 6, margin: 0,
              }}>
                <span style={{ fontSize: 14 }}>{meta.icon}</span>
                {meta.label}
              </h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                {games.map(([id, def]) => (
                  <button
                    key={id}
                    onClick={() => setGameId(id)}
                    style={{
                      padding: '20px 30px', borderRadius: 14, border: '2px solid',
                      borderColor: id === gameId ? meta.color : '#333',
                      background: id === gameId ? meta.color + '15' : '#2a2a4a',
                      color: id === gameId ? meta.color : '#aaa',
                      cursor: 'pointer', fontSize: 18, fontWeight: 'bold',
                      minWidth: 160, transition: 'all 0.15s',
                      textAlign: 'center',
                    }}
                  >
                    {def.name}
                    <br />
                    <span style={{ fontSize: 11, fontWeight: 'normal', color: '#777' }}>
                      {GAME_DESCRIPTIONS[id]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 입력 방식 (알고리즘 게임은 숨김) */}
      {!isStandaloneGame(gameId) && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <h3 style={{ color: '#666', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>입력 방식</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => {
                setInputMode('microbit');
                if (!connected && serialSupported) connect();
              }}
              style={{
                padding: '16px 32px', borderRadius: 14, border: '2px solid',
                borderColor: inputMode === 'microbit' ? '#4aff9e' : '#333',
                background: inputMode === 'microbit' ? '#4aff9e15' : '#2a2a4a',
                color: inputMode === 'microbit' ? '#4aff9e' : '#aaa',
                cursor: serialSupported ? 'pointer' : 'not-allowed',
                fontSize: 16, fontWeight: 'bold',
                opacity: serialSupported ? 1 : 0.4,
                textAlign: 'center',
              }}
              disabled={!serialSupported}
            >
              <span style={{ fontSize: 32 }}>&#x1F4BB;</span>
              <br />
              micro:bit
              <br />
              <span style={{ fontSize: 11, fontWeight: 'normal', color: connected ? '#4aff9e' : '#777' }}>
                {connected ? '연결됨 ✓' : (serialSupported ? '클릭하여 연결' : 'Chrome 필요')}
              </span>
            </button>
            <button
              onClick={() => setInputMode('keyboard')}
              style={{
                padding: '16px 32px', borderRadius: 14, border: '2px solid',
                borderColor: inputMode === 'keyboard' ? '#ffa04a' : '#333',
                background: inputMode === 'keyboard' ? '#ffa04a15' : '#2a2a4a',
                color: inputMode === 'keyboard' ? '#ffa04a' : '#aaa',
                cursor: 'pointer', fontSize: 16, fontWeight: 'bold',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: 32 }}>&#x2328;&#xFE0F;</span>
              <br />
              키보드
            </button>
          </div>
        </div>
      )}

      {/* 시작 버튼 */}
      <button
        onClick={handleStart}
        style={{
          padding: '16px 72px', fontSize: 24, borderRadius: 14,
          border: 'none', background: '#4a9eff', color: '#fff',
          cursor: 'pointer', fontWeight: 'bold', marginTop: 4,
          letterSpacing: 1,
        }}
      >
        게임 시작
      </button>
    </div>
  );
}
