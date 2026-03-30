import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasSheetsUrl } from '../api/client';

export function EntryPage() {
  const [name, setName] = useState(() => localStorage.getItem('playerName') ?? '');
  const navigate = useNavigate();
  const hasSheet = hasSheetsUrl();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    localStorage.setItem('playerName', trimmed);
    navigate('/lobby');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 24 }}>
      <h1 style={{ fontSize: 48 }}>🎮</h1>
      <h2>micro:bit Games</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="이름을 입력하세요"
          autoFocus
          maxLength={20}
          style={{ padding: '8px 16px', fontSize: 18, borderRadius: 8, border: '2px solid #444', background: '#2a2a4a', color: '#eee' }}
        />
        <button
          type="submit"
          style={{ padding: '8px 24px', fontSize: 18, borderRadius: 8, border: 'none', background: '#4a9eff', color: '#fff', cursor: 'pointer' }}
        >
          시작
        </button>
      </form>
      <p style={{ fontSize: 13, color: hasSheet ? '#4aff9e' : '#ff4a6a', maxWidth: 360, textAlign: 'center', lineHeight: 1.6 }}>
        {hasSheet
          ? '점수가 Google Sheets에 기록됩니다.'
          : '시트가 연결되지 않았습니다. 점수가 저장되지 않습니다.'}
      </p>
    </div>
  );
}
