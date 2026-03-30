import * as C from './config';

export class Background {
  private groundOffset = 0;
  private cloudX: number[] = [];

  constructor() {
    // 초기 구름 배치
    for (let i = 0; i < 5; i++) {
      this.cloudX.push(Math.random() * C.CANVAS_WIDTH);
    }
  }

  reset(): void {
    this.groundOffset = 0;
  }

  update(dt: number, speed: number): void {
    this.groundOffset = (this.groundOffset + speed * dt) % 40;

    // 구름 (느리게)
    for (let i = 0; i < this.cloudX.length; i++) {
      this.cloudX[i] -= speed * 0.1 * dt;
      if (this.cloudX[i] < -60) {
        this.cloudX[i] = C.CANVAS_WIDTH + 20;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // 배경
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);

    // 구름
    ctx.fillStyle = '#2a2a4a';
    for (let i = 0; i < this.cloudX.length; i++) {
      const y = 40 + i * 30;
      ctx.beginPath();
      ctx.ellipse(this.cloudX[i], y, 30 + i * 5, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 바닥
    ctx.fillStyle = '#3a3a5a';
    ctx.fillRect(0, C.GROUND_Y, C.CANVAS_WIDTH, C.CANVAS_HEIGHT - C.GROUND_Y);

    // 바닥 눈금
    ctx.strokeStyle = '#4a4a6a';
    ctx.lineWidth = 1;
    for (let x = -this.groundOffset; x < C.CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, C.GROUND_Y);
      ctx.lineTo(x + 20, C.GROUND_Y + 10);
      ctx.stroke();
    }

    // 바닥 선
    ctx.strokeStyle = '#5a5a7a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, C.GROUND_Y);
    ctx.lineTo(C.CANVAS_WIDTH, C.GROUND_Y);
    ctx.stroke();
  }
}
