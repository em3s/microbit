const SHEETS_BASE = 'https://script.google.com/macros/s/';
const SHEETS_SUFFIX = '/exec';

function parseSheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/macros\/s\/([^/]+)/);
  if (match) return match[1];
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
      createdAt: new Date().toISOString(),
    }),
    mode: 'no-cors',
  }).catch(() => {});
}

export function hasSheetsUrl(): boolean {
  return getSheetId() !== '';
}

export function getSheetIdPublic(): string {
  return getSheetId();
}

export function setSheetId(id: string): void {
  const parsed = parseSheetId(id);
  if (parsed) {
    localStorage.setItem('sheetId', parsed);
  } else {
    localStorage.removeItem('sheetId');
  }
}
