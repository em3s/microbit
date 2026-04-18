import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSerial } from '../hooks/useSerial';
import { createGame, GAME_REGISTRY } from '../games/GameRegistry';
import { GameOverModal } from '../components/GameOverModal';
import type { GameEngine } from '../engine/GameEngine';
import type { InputManager } from '../engine/InputManager';

const KEYBOARD_HINTS: Record<string, string> = {
  runner: 'Space = 점프 | S = 슬라이드 | D = 더블점프',
  dodge: '← → = 이동 | ↑ ↓ = 감도 조절',
};

// 게임별 캔버스 크기
const CANVAS_SIZES: Record<string, { w: number; h: number }> = {
  runner: { w: 800, h: 400 },
  dodge: { w: 400, h: 500 },
  hanoi: { w: 500, h: 500 },
  updown: { w: 500, h: 560 },
};

// 마우스/키보드 전용 게임 (micro:bit 연결 불필요, 자동 시작)
const STANDALONE_GAMES = new Set(['hanoi', 'updown']);

export function GamePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const playerName = localStorage.getItem('playerName');
  const playerEmail = localStorage.getItem('playerEmail') || '';

  const gameId = searchParams.get('game') || Object.keys(GAME_REGISTRY)[0] || 'dodge';
  const inputMode = searchParams.get('input') || 'microbit';
  const enableKeyboard = inputMode === 'keyboard' || inputMode === 'mouse';

  const canvasSize = CANVAS_SIZES[gameId] || { w: 400, h: 500 };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { manager, connected, connect, disconnect } = useSerial();
  const engineRef = useRef<GameEngine | null>(null);
  const inputRef = useRef<InputManager | null>(null);

  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [started, setStarted] = useState(false);
  const gameOverRef = useRef(false);
  const startGameRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!playerName || !playerEmail) navigate('/');
  }, [playerName, playerEmail, navigate]);

  useEffect(() => {
    if (!GAME_REGISTRY[gameId]) navigate('/lobby');
  }, [gameId, navigate]);

  const startGame = useCallback(() => {
    if (!canvasRef.current) return;

    engineRef.current?.stop();
    const prevSensitivity = inputRef.current?.sensitivity ?? 1.0;
    inputRef.current?.destroy();

    const result = createGame(gameId, canvasRef.current, manager, {
      onGameOver: (score) => {
        setFinalScore(score);
        setGameOver(true);
        gameOverRef.current = true;
      },
      sendSerial: (text: string) => manager?.send(text),
    }, enableKeyboard);

    if (result) {
      result.input.sensitivity = prevSensitivity;
      engineRef.current = result.engine;
      inputRef.current = result.input;
      setGameOver(false);
      gameOverRef.current = false;
      setStarted(true);
      result.engine.start();
    }
  }, [manager, enableKeyboard, gameId]);

  startGameRef.current = startGame;

  const startedRef = useRef(false);
  startedRef.current = started;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' && (gameOverRef.current || !startedRef.current)) {
        e.preventDefault();
        startGameRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, []);

  useEffect(() => {
    return () => {
      engineRef.current?.stop();
      inputRef.current?.destroy();
    };
  }, []);

  // 하노이: 레벨 드롭다운
  const [hanoiLevel, setHanoiLevel] = useState(() => {
    const lv = parseInt(searchParams.get('level') || '3');
    return isNaN(lv) ? 3 : Math.max(3, Math.min(8, lv));
  });

  const changeHanoiLevel = useCallback((lv: number) => {
    setHanoiLevel(lv);
    // URL을 동기적으로 업데이트 (HanoiGame 생성자가 window.location.search를 읽음)
    const params = new URLSearchParams(searchParams);
    params.set('level', String(lv));
    window.history.replaceState(null, '', `/play?${params}`);
    startGameRef.current();
  }, [searchParams]);

  // 업앤다운: 끝값만 커스터마이즈 (시작은 항상 1)
  const [udMax, setUdMax] = useState(() => {
    const m = parseInt(searchParams.get('max') || '100');
    return isNaN(m) ? 100 : m;
  });
  const applyUpdownMax = useCallback((max: number) => {
    if (!Number.isFinite(max) || max <= 1) return;
    const params = new URLSearchParams(searchParams);
    params.set('min', '1');
    params.set('max', String(max));
    window.history.replaceState(null, '', `/play?${params}`);
    startGameRef.current();
  }, [searchParams]);

  // 알고리즘 게임: 자동 시작
  const autoStarted = useRef(false);
  useEffect(() => {
    if (STANDALONE_GAMES.has(gameId) && !autoStarted.current && canvasRef.current) {
      autoStarted.current = true;
      startGameRef.current();
    }
  }, [gameId]);

  const gameDef = GAME_REGISTRY[gameId];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: 24, gap: 12 }}>
      {/* 상단 바 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: canvasSize.w, maxWidth: '100%' }}>
        <h2 style={{ margin: 0 }}>{gameDef?.name}</h2>
        {gameId === 'hanoi' && <>
          <select
            value={hanoiLevel}
            onChange={e => changeHanoiLevel(Number(e.target.value))}
            style={{
              padding: '4px 8px', borderRadius: 6, border: '1px solid #555',
              background: '#2a2a4a', color: '#4aff9e', fontSize: 14,
              cursor: 'pointer', outline: 'none',
            }}
          >
            {[3, 4, 5, 6, 7, 8].map(lv => (
              <option key={lv} value={lv}>디스크 {lv}개</option>
            ))}
          </select>
          <button
            onClick={() => startGameRef.current()}
            style={{
              padding: '6px 16px', borderRadius: 6, border: 'none',
              background: '#ff4a6a', color: '#fff', cursor: 'pointer',
              fontSize: 13, fontWeight: 'bold',
            }}
          >
            초기화
          </button>
        </>}
        {gameId === 'updown' && <>
          <span style={{ color: '#888', fontSize: 16 }}>1 ~</span>
          <input
            type="number"
            value={udMax}
            onChange={e => setUdMax(parseInt(e.target.value || '0'))}
            onBlur={() => applyUpdownMax(udMax)}
            onKeyDown={e => { if (e.key === 'Enter') applyUpdownMax(udMax); }}
            style={{
              padding: '6px 10px', width: 90, borderRadius: 8, border: '1px solid #555',
              background: '#2a2a4a', color: '#c89aff', fontSize: 18, fontWeight: 'bold',
              textAlign: 'center', outline: 'none',
            }}
          />
          <button
            onClick={() => applyUpdownMax(udMax)}
            title="다시 시작"
            style={{
              padding: '6px 12px', borderRadius: 8, border: 'none',
              background: '#ff4a6a', color: '#fff', cursor: 'pointer',
              fontSize: 16, fontWeight: 'bold',
            }}
          >
            ↻
          </button>
        </>}
        <span style={{ color: '#888', fontSize: 14 }}>{playerName}</span>
        {!STANDALONE_GAMES.has(gameId) && (
          <span style={{ color: '#555', fontSize: 12 }}>
            {inputMode === 'mouse' ? '🖱️' : enableKeyboard ? '⌨️' : (connected ? '✓ micro:bit' : 'micro:bit')}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => navigate('/lobby')}
          style={{
            padding: '4px 14px', borderRadius: 6, border: '1px solid #555',
            background: 'transparent', color: '#aaa', cursor: 'pointer', fontSize: 12,
          }}
        >
          나가기
        </button>
      </div>

      {/* 게임 캔버스 (고정 크기) */}
      <div style={{ position: 'relative', width: canvasSize.w, height: canvasSize.h, flexShrink: 0 }}>
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          style={{ background: '#1a1a2e', borderRadius: 8, display: 'block', width: canvasSize.w, height: canvasSize.h }}
        />
        {!started && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', borderRadius: 8, gap: 16,
          }}>
            <h3>{gameDef?.name}</h3>
            {!enableKeyboard && inputMode !== 'mouse' && (
              <button
                onClick={connected ? disconnect : connect}
                style={{
                  padding: '8px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: connected ? '#4aff9e' : '#4a9eff',
                  color: '#1a1a2e', fontWeight: 'bold', fontSize: 15,
                }}
              >
                {connected ? 'micro:bit 연결됨 ✓' : 'micro:bit 연결'}
              </button>
            )}
            <button onClick={startGame} style={{
              padding: '12px 32px', fontSize: 18, borderRadius: 8,
              border: 'none', background: '#4aff9e', color: '#1a1a2e',
              cursor: 'pointer', fontWeight: 'bold',
            }}>
              시작
            </button>
            <p style={{ color: '#666', fontSize: 12 }}>space</p>
          </div>
        )}
        {gameOver && playerName && (
          <GameOverModal
            score={finalScore}
            gameId={gameId}
            playerName={playerName}
            email={playerEmail}
            inputMode={inputMode}
            onRestart={startGame}
          />
        )}
      </div>

      {/* 키보드 안내 (하단) */}
      {enableKeyboard && KEYBOARD_HINTS[gameId] && (
        <div style={{
          width: canvasSize.w, maxWidth: '100%',
          background: '#2a2a4a', borderRadius: 8, padding: '8px 16px',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 13, color: '#ffa04a' }}>⌨️ </span>
          <span style={{ fontSize: 13, color: '#ccc' }}>{KEYBOARD_HINTS[gameId]}</span>
        </div>
      )}
    </div>
  );
}
