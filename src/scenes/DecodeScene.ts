import Phaser from "phaser";
import { riasec } from "../game/riasec";
import { sfx } from "../ui/sfx";
import { loc, tt, type LS } from "../game/lang";

// M1 通訊解碼(語文推理):依符號對照表,從候選中選出正確譯文。
// 表現不計分,只記遙測。答錯不懲罰,標紅後可再選。
interface Round {
  cipher: string;
  keyHints: LS[];
  options: LS[];
  answer: number;
}

const ROUNDS: Round[] = [
  {
    cipher: "◇▣▽ ─ ◇▣▽ ─ ⬡△",
    keyHints: [{ zh: "◇▣▽ = 求救", en: "◇▣▽ = distress" }, { zh: "⬡△ = 信標", en: "⬡△ = beacon" }],
    options: [
      { zh: "求救 求救 信標", en: "Distress. Distress. Beacon." },
      { zh: "信標 信標 求救", en: "Beacon. Beacon. Distress." },
      { zh: "求救 信標 求救", en: "Distress. Beacon. Distress." },
    ],
    answer: 0,
  },
  {
    cipher: "⬡△ ▽◇ ◇▣▽ ╳",
    keyHints: [{ zh: "▽◇ = 已收到", en: "▽◇ = acknowledged" }, { zh: "╳ = 終止", en: "╳ = terminate" }],
    options: [
      { zh: "信標 求救 已收到 終止", en: "Beacon. Distress. Acknowledged. Terminate." },
      { zh: "信標 已收到 求救 終止", en: "Beacon. Acknowledged. Distress. Terminate." },
      { zh: "已收到 信標 終止 求救", en: "Acknowledged. Beacon. Terminate. Distress." },
    ],
    answer: 1,
  },
  {
    cipher: "▽◇ ⬡△ ▽◇ ◎",
    keyHints: [{ zh: "◎ = 回家", en: "◎ = home" }],
    options: [
      { zh: "已收到 信標 已收到 回家", en: "Acknowledged. Beacon. Acknowledged. Home." },
      { zh: "回家 信標 回家 已收到", en: "Home. Beacon. Home. Acknowledged." },
      { zh: "已收到 回家 信標 已收到", en: "Acknowledged. Home. Beacon. Acknowledged." },
    ],
    answer: 0,
  },
];

const GLYPHS = "◇▣▽⬡△╳◎◈⬢▷◁⊕⊗∆".split("");

export class DecodeScene extends Phaser.Scene {
  private from = "modules";
  private round = 0;
  private misses = 0;
  private startedAt = 0;
  private roundObjs: Phaser.GameObjects.GameObject[] = [];
  private wave!: Phaser.GameObjects.Graphics;
  private noise = 1; // 訊號雜訊振幅(解出後歸零)
  private scrambleEvt?: Phaser.Time.TimerEvent;

  constructor() {
    super("decode");
  }

  create(data: { from?: string }) {
    this.from = data?.from ?? "modules";
    this.round = 0;
    this.misses = 0;
    this.noise = 1;
    this.startedAt = this.time.now;
    this.cameras.main.fadeIn(350, 0, 0, 0);
    this.add.rectangle(480, 270, 960, 540, 0x06090d, 0.92);
    this.add
      .text(480, 46, tt("修復殘缺訊號:對照符號表,選出正確譯文", "Repair the broken signal: use the symbol key to choose the correct translation"), {
        fontFamily: "sans-serif",
        fontSize: "16px",
        color: "#cfe9f5",
      })
      .setOrigin(0.5);
    // 訊號波形:在密文後方流動(update 持續抖動,解出後歸於平靜)
    this.wave = this.add.graphics().setDepth(1);
    this.showRound();
  }

  update() {
    if (!this.wave) return;
    this.wave.clear();
    this.wave.lineStyle(2, 0x00f5ff, 0.35 + 0.4 * this.noise);
    this.wave.beginPath();
    const y0 = 150;
    for (let x = 178; x <= 782; x += 6) {
      const base = Math.sin((x + this.time.now * 0.014) * 0.045) * 9 * this.noise;
      const jitter = (Math.random() - 0.5) * 14 * this.noise;
      const y = y0 + base + jitter;
      if (x === 178) this.wave.moveTo(x, y);
      else this.wave.lineTo(x, y);
    }
    this.wave.strokePath();
  }

  private showRound() {
    this.roundObjs.forEach((o) => o.destroy());
    this.roundObjs = [];
    const r = ROUNDS[this.round];

    const progress = this.add
      .text(480, 84, tt(`訊號片段 ${this.round + 1} / ${ROUNDS.length}`, `Signal Fragment ${this.round + 1} / ${ROUNDS.length}`), {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#5e7a8a",
      })
      .setOrigin(0.5);

    const cipherBox = this.add.rectangle(480, 150, 620, 64, 0x0e1d2a).setStrokeStyle(2, 0x2e4a5e);
    const cipher = this.add
      .text(480, 150, r.cipher, { fontFamily: "monospace", fontSize: "26px", color: "#00f5ff" })
      .setOrigin(0.5)
      .setDepth(2);
    // 解碼前先亂碼,再「鎖定」成真正的密文
    this.scrambleCipher(cipher, r.cipher);

    const hints = this.add
      .text(480, 212, tt("符號對照:", "Symbol key: ") + r.keyHints.map(loc).join("   "), {
        fontFamily: "sans-serif",
        fontSize: "16px",
        color: "#8fb3c4",
      })
      .setOrigin(0.5);

    this.roundObjs.push(progress, cipherBox, cipher, hints);

    r.options.forEach((opt, i) => {
      const y = 286 + i * 64;
      const box = this.add
        .rectangle(480, y, 580, 54, 0x13283a)
        .setStrokeStyle(2, 0x2e4a5e)
        .setInteractive({ useHandCursor: true });
      const txt = this.add
        .text(480, y, loc(opt), { fontFamily: "sans-serif", fontSize: "18px", color: "#e8f6ff" })
        .setOrigin(0.5);
      this.roundObjs.push(box, txt);

      box.on("pointerover", () => {
        box.setStrokeStyle(2, 0x00f5ff);
        sfx.hover();
      });
      box.on("pointerout", () => box.setStrokeStyle(2, 0x2e4a5e));
      box.on("pointerdown", () => {
        if (i === r.answer) {
          sfx.snap();
          box.setStrokeStyle(2, 0x35e0c8);
          this.time.delayedCall(350, () => this.next());
        } else {
          this.misses += 1;
          sfx.alarm();
          box.setFillStyle(0x3a1620);
          this.cameras.main.shake(120, 0.002);
        }
      });
    });
  }

  // 亂碼 → 鎖定:每格符號快速跳動約 0.5 秒後定格為真密文
  private scrambleCipher(label: Phaser.GameObjects.Text, real: string) {
    this.scrambleEvt?.remove();
    let ticks = 0;
    const scramble = () =>
      real
        .split("")
        .map((ch) => (ch === " " || ch === "─" ? ch : GLYPHS[Phaser.Math.Between(0, GLYPHS.length - 1)]))
        .join("");
    this.scrambleEvt = this.time.addEvent({
      delay: 45,
      repeat: 10,
      callback: () => {
        ticks++;
        label.setText(ticks > 10 ? real : scramble());
        if (ticks <= 10) sfx.type();
        else sfx.snap();
      },
    });
  }

  private next() {
    this.round += 1;
    if (this.round < ROUNDS.length) {
      this.showRound();
      return;
    }
    sfx.solve();
    this.tweens.addCounter({ from: 1, to: 0, duration: 700, onUpdate: (t) => (this.noise = t.getValue() ?? 0) });
    this.cameras.main.flash(200, 53, 224, 200);
    riasec.log("minigame_done", {
      id: "decode",
      ms: Math.round(this.time.now - this.startedAt),
      misses: this.misses,
    });
    this.add
      .text(480, 500, tt("訊號重建:完成 ▮▮▮▮▮ ──「已收到 信標 已收到 回家」", "Signal reconstruction complete ▮▮▮▮▮ - Acknowledged. Beacon. Acknowledged. Home."), {
        fontFamily: "sans-serif",
        fontSize: "15px",
        color: "#35e0c8",
        backgroundColor: "#0e1d2a",
        padding: { x: 14, y: 7 },
      })
      .setOrigin(0.5);
    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.stop();
        this.scene.resume(this.from);
      });
    });
  }
}
