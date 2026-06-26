import Phaser from "phaser";
import { riasec } from "../game/riasec";
import { sfx } from "../ui/sfx";
import { tt } from "../game/lang";
import { createNudge, type NudgeHandle } from "../ui/nudge";
import { installOtisAssist, type AssistHandle } from "../ui/assist";
import { askSignature } from "../ui/minichoice";
import { installAmbientDrift } from "../ui/ambient";

// 動力艙 R-3:Hold-to-fill(參考 Among Us「Fuel Engines / Empty Garbage」按住充能)。
// 科學依據:R(Realistic)= 操作機具、building & fixing 的實作動作。
// ⛔ 表現不計分,只記遙測。variant 只改操作手感,都能完成。
//   variant 0 手動(穩定按住)/ 1 工具(較快)/ 2 無人機協助(預充一段,你補完)。

export class HoldFillScene extends Phaser.Scene {
  private from = "bay";
  private variant = 0;
  private charge = 0;
  private held = false;
  private solved = false;
  private startedAt = 0;
  private holds = 0;
  private fill!: Phaser.GameObjects.Rectangle;
  private pct!: Phaser.GameObjects.Text;
  private rate = 0.34;
  private nudge?: NudgeHandle;
  private assist?: AssistHandle;

  constructor() {
    super("holdfill");
  }

  create(data: { from?: string; variant?: number }) {
    this.from = data?.from ?? "bay";
    this.variant = data?.variant ?? 0;
    this.charge = this.variant === 2 ? 42 : 0; // 無人機協助:預充一段
    this.held = false;
    this.solved = false;
    this.holds = 0;
    this.rate = this.variant === 1 ? 0.46 : 0.34;
    this.startedAt = this.time.now;

    this.cameras.main.fadeIn(320, 0, 0, 0);
    this.add.rectangle(480, 270, 960, 540, 0x0a0d12, 0.94);
    installAmbientDrift(this, { color: 0xffab40, count: 20, depth: 2, alphaScale: 1.5, sizeScale: 1.25 });
    this.add.text(480, 40, tt("超控:釋放卡死的鑽臂", "Override: free the jammed drill arm"), { fontFamily: "sans-serif", fontSize: "18px", color: "#ffd9b0" }).setOrigin(0.5);
    this.add
      .text(480, 70, tt("按住超控桿,持續加壓直到滿格", "Hold the override lever and keep building pressure to full"), { fontFamily: "sans-serif", fontSize: "13px", color: "#cdb89f" })
      .setOrigin(0.5);

    // 加壓槽
    const tankX = 480;
    const tankTop = 130;
    const tankBot = 400;
    this.add.rectangle(tankX, (tankTop + tankBot) / 2, 120, tankBot - tankTop, 0x141a22).setStrokeStyle(2, 0x6f7e8a);
    this.fill = this.add.rectangle(tankX, tankBot, 112, 0, 0xffab40, 0.9).setOrigin(0.5, 1);
    this.pct = this.add.text(tankX, 270, "0%", { fontFamily: "sans-serif", fontSize: "22px", color: "#ffd9b0" }).setOrigin(0.5);
    this.tankTop = tankTop;
    this.tankBot = tankBot;

    // 超控桿(按住)
    const lever = this.add.rectangle(tankX, 458, 240, 52, 0x3a2a18).setStrokeStyle(2, 0xffab40);
    const leverLabel = this.add.text(tankX, 458, tt("按住超控", "HOLD OVERRIDE"), { fontFamily: "sans-serif", fontSize: "16px", color: "#ffd9b0" }).setOrigin(0.5);
    lever.setInteractive({ useHandCursor: true });
    const press = () => {
      if (this.solved) return;
      this.held = true;
      this.holds++;
      this.nudge?.progress();
      leverLabel.setText(tt("加壓中…", "PRESSURIZING…"));
      lever.setFillStyle(0x5a3f1f);
      sfx.repair();
    };
    const release = () => {
      this.held = false;
      leverLabel.setText(tt("按住超控", "HOLD OVERRIDE"));
      lever.setFillStyle(0x3a2a18);
    };
    lever.on("pointerdown", press);
    lever.on("pointerup", release);
    lever.on("pointerout", release);

    if (this.variant === 2) this.add.text(tankX, 100, tt("維修無人機已預充壓力", "Repair drone pre-charged the line"), { fontSize: "12px", color: "#8fb6c9" }).setOrigin(0.5);

    riasec.log("minigame_start", { id: "holdfill", variant: this.variant });

    // 卡關提示:凱爾(粗、直接、動手派)
    this.nudge = createNudge(this, {
      speaker: "凱爾",
      accent: 0xffab40,
      anchor: { x: 30, y: 96 },
      lines: [
        { zh: "愣著幹嘛?按住那根桿子別放。", en: "What are you waiting for? Grab that lever and hold it." },
        { zh: "壓力一鬆手就洩,要連續加壓 —— 壓到滿格為止,手別抖。", en: "Let go and the pressure bleeds out. Keep it pressed — all the way to full, no shaky hands." },
      ],
    });
    this.assist = installOtisAssist(this, { onAssist: () => this.solve() });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.nudge?.destroy();
      this.assist?.destroy();
    });
  }

  private tankTop = 130;
  private tankBot = 400;

  update(_t: number, dt: number) {
    if (this.solved) return;
    const step = dt / 16;
    if (this.held) this.charge += this.rate * step;
    else this.charge -= 0.12 * step; // 放開緩慢洩壓
    this.charge = Phaser.Math.Clamp(this.charge, 0, 100);
    const h = ((this.tankBot - this.tankTop) * this.charge) / 100;
    this.fill.setSize(112, h);
    this.pct.setText(`${Math.round(this.charge)}%`);
    if (this.charge >= 100) this.solve();
  }

  private solve() {
    this.solved = true;
    this.nudge?.solved();
    this.assist?.destroy();
    sfx.solve();
    this.cameras.main.flash(220, 255, 171, 64);
    this.fill.setFillStyle(0x35e0c8, 0.9);
    this.add.text(480, 270, tt("鑽臂已釋放 ▮▮▮▮▮", "Drill arm released ▮▮▮▮▮"), { fontFamily: "sans-serif", fontSize: "17px", color: "#35e0c8", backgroundColor: "#0e1d2a", padding: { x: 14, y: 7 } }).setOrigin(0.5);
    riasec.log("minigame_done", { id: "holdfill", variant: this.variant, ms: Math.round(this.time.now - this.startedAt), holds: this.holds });
    this.time.delayedCall(1100, () => this.askSignatureChoice());
  }

  // 招牌抉擇(計分第 4 題,維度 R):鑽臂鬆了之後你會?
  private askSignatureChoice() {
    askSignature(
      this,
      {
        speaker: "凱爾",
        accent: 0xffab40,
        nodeId: "R-3",
        prompt: { zh: "鑽臂鬆了。接下來,你會?", en: "The drill arm is free. What do you do next?" },
        options: [
          { label: { zh: "順手把整排接頭也鎖緊,徹底修好。", en: "Tighten the whole row of joints while I'm at it — fix it properly." }, weights: { R: 14 } },
          { label: { zh: "做完該做的就收工。", en: "Do what's needed and call it done." }, weights: { R: 7 } },
          { label: { zh: "剩下的交給維修無人機善後。", en: "Leave the rest for the repair drone to finish." }, weights: { R: 2 } },
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
