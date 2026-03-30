export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 500;
export const GROUND_Y = 480;

// 플레이어
export const PLAYER_WIDTH = 36;
export const PLAYER_HEIGHT = 36;
export const PLAYER_SPEED = 0.01; // 가속도 값 → 속도 변환 계수 (의도적으로 둔감)
export const PLAYER_FRICTION = 0.9; // 마찰 (1에 가까울수록 미끄러움)

// 블록
export const BLOCK_MIN_SIZE = 50;
export const BLOCK_MAX_SIZE = 90;
export const INITIAL_FALL_SPEED = 150; // px/s
export const MAX_FALL_SPEED = 500;
export const FALL_SPEED_INCREASE = 2; // px/s per second

// 스폰
export const SPAWN_INTERVAL_START = 0.8; // 초
export const SPAWN_INTERVAL_MIN = 0.1;
export const SPAWN_RAMP_DURATION = 45; // 초에 걸쳐 감소 (더 빠르게 어려워짐)

// 명령어 쿨다운 (게임 내에서 자체 관리, InputManager는 0)
export const COMMAND_COOLDOWNS = {
  left: 0,
  right: 0,
  boom: 0,
} as const;
export const KEYBOARD_MAP = {} as const;

// 아날로그 설정
export const ANALOG_CONFIGS = {
  x: { keyPositive: 'arrowright', keyNegative: 'arrowleft', keyValue: 600 },
} as const;
