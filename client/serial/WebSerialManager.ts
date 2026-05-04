export type LogEntry = { direction: 'tx' | 'rx'; text: string; t: number };

type EventMap = {
  command: (cmd: string) => void;
  connect: () => void;
  disconnect: () => void;
  error: (err: Error) => void;
  log: (entry: LogEntry) => void;
};

type EventKey = keyof EventMap;

export class WebSerialManager {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private encoder = new TextEncoder();
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
      console.log('[Serial] port selected, opening...');
      await this.openPort(baudRate);
      console.log('[Serial] connected successfully');
      this.autoReconnect = true;
    } catch (err) {
      console.error('[Serial] connect failed:', err);
      this.port = null;
      const error = err instanceof Error ? err : new Error(String(err));
      if (error.message.includes('Failed to open serial port')) {
        alert('micro:bit 연결 실패!\n\n다른 탭이나 프로그램에서 이미 연결 중일 수 있습니다.\n다른 탭을 닫고 다시 시도해주세요.');
      }
      this.emit('error', error);
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
    if (this.port.writable) {
      try {
        this.writer = this.port.writable.getWriter();
      } catch {
        this.writer = null;
      }
    }
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
      this.writer?.releaseLock();
    } catch {}
    this.writer = null;
    try {
      await this.port?.close();
    } catch {}
    this.port = null;
    this.buffer = '';
    this.emit('disconnect');
  }

  /** 텍스트 한 줄을 micro:bit로 송신 (줄바꿈 포함 안 되어 있으면 호출자가 붙여야 함) */
  send(text: string): void {
    if (!this.writer) return;
    try {
      this.writer.write(this.encoder.encode(text));
      this.emit('log', { direction: 'tx', text: text.replace(/\n+$/, ''), t: Date.now() });
    } catch {}
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
    try { this.writer?.releaseLock(); } catch {}
    this.writer = null;
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
        this.emit('log', { direction: 'rx', text: line, t: Date.now() });
      }
    }
    if (this.buffer.length > 256) {
      this.buffer = this.buffer.substring(this.buffer.length - 64);
    }
  }
}
