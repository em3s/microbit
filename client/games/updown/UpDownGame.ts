import { GameEngine, GameCallbacks } from '../../engine/GameEngine';
import { InputManager } from '../../engine/InputManager';
import { submitScore } from '../../api/client';
import * as C from './config';

type Hint = 'up' | 'down' | 'correct' | 'invalid' | null;

interface Guess {
  value: number;
  result: 'higher' | 'lower' | 'correct';
}

export class UpDownGame extends GameEngine {
  private target = 0;
  private minR = C.MIN_VALUE;
  private maxR = C.MAX_VALUE;
  private input = '';
  private hint: Hint = null;
  private hintFlash = 0;
  private attempts = 0;
  private won = false;
  private history: Guess[] = [];

  constructor(canvas: HTMLCanvasElement, _input: InputManager, callbacks: GameCallbacks) {
    super(canvas, callbacks);
    canvas.width = C.CANVAS_WIDTH;
    canvas.height = C.CANVAS_HEIGHT;
    window.addEventListener('keydown', this.onKey);
  }

  stop(): void {
    super.stop();
    window.removeEventListener('keydown', this.onKey);
  }

  protected init(): void {
    this.target = C.MIN_VALUE + Math.floor(Math.random() * (C.MAX_VALUE - C.MIN_VALUE + 1));
    this.minR = C.MIN_VALUE;
    this.maxR = C.MAX_VALUE;
    this.input = '';
    this.hint = null;
    this.hintFlash = 0;
    this.attempts = 0;
    this.won = false;
    this.history = [];
  }

  private onKey = (e: KeyboardEvent): void => {
    if (this.won) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.init();
      }
      return;
    }
    if (/^[0-9]$/.test(e.key) && this.input.length < 3) {
      this.input += e.key;
      e.preventDefault();
    } else if (e.key === 'Backspace') {
      this.input = this.input.slice(0, -1);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      this.submit();
      e.preventDefault();
    }
  };

  private submit(): void {
    const n = parseInt(this.input, 10);
    this.input = '';
    if (!Number.isFinite(n) || n < C.MIN_VALUE || n > C.MAX_VALUE) {
      this.hint = 'invalid';
      this.hintFlash = 0.5;
      return;
    }
    this.attempts++;
    this.hintFlash = 0.5;

    if (n < this.target) {
      this.hint = 'up';
      this.minR = Math.max(this.minR, n + 1);
      this.history.push({ value: n, result: 'higher' });
    } else if (n > this.target) {
      this.hint = 'down';
      this.maxR = Math.min(this.maxR, n - 1);
      this.history.push({ value: n, result: 'lower' });
    } else {
      this.hint = 'correct';
      this.won = true;
      this.history.push({ value: n, result: 'correct' });
      this.recordScore();
    }
  }

  protected update(dt: number): void {
    this.hintFlash = Math.max(0, this.hintFlash - dt);
  }

  protected render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = C.BG_COLOR;
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);

    this.renderTitle(ctx);
    this.renderInputBox(ctx);
    this.renderHint(ctx);
    this.renderRangeBar(ctx);
    this.renderStats(ctx);
    this.renderHistory(ctx);
    this.renderKeyboardHint(ctx);

    if (this.won) this.renderWin(ctx);
  }

  private renderTitle(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#eee';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('업앤다운', C.CANVAS_WIDTH / 2, 38);

    ctx.fillStyle = '#888';
    ctx.font = '13px monospace';
    ctx.fillText(`컴퓨터가 ${C.MIN_VALUE} ~ ${C.MAX_VALUE} 중 하나를 골랐어요`, C.CANVAS_WIDTH / 2, 60);
  }

  private renderInputBox(ctx: CanvasRenderingContext2D): void {
    const cx = C.CANVAS_WIDTH / 2;
    const cy = 130;
    const w = 240, h = 84;

    const flashing = this.hintFlash > 0 && this.hint === 'invalid';
    ctx.strokeStyle = flashing ? '#ff4a6a' : C.COLOR_PRIMARY;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 14);
    ctx.stroke();

    ctx.fillStyle = this.input ? '#fff' : '#444';
    ctx.font = 'bold 52px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.input || '?', cx, cy);
    ctx.textBaseline = 'alphabetic';

    // 커서 blink
    if (this.input && Math.floor(this.elapsed * 2) % 2 === 0) {
      const textW = ctx.measureText(this.input).width;
      ctx.fillStyle = C.COLOR_PRIMARY;
      ctx.fillRect(cx + textW / 2 + 4, cy - 22, 3, 44);
    }
  }

  private renderHint(ctx: CanvasRenderingContext2D): void {
    const y = 220;
    const cx = C.CANVAS_WIDTH / 2;
    let text = '';
    let color = '#555';
    let scale = 1;

    if (this.hint === 'up') {
      text = '↑  더 큰 수!';
      color = C.COLOR_UP;
    } else if (this.hint === 'down') {
      text = '↓  더 작은 수!';
      color = C.COLOR_DOWN;
    } else if (this.hint === 'invalid') {
      text = `${C.MIN_VALUE}~${C.MAX_VALUE} 범위 숫자를 입력하세요`;
      color = '#ff4a6a';
    } else if (this.hint === 'correct') {
      text = '';
    } else {
      text = '숫자 입력 → Enter';
    }

    // 최근 힌트 강조 (약간 커졌다가 원래대로)
    if ((this.hint === 'up' || this.hint === 'down') && this.hintFlash > 0) {
      scale = 1 + this.hintFlash * 0.2;
    }

    ctx.save();
    ctx.translate(cx, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  private renderRangeBar(ctx: CanvasRenderingContext2D): void {
    const barY = 270;
    const barH = 26;
    const barX = 40;
    const barW = C.CANVAS_WIDTH - 80;
    const range = C.MAX_VALUE - C.MIN_VALUE;
    const pxPerUnit = barW / range;

    // 전체 범위 (회색)
    ctx.fillStyle = '#2e2e44';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 13);
    ctx.fill();

    // 현재 좁혀진 범위 (파랑 → 정답 시 초록)
    const leftX = barX + (this.minR - C.MIN_VALUE) * pxPerUnit;
    const rightX = barX + (this.maxR - C.MIN_VALUE) * pxPerUnit;
    const activeW = Math.max(2, rightX - leftX);
    ctx.fillStyle = this.won ? C.COLOR_CORRECT : C.COLOR_PRIMARY;
    ctx.beginPath();
    ctx.roundRect(leftX, barY, activeW, barH, 10);
    ctx.fill();

    // 경계 숫자
    ctx.fillStyle = '#bbb';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(String(this.minR), leftX, barY + barH + 16);
    ctx.textAlign = 'right';
    ctx.fillText(String(this.maxR), rightX, barY + barH + 16);

    // 지난 추측 점
    for (const g of this.history) {
      if (g.result === 'correct') continue;
      const gx = barX + (g.value - C.MIN_VALUE) * pxPerUnit;
      ctx.fillStyle = g.result === 'higher' ? C.COLOR_UP + '66' : C.COLOR_DOWN + '66';
      ctx.beginPath();
      ctx.arc(gx, barY + barH / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 이분탐색 중간값 표시 (화살표 마커)
    if (!this.won && this.minR <= this.maxR) {
      const mid = Math.floor((this.minR + this.maxR) / 2);
      const midX = barX + (mid - C.MIN_VALUE) * pxPerUnit;

      ctx.fillStyle = C.COLOR_MID;
      ctx.beginPath();
      ctx.moveTo(midX, barY - 4);
      ctx.lineTo(midX - 7, barY - 16);
      ctx.lineTo(midX + 7, barY - 16);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = C.COLOR_MID;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`중간값 ${mid}`, midX, barY - 20);
    }
  }

  private renderStats(ctx: CanvasRenderingContext2D): void {
    const y = 360;
    ctx.fillStyle = '#eee';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`시도  ${this.attempts}회`, C.CANVAS_WIDTH / 2, y);

    ctx.fillStyle = '#666';
    ctx.font = '11px monospace';
    ctx.fillText(
      `이분탐색 최적: log₂(${C.MAX_VALUE - C.MIN_VALUE + 1}) ≈ ${C.OPTIMAL_TRIES}회`,
      C.CANVAS_WIDTH / 2, y + 20,
    );
  }

  private renderHistory(ctx: CanvasRenderingContext2D): void {
    const y = 420;
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('지난 추측', C.CANVAS_WIDTH / 2, y);

    const recent = this.history.slice(-8);
    const spacing = 50;
    const startX = C.CANVAS_WIDTH / 2 - (recent.length - 1) * spacing / 2;
    recent.forEach((g, i) => {
      const x = startX + i * spacing;
      const sign = g.result === 'higher' ? '↑' : g.result === 'lower' ? '↓' : '✓';
      const c = g.result === 'higher' ? C.COLOR_UP
             : g.result === 'lower' ? C.COLOR_DOWN
             : C.COLOR_CORRECT;
      ctx.fillStyle = c;
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`${g.value}${sign}`, x, y + 20);
    });
  }

  private renderKeyboardHint(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#555';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('숫자키: 입력 · Enter: 제출 · Backspace: 지우기', C.CANVAS_WIDTH / 2, C.CANVAS_HEIGHT - 18);
  }

  private renderWin(ctx: CanvasRenderingContext2D): void {
    const W = C.CANVAS_WIDTH;
    const cy = C.CANVAS_HEIGHT / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, cy - 70, W, 180);

    ctx.fillStyle = C.COLOR_CORRECT;
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('정답!', W / 2, cy - 20);

    ctx.fillStyle = '#eee';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`${this.target} 맞춤`, W / 2, cy + 10);

    const ratio = this.attempts / C.OPTIMAL_TRIES;
    const grade = ratio <= 1 ? '🏆 완벽 (이분탐색 수준)'
                : ratio <= 1.5 ? '👍 훌륭'
                : ratio <= 2 ? '👌 보통'
                : '🙂 다시 도전';
    ctx.fillStyle = '#ccc';
    ctx.font = '14px monospace';
    ctx.fillText(`시도 ${this.attempts}회 · 최적 ${C.OPTIMAL_TRIES}회`, W / 2, cy + 40);
    ctx.fillStyle = ratio <= 1 ? C.COLOR_CORRECT : '#ffa04a';
    ctx.fillText(grade, W / 2, cy + 62);

    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText('Enter 또는 Space 로 새 게임', W / 2, cy + 92);
  }

  private recordScore(): void {
    const name = localStorage.getItem('playerName') || '';
    const email = localStorage.getItem('playerEmail') || '';
    submitScore(name, email, 'updown', this.attempts, 'keyboard');
  }
}
