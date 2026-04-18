// 게임별 접속 비번 — 교사가 해당 시간에 허용된 게임의 비번만 공개하여
// 학생이 다른 게임으로 새는 것을 방지하는 용도.
// 학생은 4자리 입력 후 해시 일치 시 통과. 교사 모드에서는 원문 조회 + 자동 통과.

import { isTeacherMode } from './teacher';

const SALT = 'microbit-access-2026';

interface GameAccess {
  hash: string;
  _plain: string;
}

const GAMES: Record<string, GameAccess> = {
  runner: { hash: 'e4099f2980dae3c51945aed2fb3beeee2604d65398fc086d6a403220dbb1af25', _plain: '8073' },
  dodge:  { hash: '416f330cca790b51f52fa6fe5475e753d83b2fc439fea83d73799c2460729e89', _plain: '6728' },
  hanoi:  { hash: '3f1db88926c2aa7282ad5231595300d02f65e2c3407927dd8473a7a44698b4c8', _plain: '2616' },
  updown: { hash: '61090e3d206d68b83f62dab60567a28687516bb9fd23586957851833bc06c26f', _plain: '1271' },
};

const KEY_PREFIX = 'gameAccess:';

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hasGameAccess(gameId: string): boolean {
  return isTeacherMode() || localStorage.getItem(KEY_PREFIX + gameId) === '1';
}

export async function verifyAndGrantGameAccess(gameId: string, input: string): Promise<boolean> {
  const entry = GAMES[gameId];
  if (!entry) return false;
  const hash = await sha256(`${SALT}:${gameId}:${input}`);
  if (hash === entry.hash) {
    localStorage.setItem(KEY_PREFIX + gameId, '1');
    return true;
  }
  return false;
}

export function revokeAllGameAccess(): void {
  for (const id of Object.keys(GAMES)) {
    localStorage.removeItem(KEY_PREFIX + id);
  }
}

export function getGameIds(): string[] {
  return Object.keys(GAMES);
}

/** 교사 모드에서만 해당 게임의 접속 비번 원문 반환 */
export function getGameCodeForTeacher(gameId: string): string | null {
  if (!isTeacherMode()) return null;
  return GAMES[gameId]?._plain ?? null;
}
