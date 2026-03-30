import { Entity, type Bounds } from '../../engine/Entity';
import * as C from './config';

export type ObstacleType = 'tall' | 'gate' | 'combo';

export class Obstacle extends Entity {
  type: ObstacleType;

  constructor(type: ObstacleType) {
    let w: number;
    let h: number;
    let y: number;

    switch (type) {
      case 'tall':
        w = C.OBSTACLE_WIDTH;
        h = C.OBSTACLE_TALL_HEIGHT;
        y = C.GROUND_Y - h;
        break;
      case 'gate':
        // 전체 영역을 하나의 엔티티로 잡되, 충돌은 getCollisionBounds로 분리
        w = C.GATE_WIDTH;
        h = C.GROUND_Y; // 화면 위~바닥
        y = 0;
        break;
      case 'combo':
        w = C.OBSTACLE_WIDTH;
        h = C.OBSTACLE_COMBO_HEIGHT;
        y = C.GROUND_Y - h;
        break;
    }

    super(C.CANVAS_WIDTH + 20, y, w, h);
    this.type = type;
  }

  /** gate는 위/아래 두 개의 충돌 박스를 반환 */
  getCollisionBounds(): Bounds[] {
    if (this.type !== 'gate') {
      return [this.getBounds()];
    }
    // 위쪽 벽: 화면 위~통로 시작
    const gapBottom = C.GROUND_Y; // 통로 바닥 = 바닥
    const gapTop = gapBottom - C.GATE_GAP_HEIGHT; // 통로 천장
    return [
      { x: this.x, y: 0, width: this.width, height: gapTop }, // 천장 블록
      // 바닥 블록은 없음 (바닥 자체가 벽)
    ];
  }

  update(dt: number, speed: number): void {
    this.x -= speed * dt;
  }

  isOffScreen(): boolean {
    return this.x + this.width < -20;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.type === 'gate') {
      this.renderGate(ctx);
      return;
    }

    ctx.fillStyle = this.type === 'tall' ? '#ff4a6a' : '#ff8a4a';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    if (this.type === 'combo') {
      ctx.fillStyle = '#cc3050';
      for (let i = 0; i < this.height; i += 20) {
        ctx.fillRect(this.x, this.y + i, this.width, 8);
      }
    }
  }

  private renderGate(ctx: CanvasRenderingContext2D): void {
    const gapTop = C.GROUND_Y - C.GATE_GAP_HEIGHT;

    // 천장 블록
    ctx.fillStyle = '#ffa04a';
    ctx.fillRect(this.x, 0, this.width, gapTop);

    // 통로 표시 (밝은 테두리)
    ctx.strokeStyle = '#ffcc44';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, gapTop, this.width, C.GATE_GAP_HEIGHT);

    // 경고 줄무늬 (천장 블록 하단)
    ctx.fillStyle = '#cc8030';
    for (let i = gapTop - 40; i < gapTop; i += 10) {
      if (i < 0) continue;
      ctx.fillRect(this.x, i, this.width, 4);
    }
  }
}
