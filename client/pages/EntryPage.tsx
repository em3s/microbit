import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function EntryPage() {
  const [name, setName] = useState(() => localStorage.getItem('playerName') ?? '');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    localStorage.setItem('playerName', trimmed);
    navigate('/play');
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
    </div>
  );
}
