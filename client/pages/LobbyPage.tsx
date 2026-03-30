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
  const { connected, connect } = useSerial();
  const serialSupported = WebSerialManager.isSupported();

  const [gameId, setGameId] = useState(() => Object.keys(GAME_REGISTRY)[0] || 'dodge');
  const [inputMode, setInputMode] = useState<'microbit' | 'keyboard'>('microbit');
  const [sheetInput, setSheetInput] = useState(() => getSheetIdPublic());
  const [sheetSaved, setSheetSaved] = useState(hasSheetsUrl());

  useEffect(() => {
    if (!playerName) navigate('/');
  }, [playerName, navigate]);

  const handleStart = () => {
    navigate(`/play?game=${gameId}&input=${inputMode}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 32, padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: 4 }}>{playerName}</h2>
        <p style={{ color: '#888', fontSize: 13 }}>{localStorage.getItem('playerEmail')}</p>
        <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>
          <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => {
            localStorage.removeItem('playerName');
            localStorage.removeItem('playerEmail');
            localStorage.removeItem('playerPicture');
            navigate('/');
          }}>
            로그아웃
          </span>
        </p>
      </div>

      {/* 게임 선택 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <h3 style={{ color: '#aaa', fontSize: 14, textTransform: 'uppercase', letterSpacing: 2 }}>게임 선택</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          {Object.entries(GAME_REGISTRY).map(([id, def]) => (
            <button
              key={id}
              onClick={() => setGameId(id)}
              style={{
                padding: '16px 32px', borderRadius: 12, border: '2px solid',
                borderColor: id === gameId ? '#ffd700' : '#333',
                background: id === gameId ? '#ffd70020' : '#2a2a4a',
                color: id === gameId ? '#ffd700' : '#aaa',
                cursor: 'pointer', fontSize: 18, fontWeight: 'bold',
                minWidth: 140, transition: 'all 0.15s',
              }}
            >
              {def.name}
              <br />
              <span style={{ fontSize: 11, fontWeight: 'normal', color: '#888' }}>
                {GAME_DESCRIPTIONS[id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 입력 방식 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <h3 style={{ color: '#aaa', fontSize: 14, textTransform: 'uppercase', letterSpacing: 2 }}>입력 방식</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => {
              setInputMode('microbit');
              if (!connected && serialSupported) connect();
            }}
            style={{
              padding: '14px 28px', borderRadius: 12, border: '2px solid',
              borderColor: inputMode === 'microbit' ? '#4aff9e' : '#333',
              background: inputMode === 'microbit' ? '#4aff9e20' : '#2a2a4a',
              color: inputMode === 'microbit' ? '#4aff9e' : '#aaa',
              cursor: serialSupported ? 'pointer' : 'not-allowed',
              fontSize: 16, fontWeight: 'bold',
              opacity: serialSupported ? 1 : 0.5,
            }}
            disabled={!serialSupported}
          >
            <span style={{ fontSize: 28 }}>&#x1F4BB;</span>
            <br />
            micro:bit
            <br />
            <span style={{ fontSize: 11, fontWeight: 'normal', color: connected ? '#4aff9e' : '#888' }}>
              {connected ? '연결됨 ✓' : (serialSupported ? '클릭하여 연결' : 'Chrome 필요')}
            </span>
          </button>
          <button
            onClick={() => setInputMode('keyboard')}
            style={{
              padding: '14px 28px', borderRadius: 12, border: '2px solid',
              borderColor: inputMode === 'keyboard' ? '#ffa04a' : '#333',
              background: inputMode === 'keyboard' ? '#ffa04a20' : '#2a2a4a',
              color: inputMode === 'keyboard' ? '#ffa04a' : '#aaa',
              cursor: 'pointer', fontSize: 16, fontWeight: 'bold',
            }}
          >
            <span style={{ fontSize: 28 }}>&#x2328;&#xFE0F;</span>
            <br />
            키보드
          </button>
        </div>
      </div>

      {/* 시작 */}
      <button
        onClick={handleStart}
        style={{
          padding: '16px 64px', fontSize: 22, borderRadius: 12,
          border: 'none', background: '#4a9eff', color: '#fff',
          cursor: 'pointer', fontWeight: 'bold', marginTop: 8,
        }}
      >
        게임 시작
      </button>

      {/* 시트 설정 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 16 }}>
        <p style={{ fontSize: 12, color: sheetSaved ? '#4aff9e' : '#ff4a6a' }}>
          {sheetSaved ? '점수 기록: Google Sheets 연결됨' : '점수 기록: 시트 미연결'}
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={sheetInput}
            onChange={e => setSheetInput(e.target.value)}
            placeholder="시트 ID 또는 URL"
            style={{
              padding: '4px 10px', fontSize: 12, borderRadius: 6,
              border: '1px solid #444', background: '#2a2a4a', color: '#ccc',
              width: 260,
            }}
          />
          <button
            onClick={() => {
              setSheetId(sheetInput);
              setSheetSaved(hasSheetsUrl());
            }}
            style={{
              padding: '4px 12px', fontSize: 12, borderRadius: 6,
              border: 'none', background: '#3a3a5a', color: '#aaa', cursor: 'pointer',
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
