import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitScore, hasSheetsUrl, getSheetId, setSheetId } from '../api/client';

const GOOGLE_CLIENT_ID = '875819178193-7e81gvdi8j6dpr9ltv3u1r0b4ea16i8a.apps.googleusercontent.com';

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleJwtPayload {
  name: string;
  email: string;
  picture: string;
}

function decodeJwt(token: string): GoogleJwtPayload {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export function EntryPage() {
  const navigate = useNavigate();
  const btnRef = useRef<HTMLDivElement>(null);
  const [sheetInput, setSheetInput] = useState(() => getSheetId());
  const [sheetSaved, setSheetSaved] = useState(hasSheetsUrl());
  const [showSheetEdit, setShowSheetEdit] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLogin = useCallback((response: GoogleCredentialResponse) => {
    const payload = decodeJwt(response.credential);
    localStorage.setItem('playerName', payload.name);
    localStorage.setItem('playerEmail', payload.email);
    localStorage.setItem('playerPicture', payload.picture || '');
    submitScore(payload.name, payload.email, 'login', 0, 'login');
    navigate('/lobby');
  }, [navigate]);

  useEffect(() => {
    if (localStorage.getItem('playerEmail')) {
      navigate('/lobby');
      return;
    }

    const initGoogle = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id) {
        setTimeout(initGoogle, 100);
        return;
      }
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleLogin,
      });
      if (btnRef.current) {
        google.accounts.id.renderButton(btnRef.current, {
          theme: 'filled_blue',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 280,
        });
      }
    };
    initGoogle();
  }, [handleLogin, navigate]);

  const handleSaveSheet = () => {
    setSheetId(sheetInput);
    setSheetSaved(hasSheetsUrl());
  };

  const copyUrl = () => {
    const id = getSheetId();
    const base = window.location.origin + window.location.pathname;
    const url = id ? `${base}?sheet=${id}` : base;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 24 }}>
      <h1 style={{ fontSize: 48 }}>🎮</h1>
      <h2>micro:bit Games</h2>
      <div ref={btnRef} />

      {/* 시트 설정 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{ fontSize: 12, color: sheetSaved ? '#4aff9e' : '#ff4a6a', cursor: 'pointer' }}
            onClick={() => setShowSheetEdit(v => !v)}
          >
            {sheetSaved ? '● 점수 기록 연결됨' : '○ 점수 기록 미연결'}
            <span style={{ color: '#555', marginLeft: 4 }}>{showSheetEdit ? '▲' : '▼'}</span>
          </span>
          {sheetSaved && (
            <button
              onClick={copyUrl}
              style={{
                padding: '2px 10px', fontSize: 11, borderRadius: 4,
                border: '1px solid #4a9eff', background: 'transparent',
                color: copied ? '#4aff9e' : '#4a9eff', cursor: 'pointer',
              }}
            >
              {copied ? '복사됨 ✓' : 'URL 복사'}
            </button>
          )}
        </div>
        {showSheetEdit && (
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={sheetInput}
              onChange={e => setSheetInput(e.target.value)}
              placeholder="Apps Script 배포 ID 또는 URL"
              style={{
                padding: '4px 10px', fontSize: 11, borderRadius: 6,
                border: '1px solid #444', background: '#2a2a4a', color: '#ccc',
                width: 300,
              }}
            />
            <button
              onClick={handleSaveSheet}
              style={{
                padding: '4px 14px', fontSize: 11, borderRadius: 6,
                border: 'none', background: '#3a3a5a', color: '#aaa', cursor: 'pointer',
              }}
            >
              저장
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
