import { useState, useEffect, useRef, useCallback } from 'react';
import type { WebSerialManager, LogEntry } from '../serial/WebSerialManager';

const MAX_ENTRIES = 500;

function formatTime(t: number): string {
  const d = new Date(t);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

export function SerialDebugPanel({ manager, width }: { manager: WebSerialManager; width: number }) {
  const [expanded, setExpanded] = useState(false);
  const entriesRef = useRef<LogEntry[]>([]);
  const txCountRef = useRef(0);
  const rxCountRef = useRef(0);
  const [, setTick] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onLog = (entry: LogEntry) => {
      const arr = entriesRef.current;
      arr.push(entry);
      if (arr.length > MAX_ENTRIES) arr.splice(0, arr.length - MAX_ENTRIES);
      if (entry.direction === 'tx') txCountRef.current += 1;
      else rxCountRef.current += 1;
    };
    manager.on('log', onLog);
    return () => { manager.off('log', onLog); };
  }, [manager]);

  // 패널 열려 있을 때만 200ms 주기로 화면 갱신 (성능)
  useEffect(() => {
    if (!expanded) {
      // 닫혀 있어도 카운트는 가끔 업데이트
      const id = window.setInterval(() => setTick(x => x + 1), 1000);
      return () => window.clearInterval(id);
    }
    const id = window.setInterval(() => setTick(x => x + 1), 200);
    return () => window.clearInterval(id);
  }, [expanded]);

  // 항상 최신 로그가 보이게 자동 스크롤
  useEffect(() => {
    if (!expanded) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  });

  const clear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    entriesRef.current = [];
    txCountRef.current = 0;
    rxCountRef.current = 0;
    setTick(x => x + 1);
  }, []);

  const entries = entriesRef.current;

  return (
    <div style={{
      width, maxWidth: '100%',
      background: '#1a1a2e', border: '1px solid #333', borderRadius: 8,
      fontSize: 12, color: '#aaa',
    }}>
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '8px 12px', cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span style={{ color: '#888' }}>{expanded ? '▼' : '▶'}</span>
        <span>🔌 시리얼 디버그</span>
        <span style={{ color: '#4aff9e' }}>TX {txCountRef.current}</span>
        <span style={{ color: '#ffa04a' }}>RX {rxCountRef.current}</span>
        <div style={{ flex: 1 }} />
        {expanded && (
          <button
            onClick={clear}
            style={{
              padding: '2px 10px', borderRadius: 4, border: '1px solid #555',
              background: 'transparent', color: '#aaa', cursor: 'pointer', fontSize: 11,
            }}
          >
            지우기
          </button>
        )}
      </div>
      {expanded && (
        <div
          ref={listRef}
          style={{
            maxHeight: 240, overflowY: 'auto',
            padding: '6px 12px',
            borderTop: '1px solid #333',
            fontFamily: 'monospace', fontSize: 11, lineHeight: 1.5,
            background: '#0e0e1a',
          }}
        >
          {entries.length === 0 ? (
            <div style={{ color: '#555', padding: '8px 0' }}>아직 송수신된 데이터가 없습니다.</div>
          ) : (
            entries.map((e, i) => (
              <div
                key={i}
                style={{
                  color: e.direction === 'tx' ? '#4aff9e' : '#ffa04a',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}
              >
                <span style={{ color: '#555' }}>[{formatTime(e.t)}]</span>{' '}
                <span>{e.direction === 'tx' ? '→' : '←'}</span>{' '}
                {e.text}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
