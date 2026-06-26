import Phaser from "phaser";
import { say, systemCard, hideDialogue, wait } from "../ui/dialogue";
import { sfx } from "../ui/sfx";
import { playMusic } from "../ui/music";
import { fitCover } from "./TitleScene";
import { installAmbientDrift, installPointerParallax, installRoomAmbience } from "../ui/ambient";
import { fadeToScene } from "../ui/transition";

// 開場冷開場(純劇情):星火號事故 + C-742 在低溫艙甦醒,把背景說明排在「選裝備之前」。
// 看過一次後重玩自動略過;播放中可隨時按右下「跳過」。
// ⛔ 純敘事,絕不出現任何 RIASEC 數值/維度。
const INTRO_SEEN = "meridian.introSeen.v1";

export class PrologueScene extends Phaser.Scene {
  private done = false;
  private skipBtn?: HTMLElement;

  constructor() {
    super("prologue");
  }

  create() {
    this.done = false;

    // 重玩自動略過:看過一次就直接進選裝備,不再播開場。
    if (localStorage.getItem(INTRO_SEEN)) {
      this.scene.start("equip");
      return;
    }

    // 冷開場從全黑起;甦醒掃描後才淡入太空背景。
    this.cameras.main.setBackgroundColor("#02040a");
    const bg = this.add.image(480, 270, "title").setAlpha(0);
    fitCover(bg, 960, 540);
    this.add.rectangle(480, 270, 960, 540, 0x02040a, 0.55); // 壓暗,保持沉浸冷調
    installAmbientDrift(this, { color: 0x7fb6c9, count: 14, depth: 4, alphaScale: 1.15, sizeScale: 1.08 });
    installRoomAmbience(this, "title", 4);
    installPointerParallax(this, bg, { strength: 6, duration: 560 });

    playMusic(this, "bgm_title_drift", 0.2);
    this.showSkip();
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => this.hideSkip());

    this.run(bg);
  }

  private async run(bg: Phaser.GameObjects.Image) {
    // 1) 系統重啟 — 黑底字卡
    await systemCard(
      [
        { zh: "星火號 ── 任務時間:第 21 日。", en: "MERIDIAN ── Mission time: Day 21." },
        { zh: "系統重啟……偵測到意識活動。", en: "System reboot... consciousness activity detected." },
        { zh: "神經復甦程序:3、2、1。", en: "Neural revival sequence: 3, 2, 1." },
      ],
      650,
    );
    if (this.done) return;

    // 2) 藍光掃過 — 甦醒;同時淡入太空背景
    sfx.cryoWake();
    const scan = this.add.rectangle(0, 270, 30, 540, 0x00f5ff, 0.35);
    this.tweens.add({ targets: scan, x: 990, duration: 900, onComplete: () => scan.destroy() });
    this.tweens.add({ targets: bg, alpha: 1, duration: 1400, ease: "sine.out" });
    this.cameras.main.flash(220, 120, 220, 255);
    await wait(1100);
    if (this.done) return;

    // 3) OTIS 的第一句話 + 背景說明(由 Awakening 前移到這裡)
    await say("奧提斯", { zh: "C-742,早安。我是奧提斯,星火號核心中樞系統。歡迎回來。", en: "Good morning, C-742. I am OTIS, the Meridian's central core system. Welcome back." }, "otis");
    if (this.done) return;
    await say("你", { zh: "(頭很重……除了「C-742」這個編號,我什麼都想不起來。)", en: "(My head is heavy... apart from the designation \"C-742,\" I can't remember anything.)" }, "self");
    if (this.done) return;
    await say("奧提斯", { zh: "請先保持冷靜。神經震盪造成的記憶抑制,屬於預期副作用。", en: "Stay calm for now. Memory suppression from the neural shock is an expected side effect." }, "otis");
    if (this.done) return;
    await say(
      "奧提斯",
      { zh: "三週前,星火號穿越歐特雲時遭遇未知引力偏轉。六位艙區專員感知失聯,現在沉睡在各自崗位上。", en: "Three weeks ago, while crossing the Oort cloud, the Meridian met an unknown gravitational deflection. Six bay specialists lost sensory contact and now sleep at their stations." },
      "otis",
    );
    if (this.done) return;
    await say("奧提斯", { zh: "維生資源剩餘 16.6%。倒數 168 小時。要把他們喚回來,得靠你。", en: "Life-support reserves at 16.6%. Countdown: 168 hours. Bringing them back is up to you." }, "otis");
    if (this.done) return;

    // 4) 帶往裝備櫃 — 自然銜接到選裝備場景
    await say("奧提斯", { zh: "出發前,低溫艙旁的裝備櫃會配發你一件核心裝備。去挑一件吧。", en: "Before you set out, the locker beside the cryo bay will issue you one core tool. Go pick one." }, "otis");
    if (this.done) return;

    this.finish();
  }

  /** 收尾:標記已看過 → 收掉 UI → 淡出 → 進選裝備。自然結束與跳過都匯流到這裡(只跑一次)。 */
  private finish() {
    if (this.done) return;
    this.done = true;
    localStorage.setItem(INTRO_SEEN, "1");
    this.hideSkip();
    hideDialogue();
    document.getElementById("syscard")?.classList.add("hidden");
    fadeToScene(this, "equip");
  }

  private showSkip() {
    let btn = document.getElementById("skip-intro");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "skip-intro";
      document.getElementById("app")?.appendChild(btn);
    }
    btn.textContent = "跳過 ▸";
    btn.classList.remove("hidden");
    btn.onclick = (e) => {
      e.stopPropagation();
      sfx.click();
      this.finish();
    };
    this.skipBtn = btn;
  }

  private hideSkip() {
    if (this.skipBtn) {
      this.skipBtn.onclick = null;
      this.skipBtn.classList.add("hidden");
    }
  }
}
