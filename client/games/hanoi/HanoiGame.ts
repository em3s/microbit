import { GameEngine, GameCallbacks } from '../../engine/GameEngine';
import { InputManager } from '../../engine/InputManager';
import * as C from './config';

interface DiskInfo {
  size: number;
  color: string;
  width: number;
}

interface DragState {
  disk: DiskInfo;
  fromPeg: number;
  mx: number;  // 마우스 캔버스 좌표
  my: number;
}

// 놓은 뒤 떨어지는 짧은 애니메이션
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

  // --- 마우스 이벤트 ---
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

  private onMouseDown = (e: MouseEvent): void => {
    if (this.won || this.drag || this.dropAnim) return;
    const { x, y } = this.toCanvas(e);
    const pegIdx = this.getPegAt(x);
    const stack = this.pegs[pegIdx];
    if (stack.length === 0) return;

    // 맨 위 디스크 히트 체크 (여유 있게)
    const topIdx = stack.length - 1;
    const disk = stack[topIdx];
    const diskX = this.pegX[pegIdx] - disk.width / 2;
    const diskY = this.getDiskY(pegIdx, topIdx);
    if (x >= diskX - 10 && x <= diskX + disk.width + 10 &&
        y >= diskY - 10 && y <= C.PEG_BASE_Y + 10) {
      stack.pop();
      this.drag = { disk, fromPeg: pegIdx, mx: x, my: y };
      this.canvas.style.cursor = 'grabbing';
    }
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.drag) return;
    const { x, y } = this.toCanvas(e);
    this.drag.mx = x;
    this.drag.my = y;
  };

  private onMouseUp = (_e: MouseEvent): void => {
    if (!this.drag) return;
    const { disk, fromPeg, mx } = this.drag;
    const toPeg = this.getPegAt(mx);
    const targetStack = this.pegs[toPeg];

    const valid = toPeg !== fromPeg &&
      (targetStack.length === 0 || targetStack[targetStack.length - 1].size > disk.size);

    if (valid) {
      // 드롭 애니메이션 시작
      const targetY = this.getDiskY(toPeg, targetStack.length);
      this.dropAnim = {
        disk,
        toPeg,
        x: this.pegX[toPeg],
        y: this.getDiskY(toPeg, targetStack.length) - 60, // 살짝 위에서 시작
        targetY,
      };
    } else {
      // 무효 → 원래 기둥으로 복귀
      this.pegs[fromPeg].push(disk);
    }

    this.drag = null;
    this.canvas.style.cursor = 'pointer';
  };

  constructor(canvas: HTMLCanvasElement, _input: InputManager, callbacks: GameCallbacks) {
    super(canvas, callbacks);
    canvas.width = C.CANVAS_WIDTH;
    canvas.height = C.CANVAS_HEIGHT;
    canvas.style.cursor = 'pointer';

    const params = new URLSearchParams(window.location.search);
    const lvl = parseInt(params.get('level') || String(C.DEFAULT_LEVEL));
    this.level = Math.max(C.MIN_LEVEL, Math.min(C.MAX_LEVEL, isNaN(lvl) ? C.DEFAULT_LEVEL : lvl));

    const spacing = C.CANVAS_WIDTH / (C.PEG_COUNT + 1);
    for (let i = 0; i < C.PEG_COUNT; i++) {
      this.pegX.push(spacing * (i + 1));
    }

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

  protected init(): void {
    this.pegs = [[], [], []];
    this.moves = 0;
    this.won = false;
    this.drag = null;
    this.dropAnim = null;
    this.optimalMoves = Math.pow(2, this.level) - 1;

    for (let i = this.level; i >= 1; i--) {
      const t = (i - 1) / Math.max(this.level - 1, 1);
      this.pegs[0].push({
        size: i,
        color: C.DISK_COLORS[(i - 1) % C.DISK_COLORS.length],
        width: C.DISK_MIN_WIDTH + t * (C.DISK_MAX_WIDTH - C.DISK_MIN_WIDTH),
      });
    }
  }

  protected update(dt: number): void {
    if (this.dropAnim) {
      const a = this.dropAnim;
      a.y += 1500 * dt;
      if (a.y >= a.targetY) {
        a.y = a.targetY;
        this.pegs[a.toPeg].push(a.disk);
        this.moves++;
        this.dropAnim = null;

        if (this.pegs[2].length === this.level) {
          this.won = true;
          this.score = this.calculateScore();
          setTimeout(() => this.gameOver(), 1000);
        }
      }
    }
  }

  private getDiskY(_pegIdx: number, stackIndex: number): number {
    return C.PEG_BASE_Y - C.DISK_HEIGHT * (stackIndex + 1);
  }

  private calculateScore(): number {
    const efficiency = this.optimalMoves / Math.max(this.moves, 1);
    return Math.floor(efficiency * 700 + this.level * 100);
  }

  protected render(ctx: CanvasRenderingContext2D): void {
    const W = C.CANVAS_WIDTH;
    const H = C.CANVAS_HEIGHT;

    ctx.fillStyle = C.BG_COLOR;
    ctx.fillRect(0, 0, W, H);

    const labels = ['A', 'B', 'C'];

    // 드래그 중이면 목표 기둥 하이라이트
    const hoverPeg = this.drag ? this.getPegAt(this.drag.mx) : -1;

    for (let i = 0; i < C.PEG_COUNT; i++) {
      const px = this.pegX[i];
      const isHover = hoverPeg === i;

      // 기둥 바닥
      ctx.fillStyle = isHover ? C.SELECTED_GLOW : C.PEG_COLOR;
      ctx.fillRect(px - C.PEG_BASE_WIDTH / 2, C.PEG_BASE_Y, C.PEG_BASE_WIDTH, C.PEG_BASE_HEIGHT);

      // 기둥
      ctx.fillRect(px - C.PEG_WIDTH / 2, C.PEG_BASE_Y - C.PEG_HEIGHT, C.PEG_WIDTH, C.PEG_HEIGHT);

      // 라벨
      ctx.fillStyle = isHover ? C.SELECTED_GLOW : '#666';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], px, C.PEG_BASE_Y + 36);

      // 디스크
      const stack = this.pegs[i];
      for (let j = 0; j < stack.length; j++) {
        this.renderDisk(ctx, px, this.getDiskY(i, j), stack[j], false);
      }
    }

    // 드롭 애니메이션 디스크
    if (this.dropAnim) {
      const a = this.dropAnim;
      this.renderDisk(ctx, a.x, a.y, a.disk, false);
    }

    // 드래그 중인 디스크 (마우스 위치에)
    if (this.drag) {
      this.renderDisk(ctx, this.drag.mx, this.drag.my - C.DISK_HEIGHT / 2, this.drag.disk, true);
    }

    // HUD
    ctx.fillStyle = '#eee';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`이동: ${this.moves}`, 16, 32);

    ctx.fillStyle = '#666';
    ctx.font = '14px monospace';
    ctx.fillText(`최적: ${this.optimalMoves}`, 16, 54);

    // 승리
    if (this.won) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, H / 2 - 60, W, 120);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CLEAR!', W / 2, H / 2 - 10);

      ctx.fillStyle = '#eee';
      ctx.font = '18px monospace';
      ctx.fillText(`${this.moves}회 이동 (최적 ${this.optimalMoves}회)`, W / 2, H / 2 + 30);
    }

    // 안내
    if (!this.won && !this.drag && !this.dropAnim) {
      ctx.fillStyle = '#555';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('디스크를 드래그하여 옮기세요', W / 2, H - 16);
    }
  }

  private renderDisk(
    ctx: CanvasRenderingContext2D,
    cx: number, y: number,
    disk: DiskInfo, highlight: boolean,
  ): void {
    const w = disk.width;
    const h = C.DISK_HEIGHT;
    const x = cx - w / 2;
    const r = 6;

    if (highlight) {
      ctx.shadowColor = C.SELECTED_GLOW;
      ctx.shadowBlur = 16;
    }

    ctx.fillStyle = disk.color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h - 2, r);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(disk.size), cx, y + h / 2 + 4);
  }
}
