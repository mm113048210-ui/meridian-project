import Phaser from "phaser";
import { riasec, type DimWeights } from "../game/riasec";
import { loc, type LS } from "../game/lang";
import { sfx } from "./sfx";

// 小遊戲「招牌抉擇」:完成任務後,角色問一個偏好抉擇,玩家選一個。
// ⛔ 這是「選擇」(偏好)不是「表現」→ 合法計分,符合鐵則與 RIASEC(測興趣)。
//   weights 必須維度純化(只加該艙維度),依投入強度 14 高 / 7 中 / 2 低。
//   三個選項外觀等色等大,不暗示何者較佳(避免作答偏誤)。

export interface SigOption {
  label: LS;
  weights: DimWeights;
}

const HEX = (c: number) => `#${c.toString(16).padStart(6, "0")}`;

export function askSignature(
  scene: Phaser.Scene,
  cfg: {
    speaker: string;
    accent?: number;
    prompt: LS;
    options: SigOption[];
    nodeId: string;
    /** 預設 true 寫入全域評分引擎;false = 快速重測,改由 done(idx, opt) 自行累積 */
    score?: boolean;
  },
  done: (idx: number, opt: SigOption) => void,
): void {
  const accent = cfg.accent ?? 0x7fb6c9;
  const layer = scene.add.container(0, 0).setDepth(80).setAlpha(0);
  const dim = scene.add.rectangle(480, 270, 960, 540, 0x05080c, 0.74).setInteractive();
  const sp = scene.add.text(480, 138, cfg.speaker, { fontFamily: "sans-serif", fontSize: "14px", color: HEX(accent) }).setOrigin(0.5);
  const pr = scene.add
    .text(480, 172, loc(cfg.prompt), { fontFamily: "sans-serif", fontSize: "18px", color: "#eaf6ff", wordWrap: { width: 700 }, align: "center" })
    .setOrigin(0.5);
  layer.add([dim, sp, pr]);

  // 打亂選項順序,避免高分選項恆在最前導致作答偏誤
  const shuffled = Phaser.Utils.Array.Shuffle([...cfg.options]);

  const baseY = 256;
  shuffled.forEach((opt, i) => {
    const y = baseY + i * 74;
    const b = scene.add.rectangle(480, y, 640, 60, 0x12283a).setStrokeStyle(2, accent, 0.5);
    const t = scene.add
      .text(480, y, loc(opt.label), { fontFamily: "sans-serif", fontSize: "15px", color: "#dbeeff", wordWrap: { width: 600 }, align: "center" })
      .setOrigin(0.5);
    layer.add([b, t]);
    b.setInteractive({ useHandCursor: true });
    b.on("pointerover", () => {
      b.setFillStyle(0x1a3a52);
      b.setStrokeStyle(2, accent, 1);
      sfx.hover();
    });
    b.on("pointerout", () => {
      b.setFillStyle(0x12283a);
      b.setStrokeStyle(2, accent, 0.5);
    });
    b.on("pointerdown", () => {
      sfx.click();
      // ⛔ 唯一計分:把偏好選擇加進該艙維度(強度分級)。重測 score:false 時不污染全域引擎。
      if (cfg.score !== false) riasec.addChoice(opt.weights, cfg.nodeId);
      scene.tweens.add({ targets: layer, alpha: 0, duration: 220, onComplete: () => layer.destroy(true) });
      done(i, opt);
    });
  });

  scene.tweens.add({ targets: layer, alpha: 1, duration: 240 });
}
