export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 500;

// 기둥
export const PEG_COUNT = 3;
export const PEG_HEIGHT = 280;
export const PEG_WIDTH = 8;
export const PEG_BASE_Y = 420;
export const PEG_BASE_WIDTH = 160;
export const PEG_BASE_HEIGHT = 10;

// 디스크
export const DISK_HEIGHT = 30;
export const DISK_MIN_WIDTH = 40;
export const DISK_MAX_WIDTH = 140;
export const DISK_HIT_PADDING = 10;

// 드래그 & 드롭
export const DROP_SPEED = 1500;     // px/s
export const DROP_OFFSET_Y = 60;    // 드롭 시작 위치 (목표 위 px)

// 색상
export const DISK_COLORS = [
  '#ff4a6a', '#ffa04a', '#ffd700', '#4aff9e', '#4a9eff',
  '#a04aff', '#ff4aff', '#4affff',
];
export const PEG_COLOR = '#3a3a5a';
export const BG_COLOR = '#1a1a2e';
export const SELECTED_GLOW = '#ffd700';

// 난이도
export const DEFAULT_LEVEL = 3;
export const MIN_LEVEL = 3;
export const MAX_LEVEL = 8;
