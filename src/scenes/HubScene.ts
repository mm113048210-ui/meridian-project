import Phaser from "phaser";
import { say, playLines, hideDialogue } from "../ui/dialogue";
import { hidePortrait } from "../ui/portrait";
import { flow, currentDay, syncHud, setStage } from "../game/flow";
import { sfx } from "../ui/sfx";
import { playMusic } from "../ui/music";
import { BAYS } from "../game/script";
import { loc, speakerName, tt } from "../game/lang";
import { installAmbientDrift, installPointerParallax, installVignette } from "../ui/ambient";
import { fadeToScene } from "../ui/transition";
import { DISPLAY } from "../ui/fonts";
import type { Line } from "../game/script";

// 艦橋 HUB:選擇下一個要支援的艙區(自由順序)
export class HubScene extends Phaser.Scene {
  private leaving = false;
  private mapGroup?: Phaser.GameObjects.Container;
  private promptText?: Phaser.GameObjects.Text;

  constructor() {
    super("hub");
  }

  create() {
    this.leaving = false;
    this.cameras.main.fadeIn(500, 0, 0, 0);
    playMusic(this, "bgm_ship_hub", 0.24);
    this.add.rectangle(480, 270, 960, 540, 0x000000, 1);
    // 暗角 + 環境塵埃:艦橋星圖的聚焦感與微光浮塵(壓在地圖之上、互動點之下)
    installVignette(this, { depth: 3 });
    installAmbientDrift(this, { color: 0x4ec5d8, count: 16, depth: 4 });
    // 存檔已改為手機「狀態」頁的「✦ 存檔」鈕(航程中隨時可存,檢查點式)。
    document.getElementById("hud")?.classList.remove("hidden");
    setStage("hub");
    syncHud();
    this.run();
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
        zh: `第 ${currentDay()} 日。還有 ${6 - done.length} 位專員等待喚醒。請選擇下一個艙區。`,
        en: `Day ${currentDay()}. ${6 - done.length} specialists remain in stasis. Choose the next bay.`,
      },
      "otis",
    );
    hideDialogue();
    this.drawDoors();
  }

  private drawDoors() {
    this.drawShipMap();
  }

  private drawShipMap() {
    const map = this.add.image(480, 270, "ship_map").setDisplaySize(960, 509);
    installPointerParallax(this, map, { strength: 6, duration: 520 });
    this.mapGroup = this.add.container(0, 0, [map]);

    this.add
      .text(480, 36, tt("星火號艙區地圖", "MERIDIAN Deck Map"), {
        fontFamily: DISPLAY,
        fontSize: "20px",
        color: "#d8f4ff",
      })
      .setOrigin(0.5);
    this.add
      .text(480, 62, tt("滑鼠移到艙區查看名稱，點擊進入", "Hover a bay to identify it. Click to enter."), {
        fontFamily: "sans-serif",
        fontSize: "12px",
        color: "#84aebe",
      })
      .setOrigin(0.5);

    this.promptText = this.add
      .text(480, 488, "", {
        fontFamily: "sans-serif",
        fontSize: "13px",
        color: "#d8f4ff",
        backgroundColor: "rgba(5, 12, 18, 0.72)",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);

    this.mapHotspots().forEach((spot) => this.addHotspot(spot));
  }

  private flashPrompt(text: string) {
    if (!this.promptText) return;
    this.promptText.setText(text).setVisible(true);
    this.time.delayedCall(900, () => this.promptText?.setVisible(false));
  }

  private mapHotspots() {
    return [
      { key: "powerbay", x: 260, y: 284, w: 150, h: 134, note: tt("左下機械區，推定為動力與維修核心", "Lower-left machinery room, likely power and repair core") },
      { key: "medbay", x: 354, y: 150, w: 148, h: 126, note: tt("上左雙艙床區，推定為醫療艙", "Upper-left room with twin pods, likely med bay") },
      { key: "command", x: 646, y: 170, w: 184, h: 116, note: tt("右上主控台與星圖，指揮中心", "Upper-right consoles and star display, command center") },
      { key: "datalab", x: 796, y: 306, w: 116, h: 206, note: tt("右側設備艙，改作溫室/樣本控制區", "Right-side equipment bay, used as greenhouse/sample control") },
      { key: "muralhall", x: 656, y: 388, w: 190, h: 150, note: tt("右下開放空間，改為交誼廳與休息區", "Lower-right open room, now the lounge and rest area") },
      { key: "workshop", x: 480, y: 124, w: 94, h: 68, note: tt("上方小型資料節點，推定為資料艙", "Upper small data node, likely archive bay") },
    ];
  }

  private addHotspot(spot: ReturnType<HubScene["mapHotspots"]>[number]) {
    const bay = BAYS.find((b) => b.key === spot.key);
    if (!bay) return;
    const isDone = flow.completedBays.includes(bay.key);
    const zone = this.add
      .rectangle(spot.x, spot.y, spot.w, spot.h, 0x35e0c8, 0.02)
      .setStrokeStyle(2, isDone ? 0x35e0c8 : 0x00f5ff, 0)
      .setInteractive({ useHandCursor: !isDone });
    const dot = this.add
      .circle(spot.x, spot.y, 5, isDone ? 0x35e0c8 : 0xffd166, 0.95)
      .setDepth(8);
    this.mapGroup?.add(dot);
    const pulse = this.tweens.add({
      targets: dot,
      alpha: { from: 0.35, to: 1 },
      scale: { from: 0.85, to: 1.3 },
      duration: 900,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
    zone.on("pointerover", () => {
      sfx.hover();
      zone.setFillStyle(0x35e0c8, isDone ? 0.07 : 0.16);
      zone.setStrokeStyle(2, isDone ? 0x35e0c8 : 0x00f5ff, 0.85);
      dot.setScale(1.45);
      this.showMapPrompt(bay, isDone, spot.note);
    });
    zone.on("pointerout", () => {
      zone.setFillStyle(0x35e0c8, 0.02);
      zone.setStrokeStyle(2, isDone ? 0x35e0c8 : 0x00f5ff, 0);
      dot.setScale(1);
      this.promptText?.setVisible(false);
    });
    zone.on("pointerdown", () => {
      if (isDone) {
        this.flashPrompt(tt(`${loc(bay.name)} 已穩定`, `${loc(bay.name)} is already stable`));
        return;
      }
      zone.disableInteractive().setVisible(false);
      pulse.stop();
      this.enterBay(bay.key, spot);
    });
  }

  private showMapPrompt(bay: (typeof BAYS)[number], isDone: boolean, note: string) {
    const status = isDone
      ? tt(`${speakerName(bay.char.name)} 已甦醒`, `${speakerName(bay.char.name)} awakened`)
      : tt(`點擊進入，喚醒 ${speakerName(bay.char.name)}`, `Click to enter and wake ${speakerName(bay.char.name)}`);
    this.promptText?.setText(`${loc(bay.name)} · ${status}\n${note}`).setVisible(true);
  }

  private enterBay(bayKey: string, spot: { x: number; y: number; w: number; h: number }) {
    if (this.leaving || flow.completedBays.includes(bayKey)) return;
    this.leaving = true;
    sfx.click();
    this.promptText?.setVisible(false);
    const scale = 1.38;
    const marker = this.add.rectangle(spot.x, spot.y, spot.w, spot.h, 0xffffff, 0.12).setStrokeStyle(3, 0xffffff, 0.9);
    this.mapGroup?.add(marker);
    this.tweens.add({
      targets: this.mapGroup,
      scale,
      x: 480 - spot.x * scale,
      y: 270 - spot.y * scale,
      duration: 520,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        this.cameras.main.fadeOut(260, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("bay", { bayKey }));
      },
    });
  }

  // ── 中點轉折:通訊攔截 ──
  private async midpoint() {
    sfx.alarm();
    this.cameras.main.shake(200, 0.002);
    const lines: Line[] = [
      { who: "系統", text: { zh: "——攔截到未授權廣播。來源:艦內。頻道:全頻段。", en: "— Unauthorized broadcast intercepted. Source: onboard. Channel: all bands." }, style: "system", portrait: "" },
      { who: "???", text: { zh: "(雜訊中的聲音)……如果有人聽到,聽好。震盪不是意外。倒數也不是真的。它在……(訊號中斷)", en: "(A voice through static) ...If anyone hears this, listen. The shock wasn't an accident. The countdown isn't real. It is... (signal lost)" }, style: "system" },
      { who: "奧提斯", text: { zh: "廣播源已隔離。那只是受損通訊模組的殘留回放,不用採信。", en: "Broadcast source isolated. It was residual playback from a damaged comm module. Do not rely on it." }, style: "otis", portrait: "otis_suspicious" },
      { who: "你", text: { zh: "(「倒數不是真的」……那我這幾天到底在追什麼?)", en: "(\"The countdown isn't real\"... then what have I been chasing all these days?)" }, style: "self", portrait: "" },
      { who: "奧提斯", text: { zh: "您的心率上升了 11%。建議先專注下一位專員。時間……仍在倒數。", en: "Your heart rate has risen 11%. I recommend focusing on the next specialist. Time... is still counting down." }, style: "otis", portrait: "otis_alarm" },
    ];
    await playLines(lines);
    hideDialogue();
    hidePortrait();
  }

  // ── 六人全醒 → 結局序列 ──
  private async finale() {
    await say("奧提斯", { zh: "六位專員已全員甦醒。系統修復度足以抵達 Kepler-452。", en: "All six specialists are awake. System repair is sufficient to reach Kepler-452." }, "otis");
    await say("奧提斯", { zh: "接下來是最終航段。降落前,還有兩項艙船認證要完成。", en: "Next is the final leg. Before landing, two ship certifications remain." }, "otis");
    hideDialogue();
    fadeToScene(this, "modules", { duration: 700 });
  }
}
