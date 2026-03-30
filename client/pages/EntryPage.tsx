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
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

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

  const APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getOrCreateSheet();
    sheet.appendRow([
      data.playerName || '',
      data.email || '',
      data.gameId || '',
      data.score || 0,
      data.input || '',
      data.version || '',
      data.createdAt || new Date().toISOString()
    ]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('scores');
  if (!sheet) {
    sheet = ss.insertSheet('scores');
    sheet.appendRow(['playerName', 'email', 'gameId', 'score', 'input', 'version', 'createdAt']);
    sheet.getRange('1:1').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
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

        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 11, color: '#666', lineHeight: 2, textAlign: 'left', width: '100%' }}>
          <li><a href="https://sheets.google.com" target="_blank" rel="noreferrer" style={{ color: '#4a9eff' }}>Google Sheets</a> 새로 만들기</li>
          <li>확장 프로그램 → Apps Script → 아래 코드 붙여넣기</li>
          <li>배포 → 새 배포 → 웹 앱 (실행: <b style={{ color: '#ccc' }}>나</b>, 액세스: <b style={{ color: '#ccc' }}>모든 사용자</b>)</li>
          <li>배포 URL을 위 입력란에 붙여넣기 → 연결</li>
          <li>URL 복사 → 학생에게 공유</li>
        </ol>

        {/* Code.gs */}
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span
              style={{ fontSize: 11, color: '#888', cursor: 'pointer' }}
              onClick={() => setShowCode(v => !v)}
            >
              Apps Script 코드 {showCode ? '▲' : '▼'}
            </span>
            <button
              onClick={copyCode}
              style={{
                padding: '2px 10px', fontSize: 10, borderRadius: 4,
                border: '1px solid #555', background: 'transparent',
                color: codeCopied ? '#4aff9e' : '#aaa', cursor: 'pointer',
              }}
            >
              {codeCopied ? '복사됨 ✓' : '코드 복사'}
            </button>
          </div>
          {showCode && (
            <pre style={{
              margin: 0, padding: 10, fontSize: 10, lineHeight: 1.4,
              background: '#1a1a2e', borderRadius: 6, color: '#aaa',
              overflow: 'auto', maxHeight: 200,
            }}>
              {APPS_SCRIPT_CODE}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
