export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export abstract class Entity {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  getBounds(): Bounds {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  abstract update(dt: number, ...args: unknown[]): void;
  abstract render(ctx: CanvasRenderingContext2D): void;
}

export function checkCollision(a: Bounds, b: Bounds, shrink = 0.8): boolean {
  // 판정 관대하게 (shrink로 히트박스 축소)
  const ax = a.x + a.width * (1 - shrink) / 2;
  const ay = a.y + a.height * (1 - shrink) / 2;
  const aw = a.width * shrink;
  const ah = a.height * shrink;

  const bx = b.x + b.width * (1 - shrink) / 2;
  const by = b.y + b.height * (1 - shrink) / 2;
  const bw = b.width * shrink;
  const bh = b.height * shrink;

  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
