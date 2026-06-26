import Phaser from "phaser";
import { riasec } from "../game/riasec";
import { sfx } from "../ui/sfx";
import { tt } from "../game/lang";
import { createNudge, type NudgeHandle } from "../ui/nudge";
import { installOtisAssist, type AssistHandle } from "../ui/assist";
import { askSignature } from "../ui/minichoice";
import { installAmbientDrift } from "../ui/ambient";

// 交誼廳 A-3:Assemble Artifact(參考 Among Us「Assemble Artifact」拼合碎片)。
// 科學依據:A(Artistic)= creating / designing / self-expression 的創作排列。
// ⛔ 表現不計分,只記遙測。自由排列(任何碎片入任何槽都成立)= 自我表達。

const FRAG_COLORS = [0xffc75f, 0x69f0ae, 0x7fb6c9, 0xc792ea, 0xff8a80];
const FRAG_ACCENTS = [0x4a2b17, 0x153e32, 0x18394a, 0x342148, 0x4a1f24];
const SLOT_Y = 218;
const SLOT_X0 = 210;
const SLOT_GAP = 135;
const PANEL_W = 128;
const PANEL_H = 138;
const N = 5;

interface Slot {
  x: number;
  filled: boolean;
  ghost: Phaser.GameObjects.Container;
}

export class AssembleScene extends Phaser.Scene {
  private from = "bay";
  private variant = 0;
  private slots: Slot[] = [];
  private placed = 0;
  private solved = false;
  private startedAt = 0;
  private moves = 0;
  private nudge?: NudgeHandle;
  private assist?: AssistHandle;

  constructor() {
    super("assemble");
  }

  create(data: { from?: string; variant?: number }) {
    this.from = data?.from ?? "bay";
    this.variant = data?.variant ?? 0;
    this.slots = [];
    this.placed = 0;
    this.solved = false;
    this.moves = 0;
    this.startedAt = this.time.now;

    this.cameras.main.fadeIn(320, 0, 0, 0);
    this.ensureMemoryFrames();
    this.add.image(480, 270, "muralhall").setDisplaySize(960, 540).setAlpha(0.42);
    this.add.rectangle(480, 270, 960, 540, 0x100c16, 0.62);
    installAmbientDrift(this, { color: 0xc792ea, count: 20, depth: 2, alphaScale: 1.45, sizeScale: 1.25 });
    this.add.text(480, 34, tt("重建紀念壁畫:拼回失聯艦員的記憶", "Rebuild the memorial mural: piece back the lost crew's memory"), { fontFamily: "sans-serif", fontSize: "17px", color: "#ffe6b0" }).setOrigin(0.5);
    this.add
      .text(480, 60, tt("把記憶碎片嵌回牆面。順序不影響分數,它只是你選擇怎麼紀念。", "Set the memory panels back into the wall. The order is not scored; it is how you choose to remember."), { fontFamily: "sans-serif", fontSize: "13px", color: "#d8c0a0" })
      .setOrigin(0.5);

    // 壁畫框 + 槽位
    this.drawMuralBackplate();
    for (let i = 0; i < N; i++) {
      const x = SLOT_X0 + i * SLOT_GAP;
      const ghostAlpha = this.variant === 2 ? 0.22 : this.variant === 1 ? 0.1 : 0.04;
      const ghost = this.createSlotGhost(i, x, SLOT_Y, ghostAlpha);
      this.slots.push({ x, filled: false, ghost });
    }

    // 碎片(底部洗牌排開)
    const order = Phaser.Utils.Array.Shuffle([...Array(N).keys()]);
    order.forEach((colorIdx, pos) => {
      const sx = SLOT_X0 + pos * SLOT_GAP + (Math.random() * 24 - 12);
      const sy = 415 + (Math.random() * 22 - 11);
      this.spawnFragment(colorIdx, sx, sy);
    });

    riasec.log("minigame_start", { id: "assemble", variant: this.variant });

    // 卡關提示:萊拉(夢幻、鼓勵、沒有標準答案)
    this.nudge = createNudge(this, {
      speaker: "萊拉",
      accent: 0x69f0ae,
      anchor: { x: 632, y: 300 },
      lines: [
        { zh: "別怕排錯,這沒有標準答案 —— 怎麼放,都是你的版本。", en: "Don't be afraid to get it 'wrong' — there's no right answer. However you place them, it's your version." },
        { zh: "把五個碎片都拖進格子裡,壁畫就會亮起來。", en: "Drag all five fragments into the slots and the mural lights up." },
      ],
    });
    this.assist = installOtisAssist(this, { onAssist: () => this.solve() });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.nudge?.destroy();
      this.assist?.destroy();
    });
  }

  private ensureMemoryFrames() {
    const tex = this.textures.get("memory_panels_sheet");
    if (tex.has("memory_panel_0")) return;
    tex.add("memory_panel_0", 0, 72, 82, 300, 260);
    tex.add("memory_panel_1", 0, 570, 78, 300, 260);
    tex.add("memory_panel_2", 0, 1030, 78, 305, 260);
    tex.add("memory_panel_3", 0, 286, 410, 270, 270);
    tex.add("memory_panel_4", 0, 574, 410, 270, 270);
  }

  private drawMuralBackplate() {
    const w = N * SLOT_GAP + 58;
    const h = 184;
    this.add.rectangle(480, SLOT_Y + 8, w + 28, h + 32, 0x08070b, 0.55).setDepth(0);
    this.add.rectangle(480, SLOT_Y, w, h, 0x211721, 0.96).setStrokeStyle(4, 0x8a5a35, 0.9);
    this.add.rectangle(480, SLOT_Y, w - 18, h - 18, 0x120d16, 0.35).setStrokeStyle(2, 0xffc75f, 0.28);
    this.add.rectangle(480, SLOT_Y - 102, w - 76, 12, 0xffc75f, 0.12);
    this.add.rectangle(480, SLOT_Y + 102, w - 76, 12, 0xffc75f, 0.1);
    for (let i = 0; i < 9; i++) {
      const x = 142 + i * 84;
      this.add.rectangle(x, SLOT_Y - 102, 10, 10, 0xffc75f, 0.24).setAngle(45);
      this.add.rectangle(x + 34, SLOT_Y + 102, 8, 8, 0xc792ea, 0.22).setAngle(45);
    }
    this.add.text(480, SLOT_Y - 82, tt("LOUNGE MEMORY WALL / C-742", "LOUNGE MEMORY WALL / C-742"), {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#cda77c",
    }).setOrigin(0.5);
  }

  private createSlotGhost(idx: number, x: number, y: number, ghostAlpha: number) {
    const c = this.add.container(x, y);
    const shadow = this.add.rectangle(4, 5, PANEL_W, PANEL_H, 0x000000, 0.26);
    const frame = this.add.rectangle(0, 0, PANEL_W, PANEL_H, 0x0d0b12, 0.82).setStrokeStyle(2, 0x6b503f, 0.75);
    const inset = this.add.rectangle(0, 0, PANEL_W - 16, PANEL_H - 16, FRAG_COLORS[idx], ghostAlpha).setStrokeStyle(1, FRAG_COLORS[idx], 0.35);
    const label = this.add.text(-52, -58, `0${idx + 1}`, { fontFamily: "monospace", fontSize: "11px", color: "#856f78" });
    c.add([shadow, frame, inset, label]);
    return c;
  }

  private spawnFragment(colorIdx: number, sx: number, sy: number) {
    const frag = this.add.container(sx, sy);
    this.drawMemoryPanel(frag, colorIdx, true);
    frag.setSize(PANEL_W, PANEL_H);
    frag.setData("home", { x: sx, y: sy });
    frag.setData("slot", -1);
    frag.setInteractive({ useHandCursor: true, draggable: true });
    this.input.setDraggable(frag);
    const floatTween = this.tweens.add({
      targets: frag,
      y: sy + Phaser.Math.Between(-5, 5),
      duration: Phaser.Math.Between(1500, 2300),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    frag.setData("floatTween", floatTween);

    frag.on("dragstart", () => {
      if (this.solved) return;
      const tween = frag.getData("floatTween") as Phaser.Tweens.Tween | undefined;
      tween?.stop();
      this.tweens.killTweensOf(frag);
      const prev = frag.getData("slot") as number;
      frag.setData("prevSlot", prev);
      if (prev >= 0) {
        this.slots[prev].filled = false;
        frag.setData("slot", -1);
      }
      frag.setDepth(20);
      frag.setScale(1.06);
    });
    frag.on("drag", (_p: unknown, dx: number, dy: number) => {
      if (this.solved) return;
      frag.setPosition(dx, dy);
    });
    frag.on("dragend", () => {
      if (this.solved) return;
      frag.setDepth(1);
      frag.setScale(1);
      const prev = frag.getData("prevSlot") as number;
      // 找最近的槽。距離放寬,避免玩家明明拖到面板邊緣卻吸不上去。
      let best = -1;
      let bestD = 120;
      this.slots.forEach((s, i) => {
        if (s.filled) return;
        const d = Math.hypot(frag.x - s.x, frag.y - SLOT_Y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      if (best >= 0) {
        this.slots[best].filled = true;
        frag.setData("slot", best);
        this.moves++;
        sfx.snap();
        this.nudge?.progress();
        this.tweens.add({ targets: frag, x: this.slots[best].x, y: SLOT_Y, angle: 0, duration: 180, ease: "Back.easeOut" });
        const flash = this.add.rectangle(this.slots[best].x, SLOT_Y, PANEL_W + 12, PANEL_H + 12, FRAG_COLORS[colorIdx], 0.18).setDepth(9);
        this.tweens.add({ targets: flash, alpha: 0, scaleX: 1.15, scaleY: 1.15, duration: 320, onComplete: () => flash.destroy() });
        this.checkDone();
      } else {
        if (prev >= 0) {
          this.slots[prev].filled = true;
          frag.setData("slot", prev);
          this.tweens.add({ targets: frag, x: this.slots[prev].x, y: SLOT_Y, duration: 190, ease: "Back.easeOut" });
        } else {
          frag.setData("slot", -1);
          const home = frag.getData("home") as { x: number; y: number };
          this.tweens.add({ targets: frag, x: home.x, y: home.y, duration: 220, ease: "Back.easeOut" });
        }
        sfx.hover();
      }
    });
  }

  private drawMemoryPanel(parent: Phaser.GameObjects.Container, idx: number, draggable: boolean) {
    const frameName = `memory_panel_${idx}`;
    if (this.textures.get("memory_panels_sheet").has(frameName)) {
      const shadow = this.add.rectangle(5, 7, PANEL_W, PANEL_H, 0x000000, 0.35);
      const panel = this.add.image(0, 0, "memory_panels_sheet", frameName).setDisplaySize(PANEL_W, PANEL_H);
      parent.add([shadow, panel]);
      if (!draggable) panel.setAlpha(0.72);
      return;
    }
    const color = FRAG_COLORS[idx];
    const accent = FRAG_ACCENTS[idx];
    const shadow = this.add.rectangle(5, 7, PANEL_W, PANEL_H, 0x000000, 0.35);
    const frame = this.add.rectangle(0, 0, PANEL_W, PANEL_H, 0x24151f, 0.98).setStrokeStyle(3, color, 0.78);
    const face = this.add.rectangle(0, 0, PANEL_W - 16, PANEL_H - 16, 0x17111a, 0.94).setStrokeStyle(1, 0xfff0c8, 0.22);
    const wash = this.add.rectangle(0, 0, PANEL_W - 28, PANEL_H - 28, color, 0.12);
    parent.add([shadow, frame, face, wash]);

    const label = this.add.text(-50, -57, `MEM-${idx + 1}`, { fontFamily: "monospace", fontSize: "10px", color: "#ffe6b0" });
    parent.add(label);
    if (idx === 0) this.drawStars(parent, color);
    if (idx === 1) this.drawSprout(parent, color, accent);
    if (idx === 2) this.drawSignal(parent, color);
    if (idx === 3) this.drawPortraitSilhouette(parent, color, accent);
    if (idx === 4) this.drawOrbit(parent, color);

    const cracks = [
      [-40, 42, -12, 26],
      [18, -46, 36, -28],
      [38, 34, 50, 48],
    ];
    cracks.forEach(([x1, y1, x2, y2]) => {
      const line = this.add.line(0, 0, x1, y1, x2, y2, 0xffe0b0, draggable ? 0.28 : 0.16).setOrigin(0, 0);
      parent.add(line);
    });
  }

  private drawStars(parent: Phaser.GameObjects.Container, color: number) {
    const pts = [
      [-34, -22], [-5, -36], [24, -18], [40, 12], [5, 30], [-28, 18],
    ];
    pts.forEach(([x, y], i) => {
      parent.add(this.add.rectangle(x, y, i % 2 ? 7 : 10, i % 2 ? 7 : 10, color, 0.85).setAngle(45));
      if (i > 0) parent.add(this.add.line(0, 0, pts[i - 1][0], pts[i - 1][1], x, y, color, 0.35).setOrigin(0, 0));
    });
  }

  private drawSprout(parent: Phaser.GameObjects.Container, color: number, accent: number) {
    parent.add(this.add.rectangle(0, 22, 8, 58, color, 0.75));
    parent.add(this.add.ellipse(-20, -2, 42, 22, color, 0.78).setAngle(-25));
    parent.add(this.add.ellipse(24, 7, 48, 24, color, 0.78).setAngle(25));
    parent.add(this.add.rectangle(0, 48, 72, 12, accent, 0.8));
    parent.add(this.add.rectangle(-36, 32, 12, 28, color, 0.35));
    parent.add(this.add.rectangle(36, 30, 10, 30, color, 0.32));
  }

  private drawSignal(parent: Phaser.GameObjects.Container, color: number) {
    for (let i = 0; i < 4; i++) {
      parent.add(this.add.rectangle(-42 + i * 28, 36 - i * 22, 16, 18 + i * 22, color, 0.72));
    }
    parent.add(this.add.rectangle(0, -42, 78, 12, color, 0.35));
    parent.add(this.add.rectangle(0, -22, 58, 8, color, 0.28));
  }

  private drawPortraitSilhouette(parent: Phaser.GameObjects.Container, color: number, accent: number) {
    parent.add(this.add.circle(0, -28, 24, color, 0.78));
    parent.add(this.add.rectangle(0, 22, 54, 72, accent, 0.82));
    parent.add(this.add.rectangle(-32, 20, 14, 58, color, 0.45).setAngle(12));
    parent.add(this.add.rectangle(32, 20, 14, 58, color, 0.45).setAngle(-12));
    parent.add(this.add.rectangle(0, -4, 44, 8, 0xffe6c8, 0.45));
  }

  private drawOrbit(parent: Phaser.GameObjects.Container, color: number) {
    parent.add(this.add.circle(0, 0, 22, color, 0.78));
    parent.add(this.add.ellipse(0, 0, 96, 38).setStrokeStyle(2, color, 0.55).setAngle(-18));
    parent.add(this.add.ellipse(0, 0, 78, 78).setStrokeStyle(2, color, 0.25));
    parent.add(this.add.circle(42, -16, 8, 0xffe6b0, 0.75));
  }

  private lightSlot(slot: Phaser.GameObjects.Container) {
    slot.each((child: Phaser.GameObjects.GameObject) => {
      if (child instanceof Phaser.GameObjects.Rectangle) {
        child.setStrokeStyle(2, 0x35e0c8, 0.9);
      }
    });
  }

  private checkDone() {
    this.placed = this.slots.filter((s) => s.filled).length;
    if (this.placed >= N && !this.solved) this.solve();
  }

  private solve() {
    this.solved = true;
    this.nudge?.solved();
    this.assist?.destroy();
    sfx.solve();
    this.cameras.main.flash(240, 199, 146, 234);
    this.slots.forEach((s) => this.lightSlot(s.ghost));
    // 壁畫亮起
    const glow = this.add.rectangle(480, SLOT_Y, N * SLOT_GAP + 72, 190, 0xffc75f, 0).setStrokeStyle(4, 0xffe6b0, 0.95);
    const sweep = this.add.rectangle(132, SLOT_Y, 36, 184, 0xffffff, 0.16).setDepth(18);
    this.tweens.add({ targets: glow, alpha: 0.32, duration: 600, yoyo: true, repeat: 1 });
    this.tweens.add({ targets: sweep, x: 826, alpha: { from: 0.02, to: 0.24 }, duration: 900, ease: "Sine.easeInOut", onComplete: () => sweep.destroy() });
    this.add.text(480, 338, tt("記憶壁畫已重建  /  五段訊號重新連線", "Memorial mural restored / five signals re-linked"), { fontFamily: "monospace", fontSize: "16px", color: "#ffe6b0", backgroundColor: "#211721", padding: { x: 14, y: 7 } }).setOrigin(0.5);
    riasec.log("minigame_done", { id: "assemble", variant: this.variant, ms: Math.round(this.time.now - this.startedAt), moves: this.moves });
    this.time.delayedCall(1200, () => this.askSignatureChoice());
  }

  // 招牌抉擇(計分第 4 題,維度 A):重建之後的創作態度。
  private askSignatureChoice() {
    askSignature(
      this,
      {
        speaker: "萊拉",
        accent: 0x69f0ae,
        nodeId: "A-3",
        prompt: { zh: "壁畫亮起來了。面對它,你會?", en: "The mural lights up. Facing it, you?" },
        options: [
          { label: { zh: "再加幾筆自己的詮釋,讓它變成新的東西。", en: "Add a few strokes of my own — make it something new." }, weights: { A: 14 } },
          { label: { zh: "照原樣復原就好。", en: "Just restore it as it was." }, weights: { A: 7 } },
          { label: { zh: "拍照存檔,交給系統歸檔。", en: "Photograph it and let the system archive it." }, weights: { A: 2 } },
        ],
      },
      () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.stop();
          this.scene.resume(this.from);
        });
      },
    );
  }
}
