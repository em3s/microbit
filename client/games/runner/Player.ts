import { Entity } from '../../engine/Entity';
import * as C from './config';

type PlayerState = 'RUNNING' | 'JUMPING' | 'DOUBLE_JUMPING' | 'SLIDING' | 'FALLING';

export class Player extends Entity {
  state: PlayerState = 'RUNNING';
  private vy = 0;
  private slideTimer = 0;
  constructor() {
    super(C.PLAYER_X, C.GROUND_Y - C.PLAYER_HEIGHT, C.PLAYER_WIDTH, C.PLAYER_HEIGHT);
  }

  reset(): void {
    this.state = 'RUNNING';
    this.y = C.GROUND_Y - C.PLAYER_HEIGHT;
    this.height = C.PLAYER_HEIGHT;
    this.vy = 0;
    this.slideTimer = 0;
  }

  jump(): boolean {
    if (this.state !== 'RUNNING') return false;
    this.state = 'JUMPING';
    this.vy = C.JUMP_VELOCITY;
    return true;
  }

  doubleJump(): boolean {
    if (this.state !== 'JUMPING' && this.state !== 'FALLING') return false;
    this.state = 'DOUBLE_JUMPING';
    this.vy = C.DOUBLE_JUMP_VELOCITY;
    return true;
  }

  slide(): boolean {
    if (this.state !== 'RUNNING') return false;
    this.state = 'SLIDING';
    this.slideTimer = C.SLIDE_DURATION;
    this.height = C.SLIDE_HEIGHT;
    this.y = C.GROUND_Y - C.SLIDE_HEIGHT;
    return true;
  }

  update(dt: number): void {
    // 슬라이드 타이머
    if (this.state === 'SLIDING') {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.state = 'RUNNING';
        this.height = C.PLAYER_HEIGHT;
        this.y = C.GROUND_Y - C.PLAYER_HEIGHT;
      }
      return;
    }

    // 점프/낙하 물리
    if (this.state === 'JUMPING' || this.state === 'DOUBLE_JUMPING' || this.state === 'FALLING') {
      this.vy += C.GRAVITY * dt;
      this.y += this.vy * dt;

      if (this.vy > 0 && this.state === 'JUMPING') {
        this.state = 'FALLING';
      }

      // 착지
      if (this.y >= C.GROUND_Y - C.PLAYER_HEIGHT) {
        this.y = C.GROUND_Y - C.PLAYER_HEIGHT;
        this.vy = 0;
        this.state = 'RUNNING';
        this.height = C.PLAYER_HEIGHT;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 몸체
    const color = this.state === 'SLIDING' ? '#4a9eff' : '#4aff9e';
    ctx.fillStyle = color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // 눈
    if (this.state !== 'SLIDING') {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(this.x + this.width - 12, this.y + 10, 6, 6);
    }

    ctx.restore();
  }
}
