import Phaser from "phaser";
import { riasec } from "../game/riasec";
import { sfx } from "../ui/sfx";
import { tt } from "../game/lang";

// E-2:六艙電力分配(拖曳滑桿,總量有限)。沒有唯一正解 — 取捨本身即體驗。
interface BayRow {
  name: string;
  min: number; // 最低需求
  value: number;
  knob?: Phaser.GameObjects.Arc;
  fill?: Phaser.GameObjects.Rectangle;
  label?: Phaser.GameObjects.Text;
  lamp?: Phaser.GameObjects.Arc; // 艙區燈號
}

const BUDGET = 500;
const ROW_MAX = 130;
const BAR_X = 300;
const BAR_W = 430;

export class PowerGridScene extends Phaser.Scene {
  private rows: BayRow[] = [];
  private totalText!: Phaser.GameObjects.Text;
  private confirmBtn!: Phaser.GameObjects.Text;
  private overloadGlow!: Phaser.GameObjects.Rectangle;
  private solved = false;
  private startedAt = 0;
  private adjustCount = 0;
  private from = "modules";

  constructor() {
    super("powergrid");
  }

  create(data: { from?: string }) {
    this.from = data?.from ?? "modules";
    this.solved = false;
    this.adjustCount = 0;
    this.startedAt = this.time.now;
    this.rows = [
      { name: tt("動力艙", "Power Bay"), min: 100, value: 70 },
      { name: tt("溫室", "Greenhouse"), min: 60, value: 70 },
      { name: tt("環形走廊", "Mural Ring"), min: 40, value: 70 },
      { name: tt("醫療艙", "Med Bay"), min: 90, value: 70 },
      { name: tt("指揮中心", "Command"), min: 80, value: 70 },
      { name: tt("資料艙", "Archive"), min: 50, value: 70 },
    ];

    this.cameras.main.fadeIn(350, 0, 0, 0);
    this.add.rectangle(480, 270, 960, 540, 0x06090d, 0.9);
    this.add
      .text(480, 44, tt("分配電力:拖曳各艙滑桿,讓所有艙區達到最低需求", "Allocate power: drag each bay slider above its minimum requirement"), {
        fontFamily: "sans-serif",
        fontSize: "16px",
        color: "#cfe9f5",
      })
      .setOrigin(0.5);

    // 過載警示用紅色邊框光暈(僅過載時可見,持續呼吸)
    this.overloadGlow = this.add
      .rectangle(480, 270, 952, 532, 0xe63946, 0)
      .setStrokeStyle(6, 0xe63946, 1)
      .setVisible(false);
    this.tweens.add({
      targets: this.overloadGlow,
      alpha: { from: 1, to: 0.4 },
      duration: 520,
      yoyo: true,
      repeat: -1,
    });

    this.rows.forEach((row, i) => this.makeRow(row, 108 + i * 58));

    this.totalText = this.add
      .text(480, 468, "", { fontFamily: "monospace", fontSize: "15px", color: "#cfe9f5" })
      .setOrigin(0.5);

    this.confirmBtn = this.add
      .text(480, 508, tt("確認分配", "Confirm Allocation"), {
        fontFamily: "sans-serif",
        fontSize: "16px",
        color: "#0d1b2a",
        backgroundColor: "#2e4a5e",
        padding: { x: 18, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.confirmBtn.on("pointerdown", () => {
      if (this.canConfirm()) this.solve();
      else sfx.alarm();
    });

    this.refresh();
  }

  private makeRow(row: BayRow, y: number) {
    // 艙區燈號(紅=不足,青=正常),持續微脈動
    row.lamp = this.add.circle(BAR_X - 150, y, 7, 0x35e0c8);
    this.tweens.add({
      targets: row.lamp,
      alpha: { from: 1, to: 0.5 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
    this.add
      .text(BAR_X - 24, y, row.name, { fontFamily: "sans-serif", fontSize: "16px", color: "#8fb3c4" })
      .setOrigin(1, 0.5);
    this.add.rectangle(BAR_X + BAR_W / 2, y, BAR_W, 14, 0x0e1d2a).setStrokeStyle(1, 0x2e4a5e);
    // 最低需求刻度
    const minX = BAR_X + (row.min / ROW_MAX) * BAR_W;
    this.add.rectangle(minX, y, 2, 22, 0x8fb3c4, 0.7);

    row.fill = this.add.rectangle(BAR_X, y, 0, 10, 0x00f5ff).setOrigin(0, 0.5);
    row.label = this.add
      .text(BAR_X + BAR_W + 18, y, "", { fontFamily: "monospace", fontSize: "15px", color: "#cfe9f5" })
      .setOrigin(0, 0.5);

    row.knob = this.add.circle(BAR_X + (row.value / ROW_MAX) * BAR_W, y, 12, 0x35e0c8);
    row.knob.setStrokeStyle(2, 0x0d1b2a);
    row.knob.setInteractive({ useHandCursor: true, draggable: true });
    row.knob.on("drag", (_p: unknown, dx: number) => {
      if (this.solved) return;
      const x = Phaser.Math.Clamp(dx, BAR_X, BAR_X + BAR_W);
      row.knob!.x = x;
      row.value = Math.round(((x - BAR_X) / BAR_W) * ROW_MAX);
      this.refresh();
    });
    row.knob.on("dragend", () => {
      this.adjustCount += 1;
      sfx.click();
    });
  }

  private total() {
    return this.rows.reduce((s, r) => s + r.value, 0);
  }

  private canConfirm() {
    return this.total() <= BUDGET && this.rows.every((r) => r.value >= r.min);
  }

  private refresh() {
    const total = this.total();
    const over = total > BUDGET;
    this.rows.forEach((r) => {
      const under = r.value < r.min;
      r.fill!.width = (r.value / ROW_MAX) * BAR_W;
      r.fill!.fillColor = under ? 0xe63946 : 0x00f5ff;
      r.label!.setText(`${String(r.value).padStart(3, " ")}${under ? tt(" ⚠不足", " low") : ""}`);
      r.label!.setColor(under ? "#e63946" : "#cfe9f5");
      r.lamp!.setFillStyle(under ? 0xe63946 : 0x35e0c8);
    });
    this.overloadGlow.setVisible(over);
    this.totalText.setText(
      `${tt("總供電", "Total power")} ${total} / ${BUDGET}${over ? tt("  ⚠ 過載", "  overload") : ""}`,
    );
    this.totalText.setColor(over ? "#e63946" : "#cfe9f5");
    const ok = this.canConfirm();
    this.confirmBtn.setBackgroundColor(ok ? "#00f5ff" : "#2e4a5e");
    this.confirmBtn.setColor(ok ? "#0d1b2a" : "#5e7a8a");
  }

  private solve() {
    if (this.solved) return;
    this.solved = true;
    sfx.solve();
    this.cameras.main.flash(200, 53, 224, 200);
    riasec.log("minigame_done", {
      id: "powergrid",
      ms: Math.round(this.time.now - this.startedAt),
      adjusts: this.adjustCount,
      allocation: this.rows.map((r) => ({ name: r.name, value: r.value })),
      spare: BUDGET - this.total(),
    });
    this.add
      .text(480, 468, tt("電網負載:平衡 ▮▮▮▮▮", "Power grid load: balanced ▮▮▮▮▮"), {
        fontFamily: "sans-serif",
        fontSize: "16px",
        color: "#35e0c8",
        backgroundColor: "#0e1d2a",
        padding: { x: 14, y: 7 },
      })
      .setOrigin(0.5);
    this.time.delayedCall(1200, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.stop();
        this.scene.resume(this.from);
      });
    });
  }
}
