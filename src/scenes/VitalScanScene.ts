import Phaser from "phaser";
import { riasec } from "../game/riasec";
import { sfx } from "../ui/sfx";
import { tt } from "../game/lang";
import { createNudge, type NudgeHandle } from "../ui/nudge";
import { installOtisAssist, type AssistHandle } from "../ui/assist";
import { askSignature } from "../ui/minichoice";
import { installAmbientDrift } from "../ui/ambient";

// 醫療艙 S-3:Submit Scan + 安撫。素材是介面本身,不是背景壁紙 ——
// 控制台=按住穩定的互動本體;警示燈隨心律狀態即時反應。其餘留白,不堆道具。
// 科學依據:S(Social)= healing / helping / showing concern。
// ⛔ 表現不計分,只記遙測;variant 只改照護順序/語氣,都能完成。

function fit(img: Phaser.GameObjects.Image, w: number, h: number) {
  img.setScale(Math.min(w / img.width, h / img.height));
}

const UNSTABLE = Phaser.Display.Color.ValueToColor(0xff4d58);
const STABLE = Phaser.Display.Color.ValueToColor(0x69f0ae);

export class VitalScanScene extends Phaser.Scene {
  private from = "bay";
  private variant = 0;
  private instability = 1; // 1=亂、0=穩
  private held = false;
  private steady = false;
  private solved = false;
  private startedAt = 0;
  private wave!: Phaser.GameObjects.Graphics;
  private phase: "stabilize" | "comfort" = "stabilize";
  private hint!: Phaser.GameObjects.Text;
  private nudge?: NudgeHandle;
  private assist?: AssistHandle;

  private alarm?: Phaser.GameObjects.Image;
  private control?: Phaser.GameObjects.Image;
  private controlGlow?: Phaser.GameObjects.Ellipse;
  private controlLabel?: Phaser.GameObjects.Text;

  constructor() {
    super("vitalscan");
  }

  create(data: { from?: string; variant?: number }) {
    this.from = data?.from ?? "bay";
    this.variant = data?.variant ?? 0;
    this.instability = 1;
    this.held = false;
    this.steady = false;
    this.solved = false;
    this.phase = "stabilize";
    this.startedAt = this.time.now;

    this.cameras.main.fadeIn(320, 0, 0, 0);
    this.add.rectangle(480, 270, 960, 540, 0x0b0f14, 0.96);
    this.ensureFrames();
    installAmbientDrift(this, { color: 0xff8a80, count: 10, depth: 1, alphaScale: 1.0, sizeScale: 1.0 });
    this.add.text(480, 44, tt("照護站:穩定生命徵象", "Care Station: stabilize vital signs"), { fontFamily: "sans-serif", fontSize: "18px", color: "#bfe6ff" }).setOrigin(0.5);
    this.hint = this.add
      .text(480, 76, tt("按住控制台,讓心律回到綠色安全帶", "Hold the console until the rhythm returns to the green band"), { fontFamily: "sans-serif", fontSize: "13px", color: "#a8cfe0" })
      .setOrigin(0.5);

    // 波形螢幕(中央):ECG 顯示區 + 綠色安全帶
    this.add.rectangle(480, 210, 520, 150, 0x0e1620).setStrokeStyle(2, 0x2e4a5e);
    this.add.rectangle(480, 210, 520, 46, 0x35e0c8, 0.1);
    this.wave = this.add.graphics();

    // 警示燈(螢幕右上角,唯一的狀態指示):隨 instability 紅閃,穩定後熄滅
    this.alarm = this.add.image(770, 132, "medbay_task_sheet", "med_alarm");
    fit(this.alarm, 78, 90);

    // 控制台(下方)= 按住穩定的互動本體
    this.controlGlow = this.add.ellipse(480, 392, 236, 134, 0x69f0ae, 0.55).setAlpha(0);
    this.control = this.add.image(480, 392, "medbay_task_sheet", "med_control").setInteractive({ useHandCursor: true });
    fit(this.control, 200, 150);
    this.controlLabel = this.add.text(480, 482, tt("按住控制台穩定", "HOLD TO STABILIZE"), { fontFamily: "sans-serif", fontSize: "15px", color: "#bdf5d6" }).setOrigin(0.5);

    const press = () => {
      if (this.solved || this.phase !== "stabilize") return;
      this.held = true;
      this.nudge?.progress();
      this.controlLabel?.setText(tt("穩定中…", "STABILIZING…"));
      this.control?.setTint(0xc8f5e0);
      this.tweens.add({ targets: this.controlGlow, alpha: 1, duration: 150 });
    };
    const release = () => {
      if (this.steady) return;
      this.held = false;
      this.controlLabel?.setText(tt("按住控制台穩定", "HOLD TO STABILIZE"));
      this.control?.clearTint();
      this.tweens.add({ targets: this.controlGlow, alpha: 0, duration: 200 });
    };
    this.control.on("pointerdown", press);
    this.control.on("pointerup", release);
    this.control.on("pointerout", release);

    riasec.log("minigame_start", { id: "vitalscan", variant: this.variant });

    this.nudge = createNudge(this, {
      speaker: "希雅",
      accent: 0xff8a80,
      anchor: { x: 24, y: 92 },
      lines: [
        { zh: "別慌。按住控制台,讓心律慢慢回到綠色帶裡。", en: "Don't panic. Hold the console and let the rhythm ease back into the green band." },
        { zh: "穩了之後,他需要的不只是儀器 —— 選一個你覺得對的照護方式。", en: "Once it's steady, they need more than machines — choose the care that feels right." },
      ],
    });
    // 逃生口:接手 → 直接進入照護階段(仍會問計分招牌抉擇,不跳過)
    this.assist = installOtisAssist(this, { onAssist: () => { if (!this.steady) this.enterComfort(); } });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.nudge?.destroy();
      this.assist?.destroy();
    });
  }

  private ensureFrames() {
    const tex = this.textures.get("medbay_task_sheet");
    if (tex.has("med_alarm")) return;
    // 切框由 alpha 邊界精算(前景放大顯示,需精確)
    tex.add("med_ecg", 0, 80, 83, 139, 134);
    tex.add("med_alarm", 0, 326, 86, 116, 142);
    tex.add("med_monitor", 0, 559, 65, 205, 168);
    tex.add("med_scan_bracket", 0, 567, 301, 189, 195);
    tex.add("med_light_cone", 0, 870, 304, 186, 169);
    tex.add("med_control", 0, 1147, 325, 176, 142);
  }

  update(t: number, dt: number) {
    if (this.solved) return;
    const step = dt / 16;
    if (this.phase === "stabilize") {
      if (this.held) this.instability -= 0.012 * step;
      else this.instability += 0.005 * step;
      this.instability = Phaser.Math.Clamp(this.instability, 0, 1);
      this.reactToState(t);
      if (this.instability <= 0.12 && !this.steady) this.enterComfort();
    }
    this.drawWave(t);
  }

  // 警示燈的顏色與閃爍速度跟著心律穩定度走 —— 素材成為即時診斷回饋。
  private reactToState(t: number) {
    if (this.steady || !this.alarm) return;
    const k = Math.round((1 - this.instability) * 100); // 0 亂 .. 100 穩
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(UNSTABLE, STABLE, 100, k);
    this.alarm.setTint(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
    this.alarm.setAlpha(0.45 + 0.45 * Math.sin(t * (0.004 + 0.013 * this.instability)));
  }

  private drawWave(t: number) {
    const g = this.wave;
    g.clear();
    g.lineStyle(2, this.steady ? 0x69f0ae : 0xff8a80, 0.95);
    const baseY = 210;
    const left = 235;
    const right = 725;
    g.beginPath();
    for (let x = left; x <= right; x += 4) {
      const phase = (x - left) * 0.05 + t * 0.012;
      const amp = 8 + this.instability * 46;
      const spike = Math.sin(phase) * amp + (Math.sin(phase * 3.3) * amp * 0.4 * this.instability);
      const y = baseY - spike;
      if (x === left) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokePath();
  }

  private enterComfort() {
    this.steady = true;
    this.phase = "comfort";
    this.assist?.destroy();
    sfx.solve();
    this.held = false;

    // 警示燈轉綠熄滅 = 已穩定
    this.alarm?.setTint(0x69f0ae);
    this.tweens.add({ targets: this.alarm, alpha: 0, duration: 600 });
    // 控制台:停用、回正、熄滅光暈
    this.control?.disableInteractive();
    this.control?.clearTint();
    this.tweens.add({ targets: this.controlGlow, alpha: 0, duration: 300 });
    this.controlLabel?.setText(tt("心律穩定 ✓", "Rhythm steady ✓"));
    this.hint.setText(tt("心律穩了。他醒過來,看著你。", "The rhythm holds. He wakes and looks at you."));
    this.nudge?.progress();

    // 招牌抉擇(計分第 4 題,維度 S,純化分級):只選一個照護方式。
    askSignature(
      this,
      {
        speaker: "希雅",
        accent: 0xff8a80,
        nodeId: "S-3",
        prompt: { zh: "他需要的不只是儀器。你會怎麼陪他?", en: "He needs more than machines. How do you stay with him?" },
        options: [
          { label: { zh: "握住他的手,陪他直到他睡著。", en: "Hold his hand and stay until he falls asleep." }, weights: { S: 14 } },
          { label: { zh: "確認數值穩定、記錄後,巡下一床。", en: "Confirm the readings, log them, move to the next bed." }, weights: { S: 7 } },
          { label: { zh: "交給監測儀,你先去忙別的。", en: "Leave him to the monitor; there's other work to do." }, weights: { S: 2 } },
        ],
      },
      () => this.solve(),
    );
  }

  private solve() {
    this.solved = true;
    this.nudge?.solved();
    sfx.solve();
    this.cameras.main.flash(220, 105, 240, 174);
    this.add.text(480, 300, tt("病患已穩定 · 安心入眠 ▮▮▮▮▮", "Patient stabilized · resting easy ▮▮▮▮▮"), { fontFamily: "sans-serif", fontSize: "17px", color: "#9df5e7", backgroundColor: "#0e1d2a", padding: { x: 14, y: 7 } }).setOrigin(0.5);
    riasec.log("minigame_done", { id: "vitalscan", variant: this.variant, ms: Math.round(this.time.now - this.startedAt) });
    this.time.delayedCall(1400, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.stop();
        this.scene.resume(this.from);
      });
    });
  }
}
