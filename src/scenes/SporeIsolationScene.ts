import Phaser from "phaser";
import { riasec } from "../game/riasec";
import { flow, type SporeVariant } from "../game/flow";
import { sfx } from "../ui/sfx";
import { tt } from "../game/lang";
import { setSubSteps, completeSubStep } from "../game/tasks";
import { createNudge, type NudgeHandle } from "../ui/nudge";
import { installOtisAssist, type AssistHandle } from "../ui/assist";
import { askSignature } from "../ui/minichoice";
import { installAmbientDrift } from "../ui/ambient";

// I-3 旗艦任務「孢子隔離」:兩階段(掃描樣本 → 隔離處置)。
// 參考 Among Us:Inspect/Submit Scan、Sort Samples、Water Plants 的玩法感。
// ⛔ 表現(速度/錯誤)不計分,只記遙測。三種 variant 只改「怎麼做」,都能過關。
// variant:manual=照手冊(側欄步驟清單)/ inquire=邊做邊問「為什麼」/ verify=先驗密封再處置。

const TUBE_X = [330, 480, 630];
const TUBE_Y = 200;
const INFECTED = [true, false, true]; // 樣本 A、C 受感染(B 乾淨)

function fit(img: Phaser.GameObjects.Image, w: number, h: number) {
  img.setScale(Math.min(w / img.width, h / img.height));
}

export class SporeIsolationScene extends Phaser.Scene {
  private from = "bay";
  private variant: SporeVariant = "manual";
  private stage = 1;
  private scanned = [false, false, false];
  private isolated = [false, false, false];
  private sealChecked = false;
  private tempOk = false;
  private humOk = false;
  private solved = false;
  private startedAt = 0;
  private actions = 0;

  private stageText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private stageLayer!: Phaser.GameObjects.Container;
  private arm?: Phaser.GameObjects.Image; // 機械臂掃描器(階段一)
  private checklist?: Phaser.GameObjects.Container;
  private nudge?: NudgeHandle;
  private assist?: AssistHandle;

  constructor() {
    super("spore");
  }

  create(data: { from?: string }) {
    this.from = data?.from ?? "bay";
    this.variant = flow.sporeVariant;
    this.stage = 1;
    this.scanned = [false, false, false];
    this.isolated = [false, false, false];
    this.sealChecked = false;
    this.tempOk = this.humOk = false;
    this.solved = false;
    this.actions = 0;
    this.startedAt = this.time.now;

    this.cameras.main.fadeIn(350, 0, 0, 0);
    this.add.rectangle(480, 270, 960, 540, 0x06120f, 0.94);
    this.add.rectangle(480, 270, 960, 540, 0x0a2018, 0).setStrokeStyle(0);
    this.addGreenhouseAssets();
    installAmbientDrift(this, { color: 0x69f0ae, count: 24, depth: 2, alphaScale: 1.55, sizeScale: 1.3 });

    this.add
      .text(480, 34, tt("孢子隔離程序", "Spore Containment Procedure"), {
        fontFamily: "sans-serif",
        fontSize: "18px",
        color: "#d7f7ea",
      })
      .setOrigin(0.5);
    this.stageText = this.add
      .text(480, 60, "", { fontFamily: "sans-serif", fontSize: "13px", color: "#79e6c4" })
      .setOrigin(0.5);
    this.hintText = this.add
      .text(480, 500, "", {
        fontFamily: "sans-serif",
        fontSize: "13px",
        color: "#cfeede",
        backgroundColor: "rgba(4, 18, 14, 0.82)",
        padding: { x: 12, y: 8 },
        align: "center",
        wordWrap: { width: 640 },
      })
      .setOrigin(0.5);

    this.stageLayer = this.add.container(0, 0);
    riasec.log("minigame_start", { id: "spore", variant: this.variant });

    // 任務列表掛兩個子步驟(手機任務頁逐步勾選)
    setSubSteps([
      { zh: "掃描三個樣本", en: "Scan three samples" },
      { zh: "隔離感染樣本並穩定環境", en: "Isolate infected samples & stabilize" },
    ]);

    if (this.variant === "manual") this.buildChecklist();
    this.buildStage1();

    // 卡關提示:艾莉絲(乾、聰明、有點刺)
    this.nudge = createNudge(this, {
      speaker: "艾莉絲",
      accent: 0x448aff,
      anchor: { x: 24, y: 300 },
      lines: [
        { zh: "卡住了?資料就在你眼前,看仔細點。", en: "Stuck? The data's right in front of you. Look closer." },
        { zh: "陽性的會在掃描下顯影 —— 紅的拖進隔離艙,綠的別動。", en: "Positives fluoresce under the scan — drag the red ones into the chamber, leave the green." },
        { zh: "溫濕度量表,把把手拉進那條虛線帶就穩了。別想太多。", en: "The temp/humidity gauges — pull the handle into the dashed band. Don't overthink it." },
      ],
    });
    this.assist = installOtisAssist(this, { onAssist: () => this.solve() });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.nudge?.destroy();
      this.assist?.destroy();
    });
  }

  // 只註冊切框(由 alpha 邊界精算);素材不再當背景壁紙鋪滿,而是在各階段
  // 接成功能元件:機械臂=掃描器、櫃子=隔離艙。
  private addGreenhouseAssets() {
    const tex = this.textures.get("greenhouse_task_sheet");
    if (!tex.has("green_robot_arm")) {
      tex.add("green_robot_arm", 0, 487, 332, 331, 187);
      tex.add("green_cabinet", 0, 1129, 42, 202, 248);
    }
  }

  // ── 側欄步驟清單(僅 manual 變體)──────────────────────────
  private buildChecklist() {
    this.checklist = this.add.container(792, 150);
    const bg = this.add.rectangle(0, 60, 280, 220, 0x0d2018, 0.9).setStrokeStyle(1, 0x2e5e4a);
    const title = this.add
      .text(-120, -40, tt("生化安全手冊", "Biosafety Manual"), { fontSize: "13px", color: "#9be6c8" })
      .setOrigin(0, 0.5);
    this.checklist.add([bg, title]);
    const items = [
      tt("掃描樣本 A", "Scan sample A"),
      tt("掃描樣本 B", "Scan sample B"),
      tt("掃描樣本 C", "Scan sample C"),
      tt("隔離受感染樣本", "Isolate infected samples"),
      tt("溫度回到安全帶", "Temperature into safe band"),
      tt("濕度回到安全帶", "Humidity into safe band"),
    ];
    items.forEach((label, i) => {
      const row = this.add.text(-120, -10 + i * 26, `□ ${label}`, { fontSize: "12px", color: "#7fb6a4" });
      row.setData("base", label);
      this.checklist!.add(row);
    });
  }

  private tickChecklist(index: number) {
    if (!this.checklist) return;
    const row = this.checklist.list[2 + index] as Phaser.GameObjects.Text | undefined;
    if (row) {
      row.setText(`☑ ${row.getData("base")}`);
      row.setColor("#35e0c8");
    }
  }

  private why(text: { zh: string; en: string }) {
    // inquire 變體:每個動作後解釋「為什麼」
    if (this.variant === "inquire") this.hintText.setText(`${tt("為什麼:", "Why: ")}${tt(text.zh, text.en)}`);
  }

  // ── 階段一:掃描三個樣本 ─────────────────────────────────
  private buildStage1() {
    this.stage = 1;
    this.stageText.setText(tt("階段 1 / 2 ── 掃描樣本", "Stage 1 / 2 ── Scan samples"));
    this.hintText.setText(tt("點擊每個培養皿,機械臂會移過去掃描", "Click a dish — the robotic arm moves over to scan it"));
    this.stageLayer.removeAll(true);

    // 機械臂掃描器:停在樣本上方,點哪個皿就移過去掃哪個
    this.arm = this.add.image(TUBE_X[1], TUBE_Y - 96, "greenhouse_task_sheet", "green_robot_arm");
    fit(this.arm, 150, 96);
    this.stageLayer.add(this.arm);

    TUBE_X.forEach((x, i) => {
      const dish = this.add.container(x, TUBE_Y);
      const plate = this.add.circle(0, 0, 40, 0x123a2c).setStrokeStyle(2, 0x35e0c8, 0.6);
      const sample = this.add.circle(0, 0, 22, 0x6fae8e, 0.85);
      const tag = this.add
        .text(0, 58, ["A", "B", "C"][i], { fontSize: "14px", color: "#bfe9d8" })
        .setOrigin(0.5);
      const bar = this.add.rectangle(0, 40, 0, 5, 0x35e0c8).setOrigin(0, 0.5);
      const barBg = this.add.rectangle(-30, 40, 60, 5, 0x0c241b).setOrigin(0, 0.5);
      dish.add([plate, sample, barBg, bar, tag]);
      this.stageLayer.add(dish);

      plate.setInteractive(new Phaser.Geom.Circle(0, 0, 40), Phaser.Geom.Circle.Contains);
      plate.input!.cursor = "pointer";
      plate.on("pointerdown", () => {
        if (this.scanned[i] || this.solved) return;
        this.scanned[i] = true;
        this.actions++;
        sfx.hover();
        // 機械臂先移到該樣本上方,再開始掃描條動畫
        this.tweens.add({ targets: this.arm, x, duration: 320, ease: "Sine.easeInOut" });
        this.tweens.add({
          targets: bar,
          width: 60,
          delay: 280,
          duration: 720,
          onUpdate: () => bar.setX(-30),
          onComplete: () => {
            sfx.snap();
            const infected = INFECTED[i];
            sample.setFillStyle(infected ? 0xe06a5a : 0x6fe09a, 0.95);
            if (infected) {
              // 受感染:畫幾個孢子點
              for (let k = 0; k < 5; k++) {
                const a = (k / 5) * Math.PI * 2;
                dish.add(this.add.circle(Math.cos(a) * 12, Math.sin(a) * 12, 3, 0x7a1d12));
              }
            }
            tag.setText(`${["A", "B", "C"][i]} · ${infected ? tt("陽性", "POS") : tt("陰性", "NEG")}`);
            tag.setColor(infected ? "#ff9b8a" : "#7fe0a4");
            this.tickChecklist(i);
            this.why(
              infected
                ? { zh: "孢子在掃描頻率下顯影 → 判定陽性,需隔離。", en: "Spores fluoresce under the scan → positive, must isolate." }
                : { zh: "無顯影反應 → 樣本乾淨,留在原位。", en: "No fluorescence → clean sample, leave in place." },
            );
            riasec.log("spore_scan", { i, infected });
            this.nudge?.progress();
            this.checkStage1();
          },
        });
      });
    });
  }

  private checkStage1() {
    if (!this.scanned.every(Boolean)) return;
    this.completeSub(); // 勾掉「掃描」子步驟
    this.stageText.setText(tt("掃描完成 ✓", "Scan complete ✓"));
    this.time.delayedCall(700, () => this.beginStage2Gate());
  }

  // verify 變體:進階段二前先做密封檢查
  private beginStage2Gate() {
    if (this.variant === "verify" && !this.sealChecked) {
      this.stageLayer.removeAll(true);
      this.stageText.setText(tt("處置前 ── 密封檢查", "Before handling ── seal check"));
      this.hintText.setText(tt("點擊隔離艙確認氣密,再開始處置", "Click the chamber to confirm airtight, then proceed"));
      const seal = this.add.container(480, 250);
      const box = this.add.rectangle(0, 0, 150, 110, 0x12302a).setStrokeStyle(2, 0xffd166);
      const lbl = this.add.text(0, 0, tt("密封檢查", "SEAL CHECK"), { fontSize: "14px", color: "#ffd166" }).setOrigin(0.5);
      seal.add([box, lbl]);
      this.stageLayer.add(seal);
      box.setInteractive({ useHandCursor: true });
      box.on("pointerdown", () => {
        this.sealChecked = true;
        sfx.solve();
        this.cameras.main.flash(160, 53, 224, 200);
        this.why({ zh: "先確認氣密,避免處置時孢子外洩。", en: "Confirm airtight first so spores can't escape during handling." });
        this.buildStage2();
      });
      return;
    }
    this.buildStage2();
  }

  // ── 階段二:隔離感染樣本(Sort Samples)+ 穩定環境(O2 式垂直量表)──
  private buildStage2() {
    this.stage = 2;
    this.stageText.setText(tt("階段 2 / 2 ── 隔離與穩定", "Stage 2 / 2 ── Isolate & stabilize"));
    this.hintText.setText(
      tt("把陽性樣本拖進隔離艙,再把溫濕度量表拉進虛線安全帶", "Drag positive samples into the chamber, then pull temp/humidity into the dashed safe band"),
    );
    this.stageLayer.removeAll(true);

    // 隔離艙 = 櫃子素材本體(負壓櫃),把陽性樣本拖進去
    const cabinet = this.add.image(300, 150, "greenhouse_task_sheet", "green_cabinet");
    fit(cabinet, 150, 162);
    this.stageLayer.add(cabinet);
    this.stageLayer.add(
      this.add.text(300, 60, tt("隔離艙(負壓)", "Isolation (neg. pressure)"), { fontSize: "13px", color: "#6fae93" }).setOrigin(0.5),
    );

    // 樣本拖箱(Sort Samples):陽性 A、C 拖入;陰性 B 留原位(放錯回彈,不計成敗)
    const baseX = [140, 250, 360];
    const baseY = 460;
    TUBE_X.forEach((_, i) => {
      const infected = INFECTED[i];
      const sx = baseX[i];
      const sy = baseY;
      const dot = this.add.container(sx, sy);
      const c = this.add.circle(0, 0, 20, infected ? 0xe06a5a : 0x6fe09a, 0.95).setStrokeStyle(2, 0xffffff, 0.3);
      const tag = this.add.text(0, 30, ["A", "B", "C"][i], { fontSize: "12px", color: "#cfe9de" }).setOrigin(0.5);
      dot.add([c, tag]);
      dot.setSize(40, 40);
      this.stageLayer.add(dot);

      if (!infected) {
        dot.setAlpha(0.55);
        return;
      }
      dot.setInteractive({ useHandCursor: true, draggable: true });
      this.input.setDraggable(dot);
      dot.on("drag", (_p: unknown, dx: number, dy: number) => {
        if (this.solved) return;
        dot.setPosition(dx, dy);
      });
      dot.on("dragend", () => {
        const inChamber = Math.abs(dot.x - 300) < 152 && Math.abs(dot.y - 140) < 68;
        if (inChamber) {
          this.isolated[i] = true;
          this.actions++;
          sfx.snap();
          dot.disableInteractive();
          cabinet.setTint(0x9ff5cf);
          this.time.delayedCall(200, () => cabinet.clearTint());
          this.tweens.add({ targets: dot, x: 270 + i * 22, y: 150, duration: 160, onComplete: () => dot.setVisible(false) });
          this.why({ zh: "陽性樣本移入負壓艙,阻斷孢子擴散。", en: "Positive sample moved into the negative-pressure chamber to stop spread." });
          riasec.log("spore_isolate", { i });
          if (INFECTED.every((inf, k) => !inf || this.isolated[k])) this.tickChecklist(3);
          this.nudge?.progress();
          this.checkStage2();
        } else {
          this.tweens.add({ targets: dot, x: sx, y: sy, duration: 200, ease: "Back.easeOut" });
          sfx.error();
          this.nudge?.fail();
        }
      });
    });

    // 溫濕度垂直量表(O2 式:把手拉進虛線目標帶)
    this.buildGauge(tt("溫度", "Temp"), 620, () => (this.tempOk = true), () => (this.tempOk = false), 4);
    this.buildGauge(tt("濕度", "Humidity"), 760, () => (this.humOk = true), () => (this.humOk = false), 5);
  }

  // 垂直量表:把手往上拉、下方液位跟著填,落在虛線安全帶即綠燈(Among Us O2/Calibrate 風)
  private buildGauge(label: string, cx: number, onOk: () => void, onLost: () => void, checklistIdx: number) {
    const topY = 200;
    const botY = 440;
    const h = botY - topY;
    const glass = this.add.rectangle(cx, (topY + botY) / 2, 66, h + 24, 0x0b2a36, 0.6).setStrokeStyle(2, 0x2e5e4a);
    const track = this.add.rectangle(cx, (topY + botY) / 2, 40, h, 0x0c2430).setStrokeStyle(1, 0x2e5e4a);
    const bandY = topY + 46 + Math.random() * (h - 92);
    const band = this.add.container(cx, bandY);
    band.add(this.add.rectangle(0, 0, 46, 26, 0x35e0c8, 0.16));
    for (let k = -1; k <= 1; k++) band.add(this.add.rectangle(k * 16, 0, 12, 4, 0xffffff, 0.85));
    const fill = this.add.rectangle(cx, botY, 40, 1, 0xe0c14a, 0.8).setOrigin(0.5, 1);
    const handle = this.add.rectangle(cx, botY - 8, 54, 16, 0xcfd9de).setStrokeStyle(2, 0x6f96a8);
    const lbl = this.add.text(cx, botY + 24, label, { fontSize: "12px", color: "#9be6c8" }).setOrigin(0.5);
    this.stageLayer.add([glass, track, band, fill, handle, lbl]);

    let ok = false;
    handle.setInteractive({ useHandCursor: true, draggable: true });
    this.input.setDraggable(handle);
    handle.on("drag", (_p: unknown, _dx: number, dy: number) => {
      if (this.solved) return;
      const y = Phaser.Math.Clamp(dy, topY, botY);
      handle.y = y;
      fill.setSize(40, botY - y);
      const within = Math.abs(y - bandY) < 16;
      if (within && !ok) {
        ok = true;
        this.actions++;
        handle.setFillStyle(0x35e0c8);
        fill.setFillStyle(0x35e0c8, 0.8);
        sfx.repair();
        onOk();
        this.tickChecklist(checklistIdx);
        this.why({ zh: "環境回到孢子無法增殖的區間,溫室才穩得住。", en: "Conditions back into the range where spores can't multiply, so the greenhouse holds." });
        this.checkStage2();
      } else if (!within && ok) {
        ok = false;
        handle.setFillStyle(0xcfd9de);
        fill.setFillStyle(0xe0c14a, 0.8);
        onLost();
      }
    });
  }

  private checkStage2() {
    if (this.solved) return;
    const allIsolated = INFECTED.every((inf, i) => !inf || this.isolated[i]);
    if (!allIsolated || !this.tempOk || !this.humOk) return;
    this.solve();
  }

  private completeSub() {
    completeSubStep();
  }

  private solve() {
    this.solved = true;
    this.nudge?.solved();
    this.assist?.destroy();
    this.completeSub(); // 勾掉「隔離」子步驟
    sfx.solve();
    this.cameras.main.flash(240, 53, 224, 200);
    // 視覺回饋:溫室淨化 — 綠光擴散
    const glow = this.add.circle(480, 270, 10, 0x35e0c8, 0.5);
    this.tweens.add({ targets: glow, radius: 520, alpha: 0, duration: 900, ease: "Cubic.easeOut" });
    this.stageText.setText("");
    this.hintText.setText(tt("孢子已封存 · 溫室穩定 ▮▮▮▮▮", "Spores sealed · greenhouse stable ▮▮▮▮▮"));
    this.hintText.setColor("#7df5d0");

    riasec.log("minigame_done", {
      id: "spore",
      variant: this.variant,
      ms: Math.round(this.time.now - this.startedAt),
      actions: this.actions,
    });

    this.time.delayedCall(1200, () => this.askSignatureChoice());
  }

  // 招牌抉擇(計分第 4 題,維度 I,純化分級):封存後你會怎麼做?
  private askSignatureChoice() {
    askSignature(
      this,
      {
        speaker: "艾莉絲",
        accent: 0x448aff,
        nodeId: "I-3",
        prompt: { zh: "孢子封存了。接下來,你會?", en: "The spores are sealed. What do you do next?" },
        options: [
          { label: { zh: "追下去 —— 我想弄清楚它為什麼這樣擴散。", en: "Dig deeper — I want to understand why it spread like this." }, weights: { I: 14 } },
          { label: { zh: "把結果記錄下來就好。", en: "Just log the results." }, weights: { I: 7 } },
          { label: { zh: "結案,不再深究。", en: "Close it out. No need to dig further." }, weights: { I: 2 } },
        ],
      },
      () => this.finish(),
    );
  }

  private finish() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.stop();
      this.scene.resume(this.from);
    });
  }
}
