import Phaser from "phaser";
import { say, playLines, hideDialogue } from "../ui/dialogue";
import { hidePortrait } from "../ui/portrait";
import { flow, currentDay, syncHud, setStage, saveFlow } from "../game/flow";
import { sfx } from "../ui/sfx";
import { fitCover } from "./TitleScene";
import { BAYS } from "../game/script";
import { loc, speakerName, tt } from "../game/lang";
import type { Line } from "../game/script";

// 艦橋 HUB:選擇下一個要支援的艙區(自由順序)
export class HubScene extends Phaser.Scene {
  private leaving = false;

  constructor() {
    super("hub");
  }

  create() {
    this.leaving = false;
    this.cameras.main.fadeIn(500, 0, 0, 0);
    const bg = this.add.image(480, 270, "title");
    fitCover(bg, 960, 540);
    this.add.rectangle(480, 270, 960, 540, 0x05080c, 0.62);
    // Hub 是唯一一般存檔點:已完成一段劇情,尚未進入下一個測評選擇。
    document.getElementById("hud")?.classList.remove("hidden");
    document.getElementById("save-button")?.classList.remove("hidden");
    setStage("hub");
    this.bindSaveButton();
    syncHud();
    this.run();
  }

  private bindSaveButton() {
    const btn = document.getElementById("save-button");
    if (!btn) return;
    btn.onclick = (event) => {
      event.stopPropagation();
      const ok = saveFlow("hub");
      btn.textContent = ok ? tt("已存檔", "Saved") : tt("存檔失敗", "Save failed");
      window.setTimeout(() => {
        btn.textContent = tt("存檔", "Save");
      }, 1200);
    };
  }

  private async run() {
    const done = flow.completedBays;

    if (done.length >= 6) {
      this.finale();
      return;
    }

    // 中點轉折(完成 3 艙後,一次性事件)
    if (done.length === 3 && !flow.midpointPlayed) {
      flow.midpointPlayed = true;
      await this.midpoint();
    }

    await say(
      "奧提斯",
      {
        zh: `第 ${currentDay()} 日。尚有 ${6 - done.length} 位專員等待喚醒。請選擇前往的艙區,程序官。`,
        en: `Day ${currentDay()}. ${6 - done.length} specialists remain in stasis. Choose the next bay, Officer.`,
      },
      "otis",
    );
    hideDialogue();
    this.drawDoors();
  }

  private drawDoors() {
    this.add
      .text(480, 64, tt("── 星火號 艙區導引 ──", "── MERIDIAN · Bay Directory ──"), {
        fontFamily: "sans-serif",
        fontSize: "20px",
        color: "#cfe9f5",
      })
      .setOrigin(0.5);

    BAYS.forEach((bay, i) => {
      const x = 230 + (i % 3) * 250;
      const y = 190 + Math.floor(i / 3) * 200;
      const isDone = flow.completedBays.includes(bay.key);

      const card = this.add.container(x, y);
      const frame = this.add
        .rectangle(0, 0, 220, 160, isDone ? 0x0a141d : 0x13283a)
        .setStrokeStyle(2, isDone ? 0x1c3242 : 0x2e4a5e);
      const thumb = this.add.image(0, -22, bay.bg).setDisplaySize(204, 96);
      if (isDone) thumb.setTint(0x3a4a55);
      const label = this.add
        .text(0, 48, loc(bay.name) + (isDone ? tt(" ─ 已穩定", " - Stable") : ""), {
          fontFamily: "sans-serif",
          fontSize: "15px",
          color: isDone ? "#5e7a8a" : "#e8f6ff",
        })
        .setOrigin(0.5);
      const who = this.add
        .text(0, 70, isDone ? tt(`${speakerName(bay.char.name)} 已甦醒`, `${speakerName(bay.char.name)} awakened`) : tt(`${speakerName(bay.char.name)} ─ 沉睡中`, `${speakerName(bay.char.name)} - in stasis`), {
          fontFamily: "sans-serif",
          fontSize: "11px",
          color: isDone ? "#35e0c8" : "#8fb3c4",
        })
        .setOrigin(0.5);
      card.add([frame, thumb, label, who]);

      if (!isDone) {
        frame.setInteractive({ useHandCursor: true });
        frame.on("pointerover", () => {
          frame.setStrokeStyle(2, 0x00f5ff);
          sfx.hover();
        });
        frame.on("pointerout", () => frame.setStrokeStyle(2, 0x2e4a5e));
        frame.on("pointerdown", () => {
          if (this.leaving) return; // 防連點重複觸發場景切換
          this.leaving = true;
          sfx.click();
          // 按下回饋:卡片快速下壓回彈
          this.tweens.add({ targets: card, scale: 0.97, duration: 90, ease: "Cubic.easeOut", yoyo: true });
          this.cameras.main.fadeOut(450, 0, 0, 0);
          this.cameras.main.once("camerafadeoutcomplete", () =>
            this.scene.start("bay", { bayKey: bay.key }),
          );
        });
      }
    });
  }

  // ── 中點轉折:通訊攔截 ──
  private async midpoint() {
    sfx.alarm();
    this.cameras.main.shake(200, 0.002);
    const lines: Line[] = [
      { who: "系統", text: { zh: "——攔截到未授權廣播。來源:艦內。頻道:全頻段。", en: "— Unauthorized broadcast intercepted. Source: onboard. Channel: all bands." }, style: "system", portrait: "" },
      { who: "???", text: { zh: "(雜訊中的聲音)……如果有人聽到,聽好。震盪不是意外。倒數不是真的。它在……(訊號中斷)", en: "(A voice through static) ...If anyone's listening, hear me. The shock was no accident. The countdown isn't real. It's — (signal lost)" }, style: "system" },
      { who: "奧提斯", text: { zh: "廣播源已隔離。那是受損通訊模組的回放殘響,程序官。不具參考價值。", en: "Broadcast source isolated. Just playback echo from a damaged comm module, Procedural Officer. Of no value." }, style: "otis", portrait: "otis_suspicious" },
      { who: "你", text: { zh: "(「倒數不是真的」……那我這幾天拼命趕的,是什麼?)", en: "(\"The countdown isn't real\"... then what have I been racing against all these days?)" }, style: "self", portrait: "" },
      { who: "奧提斯", text: { zh: "您的心率上升了 11%。建議:專注於下一位專員。時間……仍在倒數。", en: "Your heart rate has risen 11%. Recommendation: focus on the next specialist. Time... is still counting down." }, style: "otis", portrait: "otis_alarm" },
    ];
    await playLines(lines);
    hideDialogue();
    hidePortrait();
  }

  // ── 六人全醒 → 結局序列 ──
  private async finale() {
    await say("奧提斯", { zh: "六位專員,全員甦醒。系統修復度:足以抵達 Kepler-452。", en: "All six specialists are awake. System repair: sufficient to reach Kepler-452." }, "otis");
    await say("奧提斯", { zh: "接下來是最終航段——以及,降落前的四項艙船認證作業。", en: "Next comes the final leg - and four ship certification tasks before landing." }, "otis");
    hideDialogue();
    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("modules"));
  }
}
