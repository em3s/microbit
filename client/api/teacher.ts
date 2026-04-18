// 선생님 모드 — 이진탐색 힌트/통계 같은 교사용 오버레이를 켜고 끔.
// 비밀번호는 클라이언트 상수. 진짜 보안이 아니라 "학생 기본값에서 숨김" 용도.

const PASSWORD = 'teacher';
const KEY = 'teacherMode';

export function isTeacherMode(): boolean {
  return localStorage.getItem(KEY) === '1';
}

export function tryEnableTeacherMode(input: string): boolean {
  if (input === PASSWORD) {
    localStorage.setItem(KEY, '1');
    return true;
  }
  return false;
}

export function disableTeacherMode(): void {
  localStorage.removeItem(KEY);
}
