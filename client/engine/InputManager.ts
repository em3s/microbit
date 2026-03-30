import { WebSerialManager } from '../serial/WebSerialManager';

export interface CommandConfig {
  cooldownMs: number;
  keyboardKey?: string;
}

export interface AnalogConfig {
  keyPositive?: string;   // 키보드 양방향 키
  keyNegative?: string;   // 키보드 음방향 키
  keyValue?: number;      // 키 입력 시 값 (기본 500)
}

export class InputManager {
  private configs: Record<string, CommandConfig>;
  private analogConfigs: Record<string, AnalogConfig>;
  private firedQueue: string[] = [];
  private firedThisFrame = new Set<string>();
  private lastAccepted = new Map<string, number>();
  private keysDown = new Set<string>();
  private keyToCommand = new Map<string, string>();

  // 연속 값 (가속도 등)
  private analogValues = new Map<string, number>();
  private keyToAnalog = new Map<string, { name: string; value: number }>();
  private analogBaseValues = new Map<string, number>(); // 원본 값 보관
  private _sensitivity = 1.0;
  private enableKeyboard: boolean;

  get sensitivity() { return this._sensitivity; }
  set sensitivity(val: number) {
    this._sensitivity = val;
    this.updateAnalogSensitivity();
  }
  private serial: WebSerialManager | null = null;
  private serialHandler: ((cmd: string) => void) | null = null;

  constructor(
    serial: WebSerialManager | null,
    configs: Record<string, CommandConfig>,
    enableKeyboard = false,
    analogConfigs: Record<string, AnalogConfig> = {},
  ) {
    this.configs = configs;
    this.analogConfigs = analogConfigs;
    this.enableKeyboard = enableKeyboard;

    // 키보드 매핑
    if (enableKeyboard) {
      for (const [cmd, cfg] of Object.entries(configs)) {
        if (cfg.keyboardKey) {
          this.keyToCommand.set(cfg.keyboardKey.toLowerCase(), cmd);
        }
      }
      for (const [name, cfg] of Object.entries(analogConfigs)) {
        const val = cfg.keyValue ?? 500;
        if (cfg.keyPositive) {
          this.keyToAnalog.set(cfg.keyPositive.toLowerCase(), { name, value: val });
          this.analogBaseValues.set(cfg.keyPositive.toLowerCase(), val);
        }
        if (cfg.keyNegative) {
          this.keyToAnalog.set(cfg.keyNegative.toLowerCase(), { name, value: -val });
          this.analogBaseValues.set(cfg.keyNegative.toLowerCase(), -val);
        }
      }
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
    }

    // 시리얼 명령어 수신
    this.serial = serial;
    this.serialHandler = (cmd: string) => {
      // 연속 값: "x:123" 형태
      const colonIdx = cmd.indexOf(':');
      if (colonIdx !== -1) {
        const name = cmd.substring(0, colonIdx);
        const value = Number(cmd.substring(colonIdx + 1));
        if (!isNaN(value)) {
          this.analogValues.set(name, value);
        }
        return;
      }
      // 이산 명령어
      if (cmd in this.configs) {
        this.firedQueue.push(cmd);
      }
    };
    serial?.on('command', this.serialHandler);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();

    // 민감도 조절 (↑/↓)
    if (key === 'arrowup') {
      this.sensitivity = Math.min(this.sensitivity + 0.5, 20.0);
      return;
    }
    if (key === 'arrowdown') {
      this.sensitivity = Math.max(this.sensitivity - 0.5, 0.5);
      return;
    }

    if (this.keyToCommand.has(key) && !this.keysDown.has(key)) {
      this.keysDown.add(key);
      this.firedQueue.push(this.keyToCommand.get(key)!);
    }
    if (this.keyToAnalog.has(key)) {
      this.keysDown.add(key);
    }
  };

  private updateAnalogSensitivity(): void {
    for (const [key, baseVal] of this.analogBaseValues) {
      const entry = this.keyToAnalog.get(key);
      if (entry) {
        entry.value = baseVal * this.sensitivity;
      }
    }
  }

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

    // 키보드 → 아날로그 값 시뮬레이션
    for (const name of Object.keys(this.analogConfigs)) {
      let val = 0;
      for (const [key, cfg] of this.keyToAnalog) {
        if (cfg.name === name && this.keysDown.has(key)) {
          val += cfg.value;
        }
      }
      // 키보드 입력이 있으면 그 값, 없으면 시리얼 값 유지 (시리얼은 command에서 세팅됨)
      if (val !== 0) {
        this.analogValues.set(name, val);
      } else if ([...this.keyToAnalog.values()].some(c => c.name === name) &&
                 ![...this.keyToAnalog.entries()].some(([k]) => this.keysDown.has(k))) {
        // 키보드 모드인데 아무 키도 안 눌림 → 0
        this.analogValues.set(name, 0);
      }
    }
  }

  /** 이번 프레임에 해당 명령어가 입력되었는지 */
  wasCommandFired(command: string): boolean {
    return this.firedThisFrame.has(command);
  }

  /** 연속 값 읽기 (가속도 등) */
  getValue(name: string): number {
    return this.analogValues.get(name) ?? 0;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    if (this.serialHandler) {
      this.serial?.off('command', this.serialHandler);
      this.serialHandler = null;
    }
  }
}
