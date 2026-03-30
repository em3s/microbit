import { GameEngine, GameCallbacks } from '../../engine/GameEngine';
import { InputManager } from '../../engine/InputManager';
import { checkCollision } from '../../engine/Entity';
import { Player } from './Player';
import { Obstacle, ObstacleType } from './Obstacle';
import { Background } from './Background';
import * as C from './config';

// 시드 기반 난수 생성 (mulberry32)
function createRng(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export class RunnerGame extends GameEngine {
  private input: InputManager;
  private player = new Player();
  private obstacles: Obstacle[] = [];
  private background = new Background();
  private speed = C.INITIAL_SPEED;
  private timeSinceObstacle = 0;
  private rng = createRng(12345);

  constructor(canvas: HTMLCanvasElement, input: InputManager, callbacks: GameCallbacks) {
    super(canvas, callbacks);
    this.input = input;
    canvas.width = C.CANVAS_WIDTH;
    canvas.height = C.CANVAS_HEIGHT;
  }

  protected init(): void {
    this.player.reset();
    this.background.reset();
    this.obstacles = [];
    this.speed = C.INITIAL_SPEED;
    this.timeSinceObstacle = 0;
    this.rng = createRng(12345);
  }

  protected update(dt: number): void {
    this.input.update();

    // 입력 처리
    if (this.input.wasCommandFired('jump')) this.player.jump();
    if (this.input.wasCommandFired('double')) this.player.doubleJump();
    if (this.input.wasCommandFired('slide')) this.player.slide();

    // 속도 증가
    this.speed = Math.min(
      C.INITIAL_SPEED + this.elapsed * C.SPEED_INCREASE_RATE,
      C.MAX_SPEED
    );

    // 플레이어 업데이트
    this.player.update(dt);

    // 배경 업데이트
    this.background.update(dt, this.speed);

    // 장애물 스폰
    this.timeSinceObstacle += dt;
    const spawnInterval = this.getSpawnInterval();
    if (this.timeSinceObstacle >= spawnInterval) {
      this.spawnObstacle();
      this.timeSinceObstacle = 0;
    }

    // 장애물 업데이트 + 충돌
    const playerBounds = this.player.getBounds();
    for (const obs of this.obstacles) {
      obs.update(dt, this.speed);
      const shrink = obs.type === 'gate' ? 1.0 : 0.8;
      for (const obsBounds of obs.getCollisionBounds()) {
        if (checkCollision(playerBounds, obsBounds, shrink)) {
          this.gameOver();
          return;
        }
      }
    }
    this.obstacles = this.obstacles.filter(o => !o.isOffScreen());

    // 거리 점수 (생존 시간 기반)
    this.score += dt * 10;
  }

  protected render(ctx: CanvasRenderingContext2D): void {
    this.background.render(ctx);

    for (const obs of this.obstacles) obs.render(ctx);
    this.player.render(ctx);

    // HUD
    ctx.fillStyle = '#eee';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${Math.floor(this.score)}`, 16, 32);

    ctx.font = '14px monospace';
    ctx.fillText(`SPEED: ${Math.floor(this.speed)}`, 16, 52);

    // 명령어 안내
    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('jump / slide / double', C.CANVAS_WIDTH - 16, 24);
  }

  private getSpawnInterval(): number {
    const progress = Math.min(this.elapsed / C.SPAWN_RAMP_DURATION, 1);
    return C.SPAWN_INTERVAL_START - progress * (C.SPAWN_INTERVAL_START - C.SPAWN_INTERVAL_MIN);
  }

  private spawnObstacle(): void {
    let type: ObstacleType;
    const t = this.elapsed;

    if (t < C.COMBO_UNLOCK_TIME) {
      // ~15초: 점프만
      type = 'tall';
    } else if (t < C.GATE_UNLOCK_TIME) {
      // 15~30초: 점프 + 콤보(더블점프)
      type = this.rng() < 0.7 ? 'tall' : 'combo';
    } else {
      // 30초~: 전부
      const r = this.rng();
      if (r < 0.5) type = 'tall';
      else if (r < 0.8) type = 'gate';
      else type = 'combo';
    }
    this.obstacles.push(new Obstacle(type));
  }
}
