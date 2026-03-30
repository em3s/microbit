import { GameEngine, GameCallbacks } from '../engine/GameEngine';
import { InputManager } from '../engine/InputManager';
import { RunnerGame } from './runner/RunnerGame';
import { COMMAND_COOLDOWNS, KEYBOARD_MAP } from './runner/config';
import type { CommandConfig } from '../engine/InputManager';
import { WebSerialManager } from '../serial/WebSerialManager';

interface GameDef {
  name: string;
  create: (canvas: HTMLCanvasElement, input: InputManager, callbacks: GameCallbacks) => GameEngine;
  commands: Record<string, CommandConfig>;
}

export const GAME_REGISTRY: Record<string, GameDef> = {
  runner: {
    name: '러너',
    create: (canvas, input, callbacks) => new RunnerGame(canvas, input, callbacks),
    commands: {
      jump: { cooldownMs: COMMAND_COOLDOWNS.jump, keyboardKey: KEYBOARD_MAP.jump },
      slide: { cooldownMs: COMMAND_COOLDOWNS.slide, keyboardKey: KEYBOARD_MAP.slide },
      double: { cooldownMs: COMMAND_COOLDOWNS.double, keyboardKey: KEYBOARD_MAP.double },
    },
  },
};

export function createGame(
  gameId: string,
  canvas: HTMLCanvasElement,
  serial: WebSerialManager | null,
  callbacks: GameCallbacks,
  enableKeyboard = false,
): { engine: GameEngine; input: InputManager } | null {
  const def = GAME_REGISTRY[gameId];
  if (!def) return null;

  const input = new InputManager(serial, def.commands, enableKeyboard);
  const engine = def.create(canvas, input, callbacks);
  return { engine, input };
}
