import Phaser from "phaser";
import { say, choose, hideDialogue, systemCard } from "../ui/dialogue";
import { hidePortrait, setPortrait } from "../ui/portrait";
import { riasec, type Dim } from "../game/riasec";
import { addRepair, setStage } from "../game/flow";
import { fitCover } from "./TitleScene";
import { tt } from "../game/lang";

// 2.2 四大能力測評模組(Core Missions)
// 流程:模組簡報 → 小遊戲 → 產出物 → 主觀回饋(有趣/無聊 → 偏好加成)
// ⛔ 表現不計分;「有趣」才 +5 對應維度(偏好,非能力)。
interface ModuleDef {
  key: string;
  scene: string;
  title: { zh: string; en: string };
  brief: { zh: string; en: string };
  deliverable: { zh: string; en: string };
  dims: Dim[];
}

const MODULES: ModuleDef[] = [
  {
    key: "M1",
    scene: "decode",
    title: { zh: "通訊解碼", en: "Signal Decoding" },
    brief: { zh: "深空通訊陣列收到一段殘缺訊號。修復語義,完成航行日誌的最後一頁。", en: "The deep-space array received a fragmented signal. Restore its meaning and complete the last page of the voyage log." },
    deliverable: { zh: "航行日誌・補完", en: "Voyage Log - Restored" },
    dims: ["I", "A"],
  },
  {
    key: "M2",
    scene: "pipepuzzle",
    title: { zh: "結構修復", en: "Structural Repair" },
    brief: { zh: "登陸艇的冷卻迴路在震盪中斷裂。按圖紙接通管線,取得結構安全認證。", en: "The lander's cooling loop broke during the shock. Reconnect the pipes and secure structural certification." },
    deliverable: { zh: "登陸艇圖紙・認證", en: "Lander Blueprint - Certified" },
    dims: ["R", "I"],
  },
  {
    key: "M3",
    scene: "powergrid",
    title: { zh: "資源拓荒", en: "Resource Allocation" },
    brief: { zh: "降落前最後一次資源盤點。分配六艙電力,產出平衡報表。", en: "Run the final resource audit before landing. Allocate power across six bays and file a balanced report." },
    deliverable: { zh: "資源報表・歸檔", en: "Resource Report - Filed" },
    dims: ["C", "E"],
  },
  {
    key: "M4",
    scene: "sortpuzzle",
    title: { zh: "數據風暴", en: "Cargo Data Storm" },
    brief: { zh: "穿越電離層時貨艙清單全數打散。在亂流中重建分類,寫下危機日誌。", en: "The cargo manifest scattered during ionosphere entry. Rebuild the categories and seal the crisis log." },
    deliverable: { zh: "危機日誌・封存", en: "Crisis Log - Sealed" },
    dims: ["C", "R"],
  },
];

export class ModulesScene extends Phaser.Scene {
  constructor() {
    super("modules");
  }

  create() {
    document.getElementById("hud")?.classList.remove("hidden");
    document.getElementById("save-button")?.classList.add("hidden");
    setStage("modules");
    this.cameras.main.fadeIn(500, 0, 0, 0);
    const bg = this.add.image(480, 270, "command");
    fitCover(bg, 960, 540);
    this.add.rectangle(480, 270, 960, 540, 0x05080c, 0.55);
    this.run();
  }

  private async run() {
    await systemCard([{ zh: "接近 Kepler-452。", en: "Approaching Kepler-452." }, { zh: "進入最終航段:艦船認證程序。", en: "Entering final phase: ship certification." }], 850);
    setPortrait("otis");
    await say("奧提斯", { zh: "六位專員已就位。但降落授權需要「程序官親自完成」四項艙船認證作業。", en: "All six specialists are in place. But landing clearance requires the Procedural Officer to personally complete four ship certifications." }, "otis");
    await say("奧提斯", { zh: "這是規定,程序官。……同時,也是我最後的觀測窗口。", en: "It's regulation, Procedural Officer. ...And also my last window of observation." }, "otis");
    hideDialogue();
    hidePortrait();

    for (const mod of MODULES) {
      await systemCard([
        { zh: `認證作業 ${mod.key}:${mod.title.zh}`, en: `Certification ${mod.key}: ${mod.title.en}` },
        mod.brief,
      ], 800);
      riasec.log("module_start", { id: mod.key });
      await this.runMinigame(mod.scene);

      // 產出物
      await say("奧提斯", { zh: `產出物已登錄:【${mod.deliverable.zh}】`, en: `Deliverable registered: ${mod.deliverable.en}` }, "otis");

      // 主觀回饋:有趣/無聊(L3 偏好訊號)
      await say("奧提斯", { zh: "回饋採樣:這項作業,對您而言是——", en: "Feedback sample: this task, to you, was —" }, "otis");
      const fb = await choose([{ label: { zh: "比想像中有趣。", en: "More interesting than expected." } }, { label: { zh: "無聊,純粹是義務。", en: "Boring. Pure obligation." } }]);
      if (fb === 0) {
        mod.dims.forEach((d) => riasec.addResonance(d, true, mod.key));
        await say("奧提斯", { zh: "「有趣」……已記錄。這個詞在我的資料庫裡,權重很高。", en: "\"Interesting\"... recorded. That word carries a lot of weight in my database." }, "otis");
      } else {
        riasec.log("module_boring", { id: mod.key });
        await say("奧提斯", { zh: "已記錄。義務也是一種重量,謝謝您誠實。", en: "Recorded. Obligation is a kind of weight too. Thank you for your honesty." }, "otis");
      }
      hideDialogue();
      addRepair(4);
    }

    setPortrait("otis");
    await say("奧提斯", { zh: "四項認證,全數完成。降落授權……批准。", en: "All four certifications complete. Landing clearance... approved." }, "otis");
    await say("奧提斯", { zh: "在入睡之前——最後一站,程序官。休眠艙在等你。", en: "Before you sleep — one last stop, Procedural Officer. The cryo bay is waiting." }, "otis");
    hideDialogue();
    hidePortrait();
    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("ranking"));
  }

  private runMinigame(key: string): Promise<void> {
    return new Promise((resolve) => {
      document.getElementById("hud")?.classList.add("hidden");
      this.events.once(Phaser.Scenes.Events.RESUME, () => {
        document.getElementById("hud")?.classList.remove("hidden");
        this.cameras.main.fadeIn(300, 0, 0, 0);
        resolve();
      });
      this.scene.launch(key, { from: "modules" });
      this.scene.pause();
    });
  }
}
