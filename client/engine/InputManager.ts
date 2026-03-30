import { WebSerialManager } from '../serial/WebSerialManager';

export interface CommandConfig {
  cooldownMs: number;
  keyboardKey?: string;
}

export class InputManager {
  private configs: Record<string, CommandConfig>;
  private firedQueue: string[] = [];
  private firedThisFrame = new Set<string>();
  private lastAccepted = new Map<string, number>();
  private keysDown = new Set<string>();
  private keyToCommand = new Map<string, string>();

  constructor(serial: WebSerialManager | null, configs: Record<string, CommandConfig>, enableKeyboard = false) {
    this.configs = configs;

    // 키보드 매핑 (개발용, ?keyboard=true 일 때만)
    if (enableKeyboard) {
      for (const [cmd, cfg] of Object.entries(configs)) {
        if (cfg.keyboardKey) {
          this.keyToCommand.set(cfg.keyboardKey.toLowerCase(), cmd);
        }
      }
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
    }

    // 시리얼 명령어 수신
    serial?.on('command', (cmd: string) => {
      if (cmd in this.configs) {
        this.firedQueue.push(cmd);
      }
    });
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    if (this.keyToCommand.has(key) && !this.keysDown.has(key)) {
      this.keysDown.add(key);
      this.firedQueue.push(this.keyToCommand.get(key)!);
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keysDown.delete(e.key.toLowerCase());
  };

  /** 매 프레임 시작 시 호출 */
  update(): void {
    this.firedThisFrame.clear();
    const now = performance.now();

    for (const cmd of this.firedQueue) {
      const cooldown = this.configs[cmd]?.cooldownMs ?? 0;
      const last = this.lastAccepted.get(cmd) ?? 0;
      if (now - last >= cooldown) {
        this.firedThisFrame.add(cmd);
        this.lastAccepted.set(cmd, now);
      }
    }
    this.firedQueue.length = 0;
  }

  /** 이번 프레임에 해당 명령어가 입력되었는지 */
  wasCommandFired(command: string): boolean {
    return this.firedThisFrame.has(command);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
