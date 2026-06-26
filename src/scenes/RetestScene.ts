import Phaser from "phaser";
import { askSignature, type SigOption } from "../ui/minichoice";
import { SIGNATURES, SIGNATURE_ORDER } from "../game/signatures";
import { normalizeToReport, DIMS, type Dim } from "../game/riasec";
import { careerStore } from "../game/storage";
import { tt } from "../game/lang";
import { sfx } from "../ui/sfx";
import { playMusic } from "../ui/music";
import { installAmbientDrift } from "../ui/ambient";
import { fadeToScene } from "../ui/transition";

// 快速重測:不跑劇情、不玩小遊戲,只回答 6 題招牌抉擇(短式量表)→ 產生新鑑定快照。
// 玩完的玩家可一測再測,在 Dashboard 疊圖看自己的興趣怎麼變化。
export class RetestScene extends Phaser.Scene {
  private raw: Record<Dim, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  private idx = 0;

  constructor() {
    super("retest");
  }

  create() {
    this.raw = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    this.idx = 0;
    document.getElementById("hud")?.classList.add("hidden");
    playMusic(this, "bgm_title_drift", 0.18);
    this.cameras.main.fadeIn(350, 0, 0, 0);
    this.add.rectangle(480, 270, 960, 540, 0x05080c);
    installAmbientDrift(this, { color: 0x00f5ff, count: 18, depth: 2, alphaScale: 1.3, sizeScale: 1.15 });
    // 安靜星空底,不喧賓奪主
    for (let i = 0; i < 70; i++) {
      const x = Phaser.Math.Between(0, 960);
      const y = Phaser.Math.Between(0, 540);
      const s = this.add.circle(x, y, Math.random() * 1.3 + 0.3, 0xbcd6e6, Math.random() * 0.5 + 0.2);
      this.tweens.add({ targets: s, alpha: 0.1, duration: 1400 + Math.random() * 1800, yoyo: true, repeat: -1 });
    }
    this.progressText = this.add
      .text(480, 70, "", { fontFamily: "monospace", fontSize: "13px", color: "#7fb6c9" })
      .setOrigin(0.5);
    this.ask();
  }

  private progressText!: Phaser.GameObjects.Text;

  private ask() {
    if (this.idx >= SIGNATURE_ORDER.length) return this.finish();
    const dim = SIGNATURE_ORDER[this.idx];
    this.progressText.setText(
      `${tt("重測", "Re-assessment")}  ${this.idx + 1} / ${SIGNATURE_ORDER.length}`,
    );
    const item = SIGNATURES[dim];
    askSignature(
      this,
      {
        speaker: item.speaker,
        accent: item.accent,
        nodeId: `retest-${item.nodeId}`,
        prompt: item.prompt,
        options: item.options,
        score: false, // 不污染全域引擎;本機累積
      },
      (_i: number, opt: SigOption) => {
        for (const d of DIMS) {
          const v = opt.weights[d];
          if (typeof v === "number") this.raw[d] += v;
        }
        this.idx += 1;
        this.time.delayedCall(180, () => this.ask());
      },
    );
  }

  private async finish() {
    const { scores, code } = normalizeToReport(this.raw);
    sfx.solve();
    this.cameras.main.flash(220, 53, 224, 200);
    await careerStore.addAssessment({ scores, code, finalChoice: -1 });
    this.add
      .text(480, 270, tt("重測完成 ▮▮▮▮▮", "Re-assessment complete ▮▮▮▮▮"), {
        fontFamily: "sans-serif",
        fontSize: "18px",
        color: "#35e0c8",
      })
      .setOrigin(0.5);
    this.time.delayedCall(900, () => fadeToScene(this, "home", { duration: 400 }));
  }
}
