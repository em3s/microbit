import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAME_REGISTRY } from '../games/GameRegistry';
import { useSerial } from '../hooks/useSerial';
import { WebSerialManager } from '../serial/WebSerialManager';
import { hasSheetsUrl, getSheetIdPublic, setSheetId } from '../api/client';

const GAME_DESCRIPTIONS: Record<string, string> = {
  runner: '장애물을 피해 최대한 오래 달리세요',
  dodge: '위에서 떨어지는 블록을 피하세요',
};

export function LobbyPage() {
  const navigate = useNavigate();
  const playerName = localStorage.getItem('playerName');
  const playerEmail = localStorage.getItem('playerEmail');
  const playerPicture = localStorage.getItem('playerPicture');
  const { connected, connect } = useSerial();
  const serialSupported = WebSerialManager.isSupported();

  const [gameId, setGameId] = useState(() => Object.keys(GAME_REGISTRY)[0] || 'dodge');
  const [inputMode, setInputMode] = useState<'microbit' | 'keyboard'>('microbit');
  const [sheetInput, setSheetInput] = useState(() => getSheetIdPublic());
  const [sheetSaved, setSheetSaved] = useState(hasSheetsUrl());
  const [showSheetEdit, setShowSheetEdit] = useState(false);

  useEffect(() => {
    if (!playerName) navigate('/');
  }, [playerName, navigate]);

  const handleStart = () => {
    navigate(`/play?game=${gameId}&input=${inputMode}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('playerName');
    localStorage.removeItem('playerEmail');
    localStorage.removeItem('playerPicture');
    navigate('/');
  };

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

      {/* 게임 선택 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <h3 style={{ color: '#666', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>게임 선택</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          {Object.entries(GAME_REGISTRY).map(([id, def]) => (
            <button
              key={id}
              onClick={() => setGameId(id)}
              style={{
                padding: '20px 36px', borderRadius: 14, border: '2px solid',
                borderColor: id === gameId ? '#ffd700' : '#333',
                background: id === gameId ? '#ffd70015' : '#2a2a4a',
                color: id === gameId ? '#ffd700' : '#aaa',
                cursor: 'pointer', fontSize: 20, fontWeight: 'bold',
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

      {/* 입력 방식 */}
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

      {/* 시트 설정 (하단, 작게) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 8, opacity: 0.7 }}>
        <span
          style={{ fontSize: 11, color: sheetSaved ? '#4aff9e' : '#ff4a6a', cursor: 'pointer' }}
          onClick={() => setShowSheetEdit(v => !v)}
        >
          {sheetSaved ? '● 점수 기록 연결됨' : '○ 점수 기록 미연결'}
          <span style={{ color: '#555', marginLeft: 6 }}>{showSheetEdit ? '▲' : '▼'}</span>
        </span>
        {showSheetEdit && (
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={sheetInput}
              onChange={e => setSheetInput(e.target.value)}
              placeholder="Apps Script ID 또는 URL"
              style={{
                padding: '4px 10px', fontSize: 11, borderRadius: 6,
                border: '1px solid #444', background: '#2a2a4a', color: '#ccc',
                width: 280,
              }}
            />
            <button
              onClick={() => {
                setSheetId(sheetInput);
                setSheetSaved(hasSheetsUrl());
              }}
              style={{
                padding: '4px 14px', fontSize: 11, borderRadius: 6,
                border: 'none', background: '#3a3a5a', color: '#aaa', cursor: 'pointer',
              }}
            >
              저장
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
