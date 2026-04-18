export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 560;
export const BG_COLOR = '#1a1a2e';

// 숫자 범위
export const MIN_VALUE = 1;
export const MAX_VALUE = 100;

// 색상 팔레트
export const COLOR_PRIMARY = '#4a9eff';
export const COLOR_CORRECT = '#4aff9e';
export const COLOR_UP = '#4aff9e';
export const COLOR_DOWN = '#ffa04a';
export const COLOR_MID = '#ffd700';

// 이분탐색 최적 시도 (log2 올림)
export const OPTIMAL_TRIES = Math.ceil(Math.log2(MAX_VALUE - MIN_VALUE + 1));
