import Phaser from "phaser";
import { reducedMotion } from "./motion";

// ── 場景轉場(統一語彙)──────────────────────────────────────────
// 把散落各場景的「fadeOut → camerafadeoutcomplete → scene.start」收斂成一個一致的
// 轉場。預設帶一抹極淡的青色尾韻(科幻感)+ 收尾時短暫內縮的暗角脈衝,讓切換像
// 「被有意設計」而非單調黑屏。⚠️ 不碰相機 zoom(HiDPI 用 zoom=SS,動它會打架)。
// 鐵則:純視覺,不影響流程/計分。Hub→艙的招牌縮放轉場保留,不被此取代。

export interface TransitionOpts {
  duration?: number;
  /** 淡出色(r,g,b);預設深青黑。 */
  color?: [number, number, number];
  data?: object;
}

export function fadeToScene(
  scene: Phaser.Scene,
  key: string,
  opts: TransitionOpts = {},
): void {
  const reduced = reducedMotion();
  const { duration = reduced ? 240 : 600, color = [5, 10, 16], data } = opts;
  const cam = scene.cameras.main;

  // 收尾脈衝:一圈快速內縮的暗環,給轉場一點「快門」收束感(壓在最上層,短命)。
  // 減少動態時略過,只做純淡出。
  if (!reduced) {
    const ring = scene.add
      .circle(480, 270, 560, 0x05080c, 0)
      .setStrokeStyle(2, 0x00f5ff, 0.18)
      .setDepth(999);
    scene.tweens.add({
      targets: ring,
      radius: 120,
      alpha: { from: 0.5, to: 0 },
      duration: Math.min(420, duration),
      ease: "Cubic.easeIn",
      onComplete: () => ring.destroy(),
    });
  }

  cam.fadeOut(duration, color[0], color[1], color[2]);
  cam.once("camerafadeoutcomplete", () => scene.scene.start(key, data));
}
