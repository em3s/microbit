import { useState, useEffect, useRef, useCallback } from 'react';
import type { WebSerialManager, LogEntry } from '../serial/WebSerialManager';
import { showToast } from './Toast';

const MAX_ENTRIES = 500;

function formatTime(t: number): string {
  const d = new Date(t);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

/** 게임별 TX(웹→마이크로비트) CSV 포맷 설명 */
const TX_FORMAT_DOCS: Record<string, { fields: string[]; example: string; notes: string[] }> = {
  runner: {
    fields: ['d', 'kind', 'pstate', 'score', 'go'],
    example: '350,tall,G,42,0',
    notes: [
      'd: 다음 장애물까지 거리(px). 작을수록 가까움. 장애물 없으면 9999',
      'kind: tall(높은 벽=점프) / gate(낮은 문=슬라이드) / combo(높음=점프+더블점프) / none(없음) / reset(라운드 시작 신호)',
      'pstate: G(달림) / J(점프중·낙하중) / D(슬라이드중)',
      'score: 누적 점수',
      'go: 0(진행중) / 1(게임오버)',
    ],
  },
  dodge: {
    fields: ['(아날로그 값)'],
    example: 'x:123',
    notes: ['x:N 형식. N은 좌우 가속도. 음수=왼쪽, 양수=오른쪽'],
  },
};

/** 마이크로비트가 보내는 RX 명령 설명 */
const RX_DOCS: Record<string, string> = {
  runner: 'jump / double / slide 중 하나',
  dodge: 'x:N 형태의 아날로그 값 (가속도)',
};

function buildCopyText(
  entries: LogEntry[],
  gameId: string,
  txCount: number,
  rxCount: number,
): string {
  const lines: string[] = [];
  const fmt = TX_FORMAT_DOCS[gameId];
  const rxDoc = RX_DOCS[gameId] ?? '명령어';

  lines.push('=== 시리얼 로그 ===');
  lines.push(`게임: ${gameId}`);
  lines.push(`복사 시각: ${new Date().toISOString()}`);
  lines.push(`총 TX(웹→마이크로비트): ${txCount}회   RX(마이크로비트→웹): ${rxCount}회`);
  lines.push(`표시된 항목: ${entries.length}개 (최근 ${MAX_ENTRIES}개까지 보관)`);
  lines.push('');
  if (fmt) {
    lines.push(`TX 포맷: "${fmt.fields.join(',')}"  예) "${fmt.example}"`);
    fmt.notes.forEach(n => lines.push(`  - ${n}`));
  }
  lines.push(`RX 포맷: ${rxDoc}`);
  lines.push('');
  lines.push('타임스탬프는 첫 항목으로부터의 상대 시간(초). +0.000 = 시작.');
  lines.push('');

  if (entries.length === 0) {
    lines.push('(데이터 없음)');
  } else {
    const t0 = entries[0].t;
    for (const e of entries) {
      const offset = ((e.t - t0) / 1000).toFixed(3).padStart(8, ' ');
      const dir = e.direction === 'tx' ? 'TX' : 'RX';
      let body = e.text;
      // runner의 TX는 디코드해서 부가 표기
      if (e.direction === 'tx' && gameId === 'runner' && fmt) {
        const parts = e.text.split(',');
        if (parts.length >= fmt.fields.length) {
          const decoded = fmt.fields.map((f, i) => `${f}=${parts[i]}`).join(' ');
          body = `${e.text}    (${decoded})`;
        }
      }
      lines.push(`[+${offset}s] ${dir}  ${body}`);
    }
  }

  lines.push('');
  lines.push('=== 끝 ===');
  return lines.join('\n');
}

export function SerialDebugPanel({
  manager,
  width,
  gameId,
}: {
  manager: WebSerialManager;
  width: number;
  gameId: string;
}) {
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

  const copy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = buildCopyText(
      entriesRef.current,
      gameId,
      txCountRef.current,
      rxCountRef.current,
    );
    try {
      await navigator.clipboard.writeText(text);
      showToast(`로그 복사됨 (${entriesRef.current.length}개 항목)`, 'success');
    } catch {
      showToast('복사 실패 — 브라우저 권한 확인', 'error');
    }
  }, [gameId]);

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
          <>
            <button
              onClick={copy}
              style={{
                padding: '2px 10px', borderRadius: 4, border: '1px solid #4a9eff',
                background: 'transparent', color: '#4a9eff', cursor: 'pointer', fontSize: 11,
              }}
            >
              복사
            </button>
            <button
              onClick={clear}
              style={{
                padding: '2px 10px', borderRadius: 4, border: '1px solid #555',
                background: 'transparent', color: '#aaa', cursor: 'pointer', fontSize: 11,
              }}
            >
              지우기
            </button>
          </>
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
