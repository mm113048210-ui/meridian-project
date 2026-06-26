import Phaser from "phaser";
import { say, hideDialogue } from "../ui/dialogue";
import { hidePortrait, setPortrait } from "../ui/portrait";
import { riasec } from "../game/riasec";
import { sfx } from "../ui/sfx";
import { playMusic } from "../ui/music";
import { RANKING_ITEMS, RANK_SCORES } from "../game/script";
import { setStage } from "../game/flow";
import { loc, tt } from "../game/lang";
import { installAmbientDrift } from "../ui/ambient";

// L4 強迫排序:六項成就感由高至低(拖曳排序)。價值觀校準,權重最高的一筆。
const SLOT_X = 500;
const SLOT_Y0 = 130;
const SLOT_H = 56;

export class RankingScene extends Phaser.Scene {
  private order: number[] = [];
  private cards: Phaser.GameObjects.Container[] = [];
  private confirmed = false;

  constructor() {
    super("ranking");
  }

  create() {
    this.confirmed = false;
    this.cards = [];
    document.getElementById("hud")?.classList.add("hidden");
    document.getElementById("save-button")?.classList.add("hidden");
    setStage("ranking");
    this.cameras.main.fadeIn(600, 0, 0, 0);
    playMusic(this, "bgm_final_release", 0.22);
    this.add.rectangle(480, 270, 960, 540, 0x05080c);
    installAmbientDrift(this, { color: 0xffd700, count: 22, depth: 2, alphaScale: 1.35, sizeScale: 1.2 });
    // 休眠艙白光氛圍
    const glow = this.add.ellipse(480, 270, 900, 480, 0x8b5cf6, 0.06);
    this.tweens.add({ targets: glow, alpha: 0.4, duration: 2600, yoyo: true, repeat: -1 });
    this.intro();
  }

  private async intro() {
    setPortrait("otis");
    await say("奧提斯", { zh: "休眠艙已就緒。入睡之前,還有最後一項記錄。", en: "The cryo bay is ready. Before you sleep, one last record." }, "otis");
    await say(
      "奧提斯",
      {
        zh: "假設你只能把有限的「人類樣貌」帶去新世界。以下六種時刻,請依你願意留下的程度,由高到低排序。",
        en: "Assume you can carry only a limited record of humanity to the new world. Rank these six moments from most worth preserving to least.",
      },
      "otis",
    );
    await say("奧提斯", { zh: "排在最後的那一項,將不被收錄。請慎重。", en: "The item placed last will not be archived. Choose carefully." }, "otis");
    hideDialogue();
    hidePortrait();
    this.buildBoard();
  }

  private buildBoard() {
    this.add
      .text(480, 64, tt("由高至低排序:你最願意留下哪種時刻?", "Rank from high to low: which moments would you preserve?"), {
        fontFamily: "sans-serif",
        fontSize: "17px",
        color: "#cfe9f5",
      })
      .setOrigin(0.5);

    for (let i = 0; i < 6; i++) {
      this.add
        .text(204, SLOT_Y0 + i * SLOT_H, `${i + 1}`, {
          fontFamily: "monospace",
          fontSize: "17px",
          color: i === 5 ? "#e63946" : "#5e7a8a",
        })
        .setOrigin(0.5);
    }
    this.add
      .text(204, SLOT_Y0 + 5 * SLOT_H + 26, tt("(不收錄)", "(not archived)"), {
        fontFamily: "sans-serif",
        fontSize: "10px",
        color: "#e63946",
      })
      .setOrigin(0.5)
      .setAlpha(0.8);

    this.order = Phaser.Utils.Array.Shuffle([...RANKING_ITEMS.keys()]);
    this.order.forEach((itemIdx) => this.spawnCard(itemIdx));

    const btn = this.add
      .text(480, 488, tt("封存記錄", "Archive Record"), {
        fontFamily: "sans-serif",
        fontSize: "16px",
        color: "#0d1b2a",
        backgroundColor: "#00f5ff",
        padding: { x: 20, y: 9 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn.on("pointerdown", () => {
      if (this.confirmed) return;
      this.confirmed = true;
      sfx.solve();
      // 排名加權計分
      this.order.forEach((itemIdx, rank) => {
        riasec.addRanking({ [RANKING_ITEMS[itemIdx].dim]: RANK_SCORES[rank] }, `L4-rank${rank + 1}`);
      });
      riasec.log("ranking_final", { order: this.order });
      this.cameras.main.fadeOut(900, 255, 255, 255);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("final"));
    });
  }

  private spawnCard(itemIdx: number) {
    const slot = this.order.indexOf(itemIdx);
    const c = this.add.container(SLOT_X, SLOT_Y0 + slot * SLOT_H);
    const r = this.add.rectangle(0, 0, 520, 46, 0x13283a).setStrokeStyle(2, 0x2e4a5e);
    const t = this.add.text(-240, 0, loc(RANKING_ITEMS[itemIdx].text), {
      fontFamily: "sans-serif",
      fontSize: "14px",
      color: "#e8f6ff",
    }).setOrigin(0, 0.5);
    const grip = this.add.text(240, 0, "≡", { fontSize: "18px", color: "#5e7a8a" }).setOrigin(1, 0.5);
    c.add([r, t, grip]);
    c.setSize(520, 46);
    c.setData("item", itemIdx);
    c.setInteractive({ useHandCursor: true, draggable: true });
    this.cards.push(c);

    c.on("drag", (_p: unknown, _x: number, y: number) => {
      if (this.confirmed) return;
      c.y = Phaser.Math.Clamp(y, SLOT_Y0 - 20, SLOT_Y0 + 5 * SLOT_H + 20);
      c.setDepth(10);
      const hover = Phaser.Math.Clamp(Math.round((c.y - SLOT_Y0) / SLOT_H), 0, 5);
      const cur = this.order.indexOf(itemIdx);
      if (hover !== cur) {
        this.order.splice(cur, 1);
        this.order.splice(hover, 0, itemIdx);
        this.layout(c);
        sfx.hover();
      }
    });
    c.on("dragend", () => {
      if (this.confirmed) return;
      c.setDepth(1);
      this.layout();
      sfx.snap();
    });
  }

  private layout(skip?: Phaser.GameObjects.Container) {
    this.cards.forEach((card) => {
      if (card === skip) return;
      const slot = this.order.indexOf(card.getData("item"));
      this.tweens.add({ targets: card, y: SLOT_Y0 + slot * SLOT_H, x: SLOT_X, duration: 140 });
    });
  }
}
