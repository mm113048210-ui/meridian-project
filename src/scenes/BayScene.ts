import Phaser from "phaser";
import { say, choose, playLines, hideDialogue, wait } from "../ui/dialogue";
import { hidePortrait } from "../ui/portrait";
import { riasec } from "../game/riasec";
import { flow, addRepair } from "../game/flow";
import { sfx } from "../ui/sfx";
import { fitCover } from "./TitleScene";
import { BAYS, type Bay } from "../game/script";

// 通用艙區場景:吃劇本資料,跑「3 節點 → 共振 → 喚醒 → 記憶碎片」
export class BayScene extends Phaser.Scene {
  private bay!: Bay;
  private enteredAt = 0;

  constructor() {
    super("bay");
  }

  create(data: { bayKey: string }) {
    this.bay = BAYS.find((b) => b.key === data.bayKey)!;
    this.enteredAt = this.time.now;
    document.getElementById("save-button")?.classList.add("hidden");
    riasec.log("bay_enter", { bay: this.bay.key });
    this.cameras.main.fadeIn(500, 0, 0, 0);
    const bg = this.add.image(480, 270, this.bay.bg);
    fitCover(bg, 960, 540);
    this.add.rectangle(480, 270, 960, 540, 0x05080c, 0.3);
    this.run();
  }

  private async run() {
    const bay = this.bay;
    // 進場警示(動力艙為教學關,額外震動)
    if (bay.key === "powerbay") {
      sfx.alarm();
      this.cameras.main.shake(220, 0.003);
    }

    for (const node of bay.nodes) {
      await playLines(node.intro);
      const idx = await choose(node.choices.map((c) => ({ label: c.label })));
      // ⛔ 唯一計分點:選擇=偏好。小遊戲表現不計分。
      riasec.addChoice(node.choices[idx].weights, node.id);
      // R-1 的選法決定拼管小遊戲變體(動手/手冊提示/無人機協助)
      if (node.id === "R-1") flow.pipeVariant = (["hands", "manual", "assist"] as const)[idx];
      await playLines(node.choices[idx].reaction);
      hideDialogue();
      if (node.minigame) await this.runMinigame(node.minigame);
      addRepair(5);
    }

    // 喚醒
    this.cameras.main.flash(300, 53, 224, 200);
    sfx.solve();
    await playLines(bay.awaken);
    const woke = flow.completedBays.length + 1;
    await say("奧提斯", { zh: `專員喚醒進度:${woke} / 6。`, en: `Crew revival progress: ${woke} / 6.` }, "otis");

    // 主觀共振(偽裝成校準提問 — 偏好訊號)
    await say("奧提斯", { zh: "校準提問:本艙區的作業,您的神經迴路反應如何?", en: "Calibration query: how did your neural circuits respond to this bay's work?" }, "otis");
    const liked = await choose([
      { label: { zh: "出乎意料地順手。", en: "Unexpectedly natural." } },
      { label: { zh: "只是不得不做而已。", en: "Just something I had to get through." } },
    ]);
    riasec.addResonance(bay.dim, liked === 0, bay.key);
    await say(
      "奧提斯",
      liked === 0
        ? { zh: "已記錄。您的共振曲線……很漂亮。", en: "Recorded. Your resonance curve... is beautiful." }
        : { zh: "已記錄。感謝您的誠實。", en: "Recorded. Thank you for your honesty." },
      "otis",
    );

    // 記憶碎片(身分拼圖 + 奧提斯伏筆)
    await playLines(bay.shard);

    flow.completedBays.push(bay.key);
    // 停留時間遙測(日常活動:停留與互動記錄,不計分)
    riasec.log("bay_complete", { bay: bay.key, ms: Math.round(this.time.now - this.enteredAt) });
    addRepair(3);
    hideDialogue();
    hidePortrait();
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("hub"));
  }

  private runMinigame(key: string): Promise<void> {
    return new Promise((resolve) => {
      document.getElementById("hud")?.classList.add("hidden");
      document.getElementById("save-button")?.classList.add("hidden");
      this.events.once(Phaser.Scenes.Events.RESUME, () => {
        document.getElementById("hud")?.classList.remove("hidden");
        this.cameras.main.fadeIn(300, 0, 0, 0);
        resolve();
      });
      this.scene.launch(key, { from: "bay" });
      this.scene.pause();
    });
  }
}
