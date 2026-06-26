import Phaser from "phaser";
import { sfx } from "./sfx";
import { loc, tt } from "../game/lang";
import { eggsForScene, isCollected, collectEgg, sceneAllCollected, allCollected, type Egg } from "../game/eggs";
import { reducedMotion } from "./motion";

// 在場景中對準背景真實物件,放「隱藏彩蛋點」。
// 較不明顯:平時只是極淡的微光在呼吸,滑鼠移上去才亮起。
// 點到 → 物件圖示跳出來 + 飛向手機 + 收進收藏。
// ⛔ 純探索收集,不計分、不洩維度。VN 對話顯示時不攔截(讓點擊去推進對話)。
export function installEggSpots(scene: Phaser.Scene, sceneKey: string, depth = 6): void {
  const eggs = eggsForScene(sceneKey);
  if (!eggs.length) return;

  eggs.forEach((egg) => {
    // 已收藏:只留一個極淡的小金點表示「這裡有過」,不搶眼。
    if (isCollected(egg.id)) {
      scene.add.circle(egg.x, egg.y, 3, 0xffd166, 0.2).setDepth(depth).setBlendMode(Phaser.BlendModes.ADD);
      return;
    }

    // 未收藏:微弱的暖色微光 —— 看得到、但刻意比白色主線任務點低調(更暗、脈動更慢),
    // 要稍微留意才會發現(有點找的難度);滑鼠掃過去 hover 才明確亮起。
    const halo = scene.add.circle(egg.x, egg.y, 10, 0xffd166, 0.16).setDepth(depth).setBlendMode(Phaser.BlendModes.ADD);
    const core = scene.add.circle(egg.x, egg.y, 3.5, 0xffd9a0, 0.5).setDepth(depth).setBlendMode(Phaser.BlendModes.ADD);
    if (reducedMotion()) {
      // 減少動態:不脈動,靜態微光(仍看得到、hover 才亮)。
      halo.setAlpha(0.22);
      core.setAlpha(0.55);
    } else {
      const r = Math.random() * 700;
      scene.tweens.add({ targets: halo, alpha: { from: 0.1, to: 0.3 }, scale: { from: 0.85, to: 1.2 }, duration: 1900 + r, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      scene.tweens.add({ targets: core, alpha: { from: 0.38, to: 0.62 }, duration: 1700 + r, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }

    const zone = scene.add
      .rectangle(egg.x, egg.y, 46, 46, 0xffffff, 0)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true });

    zone.on("pointerover", () => { halo.setAlpha(0.7); core.setAlpha(0.95); core.setScale(1.3); });
    zone.on("pointerout", () => { halo.setAlpha(0.22); core.setAlpha(0.55); core.setScale(1); });
    zone.on("pointerdown", () => {
      // VN 對話進行中:不攔截,交給對話系統推進文字。
      if (!document.getElementById("dialogue")?.classList.contains("hidden")) return;
      if (isCollected(egg.id)) {
        popText(scene, egg.x, egg.y - 30, `${egg.icon} ${loc(egg.name)} · ${tt("已收藏", "collected")}`);
        return;
      }
      collectEgg(egg.id);
      sfx.solve();
      zone.disableInteractive();
      scene.tweens.add({ targets: [halo, core], alpha: 0, duration: 220 });
      pop(scene, egg);
      pulsePhoneButton();
      // 收集完成回饋:收滿本艙 / 收齊全部 → 慶祝字幕(延後播,接在跳出動畫之後)
      if (allCollected()) {
        scene.time.delayedCall(700, () => popText(scene, 480, 250, tt("✦✦ 全艙收藏已收齊 18/18 ✦✦", "✦✦ All 18 finds collected ✦✦")));
      } else if (sceneAllCollected(sceneKey)) {
        scene.time.delayedCall(700, () => popText(scene, 480, 250, tt("✦ 本艙收藏已全部找到", "✦ Every find in this bay collected")));
      }
    });
  });
}

/** 物件圖示跳出 → 飛向右下角手機 → 淡出收進收藏。 */
function pop(scene: Phaser.Scene, egg: Egg): void {
  const ring = scene.add.circle(egg.x, egg.y, 8, 0x000000, 0).setStrokeStyle(2, 0xffd166, 0.9).setDepth(79);
  scene.tweens.add({ targets: ring, radius: 40, alpha: 0, duration: 480, ease: "Cubic.easeOut", onComplete: () => ring.destroy() });

  const icon = scene.add.text(egg.x, egg.y, egg.icon, { fontSize: "34px" }).setOrigin(0.5).setDepth(80);
  scene.tweens.add({
    targets: icon,
    scale: { from: 0.4, to: 1.5 },
    duration: 260,
    ease: "Back.easeOut",
    onComplete: () => {
      scene.tweens.add({
        targets: icon,
        x: 905,
        y: 512, // 右下角手機鈕方向
        scale: 0.25,
        alpha: 0.15,
        duration: 540,
        ease: "Cubic.easeIn",
        onComplete: () => icon.destroy(),
      });
    },
  });

  popText(scene, egg.x, egg.y - 46, `✦ ${tt("收藏", "Found")}:${loc(egg.name)}`);
}

function popText(scene: Phaser.Scene, x: number, y: number, text: string): void {
  const t = scene.add
    .text(x, y, text, {
      fontFamily: "sans-serif",
      fontSize: "12px",
      color: "#fff3c4",
      backgroundColor: "rgba(4, 10, 14, 0.85)",
      padding: { x: 9, y: 6 },
      align: "center",
      wordWrap: { width: 220 },
    })
    .setOrigin(0.5)
    .setDepth(82);
  scene.tweens.add({ targets: t, y: y - 24, alpha: 0, duration: 1600, ease: "Cubic.easeOut", onComplete: () => t.destroy() });
}

/** 手機鈕輕跳一下,提示「有東西進收藏了」。 */
function pulsePhoneButton(): void {
  const btn = document.getElementById("phone-toggle");
  if (!btn || typeof btn.animate !== "function") return;
  btn.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.18)" }, { transform: "scale(1)" }],
    { duration: 420, easing: "ease-out" },
  );
}
