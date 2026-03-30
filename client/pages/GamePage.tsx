import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSerial } from '../hooks/useSerial';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { createGame, GAME_REGISTRY } from '../games/GameRegistry';
import { GameOverModal } from '../components/GameOverModal';
import { Leaderboard } from '../components/Leaderboard';
import type { GameEngine } from '../engine/GameEngine';
import type { InputManager } from '../engine/InputManager';

const KEYBOARD_HINTS: Record<string, string> = {
  runner: 'Space = 점프\nS = 슬라이드\nD = 더블점프',
  dodge: '← = 왼쪽\n→ = 오른쪽\n↑ = 감도 높이기\n↓ = 감도 낮추기',
};

export function GamePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const playerName = localStorage.getItem('playerName');

  const gameId = searchParams.get('game') || Object.keys(GAME_REGISTRY)[0] || 'dodge';
  const inputMode = searchParams.get('input') || 'microbit';
  const enableKeyboard = inputMode === 'keyboard';

  // 비활성 게임이면 로비로
  useEffect(() => {
    if (!GAME_REGISTRY[gameId]) navigate('/lobby');
  }, [gameId, navigate]);

  // 리더보드 키: 게임_입력방식
  const scoreKeyMicrobit = `${gameId}_microbit`;
  const scoreKeyKeyboard = `${gameId}_keyboard`;
  const scoreKey = enableKeyboard ? scoreKeyKeyboard : scoreKeyMicrobit;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { manager, connected, connect, disconnect } = useSerial();
  const engineRef = useRef<GameEngine | null>(null);
  const inputRef = useRef<InputManager | null>(null);

  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [started, setStarted] = useState(false);
  const gameOverRef = useRef(false);
  const startGameRef = useRef<() => void>(() => {});

  const { entries: lbMicrobit, refresh: refreshMicrobit } = useLeaderboard(scoreKeyMicrobit);
  const { entries: lbKeyboard, refresh: refreshKeyboard } = useLeaderboard(scoreKeyKeyboard);
  const refreshLeaderboard = enableKeyboard ? refreshKeyboard : refreshMicrobit;

  useEffect(() => {
    if (!playerName) navigate('/');
  }, [playerName, navigate]);

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
        refreshLeaderboard();
      },
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
  }, [manager, enableKeyboard, gameId, refreshLeaderboard]);

  startGameRef.current = startGame;

  // 스페이스바로 시작/재시작
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

  const gameDef = GAME_REGISTRY[gameId];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: 24, gap: 16 }}>
      {/* 상단 바 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 1100 }}>
        <h2 style={{ margin: 0 }}>{gameDef?.name}</h2>
        <span style={{ color: '#888', fontSize: 14 }}>{playerName}</span>
        <span style={{ color: '#555', fontSize: 12 }}>
          {enableKeyboard ? '⌨️ 키보드' : (connected ? '✓ micro:bit' : 'micro:bit')}
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => navigate('/lobby')}
          style={{
            padding: '6px 16px', borderRadius: 6, border: '1px solid #555',
            background: 'transparent', color: '#aaa', cursor: 'pointer', fontSize: 13,
          }}
        >
          나가기
        </button>
      </div>

      {/* 메인: 게임 + 사이드바 */}
      <div style={{ display: 'flex', gap: 24, width: '100%', maxWidth: 1100, alignItems: 'flex-start' }}>
        {/* 게임 캔버스 */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <canvas
            ref={canvasRef}
            style={{ background: '#1a1a2e', borderRadius: 8, display: 'block' }}
          />
          {!started && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)', borderRadius: 8, gap: 16,
            }}>
              <h3>{gameDef?.name}</h3>
              {!enableKeyboard && (
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
                게임 시작
              </button>
              <p style={{ color: '#666', fontSize: 12 }}>space</p>
            </div>
          )}
          {gameOver && playerName && (
            <GameOverModal
              score={finalScore}
              gameId={scoreKey}
              playerName={playerName}
              onRestart={startGame}
            />
          )}
        </div>

        {/* 사이드바 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 220, flex: 1 }}>
          {/* 키보드 안내 */}
          {enableKeyboard && KEYBOARD_HINTS[gameId] && (
            <div style={{ background: '#2a2a4a', borderRadius: 8, padding: 16 }}>
              <h4 style={{ marginBottom: 8, color: '#ffa04a' }}>⌨️ 키보드 조작</h4>
              <pre style={{ margin: 0, fontSize: 14, color: '#ccc', lineHeight: 1.8 }}>
                {KEYBOARD_HINTS[gameId]}
              </pre>
            </div>
          )}

          {/* micro:bit 리더보드 */}
          <div style={{ background: '#2a2a4a', borderRadius: 8, padding: 16 }}>
            <Leaderboard entries={lbMicrobit} title="micro:bit 리더보드" />
          </div>

          {/* 키보드 리더보드 */}
          <div style={{ background: '#2a2a4a', borderRadius: 8, padding: 16 }}>
            <Leaderboard entries={lbKeyboard} title="⌨️ 키보드 리더보드" />
          </div>
        </div>
      </div>
    </div>
  );
}
