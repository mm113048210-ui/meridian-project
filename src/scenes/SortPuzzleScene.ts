import Phaser from "phaser";
import { riasec } from "../game/riasec";
import { sfx } from "../ui/sfx";
import { tt } from "../game/lang";

// C-2:貨艙物資分類(拖進正確的分類格)。無懲罰,錯了彈回。
type BinKey = "med" | "fuel" | "food" | "part";

const BINS: { key: BinKey; label: string; x: number }[] = [
  { key: "med", label: "醫療", x: 150 },
  { key: "fuel", label: "燃料", x: 370 },
  { key: "food", label: "糧食", x: 590 },
  { key: "part", label: "零件", x: 810 },
];

const CAT: Record<BinKey, { color: number; hex: string; icon: string }> = {
  med: { color: 0xff5a6e, hex: "#ff5a6e", icon: "icon_med" },
  fuel: { color: 0xffb454, hex: "#ffb454", icon: "icon_fuel" },
  food: { color: 0x6ad48a, hex: "#6ad48a", icon: "icon_food" },
  part: { color: 0x5ab0ff, hex: "#5ab0ff", icon: "icon_part" },
};

const ITEMS: { name: string; bin: BinKey }[] = [
  { name: "止血凝膠", bin: "med" },
  { name: "氫燃料芯", bin: "fuel" },
  { name: "凍乾飯包", bin: "food" },
  { name: "軸承組", bin: "part" },
  { name: "廣效抗生素", bin: "med" },
  { name: "推進劑罐", bin: "fuel" },
  { name: "高蛋白棒", bin: "food" },
  { name: "密封圈", bin: "part" },
  { name: "繃帶卷", bin: "med" },
  { name: "燃料濾芯", bin: "fuel" },
  { name: "淨水錠", bin: "food" },
  { name: "伺服馬達", bin: "part" },
];

const BIN_Y = 430;

export class SortPuzzleScene extends Phaser.Scene {
  private sorted = 0;
  private solved = false;
  private startedAt = 0;
  private misdrops = 0;
  private binCounts: Record<BinKey, number> = { med: 0, fuel: 0, food: 0, part: 0 };
  private from = "modules";

  constructor() {
    super("sortpuzzle");
  }

  create(data: { from?: string }) {
    this.from = data?.from ?? "modules";
    this.sorted = 0;
    this.solved = false;
    this.misdrops = 0;
    this.binCounts = { med: 0, fuel: 0, food: 0, part: 0 };
    this.startedAt = this.time.now;
    this.cameras.main.fadeIn(350, 0, 0, 0);
    this.add.rectangle(480, 270, 960, 540, 0x06090d, 0.9);
    this.add
      .text(480, 44, tt("重整貨艙:把物資拖進正確的分類格", "Restore cargo order: drag each item into the correct bin"), {
        fontFamily: "sans-serif",
        fontSize: "16px",
        color: "#cfe9f5",
      })
      .setOrigin(0.5);

    BINS.forEach((b) => {
      const cat = CAT[b.key];
      this.add.rectangle(b.x, BIN_Y, 190, 130, 0x0e1d2a).setStrokeStyle(2, cat.color, 0.9);
      this.add.circle(b.x - 52, BIN_Y - 46, 13, cat.color, 0.18).setStrokeStyle(1.5, cat.color);
      this.add.image(b.x - 52, BIN_Y - 46, cat.icon).setDisplaySize(28, 28);
      this.add
        .text(b.x - 30, BIN_Y - 46, tt(b.label, ({ 醫療: "Medical", 燃料: "Fuel", 糧食: "Food", 零件: "Parts" } as Record<string, string>)[b.label]), {
          fontFamily: "sans-serif",
          fontSize: "15px",
          color: cat.hex,
        })
        .setOrigin(0, 0.5);
    });

    // 散亂物資堆
    const shuffled = Phaser.Utils.Array.Shuffle([...ITEMS]);
    shuffled.forEach((item, i) => {
      const x = 180 + (i % 4) * 200 + Phaser.Math.Between(-26, 26);
      const y = 120 + Math.floor(i / 4) * 72 + Phaser.Math.Between(-10, 10);
      this.spawnItem(item.name, item.bin, x, y);
    });

    this.time.delayedCall(45_000, () => {
      if (this.solved) return;
      const btn = this.add
        .text(866, 506, tt("⟐ 請奧提斯接手", "Ask OTIS to assist"), {
          fontFamily: "sans-serif",
          fontSize: "15px",
          color: "#7fb6c9",
          backgroundColor: "#13283a",
          padding: { x: 12, y: 7 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      btn.on("pointerdown", () => {
        riasec.log("minigame_assist", { id: "sort" });
        this.children.list
          .filter((o) => o.getData && o.getData("bin") && !o.getData("placed"))
          .forEach((o, i) => {
            const c = o as Phaser.GameObjects.Container;
            this.time.delayedCall(i * 90, () => this.placeInBin(c, c.getData("bin") as BinKey));
          });
        btn.destroy();
      });
    });
  }

  private spawnItem(name: string, bin: BinKey, x: number, y: number) {
    const cat = CAT[bin];
    const c = this.add.container(x, y);
    const r = this.add.rectangle(0, 0, 172, 44, 0x1c3242).setStrokeStyle(2, 0x44607a);
    const stripe = this.add.rectangle(-78, 0, 6, 44, cat.color).setOrigin(0.5);
    const icon = this.add.image(-62, 0, cat.icon).setDisplaySize(24, 24);
    const itemName = tt(name, ({
      止血凝膠: "Hemostatic gel",
      氫燃料芯: "Hydrogen cell",
      凍乾飯包: "Freeze-dried meal",
      軸承組: "Bearing set",
      廣效抗生素: "Broad antibiotic",
      推進劑罐: "Propellant canister",
      高蛋白棒: "Protein bar",
      密封圈: "Seal ring",
      繃帶卷: "Bandage roll",
      燃料濾芯: "Fuel filter",
      淨水錠: "Water tablets",
      伺服馬達: "Servo motor",
    } as Record<string, string>)[name]);
    const t = this.add.text(8, 0, itemName, {
      fontFamily: "sans-serif",
      fontSize: "15px",
      color: "#e8f6ff",
    }).setOrigin(0.5);
    c.add([r, stripe, icon, t]);
    c.setSize(172, 44);
    c.setData("bin", bin);
    c.setData("home", { x, y });
    c.setInteractive({ useHandCursor: true, draggable: true });

    c.on("drag", (_p: unknown, dx: number, dy: number) => {
      if (this.solved || c.getData("placed")) return;
      c.setPosition(dx, dy).setDepth(10);
    });
    c.on("dragend", () => {
      if (this.solved || c.getData("placed")) return;
      c.setDepth(1);
      const hit = BINS.find((b) => Math.abs(c.x - b.x) < 95 && Math.abs(c.y - BIN_Y) < 65);
      if (!hit) {
        const home = c.getData("home") as { x: number; y: number };
        this.tweens.add({ targets: c, x: home.x, y: home.y, duration: 200 });
        return;
      }
      if (hit.key === bin) {
        this.placeInBin(c, bin);
      } else {
        this.misdrops += 1;
        sfx.alarm();
        this.tweens.add({ targets: c, x: c.x + 8, duration: 50, yoyo: true, repeat: 3 });
        const home = c.getData("home") as { x: number; y: number };
        this.time.delayedCall(260, () =>
          this.tweens.add({ targets: c, x: home.x, y: home.y, duration: 220 }),
        );
      }
    });
  }

  private placeInBin(c: Phaser.GameObjects.Container, bin: BinKey) {
    if (c.getData("placed")) return;
    c.setData("placed", true);
    c.disableInteractive();
    const slot = this.binCounts[bin]++;
    const b = BINS.find((x) => x.key === bin)!;
    sfx.snap();
    this.tweens.add({
      targets: c,
      x: b.x,
      y: BIN_Y - 28 + slot * 19,
      duration: 200,
      onComplete: () => {
        c.setScale(0.86);
        this.sorted += 1;
        if (this.sorted >= ITEMS.length) this.solve();
      },
    });
  }

  private solve() {
    if (this.solved) return;
    this.solved = true;
    sfx.solve();
    this.cameras.main.flash(200, 53, 224, 200);
    riasec.log("minigame_done", {
      id: "sort",
      ms: Math.round(this.time.now - this.startedAt),
      misdrops: this.misdrops,
    });
    this.add
      .text(480, 506, tt("貨艙清單:完整性 100% ▮▮▮▮▮", "Cargo manifest: integrity 100% ▮▮▮▮▮"), {
        fontFamily: "sans-serif",
        fontSize: "17px",
        color: "#35e0c8",
        backgroundColor: "#0e1d2a",
        padding: { x: 14, y: 7 },
      })
      .setOrigin(0.5);
    this.time.delayedCall(1300, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.stop();
        this.scene.resume(this.from);
      });
    });
  }
}
