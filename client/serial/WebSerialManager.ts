type EventMap = {
  command: (cmd: string) => void;
  connect: () => void;
  disconnect: () => void;
  error: (err: Error) => void;
};

type EventKey = keyof EventMap;

export class WebSerialManager {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private buffer = '';
  private listeners = new Map<EventKey, Set<Function>>();
  private running = false;
  private autoReconnect = false;
  private reconnecting = false;

  static isSupported(): boolean {
    return 'serial' in navigator;
  }

  on<K extends EventKey>(event: K, fn: EventMap[K]) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
  }

  off<K extends EventKey>(event: K, fn: EventMap[K]) {
    this.listeners.get(event)?.delete(fn);
  }

  private emit<K extends EventKey>(event: K, ...args: Parameters<EventMap[K]>) {
    this.listeners.get(event)?.forEach(fn => (fn as Function)(...args));
  }

  /** 유저 프롬프트로 포트 선택 후 연결 */
  async connect(baudRate = 115200): Promise<void> {
    if (this.port) return;

    try {
      this.port = await navigator.serial.requestPort({
        filters: [{ usbVendorId: 0x0d28 }], // micro:bit
      });
      await this.openPort(baudRate);
      this.autoReconnect = true;
    } catch (err) {
      this.port = null;
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
    }
  }

  /** 이전 페어링 포트로 자동 재연결 (프롬프트 없음) */
  private async tryReconnect(baudRate = 115200): Promise<boolean> {
    if (this.reconnecting || this.port) return false;
    this.reconnecting = true;

    try {
      const ports = await navigator.serial.getPorts();
      const microbitPort = ports.find(p => {
        const info = p.getInfo();
        return info.usbVendorId === 0x0d28;
      });

      if (microbitPort) {
        this.port = microbitPort;
        await this.openPort(baudRate);
        this.reconnecting = false;
        return true;
      }
    } catch {}

    this.reconnecting = false;
    return false;
  }

  private async openPort(baudRate: number): Promise<void> {
    if (!this.port) return;
    await this.port.open({ baudRate });
    this.running = true;
    this.buffer = '';
    this.emit('connect');
    this.readLoop();
  }

  async disconnect(): Promise<void> {
    this.autoReconnect = false;
    this.running = false;
    try {
      await this.reader?.cancel();
    } catch {}
    this.reader = null;
    try {
      await this.port?.close();
    } catch {}
    this.port = null;
    this.buffer = '';
    this.emit('disconnect');
  }

  isConnected(): boolean {
    return this.port !== null && this.running;
  }

  private async readLoop(): Promise<void> {
    if (!this.port?.readable) return;

    const decoder = new TextDecoder();

    while (this.running && this.port.readable) {
      try {
        this.reader = this.port.readable.getReader();
        while (this.running) {
          const { value, done } = await this.reader.read();
          if (done) break;
          this.buffer += decoder.decode(value, { stream: true });
          this.processBuffer();
        }
      } catch (err) {
        if (this.running) {
          this.emit('error', err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        try { this.reader?.releaseLock(); } catch {}
        this.reader = null;
      }
    }

    // 연결 끊김 처리
    const wasRunning = this.running;
    this.running = false;
    try { await this.port?.close(); } catch {}
    this.port = null;
    this.emit('disconnect');

    // 자동 재연결
    if (this.autoReconnect && wasRunning) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    setTimeout(async () => {
      if (!this.autoReconnect || this.port) return;
      const ok = await this.tryReconnect();
      if (!ok && this.autoReconnect) {
        this.scheduleReconnect();
      }
    }, 1500);
  }

  private processBuffer(): void {
    let newlineIdx: number;
    while ((newlineIdx = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.substring(0, newlineIdx).trim();
      this.buffer = this.buffer.substring(newlineIdx + 1);
      if (line.length > 0) {
        this.emit('command', line);
      }
    }
    if (this.buffer.length > 256) {
      this.buffer = this.buffer.substring(this.buffer.length - 64);
    }
  }
}
