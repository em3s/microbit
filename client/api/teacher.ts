// 선생님 모드 — 이진탐색 힌트/통계 같은 교사용 오버레이 토글.
// 비밀번호는 단방향 SHA-256 해시로만 저장. 원 비번은 코드에 없음.
// 4자리 숫자라 이론상 brute-force 가능 — 학생으로부터 숨기는 수준의 난독화.

const SALT = 'microbit-teacher-2026';
const PASSWORD_HASH = '69ee41cc049cbbcd0307f679fe757824f7c01ca4dc25ca739eda04803a25f685';
const KEY = 'teacherMode';

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function isTeacherMode(): boolean {
  return localStorage.getItem(KEY) === '1';
}

export async function tryEnableTeacherMode(input: string): Promise<boolean> {
  const hash = await sha256(`${SALT}:${input}`);
  if (hash === PASSWORD_HASH) {
    localStorage.setItem(KEY, '1');
    return true;
  }
  return false;
}

export function disableTeacherMode(): void {
  localStorage.removeItem(KEY);
}
