import Phaser from "phaser";
import { riasec, type Dim } from "../game/riasec";
import { flow } from "../game/flow";
import { sfx } from "../ui/sfx";
import { playMusic } from "../ui/music";
import { loc, tt, type LS } from "../game/lang";
import { installAmbientDrift } from "../ui/ambient";
import { fadeToScene } from "../ui/transition";

// ⛔ 隱性評估:卡面只有名稱+功能描述。維度對應只存在於這份內部資料,
//    所有卡片外框同色,不得出現 R/I/A/S/E/C 或維度配色。
const EQUIPMENT: { key: string; name: LS; desc: LS; dim: Dim }[] = [
  {
    key: "eq_plasma_wrench",
    name: { zh: "多功能電漿扳手", en: "Plasma Multi-Wrench" },
    desc: { zh: "手動開啟故障氣閘、修復基礎電路。", en: "Force open jammed hatches and repair basic circuits." },
    dim: "R",
  },
  {
    key: "eq_spectrum_scanner",
    name: { zh: "環境光譜分析儀", en: "Spectrum Scanner" },
    desc: { zh: "掃描氣體成分與隱藏的電磁波路徑。", en: "Scan gas composition and hidden electromagnetic paths." },
    dim: "I",
  },
  {
    key: "eq_holo_canvas",
    name: { zh: "全息投影畫布", en: "Holo Canvas" },
    desc: { zh: "在空中繪製發光標記,記錄路徑或留下訊息。", en: "Draw luminous markers in the air to record paths or messages." },
    dim: "A",
  },
  {
    key: "eq_bio_resonator",
    name: { zh: "生物頻率共鳴器", en: "Bio Resonator" },
    desc: { zh: "發出安撫頻率,讓緊張的生命體平靜下來。", en: "Emit calming frequencies for stressed lifeforms." },
    dim: "S",
  },
  {
    key: "eq_resource_terminal",
    name: { zh: "資源分配終端機", en: "Resource Terminal" },
    desc: { zh: "暫時駭入區域系統,重新分配電力與補給。", en: "Temporarily reroute local power and supplies." },
    dim: "E",
  },
  {
    key: "eq_protocol_library",
    name: { zh: "標準作業協議庫", en: "Protocol Library" },
    desc: { zh: "內建所有設備的標準操作手冊,操作零失誤。", en: "Carry standard procedures for every shipboard system." },
    dim: "C",
  },
];

export class EquipScene extends Phaser.Scene {
  private chosen = false;

  constructor() {
    super("equip");
  }

  create() {
    this.chosen = false;
    playMusic(this, "bgm_title_drift", 0.24);
    this.cameras.main.fadeIn(500, 13, 27, 42);
    this.add.rectangle(480, 270, 960, 540, 0x0d1b2a);
    installAmbientDrift(this, { color: 0x00f5ff, count: 20, depth: 2, alphaScale: 1.45, sizeScale: 1.25 });

    this.add
      .text(480, 56, tt("緊急協議:艙內環境不穩定,僅能攜帶一項核心裝備。", "Emergency protocol: the ship is unstable. You may carry one core tool."), {
        fontFamily: "sans-serif",
        fontSize: "18px",
        color: "#e8f6ff",
      })
      .setOrigin(0.5);
    this.add
      .text(480, 86, tt("— 奧提斯:「請從裝備櫃中選擇。任何一件都足以陪你走完這趟。」", "— OTIS: Choose from the equipment locker. Any one of them can carry you through this voyage."), {
        fontFamily: "sans-serif",
        fontSize: "14px",
        color: "#7fb6c9",
      })
      .setOrigin(0.5);

    const cols = 3;
    const cw = 250;
    const ch = 180;
    EQUIPMENT.forEach((eq, i) => {
      const x = 480 + (i % cols - 1) * (cw + 30);
      const y = 200 + Math.floor(i / cols) * (ch + 30);

      const card = this.add.container(x, y);
      // 統一中性外框 — 不分維度
      const frame = this.add.rectangle(0, 0, cw, ch, 0x13283a).setStrokeStyle(2, 0x2e4a5e);
      const icon = this.add.image(0, -38, eq.key).setScale(0.5);
      const name = this.add
        .text(0, 26, loc(eq.name), { fontFamily: "sans-serif", fontSize: "17px", color: "#e8f6ff" })
        .setOrigin(0.5);
      const desc = this.add
        .text(0, 58, loc(eq.desc), {
          fontFamily: "sans-serif",
          fontSize: "12px",
          color: "#8fb3c4",
          wordWrap: { width: cw - 30 },
          align: "center",
        })
        .setOrigin(0.5, 0);
      card.add([frame, icon, name, desc]);
      frame.setInteractive({ useHandCursor: true });
      frame.on("pointerover", () => {
        frame.setStrokeStyle(2, 0x00f5ff);
        sfx.hover();
        this.tweens.add({ targets: card, scale: 1.04, duration: 120 });
      });
      frame.on("pointerout", () => {
        frame.setStrokeStyle(2, 0x2e4a5e);
        this.tweens.add({ targets: card, scale: 1, duration: 120 });
      });
      frame.on("pointerdown", () => {
        if (this.chosen) return; // 防連點
        this.chosen = true;
        sfx.snap();
        // 按下回饋:快速縮放再回彈(ease-out),讓選擇有手感
        this.tweens.add({ targets: card, scale: 0.96, duration: 90, ease: "Cubic.easeOut", yoyo: true });
        riasec.pickEquipment(eq.dim);
        flow.equipment = loc(eq.name);
        this.cameras.main.flash(120, 0, 245, 255);
        fadeToScene(this, "awakening", { duration: 700 });
      });
    });
  }
}
