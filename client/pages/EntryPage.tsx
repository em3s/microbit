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

      {/* 선생님 설정 */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 24,
        background: '#2a2a4a', borderRadius: 12, padding: '16px 24px', maxWidth: 400, width: '100%',
      }}>
        <h4 style={{ margin: 0, color: '#aaa', fontSize: 13 }}>선생님 설정</h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={sheetInput}
              onChange={e => setSheetInput(e.target.value)}
              placeholder="Apps Script 배포 ID 또는 URL"
              style={{
                padding: '6px 10px', fontSize: 12, borderRadius: 6,
                border: '1px solid #444', background: '#1a1a2e', color: '#ccc',
                flex: 1,
              }}
            />
            <button
              onClick={handleSaveSheet}
              style={{
                padding: '6px 14px', fontSize: 12, borderRadius: 6,
                border: 'none', background: sheetSaved ? '#4aff9e' : '#4a9eff',
                color: '#1a1a2e', cursor: 'pointer', fontWeight: 'bold',
                whiteSpace: 'nowrap',
              }}
            >
              {sheetSaved ? '연결됨 ✓' : '연결'}
            </button>
          </div>

          {sheetSaved && (
            <button
              onClick={copyUrl}
              style={{
                padding: '6px 14px', fontSize: 12, borderRadius: 6,
                border: '1px solid #4a9eff', background: 'transparent',
                color: copied ? '#4aff9e' : '#4a9eff', cursor: 'pointer',
                width: '100%',
              }}
            >
              {copied ? '복사됨 ✓' : 'URL 복사 — 학생에게 이 링크를 공유하세요'}
            </button>
          )}
        </div>

        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 11, color: '#666', lineHeight: 2 }}>
          <li>Google Sheets 생성 → 확장 프로그램 → Apps Script</li>
          <li>Code.gs 붙여넣기 → 배포 → 웹 앱 (실행: 나, 액세스: 모든 사용자)</li>
          <li>배포 URL을 위 입력란에 붙여넣기 → 연결</li>
          <li>URL 복사 → 학생에게 공유</li>
        </ol>
      </div>
    </div>
  );
}
