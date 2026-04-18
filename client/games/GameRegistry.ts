import { GameEngine, GameCallbacks } from '../engine/GameEngine';
import { InputManager, type CommandConfig, type AnalogConfig } from '../engine/InputManager';
import { RunnerGame } from './runner/RunnerGame';
import { COMMAND_COOLDOWNS as RUNNER_COOLDOWNS, KEYBOARD_MAP as RUNNER_KEYS } from './runner/config';
import { DodgeGame } from './dodge/DodgeGame';
import { COMMAND_COOLDOWNS as DODGE_COOLDOWNS, KEYBOARD_MAP as DODGE_KEYS, ANALOG_CONFIGS as DODGE_ANALOG } from './dodge/config';
import { HanoiGame } from './hanoi/HanoiGame';
import { UpDownGame } from './updown/UpDownGame';
import { WebSerialManager } from '../serial/WebSerialManager';

export type GameCategory = 'microbit' | 'algorithm';

export interface GameDef {
  name: string;
  category: GameCategory;
  enabled: boolean;
  create: (canvas: HTMLCanvasElement, input: InputManager, callbacks: GameCallbacks) => GameEngine;
  commands: Record<string, CommandConfig>;
  analog?: Record<string, AnalogConfig>;
}

const ALL_GAMES: Record<string, GameDef> = {
  runner: {
    enabled: true,
    name: '러너',
    category: 'microbit',
    create: (canvas, input, callbacks) => new RunnerGame(canvas, input, callbacks),
    commands: {
      jump: { cooldownMs: RUNNER_COOLDOWNS.jump, keyboardKey: RUNNER_KEYS.jump },
      slide: { cooldownMs: RUNNER_COOLDOWNS.slide, keyboardKey: RUNNER_KEYS.slide },
      double: { cooldownMs: RUNNER_COOLDOWNS.double, keyboardKey: RUNNER_KEYS.double },
    },
  },
  dodge: {
    enabled: true,
    name: '피하기',
    category: 'microbit',
    create: (canvas, input, callbacks) => new DodgeGame(canvas, input, callbacks),
    commands: {
      left: { cooldownMs: DODGE_COOLDOWNS.left },
      right: { cooldownMs: DODGE_COOLDOWNS.right },
      boom: { cooldownMs: DODGE_COOLDOWNS.boom },
    },
    analog: DODGE_ANALOG as unknown as Record<string, AnalogConfig>,
  },
  hanoi: {
    enabled: true,
    name: '하노이탑',
    category: 'algorithm',
    create: (canvas, input, callbacks) => new HanoiGame(canvas, input, callbacks),
    commands: {},
  },
  updown: {
    enabled: true,
    name: '업앤다운',
    category: 'algorithm',
    create: (canvas, input, callbacks) => new UpDownGame(canvas, input, callbacks),
    commands: {},
  },
};

// 활성화된 게임만 노출
export const GAME_REGISTRY = Object.fromEntries(
  Object.entries(ALL_GAMES).filter(([, def]) => def.enabled)
);

export function createGame(
  gameId: string,
  canvas: HTMLCanvasElement,
  serial: WebSerialManager | null,
  callbacks: GameCallbacks,
  enableKeyboard = false,
): { engine: GameEngine; input: InputManager } | null {
  const def = ALL_GAMES[gameId];
  if (!def) return null;

  const input = new InputManager(serial, def.commands, enableKeyboard, def.analog);
  const engine = def.create(canvas, input, callbacks);
  return { engine, input };
}
