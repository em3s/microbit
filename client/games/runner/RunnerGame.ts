import { GameEngine, GameCallbacks } from '../../engine/GameEngine';
import { InputManager } from '../../engine/InputManager';
import { checkCollision } from '../../engine/Entity';
import { Player } from './Player';
import { Obstacle, ObstacleType } from './Obstacle';
import { Background } from './Background';
import * as C from './config';

// 시드 기반 난수 생성 (mulberry32) — 결정론적 스폰 패턴
function createRng(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const BROADCAST_INTERVAL = 1 / C.STATE_BROADCAST_HZ;

export class RunnerGame extends GameEngine {
  private input: InputManager;
  private player = new Player();
  private obstacles: Obstacle[] = [];
  private background = new Background();
  private speed = C.INITIAL_SPEED;
  private timeSinceObstacle = 0;
  private timeSinceBroadcast = 0;
  private rng = createRng(12345);
  private passFlash = 0;
  private passedIds = new WeakSet<Obstacle>();
  private sendSerial?: (text: string) => void;

  constructor(canvas: HTMLCanvasElement, input: InputManager, callbacks: GameCallbacks) {
    super(canvas, callbacks);
    this.input = input;
    this.sendSerial = callbacks.sendSerial;
    canvas.width = C.CANVAS_WIDTH;
    canvas.height = C.CANVAS_HEIGHT;
  }

  protected init(): void {
    this.player.reset();
    this.background.reset();
    this.obstacles = [];
    this.speed = C.INITIAL_SPEED;
    this.timeSinceObstacle = 0;
    this.timeSinceBroadcast = 0;
    this.rng = createRng(12345);
    this.passFlash = 0;
    this.passedIds = new WeakSet();
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

    this.player.update(dt);
    this.background.update(dt, this.speed);
    this.passFlash = Math.max(0, this.passFlash - dt);

    // 장애물 스폰 (시간 + 최소 간격 양쪽 조건)
    this.timeSinceObstacle += dt;
    const spawnInterval = this.getSpawnInterval();
    if (this.timeSinceObstacle >= spawnInterval && this.canSpawn()) {
      this.spawnObstacle();
      this.timeSinceObstacle = 0;
    }

    // 장애물 업데이트 + 충돌 + 통과 감지
    const playerBounds = this.player.getBounds();
    const playerRearX = C.PLAYER_X;
    for (const obs of this.obstacles) {
      obs.update(dt, this.speed);
      const shrink = obs.type === 'gate' ? 1.0 : 0.8;
      for (const obsBounds of obs.getCollisionBounds()) {
        if (checkCollision(playerBounds, obsBounds, shrink)) {
          this.broadcastState(true);
          this.gameOver();
          return;
        }
      }
      // 통과 성공 감지 (장애물이 플레이어 뒤로 완전히 지나감)
      if (!this.passedIds.has(obs) && obs.x + obs.width < playerRearX) {
        this.passedIds.add(obs);
        this.passFlash = 0.15;
      }
    }
    this.obstacles = this.obstacles.filter(o => !o.isOffScreen());

    // 생존 점수
    this.score += dt * 10;

    // 상태 송신 (20Hz)
    this.timeSinceBroadcast += dt;
    if (this.timeSinceBroadcast >= BROADCAST_INTERVAL) {
      this.broadcastState(false);
      this.timeSinceBroadcast = 0;
    }
  }

  protected render(ctx: CanvasRenderingContext2D): void {
    this.background.render(ctx);

    for (const obs of this.obstacles) obs.render(ctx);
    this.player.render(ctx);

    // 통과 성공 플래시 (초록빛)
    if (this.passFlash > 0) {
      ctx.fillStyle = `rgba(74, 255, 158, ${this.passFlash * 0.8})`;
      ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
    }

    // HUD 좌상단: 점수 + 속도
    ctx.fillStyle = '#eee';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${Math.floor(this.score)}`, 16, 32);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`SPEED: ${Math.floor(this.speed)}`, 16, 52);

    // HUD 우상단: 다음 장애물 거리(px) — P3 디버깅용
    const next = this.getNextObstacle();
    ctx.textAlign = 'right';
    ctx.fillStyle = '#666';
    ctx.font = '12px monospace';
    if (next) {
      const d = Math.floor(next.obstacle.x - (C.PLAYER_X + C.PLAYER_WIDTH));
      ctx.fillText(`next: ${next.obstacle.type} @ ${d}px`, C.CANVAS_WIDTH - 16, 24);
    } else {
      ctx.fillText('next: —', C.CANVAS_WIDTH - 16, 24);
    }

    // HUD 하단: 스킬 가용성
    ctx.textAlign = 'left';
    ctx.font = '12px monospace';
    const jumpOk = this.player.state === 'RUNNING';
    const slideOk = this.player.state === 'RUNNING';
    const doubleOk = this.player.state === 'JUMPING' || this.player.state === 'FALLING';
    const skills: [string, boolean, string][] = [
      ['JUMP', jumpOk, '#4aff9e'],
      ['SLIDE', slideOk, '#4a9eff'],
      ['DOUBLE', doubleOk, '#ffa04a'],
    ];
    let sx = 16;
    for (const [name, ok, color] of skills) {
      ctx.fillStyle = ok ? color : '#444';
      ctx.fillText(ok ? `${name} OK` : `${name} --`, sx, C.CANVAS_HEIGHT - 10);
      sx += 100;
    }
  }

  private getSpawnInterval(): number {
    const progress = Math.min(this.elapsed / C.SPAWN_RAMP_DURATION, 1);
    return C.SPAWN_INTERVAL_START - progress * (C.SPAWN_INTERVAL_START - C.SPAWN_INTERVAL_MIN);
  }

  /** 마지막 장애물로부터 최소 간격이 확보됐는지 확인 */
  private canSpawn(): boolean {
    if (this.obstacles.length === 0) return true;
    let maxX = -Infinity;
    for (const obs of this.obstacles) {
      if (obs.x > maxX) maxX = obs.x;
    }
    return C.CANVAS_WIDTH - maxX >= C.OBSTACLE_SPACING_MIN_PX;
  }

  private spawnObstacle(): void {
    let type: ObstacleType;
    const t = this.elapsed;

    if (t < C.COMBO_UNLOCK_TIME) {
      type = 'tall';
    } else if (t < C.GATE_UNLOCK_TIME) {
      type = this.rng() < 0.7 ? 'tall' : 'combo';
    } else {
      const r = this.rng();
      if (r < 0.5) type = 'tall';
      else if (r < 0.8) type = 'gate';
      else type = 'combo';
    }
    this.obstacles.push(new Obstacle(type));
  }

  /** 플레이어 기준 아직 통과하지 않은 첫 장애물 */
  private getNextObstacle(): { obstacle: Obstacle } | null {
    let best: Obstacle | null = null;
    for (const obs of this.obstacles) {
      if (obs.x + obs.width <= C.PLAYER_X) continue;
      if (!best || obs.x < best.x) best = obs;
    }
    return best ? { obstacle: best } : null;
  }

  private playerStateCode(): 'G' | 'J' | 'D' {
    const s = this.player.state;
    if (s === 'SLIDING') return 'D';
    if (s === 'RUNNING') return 'G';
    return 'J';
  }

  private broadcastState(gameOver: boolean): void {
    if (!this.sendSerial) return;
    const next = this.getNextObstacle();
    const d = next ? Math.max(0, Math.floor(next.obstacle.x - (C.PLAYER_X + C.PLAYER_WIDTH))) : 9999;
    const o = next ? next.obstacle.type : 'none';
    const payload = {
      d,
      o,
      p: this.playerStateCode(),
      sc: Math.floor(this.score),
      go: gameOver ? 1 : 0,
    };
    this.sendSerial(JSON.stringify(payload) + '\n');
  }
}
