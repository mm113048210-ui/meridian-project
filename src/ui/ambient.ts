import Phaser from "phaser";
import { makeFxTexture } from "./fx";
import { reducedMotion } from "./motion";

// ── 環境塵埃飄動(讓靜態手繪背景「呼吸」)──────────────────────────
// 一池微小光點,在畫面裡極慢地淡入→飄起→淡出→換位重生,持續循環。
// 純視覺、極低數量(預設 14),pooled(重用同一批 sprite,不增生)。
// 鐵則:不動美術資產、不影響計分/節奏。深度低,壓在背景之上、UI/對話之下。

export interface AmbientHandle {
  destroy(): void;
}

export interface AmbientOpts {
  color?: number;
  count?: number;
  depth?: number;
  alphaScale?: number;
  sizeScale?: number;
}

export interface PointerParallaxOpts {
  strength?: number;
  duration?: number;
}

export type AmbientRoom =
  | "title"
  | "powerbay"
  | "workshop"
  | "greenhouse"
  | "command"
  | "lounge"
  | "datalab"
  | "medbay"
  | "muralhall";

export function installAmbientDrift(scene: Phaser.Scene, opts: AmbientOpts = {}): AmbientHandle {
  const { color = 0x9fc7d8, count = 14, depth = 4, alphaScale = 1, sizeScale = 1 } = opts;
  if (!scene.textures.exists("fx_dot")) makeFxTexture(scene);

  let alive = true;
  const motes: Phaser.GameObjects.Image[] = [];

  const drift = (m: Phaser.GameObjects.Image) => {
    if (!alive) return;
    const x = Phaser.Math.Between(20, 940);
    const y = Phaser.Math.Between(120, 520);
    const peak = Math.min(0.72, Phaser.Math.FloatBetween(0.18, 0.36) * alphaScale);
    const dur = Phaser.Math.Between(5200, 9800);
    const rise = Phaser.Math.Between(65, 125);
    const sway = Phaser.Math.Between(-48, 48);
    m.setPosition(x, y).setScale(Phaser.Math.FloatBetween(0.08, 0.18) * sizeScale).setAlpha(0);
    scene.tweens.add({
      targets: m,
      props: {
        y: { value: y - rise, duration: dur, ease: "Sine.easeInOut" },
        x: { value: x + sway, duration: dur, ease: "Sine.easeInOut" },
        alpha: { value: peak, duration: dur / 2, ease: "Sine.easeInOut", yoyo: true },
      },
      onComplete: () => drift(m),
    });
  };

  const reduced = reducedMotion();
  // 減少動態:塵埃減半、靜態淡放,不啟動飄動循環。
  const n = reduced ? Math.ceil(count / 2) : count;
  for (let i = 0; i < n; i++) {
    const m = scene.add
      .image(0, 0, "fx_dot")
      .setDepth(depth)
      .setTint(color)
      .setBlendMode(Phaser.BlendModes.ADD);
    motes.push(m);
    if (reduced) {
      m.setPosition(Phaser.Math.Between(20, 940), Phaser.Math.Between(120, 520))
        .setScale(Phaser.Math.FloatBetween(0.08, 0.16) * sizeScale)
        .setAlpha(Math.min(0.4, 0.16 * alphaScale));
      continue;
    }
    // 錯開起始,避免同步呼吸
    scene.time.delayedCall(Phaser.Math.Between(0, 4000), () => drift(m));
  }

  const teardown = () => {
    alive = false;
    motes.forEach((m) => m.destroy());
    motes.length = 0;
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, teardown);

  return { destroy: teardown };
}

export function installPointerParallax(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Image,
  opts: PointerParallaxOpts = {},
): AmbientHandle {
  const { strength = 8, duration = 420 } = opts;
  const baseX = target.x;
  const baseY = target.y;
  let alive = true;
  let tx = baseX;
  let ty = baseY;

  const onMove = (pointer: Phaser.Input.Pointer) => {
    if (!alive) return;
    const nx = Phaser.Math.Clamp((pointer.x - 480) / 480, -1, 1);
    const ny = Phaser.Math.Clamp((pointer.y - 270) / 270, -1, 1);
    tx = baseX - nx * strength;
    ty = baseY - ny * strength * 0.65;
  };

  const onOut = () => {
    if (!alive) return;
    tx = baseX;
    ty = baseY;
  };

  const onUpdate = (_time: number, delta: number) => {
    if (!alive) return;
    const t = Phaser.Math.Clamp(delta / duration, 0.02, 0.16);
    target.x = Phaser.Math.Linear(target.x, tx, t);
    target.y = Phaser.Math.Linear(target.y, ty, t);
  };

  scene.input.on("pointermove", onMove);
  scene.input.on("pointerout", onOut);
  scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);

  const teardown = () => {
    if (!alive) return;
    alive = false;
    scene.input.off("pointermove", onMove);
    scene.input.off("pointerout", onOut);
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, teardown);
  return { destroy: teardown };
}

function trackSceneObjects(scene: Phaser.Scene, objects: Phaser.GameObjects.GameObject[]): AmbientHandle {
  let alive = true;
  const teardown = () => {
    if (!alive) return;
    alive = false;
    objects.forEach((obj) => {
      scene.tweens.killTweensOf(obj);
      obj.destroy();
    });
    objects.length = 0;
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, teardown);
  return { destroy: teardown };
}

function pulse(scene: Phaser.Scene, obj: Phaser.GameObjects.GameObject, from: number, to: number, duration: number) {
  if (reducedMotion()) {
    (obj as unknown as { setAlpha(v: number): unknown }).setAlpha((from + to) / 2);
    return;
  }
  scene.tweens.add({
    targets: obj,
    alpha: { from, to },
    duration,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });
}

function driftLine(scene: Phaser.Scene, line: Phaser.GameObjects.Rectangle, fromX: number, toX: number, duration: number) {
  if (reducedMotion()) {
    line.setX((fromX + toX) / 2);
    return;
  }
  line.setX(fromX);
  scene.tweens.add({
    targets: line,
    x: toX,
    duration,
    repeat: -1,
    ease: "Sine.easeInOut",
    repeatDelay: 900,
  });
}

function twinkleCluster(
  scene: Phaser.Scene,
  objects: Phaser.GameObjects.GameObject[],
  points: Array<{ x: number; y: number; spreadX?: number; spreadY?: number; count?: number; color?: number }>,
  depth: number,
) {
  if (!scene.textures.exists("fx_dot")) makeFxTexture(scene);
  const reduced = reducedMotion();
  points.forEach((point) => {
    // 減少動態:叢集數量減半、靜態淡放。
    const count = Math.max(1, Math.round((point.count ?? 7) * (reduced ? 0.5 : 1)));
    for (let i = 0; i < count; i++) {
      const dot = scene.add
        .image(
          point.x + Phaser.Math.Between(-(point.spreadX ?? 40), point.spreadX ?? 40),
          point.y + Phaser.Math.Between(-(point.spreadY ?? 20), point.spreadY ?? 20),
          "fx_dot",
        )
        .setDepth(depth)
        .setTint(point.color ?? 0x69f0ae)
        .setScale(Phaser.Math.FloatBetween(0.12, 0.26))
        .setAlpha(Phaser.Math.FloatBetween(0.14, 0.34))
        .setBlendMode(Phaser.BlendModes.ADD);
      objects.push(dot);
      if (reduced) continue;
      scene.tweens.add({
        targets: dot,
        x: dot.x + Phaser.Math.Between(-16, 16),
        y: dot.y + Phaser.Math.Between(-24, 16),
        alpha: { from: 0.12, to: Phaser.Math.FloatBetween(0.42, 0.72) },
        duration: Phaser.Math.Between(850, 1900),
        delay: Phaser.Math.Between(0, 900),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  });
}

/** 房間專屬環境動畫:只疊低透明度光效/掃描/粒子,不改原始背景圖。 */
export function installRoomAmbience(scene: Phaser.Scene, room: AmbientRoom, depth = 5): AmbientHandle {
  const objects: Phaser.GameObjects.GameObject[] = [];
  const addRect = (x: number, y: number, w: number, h: number, color: number, alpha: number) => {
    const r = scene.add.rectangle(x, y, w, h, color, alpha).setDepth(depth).setBlendMode(Phaser.BlendModes.ADD);
    objects.push(r);
    return r;
  };
  const addEllipse = (x: number, y: number, w: number, h: number, color: number, alpha: number) => {
    const e = scene.add.ellipse(x, y, w, h, color, alpha).setDepth(depth).setBlendMode(Phaser.BlendModes.ADD);
    objects.push(e);
    return e;
  };

  if (room === "lounge" || room === "muralhall") {
    const jukebox = addEllipse(95, 338, 150, 210, 0xffb14a, 0.16);
    const verticalSign = addRect(215, 188, 42, 140, 0xffb14a, 0.13);
    const barSign = addRect(366, 151, 236, 50, 0xffb14a, 0.14);
    const menu = addRect(535, 245, 88, 86, 0xffb14a, 0.11);
    const moonWindow = addEllipse(780, 218, 220, 245, 0xffc75f, 0.075);
    pulse(scene, jukebox, 0.08, 0.29, 1150);
    pulse(scene, verticalSign, 0.055, 0.22, 1450);
    pulse(scene, barSign, 0.06, 0.23, 1700);
    pulse(scene, menu, 0.04, 0.16, 2100);
    pulse(scene, moonWindow, 0.03, 0.115, 3300);
    twinkleCluster(scene, objects, [{ x: 725, y: 285, spreadX: 130, spreadY: 80, count: 18, color: 0xffd28a }], depth + 1);
  } else if (room === "medbay") {
    const alarmLamp = addEllipse(500, 148, 78, 66, 0xff2f3b, 0.24);
    const alarmCone = addRect(500, 310, 390, 398, 0xff2f3b, 0.06);
    alarmCone.setAngle(0);
    const bedWash = addEllipse(505, 356, 360, 140, 0xff6570, 0.07);
    const floorWash = addEllipse(500, 456, 540, 155, 0xff2f3b, 0.055);
    const panel = addRect(506, 236, 190, 66, 0xff2f3b, 0.065);
    pulse(scene, alarmLamp, 0.11, 0.34, 780);
    pulse(scene, alarmCone, 0.03, 0.105, 980);
    pulse(scene, bedWash, 0.035, 0.115, 1450);
    pulse(scene, floorWash, 0.03, 0.095, 1650);
    pulse(scene, panel, 0.035, 0.12, 1100);
  } else if (room === "greenhouse" || room === "datalab") {
    const leftRack = addEllipse(245, 284, 305, 225, 0x36f5a0, 0.12);
    const midLeftRack = addEllipse(375, 305, 225, 205, 0x69f0ae, 0.1);
    const rightRack = addEllipse(688, 282, 300, 225, 0x36f5a0, 0.115);
    const farRightBlue = addEllipse(815, 220, 180, 165, 0x23ffe6, 0.09);
    const dome = addEllipse(480, 86, 460, 110, 0x58ffe0, 0.06);
    const floorMist = addRect(480, 396, 740, 110, 0x58ffe0, 0.055);
    pulse(scene, leftRack, 0.06, 0.24, 1550);
    pulse(scene, midLeftRack, 0.045, 0.2, 1850);
    pulse(scene, rightRack, 0.055, 0.23, 1700);
    pulse(scene, farRightBlue, 0.04, 0.19, 2100);
    pulse(scene, dome, 0.025, 0.095, 3400);
    if (reducedMotion()) floorMist.setAlpha(0.08);
    else scene.tweens.add({ targets: floorMist, x: 540, alpha: { from: 0.035, to: 0.13 }, duration: 3600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    twinkleCluster(scene, objects, [
      { x: 190, y: 235, spreadX: 90, spreadY: 82, count: 24, color: 0x69f0ae },
      { x: 365, y: 300, spreadX: 90, spreadY: 88, count: 22, color: 0x69f0ae },
      { x: 680, y: 282, spreadX: 100, spreadY: 86, count: 24, color: 0x69f0ae },
      { x: 818, y: 238, spreadX: 70, spreadY: 68, count: 16, color: 0x23ffe6 },
    ], depth + 1);
  } else if (room === "command") {
    const holo = addRect(490, 236, 350, 175, 0x00f5ff, 0.13);
    const consoleLeft = addRect(365, 360, 280, 84, 0x00f5ff, 0.1);
    const consoleRight = addRect(655, 360, 265, 82, 0x00f5ff, 0.09);
    const scan = addRect(490, 170, 350, 10, 0x8effff, 0.2);
    pulse(scene, holo, 0.06, 0.22, 1550);
    pulse(scene, consoleLeft, 0.04, 0.16, 1350);
    pulse(scene, consoleRight, 0.035, 0.15, 1650);
    if (reducedMotion()) scan.setAlpha(0.16);
    else scene.tweens.add({ targets: scan, y: 305, alpha: { from: 0.06, to: 0.28 }, duration: 2500, repeat: -1, ease: "Sine.easeInOut", repeatDelay: 250 });
    twinkleCluster(scene, objects, [{ x: 490, y: 238, spreadX: 165, spreadY: 82, count: 20, color: 0x8effff }], depth + 1);
  } else if (room === "powerbay") {
    const warningPanel = addRect(508, 110, 320, 105, 0xff2f3b, 0.12);
    const redBulbs = addRect(510, 42, 300, 42, 0xff2f3b, 0.16);
    const blueArc = addEllipse(308, 286, 195, 315, 0x00cfff, 0.12);
    const pressureSign = addRect(505, 420, 300, 76, 0x00f5ff, 0.075);
    pulse(scene, warningPanel, 0.06, 0.24, 650);
    pulse(scene, redBulbs, 0.08, 0.32, 480);
    pulse(scene, blueArc, 0.05, 0.23, 560);
    pulse(scene, pressureSign, 0.035, 0.14, 1300);
    twinkleCluster(scene, objects, [{ x: 312, y: 290, spreadX: 82, spreadY: 165, count: 26, color: 0x00cfff }], depth + 1);
  } else if (room === "workshop") {
    const leftBulb = addEllipse(262, 167, 95, 125, 0xffd28a, 0.115);
    const rightBulb = addEllipse(725, 166, 115, 140, 0xffd28a, 0.12);
    const greenTools = addEllipse(487, 360, 285, 148, 0x69f0ae, 0.12);
    const monitor = addRect(176, 307, 136, 68, 0xffb14a, 0.09);
    pulse(scene, leftBulb, 0.055, 0.2, 1800);
    pulse(scene, rightBulb, 0.06, 0.21, 1700);
    pulse(scene, greenTools, 0.045, 0.2, 1350);
    pulse(scene, monitor, 0.04, 0.16, 1250);
    twinkleCluster(scene, objects, [{ x: 485, y: 365, spreadX: 130, spreadY: 55, count: 20, color: 0x69f0ae }], depth + 1);
  } else if (room === "title") {
    const starWash = addRect(480, 270, 960, 540, 0x7fb6c9, 0.045);
    pulse(scene, starWash, 0.02, 0.08, 3200);
  }

  return trackSceneObjects(scene, objects);
}

// ── 暗角(vignette)──────────────────────────────────────────────
// 程序生成一張中心透明、邊緣壓暗的徑向漸層貼圖,鋪在背景之上、內容之下,
// 讓所有靜態背景有一致的「聚焦中央」電影感。重複呼叫共用同一張貼圖。
const VIGNETTE_TEX = "vignette_tex";

export interface VignetteOpts {
  alpha?: number;
  depth?: number;
}

export function installVignette(scene: Phaser.Scene, opts: VignetteOpts = {}): Phaser.GameObjects.Image {
  if (!scene.textures.exists(VIGNETTE_TEX)) {
    const w = 256;
    const h = 144;
    const cv = scene.textures.createCanvas(VIGNETTE_TEX, w, h);
    const ctx = cv?.getContext();
    if (ctx) {
      const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.28, w / 2, h / 2, h * 1.05);
      grad.addColorStop(0, "rgba(2,6,10,0)");
      grad.addColorStop(0.62, "rgba(2,6,10,0)");
      grad.addColorStop(1, "rgba(2,6,10,0.62)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      cv?.refresh();
    }
  }
  return scene.add
    .image(480, 270, VIGNETTE_TEX)
    .setDisplaySize(980, 560)
    .setDepth(opts.depth ?? 3)
    .setAlpha(opts.alpha ?? 1)
    .setName("vignette");
}
