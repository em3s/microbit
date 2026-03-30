function getSheetsUrl(): string {
  // 1. URL 파라미터에서 읽기
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('sheet');
  if (fromUrl) {
    localStorage.setItem('sheetsUrl', fromUrl);
    return fromUrl;
  }

  // 2. localStorage에서 읽기
  return localStorage.getItem('sheetsUrl') || '';
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
  return getSheetsUrl() !== '';
}
