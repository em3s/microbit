import { GameEngine, GameCallbacks } from '../../engine/GameEngine';
import { InputManager } from '../../engine/InputManager';
import { checkCollision } from '../../engine/Entity';
import { Player } from './Player';
import { Block } from './Block';
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

export class DodgeGame extends GameEngine {
  private input: InputManager;
  private player = new Player();
  private blocks: Block[] = [];
  private timeSinceBlock = 0;
  private fallSpeed = C.INITIAL_FALL_SPEED;
  private rng = createRng(67890);

  constructor(canvas: HTMLCanvasElement, input: InputManager, callbacks: GameCallbacks) {
    super(canvas, callbacks);
    this.input = input;
    canvas.width = C.CANVAS_WIDTH;
    canvas.height = C.CANVAS_HEIGHT;
  }

  protected init(): void {
    this.player.reset();
    this.blocks = [];
    this.timeSinceBlock = 0;
    this.fallSpeed = C.INITIAL_FALL_SPEED;
    this.rng = createRng(67890);
    this.spawnCount = 0;
    this.teleportCooldown = 0;
    this.boomCooldown = 0;
    this.boomEffect = 0;
  }

  private teleportCooldown = 0;
  private boomCooldown = 0;
  private boomEffect = 0;

  protected update(dt: number): void {
    this.input.update();

    // 쿨다운 감소
    this.teleportCooldown = Math.max(0, this.teleportCooldown - dt);
    this.boomCooldown = Math.max(0, this.boomCooldown - dt);
    this.boomEffect = Math.max(0, this.boomEffect - dt);

    // 순간이동: left/right 공유 쿨타임
    if (this.input.wasCommandFired('left') && this.teleportCooldown <= 0) {
      this.player.teleport(0);
      this.teleportCooldown = 60;
    }
    if (this.input.wasCommandFired('right') && this.teleportCooldown <= 0) {
      this.player.teleport(C.CANVAS_WIDTH - C.PLAYER_WIDTH);
      this.teleportCooldown = 60;
    }
    // boom: 전체 클리어
    if (this.input.wasCommandFired('boom') && this.boomCooldown <= 0) {
      this.blocks = [];
      this.boomCooldown = 60;
      this.boomEffect = 0.3;
    }

    // 가속도 x값 읽기 (상대값 → 속도)
    const accelX = this.input.getValue('x');
    this.player.update(dt, accelX);

    // 낙하 속도 증가
    this.fallSpeed = Math.min(
      C.INITIAL_FALL_SPEED + this.elapsed * C.FALL_SPEED_INCREASE,
      C.MAX_FALL_SPEED
    );

    // 블록 스폰
    this.timeSinceBlock += dt;
    const interval = this.getSpawnInterval();
    if (this.timeSinceBlock >= interval) {
      this.spawnBlock();
      this.timeSinceBlock = 0;
    }

    // 블록 업데이트 + 충돌
    const playerBounds = this.player.getBounds();
    for (const block of this.blocks) {
      block.update(dt);
      if (checkCollision(playerBounds, block.getBounds())) {
        this.gameOver();
        return;
      }
    }
    this.blocks = this.blocks.filter(b => !b.isOffScreen());

    // 점수
    this.score += dt * 10;
  }

  protected render(ctx: CanvasRenderingContext2D): void {
    // 배경
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);

    // 바닥선
    ctx.strokeStyle = '#3a3a5a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, C.GROUND_Y);
    ctx.lineTo(C.CANVAS_WIDTH, C.GROUND_Y);
    ctx.stroke();

    // 블록
    for (const block of this.blocks) block.render(ctx);

    // 플레이어
    this.player.render(ctx);

    // HUD
    ctx.fillStyle = '#eee';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${Math.floor(this.score)}`, 16, 32);

    // 가속도 값 + 민감도 표시
    const accelX = this.input.getValue('x');
    ctx.fillStyle = '#666';
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`x: ${Math.floor(accelX)}`, C.CANVAS_WIDTH - 16, 24);
    if (this.input.sensitivity !== 1.0) {
      ctx.fillStyle = '#ffa04a';
      ctx.fillText(`감도 x${this.input.sensitivity.toFixed(1)}`, C.CANVAS_WIDTH - 16, 44);
    }

    // 스킬 쿨다운 HUD (하단)
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    const skills = [
      { name: 'L/R', cd: this.teleportCooldown, color: '#4a9eff' },
      { name: 'B', cd: this.boomCooldown, color: '#ff4a6a' },
    ];
    let sx = 16;
    for (const s of skills) {
      ctx.fillStyle = s.cd > 0 ? '#555' : s.color;
      const label = s.cd > 0 ? `${s.name} ${Math.ceil(s.cd)}s` : `${s.name} OK`;
      ctx.fillText(label, sx, C.CANVAS_HEIGHT - 10);
      sx += 100;
    }

    // boom 이펙트
    if (this.boomEffect > 0) {
      ctx.fillStyle = `rgba(255, 74, 106, ${this.boomEffect})`;
      ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);
    }
  }

  private getSpawnInterval(): number {
    const progress = Math.min(this.elapsed / C.SPAWN_RAMP_DURATION, 1);
    return C.SPAWN_INTERVAL_START - progress * (C.SPAWN_INTERVAL_START - C.SPAWN_INTERVAL_MIN);
  }

  private spawnCount = 0;

  private spawnBlock(): void {
    const size = C.BLOCK_MIN_SIZE + this.rng() * (C.BLOCK_MAX_SIZE - C.BLOCK_MIN_SIZE);
    this.spawnCount++;

    // 매 5번째마다 가장자리에 떨어뜨림
    if (this.spawnCount % 5 === 0) {
      // 왼쪽 가장자리
      this.blocks.push(new Block(0, size, this.fallSpeed));
      // 오른쪽 가장자리
      const size2 = C.BLOCK_MIN_SIZE + this.rng() * (C.BLOCK_MAX_SIZE - C.BLOCK_MIN_SIZE);
      this.blocks.push(new Block(C.CANVAS_WIDTH - size2, size2, this.fallSpeed));
    } else {
      const x = this.rng() * (C.CANVAS_WIDTH - size);
      this.blocks.push(new Block(x, size, this.fallSpeed));
    }
  }
}
