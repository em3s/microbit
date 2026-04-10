const SHEETS_BASE = 'https://script.google.com/macros/s/';
const SHEETS_SUFFIX = '/exec';
const APP_VERSION = '0.2.0';

function parseSheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/macros\/s\/([^/]+)/);
  if (match) return match[1];
  if (trimmed.startsWith('AKfyc')) return trimmed;
  return '';
}

// 최초 진입 시 URL 파라미터 → localStorage 저장 (한번만)
let urlChecked = false;
function checkUrlOnce() {
  if (urlChecked) return;
  urlChecked = true;
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('sheet');
  if (fromUrl) {
    const id = parseSheetId(fromUrl);
    if (id) localStorage.setItem('sheetId', id);
  }
}
checkUrlOnce();

const DEFAULT_SHEET_ID = 'AKfycbyjjLA5EUaUpPB29W0Qz36cv3xfVPdsAybwQSFX12vGaCW8_w2RgebHtMn3jN2Gp5w9cQ';

export function getSheetId(): string {
  return localStorage.getItem('sheetId') || DEFAULT_SHEET_ID;
}

export function setSheetId(id: string): void {
  const parsed = parseSheetId(id);
  if (parsed) {
    localStorage.setItem('sheetId', parsed);
  } else {
    localStorage.removeItem('sheetId');
  }
}

export function hasSheetsUrl(): boolean {
  return getSheetId() !== '';
}

function getSheetsUrl(): string {
  const id = getSheetId();
  if (!id) return '';
  return SHEETS_BASE + id + SHEETS_SUFFIX;
}

export function submitScore(playerName: string, email: string, gameId: string, score: number, input: string) {
  const url = getSheetsUrl();
  if (!url) return;

  fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      playerName,
      email,
      gameId,
      score: Math.floor(score),
      input,
      version: APP_VERSION,
      createdAt: new Date().toISOString(),
    }),
    mode: 'no-cors',
  }).catch(() => {});
}
