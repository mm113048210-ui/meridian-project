import Phaser from "phaser";
import { riasec } from "../game/riasec";
import { sfx } from "../ui/sfx";
import { tt } from "../game/lang";
import { createNudge, type NudgeHandle } from "../ui/nudge";
import { askSignature } from "../ui/minichoice";
import { installAmbientDrift } from "../ui/ambient";

// C-2:貨艙物資分類(拖進正確的分類格)。無懲罰,錯了彈回。
type BinKey = "bio" | "mech" | "energy" | "data";

const BINS: { key: BinKey; frame: string; x: number }[] = [
  { key: "bio", frame: "sort_bin_bio", x: 150 },
  { key: "mech", frame: "sort_bin_mech", x: 370 },
  { key: "energy", frame: "sort_bin_energy", x: 590 },
  { key: "data", frame: "sort_bin_data", x: 810 },
];


const ITEMS: { id: string; frame: string; bin: BinKey }[] = [
  { id: "plant_vial", frame: "sort_item_plant_vial", bin: "bio" },
  { id: "petri", frame: "sort_item_petri", bin: "bio" },
  { id: "seed_tray", frame: "sort_item_seed_tray", bin: "bio" },
  { id: "gear", frame: "sort_item_gear", bin: "mech" },
  { id: "pipe", frame: "sort_item_pipe", bin: "mech" },
  { id: "wrench", frame: "sort_item_wrench", bin: "mech" },
  { id: "battery", frame: "sort_item_battery", bin: "energy" },
  { id: "crystal", frame: "sort_item_crystal", bin: "energy" },
  { id: "fuel_can", frame: "sort_item_fuel_can", bin: "energy" },
  { id: "chip", frame: "sort_item_chip", bin: "data" },
  { id: "memory_card", frame: "sort_item_memory_card", bin: "data" },
  { id: "signal_module", frame: "sort_item_signal_module", bin: "data" },
];

const BIN_Y = 430;

// 等比縮放到 boxW×boxH 內,維持原圖長寬比(取代會壓扁的 setDisplaySize)。
function fit(img: Phaser.GameObjects.Image, boxW: number, boxH: number) {
  const s = Math.min(boxW / img.width, boxH / img.height);
  img.setScale(s);
}

export class SortPuzzleScene extends Phaser.Scene {
  private sorted = 0;
  private solved = false;
  private startedAt = 0;
  private misdrops = 0;
  private binCounts: Record<BinKey, number> = { bio: 0, mech: 0, energy: 0, data: 0 };
  private from = "modules";

  constructor() {
    super("sortpuzzle");
  }

  private nudge?: NudgeHandle;

  create(data: { from?: string }) {
    this.from = data?.from ?? "modules";
    this.sorted = 0;
    this.solved = false;
    this.misdrops = 0;
    this.binCounts = { bio: 0, mech: 0, energy: 0, data: 0 };
    this.ensureSortFrames();
    this.nudge = createNudge(this, {
      speaker: "陳靜",
      accent: 0xb0bec5,
      anchor: { x: 24, y: 92 },
      lines: [
        { zh: "慢慢來,分類不是比快的。看清楚每一筆屬於哪一類。", en: "Take your time — sorting isn't a race. See clearly which category each one belongs to." },
        { zh: "照它的種類拖進對應的格子,錯了會彈回來,不扣分。", en: "Drag each by its type into the matching bin. Wrong ones bounce back — no penalty." },
      ],
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.nudge?.destroy());
    this.startedAt = this.time.now;
    this.cameras.main.fadeIn(350, 0, 0, 0);
    this.add.rectangle(480, 270, 960, 540, 0x06090d, 0.9);
    installAmbientDrift(this, { color: 0xb0bec5, count: 20, depth: 2, alphaScale: 1.45, sizeScale: 1.25 });
    this.add
      .text(480, 44, tt("重整貨艙:把物資拖進正確的分類格", "Restore cargo order: drag each item into the correct bin"), {
        fontFamily: "sans-serif",
        fontSize: "16px",
        color: "#cfe9f5",
      })
      .setOrigin(0.5);

    BINS.forEach((b) => {
      const bin = this.add.image(b.x, BIN_Y, "sort_items_sheet", b.frame);
      fit(bin, 184, 200); // 保留原圖比例,不壓扁;箱子圖本身已是「框」,不再外加方框
    });

    // 散亂物資堆
    const shuffled = Phaser.Utils.Array.Shuffle([...ITEMS]);
    shuffled.forEach((item, i) => {
      const x = 180 + (i % 4) * 200 + Phaser.Math.Between(-26, 26);
      const y = 120 + Math.floor(i / 4) * 72 + Phaser.Math.Between(-10, 10);
      this.spawnItem(item.id, item.frame, item.bin, x, y);
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

  private ensureSortFrames() {
    const tex = this.textures.get("sort_items_sheet");
    if (tex.has("sort_item_plant_vial")) return;
    const add = (name: string, x: number, y: number, w: number, h: number) => tex.add(name, 0, x, y, w, h);
    // 切框由 alpha 邊界精算(非手寫),避免截到背景或鄰格。
    add("sort_item_plant_vial", 62, 210, 68, 118);
    add("sort_item_petri", 156, 227, 97, 85);
    add("sort_item_seed_tray", 270, 233, 102, 75);
    add("sort_item_gear", 390, 221, 92, 93);
    add("sort_item_pipe", 498, 234, 86, 81);
    add("sort_item_wrench", 604, 216, 106, 106);
    add("sort_item_battery", 733, 218, 66, 101);
    add("sort_item_crystal", 838, 210, 61, 116);
    add("sort_item_fuel_can", 930, 213, 97, 111);
    add("sort_item_chip", 1051, 226, 87, 88);
    add("sort_item_memory_card", 1171, 222, 73, 93);
    add("sort_item_signal_module", 1278, 223, 77, 92);
    add("sort_bin_bio", 69, 430, 278, 252);
    add("sort_bin_mech", 398, 430, 277, 252);
    add("sort_bin_energy", 733, 431, 277, 251);
    add("sort_bin_data", 1061, 431, 277, 251);
  }

  private spawnItem(id: string, frame: string, bin: BinKey, x: number, y: number) {
    const c = this.add.container(x, y);
    // 無圓框、無分類色:物資以原圖比例呈現,玩家須靠物資本身判斷分類。
    const icon = this.add.image(0, 0, "sort_items_sheet", frame);
    fit(icon, 64, 64);
    c.add([icon]);
    c.setSize(74, 74);
    c.setData("bin", bin);
    c.setData("id", id);
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
    const col = slot % 3;
    const row = Math.floor(slot / 3);
    sfx.snap();
    this.tweens.add({
      targets: c,
      x: b.x - 42 + col * 42,
      y: BIN_Y - 24 + row * 40,
      duration: 200,
      onComplete: () => {
        c.setScale(0.62);
        this.sorted += 1;
        if (this.sorted >= ITEMS.length) this.solve();
      },
    });
  }

  private solve() {
    if (this.solved) return;
    this.solved = true;
    this.nudge?.solved();
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
    this.time.delayedCall(1100, () => this.askSignatureChoice());
  }

  // 招牌抉擇(計分第 4 題,維度 C):歸檔前的嚴謹程度。
  private askSignatureChoice() {
    askSignature(
      this,
      {
        speaker: "陳靜",
        accent: 0xb0bec5,
        nodeId: "C-3",
        prompt: { zh: "分類完成。正式歸檔前,你會?", en: "Sorting's done. Before you file it for real, you?" },
        options: [
          { label: { zh: "再三核對、建立索引規則,確保零誤。", en: "Double-check everything and set indexing rules — zero errors." }, weights: { C: 14 } },
          { label: { zh: "檢查一遍就歸檔。", en: "Give it one pass, then file." }, weights: { C: 7 } },
          { label: { zh: "差不多就好,直接送出。", en: "Close enough — just submit it." }, weights: { C: 2 } },
        ],
      },
      () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.stop();
          this.scene.resume(this.from);
        });
      },
    );
  }
}
