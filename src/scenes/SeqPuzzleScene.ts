import Phaser from "phaser";
import { riasec } from "../game/riasec";
import { sfx } from "../ui/sfx";
import { tt } from "../game/lang";
import { createNudge, type NudgeHandle } from "../ui/nudge";
import { installAmbientDrift } from "../ui/ambient";

// I-3:生化隔離 SOP 步驟排序(拖曳重排)。表現不計分,只記遙測。
const STEPS = [
  "穿戴正壓防護服",
  "封閉實驗區通風閥",
  "啟動負壓隔離場",
  "以機械臂轉移孢子樣本",
  "密封三重艙門",
  "紫外線全域消毒",
  "登錄封存編號並歸檔",
];
const STEPS_EN = [
  "Put on positive-pressure suit",
  "Seal lab ventilation valves",
  "Activate negative-pressure field",
  "Transfer spores with robotic arm",
  "Seal triple bulkhead doors",
  "Run full UV sterilization",
  "Log archive ID and file record",
];

const SLOT_X = 480;
const SLOT_Y0 = 118;
const SLOT_H = 54;

export class SeqPuzzleScene extends Phaser.Scene {
  private order: number[] = []; // order[slot] = step index
  private cards: Phaser.GameObjects.Container[] = [];
  private solved = false;
  private startedAt = 0;
  private dragsCount = 0;
  private from = "modules";
  private nudge?: NudgeHandle;

  constructor() {
    super("seqpuzzle");
  }

  create(data: { from?: string }) {
    this.from = data?.from ?? "modules";
    this.solved = false;
    this.cards = [];
    this.dragsCount = 0;
    this.startedAt = this.time.now;
    this.cameras.main.fadeIn(350, 0, 0, 0);
    this.add.rectangle(480, 270, 960, 540, 0x06090d, 0.9);
    installAmbientDrift(this, { color: 0x69f0ae, count: 20, depth: 2, alphaScale: 1.45, sizeScale: 1.25 });
    this.add
      .text(480, 52, tt("排出正確的隔離程序:拖曳步驟卡重新排序", "Arrange the isolation procedure: drag the cards into order"), {
        fontFamily: "sans-serif",
        fontSize: "16px",
        color: "#cfe9f5",
      })
      .setOrigin(0.5);

    // 洗牌(保證非正解開局)
    this.order = Phaser.Utils.Array.Shuffle([...STEPS.keys()]);
    if (this.order.every((v, i) => v === i)) this.order.reverse();

    this.order.forEach((stepIdx, slot) => this.spawnCard(stepIdx, slot));

    // 漸進提示:艾莉絲(乾、聰明)。先點原則,最後給接近完整的順序;再卡才出「接手」。
    this.nudge = createNudge(this, {
      speaker: "艾莉絲",
      accent: 0x448aff,
      anchor: { x: 24, y: 300 },
      lines: [
        { zh: "卡住了?這是標準作業流程 —— 想想做危險實驗的安全順序。", en: "Stuck? It's a standard operating procedure — think about the safe order for a hazardous experiment." },
        { zh: "原則很簡單:永遠先保護自己,最後才歸檔。防護服在最前。", en: "Simple rule: protect yourself first, file the record last. The suit goes first." },
        { zh: "順序大致是:防護 → 封閉通風 → 負壓場 → 轉移樣本 → 密封艙門 → 消毒 → 歸檔。", en: "Roughly: suit up → seal vents → negative-pressure field → transfer → seal doors → sterilize → file." },
      ],
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.nudge?.destroy());

    this.time.delayedCall(45_000, () => {
      if (this.solved) return;
      const btn = this.add
        .text(854, 506, tt("⟐ 請奧提斯接手", "Ask OTIS to assist"), {
          fontFamily: "sans-serif",
          fontSize: "15px",
          color: "#7fb6c9",
          backgroundColor: "#13283a",
          padding: { x: 12, y: 7 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      btn.on("pointerdown", () => {
        riasec.log("minigame_assist", { id: "seq" });
        this.order = [...STEPS.keys()];
        this.layout();
        this.time.delayedCall(400, () => this.check());
        btn.destroy();
      });
    });
  }

  private spawnCard(stepIdx: number, slot: number) {
    const c = this.add.container(SLOT_X, SLOT_Y0 + slot * SLOT_H);
    const r = this.add.rectangle(0, 0, 520, 48, 0x13283a).setStrokeStyle(2, 0x2e4a5e);
    const t = this.add.text(-240, 0, tt(STEPS[stepIdx], STEPS_EN[stepIdx]), {
      fontFamily: "sans-serif",
      fontSize: "17px",
      color: "#e8f6ff",
    }).setOrigin(0, 0.5);
    const grip = this.add.text(240, 0, "≡", { fontSize: "20px", color: "#5e7a8a" }).setOrigin(1, 0.5);
    c.add([r, t, grip]);
    c.setData("step", stepIdx);
    c.setSize(520, 48);
    c.setInteractive({ useHandCursor: true, draggable: true });
    this.cards.push(c);

    c.on("drag", (_p: unknown, _x: number, y: number) => {
      if (this.solved) return;
      c.y = Phaser.Math.Clamp(y, SLOT_Y0 - 20, SLOT_Y0 + 6 * SLOT_H + 20);
      c.setDepth(10);
      // 即時讓位
      const hoverSlot = Phaser.Math.Clamp(Math.round((c.y - SLOT_Y0) / SLOT_H), 0, 6);
      const cur = this.order.indexOf(c.getData("step"));
      if (hoverSlot !== cur) {
        this.order.splice(cur, 1);
        this.order.splice(hoverSlot, 0, c.getData("step"));
        this.layout(c);
        sfx.hover();
      }
    });
    c.on("dragend", () => {
      if (this.solved) return;
      this.dragsCount += 1;
      c.setDepth(1);
      this.layout();
      sfx.snap();
      this.nudge?.progress(); // 有在動 → 別急著嘮叨
      this.check();
    });
  }

  private layout(skip?: Phaser.GameObjects.Container) {
    this.cards.forEach((card) => {
      if (card === skip) return;
      const slot = this.order.indexOf(card.getData("step"));
      this.tweens.add({ targets: card, y: SLOT_Y0 + slot * SLOT_H, x: SLOT_X, duration: 140 });
    });
  }

  private check() {
    if (this.solved) return;
    if (!this.order.every((v, i) => v === i)) return;
    this.solved = true;
    this.nudge?.solved();
    sfx.solve();
    this.cameras.main.flash(200, 53, 224, 200);
    riasec.log("minigame_done", {
      id: "seq",
      ms: Math.round(this.time.now - this.startedAt),
      drags: this.dragsCount,
    });
    this.cards.forEach((c) => {
      const r = c.list[0] as Phaser.GameObjects.Rectangle;
      r.setStrokeStyle(2, 0x35e0c8);
    });
    this.add
      .text(480, 506, tt("隔離程序:已封存 ▮▮▮▮▮", "Isolation procedure: sealed ▮▮▮▮▮"), {
        fontFamily: "sans-serif",
        fontSize: "17px",
        color: "#35e0c8",
        backgroundColor: "#0e1d2a",
        padding: { x: 14, y: 7 },
      })
      .setOrigin(0.5);
    this.time.delayedCall(1300, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.stop();
        this.scene.resume(this.from);
      });
    });
  }
}
