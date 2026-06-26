import Phaser from "phaser";

// ── 程序化粒子特效(里程碑時刻)────────────────────────────────────
// 純程序繪製,不新增美術。共用一張柔邊光點貼圖 'fx_dot',給 burst/shimmer/環境塵埃用。
// 用途:喚醒專員的光點爆發、身分鑑定書揭曉的星塵微光。鐵則:純視覺,不影響計分/節奏。

const FX_TEX = "fx_dot";

/** 生成一張柔邊圓點貼圖(在 BootScene create 呼叫一次即可,重複呼叫會自動跳過)。 */
export function makeFxTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(FX_TEX)) return;
  const R = 16;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (let i = R; i > 0; i--) {
    const t = 1 - i / R; // 0(邊) → 1(心)
    g.fillStyle(0xffffff, t * t * 0.9); // 二次衰減 = 柔邊
    g.fillCircle(R, R, i);
  }
  g.generateTexture(FX_TEX, R * 2, R * 2);
  g.destroy();
}

function ensureTex(scene: Phaser.Scene): void {
  if (!scene.textures.exists(FX_TEX)) makeFxTexture(scene);
}

export interface BurstOpts {
  color?: number;
  count?: number;
  speed?: number;
  depth?: number;
  scale?: number;
}

/** 一次性放射狀光點爆發(喚醒/達成的「砰」)。自動清理,不殘留。 */
export function burst(scene: Phaser.Scene, x: number, y: number, opts: BurstOpts = {}): void {
  ensureTex(scene);
  const { color = 0x35e0c8, count = 18, speed = 150, depth = 80, scale = 0.55 } = opts;
  const emitter = scene.add
    .particles(x, y, FX_TEX, {
      speed: { min: speed * 0.35, max: speed },
      angle: { min: 0, max: 360 },
      scale: { start: scale, end: 0 },
      alpha: { start: 0.95, end: 0 },
      lifespan: { min: 460, max: 820 },
      tint: color,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    })
    .setDepth(depth);
  emitter.explode(count);
  scene.time.delayedCall(1000, () => emitter.destroy());
}

export interface ShimmerOpts {
  color?: number;
  count?: number;
  width?: number;
  height?: number;
  depth?: number;
}

/** 一片緩緩上升的星塵微光(鑑定書揭曉用);在 (x,y) 為中心的區域內飄起。 */
export function shimmer(scene: Phaser.Scene, x: number, y: number, opts: ShimmerOpts = {}): void {
  ensureTex(scene);
  const { color = 0x9be9ff, count = 26, width = 360, height = 220, depth = 80 } = opts;
  const emitter = scene.add
    .particles(x, y, FX_TEX, {
      x: { min: -width / 2, max: width / 2 },
      y: { min: -height / 2, max: height / 2 },
      speedY: { min: -28, max: -10 },
      speedX: { min: -8, max: 8 },
      scale: { min: 0.05, max: 0.16 },
      alpha: { start: 0.0, end: 0.7 }, // 由下方淡入升起
      lifespan: { min: 900, max: 1600 },
      frequency: 60,
      tint: color,
      blendMode: Phaser.BlendModes.ADD,
    })
    .setDepth(depth);
  // 放一陣子後停止發射,再讓殘餘粒子自然消失。
  scene.time.delayedCall(1400, () => emitter.stop());
  scene.time.delayedCall(3200, () => emitter.destroy());
}
