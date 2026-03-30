export interface GameCallbacks {
  onGameOver: (score: number) => void;
}

export abstract class GameEngine {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected score = 0;
  protected elapsed = 0;
  protected running = false;
  private rafId = 0;
  private lastTime = 0;
  private callbacks: GameCallbacks;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.callbacks = callbacks;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.score = 0;
    this.elapsed = 0;
    this.lastTime = performance.now();
    this.init();
    this.loop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  protected gameOver(): void {
    this.stop();
    this.callbacks.onGameOver(this.score);
  }

  private loop = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.033); // 최대 33ms
    this.lastTime = now;
    this.elapsed += dt;

    this.update(dt);
    this.render(this.ctx);

    this.rafId = requestAnimationFrame(this.loop);
  };

  protected abstract init(): void;
  protected abstract update(dt: number): void;
  protected abstract render(ctx: CanvasRenderingContext2D): void;
}
