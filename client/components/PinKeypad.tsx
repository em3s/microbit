import { useState } from 'react';

interface Props {
  title?: string;
  subtitle?: string;
  verify: (input: string) => Promise<boolean>;
  onSuccess: () => void;
  onCancel: () => void;
  cancelLabel?: string;
}

const KEY_STYLE: React.CSSProperties = {
  padding: '18px 0', borderRadius: 12, border: 'none',
  background: '#1a1a2e', color: '#eee', fontSize: 24, fontWeight: 'bold',
  cursor: 'pointer', minWidth: 64, transition: 'background 0.1s',
};

export function PinKeypad({
  title = '비번',
  subtitle = '4자리 숫자',
  verify,
  onSuccess,
  onCancel,
  cancelLabel = '취소',
}: Props) {
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);

  const press = async (d: string) => {
    if (input.length >= 4) return;
    const next = input + d;
    setInput(next);
    if (next.length === 4) {
      const ok = await verify(next);
      if (ok) {
        onSuccess();
      } else {
        setShake(true);
        setTimeout(() => {
          setInput('');
          setShake(false);
        }, 400);
      }
    }
  };

  const backspace = () => setInput(input.slice(0, -1));

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#2a2a4a', borderRadius: 16, padding: '28px 32px',
          width: 320, textAlign: 'center',
          transform: shake ? 'translateX(-8px)' : 'none',
          transition: 'transform 0.08s',
        }}
      >
        <h3 style={{ margin: 0, color: '#eee' }}>{title}</h3>
        <p style={{ color: '#888', fontSize: 12, marginTop: 6 }}>{subtitle}</p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '20px 0 16px' }}>
          {[0, 1, 2, 3].map(i => {
            const filled = i < input.length;
            return (
              <div
                key={i}
                style={{
                  width: 44, height: 52, borderRadius: 8,
                  border: '2px solid ' + (filled ? '#ffd700' : '#555'),
                  background: filled ? '#ffd70015' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, color: '#ffd700', lineHeight: 1,
                }}
              >
                {filled ? '●' : ''}
              </div>
            );
          })}
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
          marginTop: 16,
        }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
            <button
              key={d}
              onClick={() => press(d)}
              style={KEY_STYLE}
              onMouseEnter={e => (e.currentTarget.style.background = '#3a3a5a')}
              onMouseLeave={e => (e.currentTarget.style.background = '#1a1a2e')}
            >
              {d}
            </button>
          ))}
          <button
            onClick={onCancel}
            style={{ ...KEY_STYLE, background: '#3a2a3a', fontSize: 16, color: '#aaa' }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => press('0')}
            style={KEY_STYLE}
            onMouseEnter={e => (e.currentTarget.style.background = '#3a3a5a')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1a1a2e')}
          >
            0
          </button>
          <button
            onClick={backspace}
            style={{ ...KEY_STYLE, background: '#3a2a3a', fontSize: 18, color: '#aaa' }}
          >
            ←
          </button>
        </div>
      </div>
    </div>
  );
}
