import Phaser from "phaser";
import { say, hideDialogue } from "../ui/dialogue";
import { sfx } from "../ui/sfx";
import { playMusic } from "../ui/music";
import { flow } from "../game/flow";
import { fadeToScene } from "../ui/transition";

export class AwakeningScene extends Phaser.Scene {
  constructor() {
    super("awakening");
  }

  create() {
    this.add.rectangle(480, 270, 960, 540, 0x000000);
    playMusic(this, "bgm_alarm_pressure", 0.24);
    document.getElementById("hud")?.classList.remove("hidden");
    this.run();
  }

  private async run() {
    // 開場(甦醒 + 背景說明)已移到 PrologueScene。這裡是「選完裝備後」的橋段:
    // OTIS 認可你挑的工具 → 警報 → 帶你出發。
    await say(
      "奧提斯",
      {
        zh: "好選擇。要把他們喚回來,你得先替他們完成卡住的工作 ── 你帶著的那件" + flow.equipment + ",會派上用場。",
        en: "Good choice. To bring them back, you need to finish the work they left suspended ── that " + flow.equipment + " you carry will be useful.",
      },
      "otis",
    );

    // 警報
    sfx.alarm();
    this.cameras.main.shake(260, 0.004);
    const red = this.add.rectangle(480, 270, 960, 540, 0xe63946, 0.18);
    this.tweens.add({ targets: red, alpha: 0, duration: 380, yoyo: true, repeat: 3 });
    await say("奧提斯", { zh: "六個艙區,六位沉睡的專員。從哪裡開始,由你決定。", en: "Six bays, six sleeping specialists. Where you begin is your call." }, "otis");
    await say("奧提斯", { zh: "我會在每一個艙區看著你。……當然,是為了你的安全。", en: "I'll be watching you in every bay. ...For your safety, of course." }, "otis");

    hideDialogue();
    fadeToScene(this, "hub");
  }
}
