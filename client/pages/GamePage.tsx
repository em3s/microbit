import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSerial } from '../hooks/useSerial';
import { createGame } from '../games/GameRegistry';
import { GameOverModal } from '../components/GameOverModal';
import { WebSerialManager } from '../serial/WebSerialManager';
import type { GameEngine } from '../engine/GameEngine';
import type { InputManager } from '../engine/InputManager';

export function GamePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const enableKeyboard = searchParams.get('keyboard') === 'true';
  const playerName = localStorage.getItem('playerName');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { manager, connected, connect, disconnect } = useSerial();
  const engineRef = useRef<GameEngine | null>(null);
  const inputRef = useRef<InputManager | null>(null);

  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!playerName) navigate('/');
  }, [playerName, navigate]);

  const startGame = useCallback(() => {
    if (!canvasRef.current) return;

    // 이전 게임 정리
    engineRef.current?.stop();
    inputRef.current?.destroy();

    const result = createGame('runner', canvasRef.current, manager, {
      onGameOver: (score) => {
        setFinalScore(score);
        setGameOver(true);
      },
    }, enableKeyboard);

    if (result) {
      engineRef.current = result.engine;
      inputRef.current = result.input;
      setGameOver(false);
      setStarted(true);
      result.engine.start();
    }
  }, [manager, enableKeyboard]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      engineRef.current?.stop();
      inputRef.current?.destroy();
    };
  }, []);

  const serialSupported = WebSerialManager.isSupported();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: 24, gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', maxWidth: 800 }}>
        <h2 style={{ flex: 1 }}>{playerName}</h2>
        {serialSupported && (
          <button
            onClick={connected ? disconnect : connect}
            style={{
              padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: connected ? '#4aff9e' : '#4a9eff',
              color: '#1a1a2e', fontWeight: 'bold',
            }}
          >
            {connected ? 'micro:bit 연결됨 ✓' : 'micro:bit 연결'}
          </button>
        )}
        {!serialSupported && (
          <span style={{ color: '#ff4a6a', fontSize: 14 }}>Chrome 브라우저를 사용하세요</span>
        )}
      </div>

      <div style={{ position: 'relative' }}>
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
            <h3>러너</h3>
            <p style={{ color: '#aaa', fontSize: 14 }}>장애물을 피해 최대한 오래 생존하세요</p>
            <button onClick={startGame} style={{
              padding: '12px 32px', fontSize: 18, borderRadius: 8,
              border: 'none', background: '#4aff9e', color: '#1a1a2e',
              cursor: 'pointer', fontWeight: 'bold',
            }}>
              게임 시작
            </button>
            {enableKeyboard && (
              <p style={{ color: '#666', fontSize: 12 }}>
                키보드: Space=점프, S=슬라이드, D=더블점프
              </p>
            )}
            {!enableKeyboard && (
              <p style={{ color: '#666', fontSize: 12 }}>
                micro:bit를 연결하세요
              </p>
            )}
          </div>
        )}
        {gameOver && playerName && (
          <GameOverModal
            score={finalScore}
            gameId="runner"
            playerName={playerName}
            onRestart={startGame}
          />
        )}
      </div>
    </div>
  );
}
