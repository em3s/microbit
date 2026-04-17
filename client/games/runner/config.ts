export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;
export const GROUND_Y = 320;

// 플레이어
export const PLAYER_X = 80;
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 60;
export const JUMP_VELOCITY = -600;
export const DOUBLE_JUMP_VELOCITY = -500;
export const GRAVITY = 1800;
export const SLIDE_DURATION = 0.5; // 초
export const SLIDE_HEIGHT = 30;

// 스크롤
export const INITIAL_SPEED = 300; // px/s
export const MAX_SPEED = 700;
export const SPEED_INCREASE_RATE = 3; // px/s per second

// 장애물 스폰
export const SPAWN_INTERVAL_START = 1.5; // 초
export const SPAWN_INTERVAL_MIN = 0.55;
export const SPAWN_RAMP_DURATION = 5; // 초에 걸쳐 감소 — 숏폼 템포
export const COMBO_UNLOCK_TIME = 2; // 초 후 콤보(더블점프) 장애물 등장
export const GATE_UNLOCK_TIME = 4; // 초 후 게이트(슬라이드) 장애물 등장

// 장애물 간 최소 간격 (px) — 더블점프/연속 점프 가능하도록 보장
export const OBSTACLE_SPACING_MIN_PX = 400;

// 상태 송신 주기 (Hz) — micro:bit 자동화용
export const STATE_BROADCAST_HZ = 20;

// 장애물 크기
export const OBSTACLE_TALL_HEIGHT = 60;
export const OBSTACLE_COMBO_HEIGHT = 100;
export const OBSTACLE_WIDTH = 30;

// 낮은 장애물 (게이트: 위아래 막힘, 슬라이드 통로만 열림)
export const GATE_GAP_HEIGHT = SLIDE_HEIGHT + 4; // 슬라이드 높이 + 여유
export const GATE_WIDTH = 40;

// 명령어 쿨다운
export const COMMAND_COOLDOWNS = {
  jump: 80,
  slide: 100,
  double: 150,
} as const;

// 키보드 매핑 (개발용, ?keyboard=true)
export const KEYBOARD_MAP = {
  jump: ' ',      // Space
  slide: 's',
  double: 'd',
} as const;
