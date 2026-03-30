import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasSheetsUrl } from '../api/client';

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
  return JSON.parse(atob(base64));
}

export function EntryPage() {
  const navigate = useNavigate();
  const hasSheet = hasSheetsUrl();
  const btnRef = useRef<HTMLDivElement>(null);

  const handleLogin = useCallback((response: GoogleCredentialResponse) => {
    const payload = decodeJwt(response.credential);
    localStorage.setItem('playerName', payload.name);
    localStorage.setItem('playerEmail', payload.email);
    localStorage.setItem('playerPicture', payload.picture || '');
    navigate('/lobby');
  }, [navigate]);

  useEffect(() => {
    // 이미 로그인되어 있으면 바로 로비로
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 24 }}>
      <h1 style={{ fontSize: 48 }}>🎮</h1>
      <h2>micro:bit Games</h2>
      <div ref={btnRef} />
      <p style={{ fontSize: 13, color: hasSheet ? '#4aff9e' : '#ff4a6a', maxWidth: 360, textAlign: 'center', lineHeight: 1.6 }}>
        {hasSheet
          ? '점수가 Google Sheets에 기록됩니다.'
          : '시트가 연결되지 않았습니다. 점수가 저장되지 않습니다.'}
      </p>
    </div>
  );
}
