import { useState, useEffect, useCallback } from 'react';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;
const listeners = new Set<(msg: ToastMessage) => void>();

export function showToast(text: string, type: 'success' | 'error' | 'info' = 'info') {
  const msg: ToastMessage = { id: ++toastId, text, type };
  listeners.forEach(fn => fn(msg));
}

const COLORS = {
  success: '#4aff9e',
  error: '#ff4a6a',
  info: '#4a9eff',
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((msg: ToastMessage) => {
    setToasts(prev => [...prev, msg]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== msg.id));
    }, 3000);
  }, []);

  useEffect(() => {
    listeners.add(addToast);
    return () => { listeners.delete(addToast); };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            padding: '10px 20px', borderRadius: 8,
            background: '#2a2a4a', border: `1px solid ${COLORS[t.type]}`,
            color: COLORS[t.type], fontSize: 14, fontWeight: 'bold',
            animation: 'fadeIn 0.2s',
          }}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
