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

  async connect(baudRate = 115200): Promise<void> {
    if (this.port) return;

    try {
      this.port = await navigator.serial.requestPort({
        filters: [{ usbVendorId: 0x0d28 }], // micro:bit
      });
      await this.port.open({ baudRate });
      this.running = true;
      this.emit('connect');
      this.readLoop();
    } catch (err) {
      this.port = null;
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
    }
  }

  async disconnect(): Promise<void> {
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

    if (this.port) {
      this.running = false;
      this.port = null;
      this.emit('disconnect');
    }
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
    // 버퍼가 너무 길면 잘라냄 (비정상 데이터 방지)
    if (this.buffer.length > 256) {
      this.buffer = this.buffer.substring(this.buffer.length - 64);
    }
  }
}
