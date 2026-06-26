import Phaser from "phaser";
import { tt } from "../game/lang";
import { sfx } from "./sfx";
import { flow } from "../game/flow";

// 漸進式鷹架(心流框架 + Buster 暗中调整):依完成艙數縮放逃生口出現時機。
// 入门期更快給逃生(降低挫败退出),心流期留更多空间。玩家不會感知此調整。
function scaledAfterMs(): number {
  const done = flow.completedBays.length;
  if (done <= 1) return 26000; // 入门:早点给出口
  if (done <= 3) return 36000; // 练习
  return 46000; // 心流:多撑一会儿
}

// 保證逃生口(错误处理「恢复机制」+ 一致性):任何小遊戲卡關夠久後,
// 角落淡入「請奧提斯接手」。點了就由 onAssist 直接完成該關 —— 絕不硬卡死。
// 表現不計分(鐵則),所以「接手」不影響評分,只解除挫敗。
// 用 Phaser 繪製,無需新美術。出現在 nudge 漸進提示「之後」,形成 提示→逃生 階梯。

export interface AssistHandle {
  destroy(): void;
}

export interface AssistOpts {
  afterMs?: number; // 卡關多久後出現逃生口(預設 40s)
  onAssist: () => void; // 通常傳 () => this.solve()
}

export function installOtisAssist(scene: Phaser.Scene, opts: AssistOpts): AssistHandle {
  const afterMs = opts.afterMs ?? scaledAfterMs();
  const W = 168;
  const H = 38;
  const x = 960 - W - 24;
  const y = 540 - H - 22;

  let layer: Phaser.GameObjects.Container | undefined;
  let used = false;

  const timer = scene.time.delayedCall(afterMs, () => {
    if (used) return;
    layer = scene.add.container(x, y).setDepth(62).setAlpha(0);
    const bg = scene.add.graphics();
    bg.fillStyle(0x081016, 0.94);
    bg.fillRoundedRect(0, 0, W, H, 9);
    bg.lineStyle(1, 0x00f5ff, 0.55);
    bg.strokeRoundedRect(0, 0, W, H, 9);
    const label = scene.add
      .text(W / 2, H / 2, tt("⟐ 請奧提斯接手", "⟐ Ask OTIS to assist"), {
        fontFamily: "sans-serif",
        fontSize: "13px",
        color: "#9be9ff",
      })
      .setOrigin(0.5);
    const hit = scene.add.rectangle(0, 0, W, H, 0xffffff, 0).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    layer.add([bg, label, hit]);

    scene.tweens.add({ targets: layer, alpha: 1, duration: 320, ease: "Sine.easeOut" });
    // 輕微呼吸,提示「這裡可以點」,但不喧賓奪主
    scene.tweens.add({ targets: label, alpha: { from: 1, to: 0.7 }, duration: 1100, yoyo: true, repeat: -1 });

    hit.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(0x0c1a26, 0.96);
      bg.fillRoundedRect(0, 0, W, H, 9);
      bg.lineStyle(1.5, 0x00f5ff, 0.9);
      bg.strokeRoundedRect(0, 0, W, H, 9);
      sfx.hover();
    });
    hit.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(0x081016, 0.94);
      bg.fillRoundedRect(0, 0, W, H, 9);
      bg.lineStyle(1, 0x00f5ff, 0.55);
      bg.strokeRoundedRect(0, 0, W, H, 9);
    });
    hit.on("pointerdown", () => {
      if (used) return;
      used = true;
      sfx.click();
      scene.tweens.add({ targets: layer, alpha: 0, duration: 200, onComplete: () => layer?.destroy() });
      opts.onAssist();
    });
  });

  return {
    destroy: () => {
      used = true;
      timer.remove();
      layer?.destroy();
    },
  };
}
