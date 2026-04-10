import { GameEngine, GameCallbacks } from '../../engine/GameEngine';
import { InputManager } from '../../engine/InputManager';
import { submitScore } from '../../api/client';
import * as C from './config';

interface DiskInfo {
  size: number;
  color: string;
  width: number;
}

interface DragState {
  disk: DiskInfo;
  fromPeg: number;
  mx: number;
  my: number;
}

interface DropAnim {
  disk: DiskInfo;
  toPeg: number;
  x: number;
  y: number;
  targetY: number;
}

export class HanoiGame extends GameEngine {
  private level: number;
  private pegs: DiskInfo[][] = [[], [], []];
  private moves = 0;
  private optimalMoves = 0;
  private won = false;
  private drag: DragState | null = null;
  private dropAnim: DropAnim | null = null;
  private pegX: number[] = [];

  constructor(canvas: HTMLCanvasElement, _input: InputManager, callbacks: GameCallbacks) {
    super(canvas, callbacks);
    canvas.width = C.CANVAS_WIDTH;
    canvas.height = C.CANVAS_HEIGHT;
    canvas.style.cursor = 'pointer';

    this.level = this.parseLevelFromURL();
    this.pegX = this.computePegPositions();

    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mouseup', this.onMouseUp);
    canvas.addEventListener('mouseleave', this.onMouseUp);
  }

  stop(): void {
    super.stop();
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('mouseleave', this.onMouseUp);
    this.canvas.style.cursor = '';
  }

  // ── 초기화 ──

  protected init(): void {
    this.pegs = [[], [], []];
    this.moves = 0;
    this.won = false;
    this.drag = null;
    this.dropAnim = null;
    this.optimalMoves = (1 << this.level) - 1;

    for (let i = this.level; i >= 1; i--) {
      const t = (i - 1) / Math.max(this.level - 1, 1);
      this.pegs[0].push({
        size: i,
        color: C.DISK_COLORS[(i - 1) % C.DISK_COLORS.length],
        width: C.DISK_MIN_WIDTH + t * (C.DISK_MAX_WIDTH - C.DISK_MIN_WIDTH),
      });
    }
  }

  // ── 업데이트 ──

  protected update(dt: number): void {
    if (!this.dropAnim) return;

    const a = this.dropAnim;
    a.y += C.DROP_SPEED * dt;
    if (a.y < a.targetY) return;

    a.y = a.targetY;
    this.pegs[a.toPeg].push(a.disk);
    this.moves++;
    this.dropAnim = null;

    if (this.pegs[2].length === this.level) {
      this.won = true;
      this.recordToSheet();
    }
  }

  // ── 드래그 & 드롭 ──

  private readonly RESTART_BTN = { x: C.CANVAS_WIDTH / 2 - 60, y: C.CANVAS_HEIGHT / 2 + 44, w: 120, h: 36 };

  private onMouseDown = (e: MouseEvent): void => {
    if (this.won) {
      const pos = this.toCanvas(e);
      const b = this.RESTART_BTN;
      if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) {
        this.init();
        this.score = 0;
        this.elapsed = 0;
      }
      return;
    }
    if (this.drag || this.dropAnim) return;

    const pos = this.toCanvas(e);
    const pegIdx = this.getPegAt(pos.x);
    const stack = this.pegs[pegIdx];
    if (stack.length === 0) return;

    const topIdx = stack.length - 1;
    const disk = stack[topIdx];
    if (this.isDiskHit(pos, pegIdx, topIdx, disk)) {
      stack.pop();
      this.drag = { disk, fromPeg: pegIdx, mx: pos.x, my: pos.y };
      this.canvas.style.cursor = 'grabbing';
    }
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.drag) return;
    const pos = this.toCanvas(e);
    this.drag.mx = pos.x;
    this.drag.my = pos.y;
  };

  private onMouseUp = (): void => {
    if (!this.drag) return;

    const { disk, fromPeg, mx } = this.drag;
    const toPeg = this.getPegAt(mx);
    const targetStack = this.pegs[toPeg];

    const canPlace = toPeg !== fromPeg &&
      (targetStack.length === 0 || targetStack[targetStack.length - 1].size > disk.size);

    if (canPlace) {
      const targetY = this.diskY(targetStack.length);
      this.dropAnim = {
        disk, toPeg,
        x: this.pegX[toPeg],
        y: targetY - C.DROP_OFFSET_Y,
        targetY,
      };
    } else {
      this.pegs[fromPeg].push(disk);
    }

    this.drag = null;
    this.canvas.style.cursor = 'pointer';
  };

  // ── 렌더링 ──

  protected render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = C.BG_COLOR;
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);

    const hoverPeg = this.drag ? this.getPegAt(this.drag.mx) : -1;
    this.renderPegs(ctx, hoverPeg);
    this.renderFloatingDisks(ctx);
    this.renderHUD(ctx);

    if (this.won) {
      this.renderVictory(ctx);
    } else if (!this.drag && !this.dropAnim) {
      this.renderHint(ctx);
    }
  }

  private renderPegs(ctx: CanvasRenderingContext2D, hoverPeg: number): void {
    const labels = ['A', 'B', 'C'];

    for (let i = 0; i < C.PEG_COUNT; i++) {
      const px = this.pegX[i];
      const lit = hoverPeg === i;

      ctx.fillStyle = lit ? C.SELECTED_GLOW : C.PEG_COLOR;
      ctx.fillRect(px - C.PEG_BASE_WIDTH / 2, C.PEG_BASE_Y, C.PEG_BASE_WIDTH, C.PEG_BASE_HEIGHT);
      ctx.fillRect(px - C.PEG_WIDTH / 2, C.PEG_BASE_Y - C.PEG_HEIGHT, C.PEG_WIDTH, C.PEG_HEIGHT);

      ctx.fillStyle = lit ? C.SELECTED_GLOW : '#666';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], px, C.PEG_BASE_Y + 36);

      for (let j = 0; j < this.pegs[i].length; j++) {
        this.renderDisk(ctx, px, this.diskY(j), this.pegs[i][j], false);
      }
    }
  }

  private renderFloatingDisks(ctx: CanvasRenderingContext2D): void {
    if (this.dropAnim) {
      const a = this.dropAnim;
      this.renderDisk(ctx, a.x, a.y, a.disk, false);
    }
    if (this.drag) {
      this.renderDisk(ctx, this.drag.mx, this.drag.my - C.DISK_HEIGHT / 2, this.drag.disk, true);
    }
  }

  private renderHUD(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#eee';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`이동: ${this.moves}`, 16, 32);

    ctx.fillStyle = '#666';
    ctx.font = '14px monospace';
    ctx.fillText(`최적: ${this.optimalMoves}`, 16, 54);
  }

  private renderVictory(ctx: CanvasRenderingContext2D): void {
    const W = C.CANVAS_WIDTH;
    const cy = C.CANVAS_HEIGHT / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, cy - 50, W, 140);

    ctx.fillStyle = '#4aff9e';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('성공', W / 2, cy - 8);

    ctx.fillStyle = '#ccc';
    ctx.font = '16px monospace';
    ctx.fillText(`최적 ${this.optimalMoves}회 / 내 이동 ${this.moves}회`, W / 2, cy + 22);

    // 다시 시작 버튼
    const b = this.RESTART_BTN;
    ctx.fillStyle = '#4a9eff';
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('다시 시작', W / 2, b.y + b.h / 2 + 5);
  }

  private renderHint(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#555';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('디스크를 드래그하여 옮기세요', C.CANVAS_WIDTH / 2, C.CANVAS_HEIGHT - 16);
  }

  private renderDisk(
    ctx: CanvasRenderingContext2D,
    cx: number, y: number,
    disk: DiskInfo, glow: boolean,
  ): void {
    const x = cx - disk.width / 2;

    if (glow) {
      ctx.shadowColor = C.SELECTED_GLOW;
      ctx.shadowBlur = 16;
    }

    ctx.fillStyle = disk.color;
    ctx.beginPath();
    ctx.roundRect(x, y, disk.width, C.DISK_HEIGHT - 2, 6);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(disk.size), cx, y + C.DISK_HEIGHT / 2 + 4);
  }

  // ── 유틸 ──

  private toCanvas(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (C.CANVAS_WIDTH / rect.width),
      y: (e.clientY - rect.top) * (C.CANVAS_HEIGHT / rect.height),
    };
  }

  private getPegAt(cx: number): number {
    const zone = C.CANVAS_WIDTH / C.PEG_COUNT;
    return Math.max(0, Math.min(C.PEG_COUNT - 1, Math.floor(cx / zone)));
  }

  private isDiskHit(pos: { x: number; y: number }, pegIdx: number, stackIdx: number, disk: DiskInfo): boolean {
    const diskX = this.pegX[pegIdx] - disk.width / 2;
    const diskY = this.diskY(stackIdx);
    const pad = C.DISK_HIT_PADDING;
    return pos.x >= diskX - pad && pos.x <= diskX + disk.width + pad &&
           pos.y >= diskY - pad && pos.y <= C.PEG_BASE_Y + pad;
  }

  private diskY(stackIndex: number): number {
    return C.PEG_BASE_Y - C.DISK_HEIGHT * (stackIndex + 1);
  }

  private recordToSheet(): void {
    const name = localStorage.getItem('playerName') || '';
    const email = localStorage.getItem('playerEmail') || '';
    submitScore(name, email, `hanoi-lv${this.level}`, this.moves, 'mouse');
  }

  private parseLevelFromURL(): number {
    const params = new URLSearchParams(window.location.search);
    const lvl = parseInt(params.get('level') || String(C.DEFAULT_LEVEL));
    return Math.max(C.MIN_LEVEL, Math.min(C.MAX_LEVEL, isNaN(lvl) ? C.DEFAULT_LEVEL : lvl));
  }

  private computePegPositions(): number[] {
    const spacing = C.CANVAS_WIDTH / (C.PEG_COUNT + 1);
    return Array.from({ length: C.PEG_COUNT }, (_, i) => spacing * (i + 1));
  }
}
