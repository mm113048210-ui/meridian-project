import Phaser from "phaser";
import { playMusic } from "../ui/music";
import { openPhone } from "../ui/phone";
import { fitCover } from "./TitleScene";
import { tt } from "../game/lang";
import { sfx } from "../ui/sfx";
import { installAmbientDrift, installPointerParallax, installRoomAmbience, installVignette } from "../ui/ambient";
import { DISPLAY } from "../ui/fonts";

// 回訪者的家:玩完劇情後不必重跑,直接落在這裡 —— 手機自動開到「星圖」,
// 可看雷達疊圖、快速重測、查生涯推薦與行動計畫。
export class HomeScene extends Phaser.Scene {
  constructor() {
    super("home");
  }

  create() {
    document.getElementById("hud")?.classList.add("hidden");
    document.getElementById("save-button")?.classList.add("hidden");
    playMusic(this, "bgm_title_drift", 0.2);
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.add.rectangle(480, 270, 960, 540, 0x05080c);
    const bg = this.add.image(480, 270, "title").setAlpha(0);
    fitCover(bg, 960, 540);
    this.tweens.add({ targets: bg, alpha: 0.4, duration: 1400 });
    this.add.rectangle(480, 270, 960, 540, 0x05080c, 0.4);
    installVignette(this, { depth: 3 });
    installAmbientDrift(this, { color: 0x4ec5d8, count: 18, depth: 4, alphaScale: 1.25, sizeScale: 1.12 });
    installRoomAmbience(this, "title", 5);
    installPointerParallax(this, bg, { strength: 7, duration: 520 });

    this.add
      .text(480, 220, tt("我的星圖", "My Star Map"), {
        fontFamily: DISPLAY,
        fontSize: "30px",
        color: "#eaf6ff",
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setData("fade", 1);
    this.add
      .text(480, 262, tt("程序官 C-742 · 生涯探索", "Officer C-742 · Career Explorer"), {
        fontFamily: "sans-serif",
        fontSize: "14px",
        color: "#7fb6c9",
      })
      .setOrigin(0.5);

    // 開啟手機到星圖頁的提示按鈕(手機已自動開,這顆是重新喚出用)
    const btn = this.add
      .text(480, 330, tt("▣ 開啟手機 · 星圖", "▣ Open Phone · Star Map"), {
        fontFamily: "sans-serif",
        fontSize: "15px",
        color: "#04121c",
        backgroundColor: "#00f5ff",
        padding: { x: 16, y: 9 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn.on("pointerover", () => btn.setScale(1.05));
    btn.on("pointerout", () => btn.setScale(1));
    btn.on("pointerdown", () => {
      sfx.click();
      openPhone("dashboard", true);
    });

    // 進場自動開手機到星圖
    this.time.delayedCall(650, () => openPhone("dashboard", true));
  }
}
