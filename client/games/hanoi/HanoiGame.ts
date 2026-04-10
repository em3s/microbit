import { GameEngine, GameCallbacks } from '../../engine/GameEngine';
import { InputManager } from '../../engine/InputManager';
import * as C from './config';

interface DiskInfo {
  size: number;       // 1 = smallest, N = largest
  color: string;
  width: number;
}

type AnimState = {
  disk: DiskInfo;
  fromPeg: number;
  toPeg: number;
  phase: 'lift' | 'move' | 'drop';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
};

export class HanoiGame extends GameEngine {
  private level: number;
  private pegs: DiskInfo[][] = [[], [], []];
  private selectedPeg: number | null = null;
  private moves = 0;
  private optimalMoves = 0;
  private won = false;
  private anim: AnimState | null = null;
  private clickQueue: number[] = []; // 클릭된 기둥 인덱스 큐

  // 기둥 x 좌표
  private pegX: number[] = [];

  private onClick = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = C.CANVAS_WIDTH / rect.width;
    const clickX = (e.clientX - rect.left) * scaleX;

    // 어떤 기둥 영역을 클릭했는지 판별
    const zoneWidth = C.CANVAS_WIDTH / C.PEG_COUNT;
    const pegIdx = Math.floor(clickX / zoneWidth);
    if (pegIdx >= 0 && pegIdx < C.PEG_COUNT) {
      this.clickQueue.push(pegIdx);
    }
  };

  constructor(canvas: HTMLCanvasElement, _input: InputManager, callbacks: GameCallbacks) {
    super(canvas, callbacks);
    canvas.width = C.CANVAS_WIDTH;
    canvas.height = C.CANVAS_HEIGHT;
    canvas.style.cursor = 'pointer';

    // URL에서 난이도 읽기
    const params = new URLSearchParams(window.location.search);
    const lvl = parseInt(params.get('level') || String(C.DEFAULT_LEVEL));
    this.level = Math.max(C.MIN_LEVEL, Math.min(C.MAX_LEVEL, isNaN(lvl) ? C.DEFAULT_LEVEL : lvl));

    // 기둥 x 좌표 계산
    const spacing = C.CANVAS_WIDTH / (C.PEG_COUNT + 1);
    for (let i = 0; i < C.PEG_COUNT; i++) {
      this.pegX.push(spacing * (i + 1));
    }

    // 마우스 클릭 리스너
    canvas.addEventListener('click', this.onClick);
  }

  stop(): void {
    super.stop();
    this.canvas.removeEventListener('click', this.onClick);
    this.canvas.style.cursor = '';
  }

  protected init(): void {
    this.pegs = [[], [], []];
    this.selectedPeg = null;
    this.moves = 0;
    this.won = false;
    this.anim = null;
    this.clickQueue.length = 0;
    this.optimalMoves = Math.pow(2, this.level) - 1;

    // 첫 번째 기둥에 디스크 쌓기 (큰 것부터)
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
    // 애니메이션 처리
    if (this.anim) {
      this.updateAnimation(dt);
      this.clickQueue.length = 0; // 애니메이션 중 클릭 무시
      return;
    }

    if (this.won) {
      this.clickQueue.length = 0;
      return;
    }

    // 클릭 큐 처리
    while (this.clickQueue.length > 0) {
      const pegIdx = this.clickQueue.shift()!;
      this.handlePegSelect(pegIdx);
      if (this.anim) break; // 이동 시작되면 나머지 클릭 무시
    }
  }

  private handlePegSelect(pegIdx: number): void {
    if (this.selectedPeg === null) {
      // 소스 기둥 선택
      if (this.pegs[pegIdx].length === 0) return; // 빈 기둥
      this.selectedPeg = pegIdx;
    } else {
      if (pegIdx === this.selectedPeg) {
        // 같은 기둥 → 취소
        this.selectedPeg = null;
        return;
      }
      // 이동 시도
      const sourcePeg = this.pegs[this.selectedPeg];
      const targetPeg = this.pegs[pegIdx];
      const disk = sourcePeg[sourcePeg.length - 1];

      if (targetPeg.length > 0 && targetPeg[targetPeg.length - 1].size < disk.size) {
        // 큰 디스크를 작은 디스크 위에 놓을 수 없음 → 취소
        this.selectedPeg = null;
        return;
      }

      // 유효한 이동 → 애니메이션 시작
      const fromPeg = this.selectedPeg;
      sourcePeg.pop();
      this.selectedPeg = null;

      const fromX = this.pegX[fromPeg];
      const fromY = this.getDiskY(fromPeg, sourcePeg.length); // 이미 pop했으므로 현재 길이가 이전 top 위치
      const toX = this.pegX[pegIdx];
      const toY = this.getDiskY(pegIdx, targetPeg.length);

      this.anim = {
        disk,
        fromPeg,
        toPeg: pegIdx,
        phase: 'lift',
        x: fromX,
        y: fromY,
        targetX: toX,
        targetY: toY,
      };
    }
  }

  private getDiskY(pegIdx: number, stackIndex: number): number {
    return C.PEG_BASE_Y - C.DISK_HEIGHT * (stackIndex + 1);
  }

  private readonly ANIM_SPEED = 1200; // px/s
  private readonly LIFT_Y = C.PEG_BASE_Y - C.PEG_HEIGHT - 40;

  private updateAnimation(dt: number): void {
    const a = this.anim!;
    const speed = this.ANIM_SPEED;

    if (a.phase === 'lift') {
      a.y -= speed * dt;
      if (a.y <= this.LIFT_Y) {
        a.y = this.LIFT_Y;
        a.phase = 'move';
      }
    } else if (a.phase === 'move') {
      const dx = a.targetX - a.x;
      if (Math.abs(dx) < speed * dt) {
        a.x = a.targetX;
        a.phase = 'drop';
      } else {
        a.x += Math.sign(dx) * speed * dt;
      }
    } else if (a.phase === 'drop') {
      a.y += speed * dt;
      if (a.y >= a.targetY) {
        a.y = a.targetY;
        // 애니메이션 완료 → 디스크 배치
        this.pegs[a.toPeg].push(a.disk);
        this.moves++;
        this.anim = null;

        // 승리 체크: 마지막 기둥에 모든 디스크
        if (this.pegs[2].length === this.level) {
          this.won = true;
          this.score = this.calculateScore();
          // 약간의 딜레이 후 게임오버 호출
          setTimeout(() => this.gameOver(), 1000);
        }
      }
    }
  }

  private calculateScore(): number {
    // 최적 이동 대비 점수 + 시간 보너스
    const efficiency = this.optimalMoves / Math.max(this.moves, 1);
    const timeBonus = Math.max(0, 300 - this.elapsed * 2);
    return Math.floor(efficiency * 700 + timeBonus + this.level * 100);
  }

  protected render(ctx: CanvasRenderingContext2D): void {
    const W = C.CANVAS_WIDTH;
    const H = C.CANVAS_HEIGHT;

    // 배경
    ctx.fillStyle = C.BG_COLOR;
    ctx.fillRect(0, 0, W, H);

    // 기둥 라벨
    const labels = ['A', 'B', 'C'];

    for (let i = 0; i < C.PEG_COUNT; i++) {
      const px = this.pegX[i];
      const isSelected = this.selectedPeg === i;

      // 기둥 바닥
      ctx.fillStyle = isSelected ? C.SELECTED_GLOW : C.PEG_COLOR;
      ctx.fillRect(
        px - C.PEG_BASE_WIDTH / 2,
        C.PEG_BASE_Y,
        C.PEG_BASE_WIDTH,
        C.PEG_BASE_HEIGHT,
      );

      // 기둥 기둥
      ctx.fillRect(
        px - C.PEG_WIDTH / 2,
        C.PEG_BASE_Y - C.PEG_HEIGHT,
        C.PEG_WIDTH,
        C.PEG_HEIGHT,
      );

      // 라벨
      ctx.fillStyle = isSelected ? C.SELECTED_GLOW : '#666';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], px, C.PEG_BASE_Y + 36);

      // 디스크 렌더링
      const stack = this.pegs[i];
      for (let j = 0; j < stack.length; j++) {
        const disk = stack[j];
        const dy = this.getDiskY(i, j);
        this.renderDisk(ctx, px, dy, disk, isSelected && j === stack.length - 1);
      }
    }

    // 애니메이션 중인 디스크
    if (this.anim) {
      this.renderDisk(ctx, this.anim.x, this.anim.y, this.anim.disk, false);
    }

    // HUD
    ctx.fillStyle = '#eee';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`이동: ${this.moves}`, 16, 32);

    ctx.fillStyle = '#666';
    ctx.font = '14px monospace';
    ctx.fillText(`최적: ${this.optimalMoves}`, 16, 54);

    // 난이도 표시
    ctx.textAlign = 'right';
    ctx.fillStyle = '#4a9eff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`LV ${this.level} (디스크 ${this.level}개)`, W - 16, 32);

    // 시간
    ctx.fillStyle = '#666';
    ctx.font = '14px monospace';
    const mins = Math.floor(this.elapsed / 60);
    const secs = Math.floor(this.elapsed % 60);
    ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, W - 16, 54);

    // 승리 메시지
    if (this.won) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, H / 2 - 60, W, 120);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CLEAR!', W / 2, H / 2 - 10);

      ctx.fillStyle = '#eee';
      ctx.font = '18px monospace';
      ctx.fillText(`${this.moves}회 이동 | SCORE: ${Math.floor(this.score)}`, W / 2, H / 2 + 30);
    }

    // 선택 안내 (하단)
    if (!this.won && !this.anim) {
      ctx.fillStyle = '#555';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      if (this.selectedPeg !== null) {
        ctx.fillStyle = C.SELECTED_GLOW;
        ctx.fillText(`${labels[this.selectedPeg]} 선택됨 → 옮길 기둥을 클릭하세요`, W / 2, H - 16);
      } else {
        ctx.fillText('기둥을 클릭하세요', W / 2, H - 16);
      }
    }
  }

  private renderDisk(
    ctx: CanvasRenderingContext2D,
    cx: number,
    y: number,
    disk: DiskInfo,
    highlight: boolean,
  ): void {
    const w = disk.width;
    const h = C.DISK_HEIGHT;
    const x = cx - w / 2;
    const r = 6;

    // 그림자 / 하이라이트
    if (highlight) {
      ctx.shadowColor = C.SELECTED_GLOW;
      ctx.shadowBlur = 12;
    }

    // 둥근 사각형
    ctx.fillStyle = disk.color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h - 2, r);
    ctx.fill();

    // 디스크 번호
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(disk.size), cx, y + h / 2 + 4);
  }
}
