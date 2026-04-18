// 게임 접속 비번 — 학생은 4자리 입력 후 해시 일치 시 통과.
// 교사 모드에서는 원문을 볼 수 있고 접속 자동 허용.

import { isTeacherMode } from './teacher';

const SALT = 'microbit-access-2026';
const CODE_HASH = 'bfe5b76d89eb1df769928dd277fdc6f057b636cb3197d2d3d771ac1b2d1f8260';
const _CODE_FOR_TEACHER = '4503';
const KEY = 'gameAccess';

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hasGameAccess(): boolean {
  return isTeacherMode() || localStorage.getItem(KEY) === '1';
}

export async function verifyAndGrantGameAccess(input: string): Promise<boolean> {
  const hash = await sha256(`${SALT}:${input}`);
  if (hash === CODE_HASH) {
    localStorage.setItem(KEY, '1');
    return true;
  }
  return false;
}

export function revokeGameAccess(): void {
  localStorage.removeItem(KEY);
}

/** 교사 모드에서만 접속 비번 원문 반환 */
export function getGameCodeForTeacher(): string | null {
  if (!isTeacherMode()) return null;
  return _CODE_FOR_TEACHER;
}
