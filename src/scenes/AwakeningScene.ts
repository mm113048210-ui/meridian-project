import Phaser from "phaser";
import { say, systemCard, hideDialogue, wait } from "../ui/dialogue";
import { sfx } from "../ui/sfx";
import { flow } from "../game/flow";

export class AwakeningScene extends Phaser.Scene {
  constructor() {
    super("awakening");
  }

  create() {
    this.add.rectangle(480, 270, 960, 540, 0x000000);
    document.getElementById("hud")?.classList.remove("hidden");
    this.run();
  }

  private async run() {
    await systemCard(
      [
        { zh: "系統重啟……檢測到意識活動。", en: "System reboot... consciousness activity detected." },
        { zh: "神經突觸復甦程序:3、2、1。", en: "Synaptic revival sequence: 3, 2, 1." },
      ],
      700,
    );

    // 藍光掃過 — 醒來
    const scan = this.add.rectangle(0, 270, 30, 540, 0x00f5ff, 0.35);
    this.tweens.add({ targets: scan, x: 990, duration: 900, onComplete: () => scan.destroy() });
    await wait(1000);

    await say("奧提斯", { zh: "程序官 C-742,早安。我是奧提斯,星火號核心中樞系統。歡迎回來。", en: "Good morning, Procedural Officer C-742. I am OTIS, the Meridian's central core system. Welcome back." }, "otis");
    await say("你", { zh: "(頭很重……除了「C-742」這個編號,我什麼都想不起來。)", en: "(My head is heavy... apart from the designation \"C-742,\" I can't recall a thing.)" }, "self");
    await say("奧提斯", { zh: "請保持冷靜。神經震盪造成的記憶抑制,屬於預期內的副作用。", en: "Please stay calm. The memory suppression from the neural shock is an expected side effect." }, "otis");
    await say(
      "奧提斯",
      { zh: "三週前,星火號穿越歐特雲時遭遇未知引力偏轉。六位艙區專員陷入感知失聯,沉睡在各自的崗位上。", en: "Three weeks ago, while crossing the Oort cloud, the Meridian met an unknown gravitational deflection. Six bay specialists lost sensory contact and now sleep at their stations." },
      "otis",
    );
    await say("奧提斯", { zh: "維生資源剩餘 16.6%。倒數 168 小時。", en: "Life-support reserves at 16.6%. Countdown: 168 hours." }, "otis");
    await say(
      "奧提斯",
      {
        zh: "唯有替他們完成未竟的工作,才能將他們一一喚回。你帶著的那件" + flow.equipment + ",會派上用場的。",
        en: "Only by finishing their unfinished work can you call them back, one by one. That " + flow.equipment + " you carry will prove useful.",
      },
      "otis",
    );

    // 警報
    sfx.alarm();
    this.cameras.main.shake(260, 0.004);
    const red = this.add.rectangle(480, 270, 960, 540, 0xe63946, 0.18);
    this.tweens.add({ targets: red, alpha: 0, duration: 380, yoyo: true, repeat: 3 });
    await say("奧提斯", { zh: "六個艙區,六位沉睡的專員。從哪裡開始——由你決定,程序官。", en: "Six bays, six sleeping specialists. Where you begin — that's your call, Procedural Officer." }, "otis");
    await say("奧提斯", { zh: "我會在每一個艙區,看著你。……為了你的安全,當然。", en: "I'll be watching you in every bay. ...For your safety, of course." }, "otis");

    hideDialogue();
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("hub"));
  }
}
