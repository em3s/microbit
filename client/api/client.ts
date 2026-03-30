const SHEETS_BASE = 'https://script.google.com/macros/s/';
const SHEETS_SUFFIX = '/exec';

/** ID만 추출하여 저장. full URL이든 ID만이든 받음 */
function parseSheetId(input: string): string {
  const trimmed = input.trim();
  // full URL: https://script.google.com/macros/s/AKfyc.../exec
  const match = trimmed.match(/\/macros\/s\/([^/]+)/);
  if (match) return match[1];
  // ID만 들어온 경우 (AKfyc...)
  if (trimmed.startsWith('AKfyc')) return trimmed;
  return '';
}

function getSheetId(): string {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('sheet');
  if (fromUrl) {
    const id = parseSheetId(fromUrl);
    if (id) localStorage.setItem('sheetId', id);
    return id;
  }
  return localStorage.getItem('sheetId') || '';
}

function getSheetsUrl(): string {
  const id = getSheetId();
  if (!id) return '';
  return SHEETS_BASE + id + SHEETS_SUFFIX;
}

export function submitScore(playerName: string, gameId: string, score: number, input: string) {
  const url = getSheetsUrl();
  if (!url) return;

  fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      playerName,
      gameId,
      score: Math.floor(score),
      input,
      createdAt: new Date().toISOString(),
    }),
    mode: 'no-cors',
  }).catch(() => {});
}

export function hasSheetsUrl(): boolean {
  return getSheetId() !== '';
}
