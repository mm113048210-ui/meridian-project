import Phaser from "phaser";
import { say, choose, hideDialogue, systemCard } from "../ui/dialogue";
import { hidePortrait, setPortrait } from "../ui/portrait";
import { riasec, type Dim } from "../game/riasec";
import { addRepair, setStage } from "../game/flow";
import { fitCover } from "./TitleScene";
import { playMusic } from "../ui/music";
import { tt } from "../game/lang";
import { installAmbientDrift, installPointerParallax, installRoomAmbience, installVignette } from "../ui/ambient";
import { fadeToScene } from "../ui/transition";

// 2.2 最終能力測評模組(Core Missions)
// 流程:模組簡報 → 小遊戲 → 產出物 → 主觀回饋(有趣/無聊 → 偏好加成)
// ⛔ 表現不計分;「有趣」才 +5 對應維度(偏好,非能力)。
export interface ModuleDef {
  key: string;
  scene: string;
  title: { zh: string; en: string };
  brief: { zh: string; en: string };
  deliverable: { zh: string; en: string };
  dims: Dim[];
}

export const MODULES: ModuleDef[] = [
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
  // 註:資源分配(powergrid)已下放至指揮中心 E-3、貨艙分類(sortpuzzle)已下放至
  //     資料艙 C-3。此處只留 M1/M2 作為降落前的「總驗收認證」,避免機制重複。
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
    playMusic(this, "bgm_certification_focus", 0.24);
    const bg = this.add.image(480, 270, "command");
    fitCover(bg, 960, 540);
    this.add.rectangle(480, 270, 960, 540, 0x05080c, 0.55);
    installVignette(this, { depth: 3 });
    installAmbientDrift(this, { color: 0x4ec5d8, count: 18, depth: 4, alphaScale: 1.3, sizeScale: 1.12 });
    installRoomAmbience(this, "command", 5);
    installPointerParallax(this, bg, { strength: 7, duration: 500 });
    this.run();
  }

  private async run() {
    await systemCard([{ zh: "接近 Kepler-452。", en: "Approaching Kepler-452." }, { zh: "進入最終航段:艦船認證。", en: "Entering final phase: ship certification." }], 850);
    setPortrait("otis");
    await say("奧提斯", { zh: "六位專員已就位。但降落授權還需要你親自完成兩項艙船認證。", en: "All six specialists are in place. But landing clearance still requires you to complete two ship certifications yourself." }, "otis");
    await say("奧提斯", { zh: "這是規定。……也是我最後一次觀測你的機會。", en: "It's regulation. ...And my last chance to observe you." }, "otis");
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
      await say("奧提斯", { zh: `已登錄產出物:【${mod.deliverable.zh}】`, en: `Deliverable registered: ${mod.deliverable.en}` }, "otis");

      // 主觀回饋:有趣/無聊(L3 偏好訊號)
      await say("奧提斯", { zh: "再確認一次。這項作業對你來說是——", en: "One more check. To you, this task was —" }, "otis");
      const fb = await choose([{ label: { zh: "比想像中有趣。", en: "More interesting than expected." } }, { label: { zh: "無聊,純粹是義務。", en: "Boring. Pure obligation." } }]);
      if (fb === 0) {
        mod.dims.forEach((d) => riasec.addResonance(d, true, mod.key));
        await say("奧提斯", { zh: "「有趣」……已記錄。這個回答很有參考價值。", en: "\"Interesting\"... recorded. That answer is valuable." }, "otis");
      } else {
        riasec.log("module_boring", { id: mod.key });
        await say("奧提斯", { zh: "已記錄。義務也有重量。謝謝你的誠實。", en: "Recorded. Obligation has weight too. Thank you for your honesty." }, "otis");
      }
      hideDialogue();
      addRepair(4);
    }

    setPortrait("otis");
    await say("奧提斯", { zh: "兩項認證全部完成。降落授權……批准。", en: "Both certifications complete. Landing clearance... approved." }, "otis");
    await say("奧提斯", { zh: "入睡之前,還有最後一站。休眠艙在等你。", en: "Before you sleep, one last stop. The cryo bay is waiting." }, "otis");
    hideDialogue();
    hidePortrait();
    fadeToScene(this, "ranking", { duration: 700 });
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
