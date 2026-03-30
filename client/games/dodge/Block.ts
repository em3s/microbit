import { Entity } from '../../engine/Entity';
import * as C from './config';

export class Block extends Entity {
  private speed: number;

  constructor(x: number, size: number, speed: number) {
    super(x, -size, size, size);
    this.speed = speed;
  }

  update(dt: number): void {
    this.y += this.speed * dt;
  }

  isOffScreen(): boolean {
    return this.y > C.CANVAS_HEIGHT + 10;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ff4a6a';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // 내부 십자
    ctx.fillStyle = '#cc3050';
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    ctx.fillRect(cx - 2, this.y + 4, 4, this.height - 8);
    ctx.fillRect(this.x + 4, cy - 2, this.width - 8, 4);
  }
}
