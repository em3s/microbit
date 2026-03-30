import { Entity } from '../../engine/Entity';
import * as C from './config';

export class Player extends Entity {
  private vx = 0;

  constructor() {
    super(
      C.CANVAS_WIDTH / 2 - C.PLAYER_WIDTH / 2,
      C.GROUND_Y - C.PLAYER_HEIGHT,
      C.PLAYER_WIDTH,
      C.PLAYER_HEIGHT,
    );
  }

  reset(): void {
    this.x = C.CANVAS_WIDTH / 2 - C.PLAYER_WIDTH / 2;
    this.vx = 0;
  }

  teleport(x: number): void {
    this.x = x;
    this.vx = 0;
  }

  /** accelX: 가속도 센서 x값 (상대값으로 속도에 반영) */
  update(dt: number, accelX: number): void {
    // 가속도 → 속도
    this.vx += accelX * C.PLAYER_SPEED * dt;
    // 마찰
    this.vx *= C.PLAYER_FRICTION;
    // 위치 갱신
    this.x += this.vx * dt * 60; // 60fps 기준 정규화

    // 벽 clamp
    if (this.x < 0) { this.x = 0; this.vx = 0; }
    if (this.x + this.width > C.CANVAS_WIDTH) {
      this.x = C.CANVAS_WIDTH - this.width;
      this.vx = 0;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#4aff9e';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // 눈
    ctx.fillStyle = '#1a1a2e';
    const eyeY = this.y + 10;
    ctx.fillRect(this.x + 8, eyeY, 5, 5);
    ctx.fillRect(this.x + this.width - 13, eyeY, 5, 5);
  }
}
