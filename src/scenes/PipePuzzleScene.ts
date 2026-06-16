import Phaser from "phaser";
import { riasec } from "../game/riasec";
import { sfx } from "../ui/sfx";
import { fitCover } from "./TitleScene";
import { flow, type PipeVariant } from "../game/flow";
import { tt } from "../game/lang";

function flowVariant(): PipeVariant {
  return flow.pipeVariant;
}

// ── R-1 拼管小遊戲 ──────────────────────────────────────────────
// ⛔ 表現(速度/錯誤)不計入 RIASEC,只記遙測。無失敗狀態,可請奧提斯協助。
// 方向: 0=N 1=E 2=S 3=W
type Dir = 0 | 1 | 2 | 3;
type PieceKind = "straight" | "elbow";

const BASE_CONNS: Record<PieceKind, Dir[]> = {
  straight: [1, 3], // E-W
  elbow: [0, 1], // N-E
};

interface Cell {
  gx: number;
  gy: number;
}

// S 形路徑(5×3 格),入口在左下、出口在右上
const PATH: Cell[] = [
  { gx: 0, gy: 2 },
  { gx: 1, gy: 2 },
  { gx: 1, gy: 1 },
  { gx: 2, gy: 1 },
  { gx: 3, gy: 1 },
  { gx: 3, gy: 0 },
  { gx: 4, gy: 0 },
];
const ENTRY_DIR: Dir = 3; // 從第一格的西側進
const EXIT_DIR: Dir = 1; // 從最後一格的東側出

const TILE = 86;
const GRID_X = 480 - (5 * TILE) / 2 + TILE / 2;
const GRID_Y = 268 - (3 * TILE) / 2 + TILE / 2;

interface PlacedPiece {
  sprite: Phaser.GameObjects.Image;
  kind: PieceKind;
  rot: number; // 0-3
  slot: number | null; // PATH index
  locked: boolean;
}

export class PipePuzzleScene extends Phaser.Scene {
  private pieces: PlacedPiece[] = [];
  private slots: (PlacedPiece | null)[] = [];
  private steam!: Phaser.GameObjects.Particles.ParticleEmitter;
  private solved = false;
  private startedAt = 0;
  private rotations = 0;
  private moves = 0;
  private variant: PipeVariant = "hands";
  private from = "modules";
  private ghosts: Phaser.GameObjects.Container[] = [];
  private lastProg = -2;

  constructor() {
    super("pipepuzzle");
  }

  create(data: { from?: string }) {
    this.from = data?.from ?? "modules";
    this.variant = flowVariant();
    this.solved = false;
    this.pieces = [];
    this.slots = PATH.map(() => null);
    this.rotations = 0;
    this.moves = 0;
    this.startedAt = this.time.now;

    this.cameras.main.fadeIn(400, 0, 0, 0);
    const bg = this.add.image(480, 270, "powerbay");
    fitCover(bg, 960, 540);
    this.add.rectangle(480, 270, 960, 540, 0x06090d, 0.78);

    this.makeTextures();
    this.add
      .text(480, 36, tt("接通冷卻管:把管件拖進凹槽,點擊已放置的管件可旋轉", "Reconnect coolant pipes: drag pieces into sockets; click placed pieces to rotate"), {
        fontFamily: "sans-serif",
        fontSize: "16px",
        color: "#cfe9f5",
      })
      .setOrigin(0.5);

    this.drawBoard();
    this.spawnTray();
    this.setupDrag();
    this.updateFlow();

    // 45 秒後出現「請奧提斯協助」(不扣分,只記遙測)
    this.time.delayedCall(45_000, () => {
      if (this.solved) return;
      const btn = this.add
        .text(870, 500, tt("⟐ 請奧提斯接手", "Ask OTIS to assist"), {
          fontFamily: "sans-serif",
          fontSize: "14px",
          color: "#7fb6c9",
          backgroundColor: "#13283a",
          padding: { x: 10, y: 6 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      btn.on("pointerdown", () => {
        riasec.log("minigame_assist", { id: "pipe" });
        this.autoSolve();
        btn.destroy();
      });
    });
  }

  // ── 紋理 ──
  private makeTextures() {
    if (this.textures.exists("socket")) {
      if (!this.textures.exists("puff")) {
        const puff = this.add.graphics();
        puff.fillStyle(0xffffff, 1);
        puff.fillCircle(8, 8, 8);
        puff.generateTexture("puff", 16, 16);
        puff.destroy();
      }
      return;
    }
    const g = this.add.graphics();

    g.fillStyle(0x0e1d2a, 1);
    g.fillRoundedRect(0, 0, TILE - 8, TILE - 8, 8);
    g.lineStyle(2, 0x2e4a5e, 1);
    g.strokeRoundedRect(1, 1, TILE - 10, TILE - 10, 8);
    g.generateTexture("socket", TILE - 8, TILE - 8);
    g.clear();

    const arm = 18;
    // 直管(E-W)
    g.fillStyle(0x1c3242, 1);
    g.fillRoundedRect(2, 2, TILE - 12, TILE - 12, 10);
    g.fillStyle(0x35e0c8, 1);
    g.fillRect(0, (TILE - 8) / 2 - arm / 2, TILE - 8, arm);
    g.fillStyle(0x9ef7ec, 1);
    g.fillRect(0, (TILE - 8) / 2 - arm / 2 + 3, TILE - 8, 4);
    g.generateTexture("pipe_straight", TILE - 8, TILE - 8);
    g.clear();

    // 彎管(N-E)
    const c = (TILE - 8) / 2;
    g.fillStyle(0x1c3242, 1);
    g.fillRoundedRect(2, 2, TILE - 12, TILE - 12, 10);
    g.fillStyle(0x35e0c8, 1);
    g.fillRect(c - arm / 2, 0, arm, c + arm / 2);
    g.fillRect(c - arm / 2, c - arm / 2, c + arm / 2 + 4, arm);
    g.fillStyle(0x9ef7ec, 1);
    g.fillRect(c - arm / 2 + 3, 0, 4, c);
    g.generateTexture("pipe_elbow", TILE - 8, TILE - 8);
    g.clear();

    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture("puff", 16, 16);
    g.destroy();
  }

  private cellXY(i: number) {
    return { x: GRID_X + PATH[i].gx * TILE, y: GRID_Y + PATH[i].gy * TILE };
  }

  private drawBoard() {
    // 凹槽
    PATH.forEach((_, i) => {
      const { x, y } = this.cellXY(i);
      this.add.image(x, y, "socket").setAlpha(0.95);
    });

    // 入口閥門 / 出口接點
    const a = this.cellXY(0);
    const b = this.cellXY(PATH.length - 1);
    this.add.image(a.x - TILE / 2 - 14, a.y, "pipe_valve").setDisplaySize(42, 42);
    this.add.text(a.x - TILE / 2 - 14, a.y - 32, tt("閥門", "Valve"), { fontFamily: "sans-serif", fontSize: "11px", color: "#ffba6b" }).setOrigin(0.5);
    this.add.image(b.x + TILE / 2 + 14, b.y, "pipe_mainline").setDisplaySize(42, 42);
    this.add.text(b.x + TILE / 2 + 14, b.y - 32, tt("主幹", "Main"), { fontFamily: "sans-serif", fontSize: "11px", color: "#8fb3c4" }).setOrigin(0.5);

    // manual 變體:手冊幽靈提示(顯示每格需要的接口方向)
    if (this.variant === "manual") {
      PATH.forEach((_, i) => {
        const req = this.requiredConns(i);
        const { x, y } = this.cellXY(i);
        const cont = this.add.container(x, y);
        req.forEach((d) => {
          const off = 26;
          const dx = d === 1 ? off : d === 3 ? -off : 0;
          const dy = d === 2 ? off : d === 0 ? -off : 0;
          cont.add(this.add.rectangle(dx, dy, d % 2 ? 14 : 5, d % 2 ? 5 : 14, 0x00f5ff, 0.35));
        });
        this.ghosts.push(cont);
      });
    }

    // 蒸氣粒子(掛在第一個斷點)
    this.steam = this.add.particles(0, 0, "puff", {
      speed: { min: 30, max: 80 },
      angle: { min: -120, max: -60 },
      scale: { start: 0.7, end: 1.8 },
      alpha: { start: 0.22, end: 0 },
      lifespan: 900,
      frequency: 60,
      tint: 0xdfeaf2,
    });
  }

  // assist 變體:預先鎖定 3 格正確管件
  private prefillAssist() {
    [1, 3, 5].forEach((slotIdx) => {
      const sol = this.solutionFor(slotIdx);
      const { x, y } = this.cellXY(slotIdx);
      const spr = this.add.image(x, y, `pipe_${sol.kind}`).setAngle(sol.rot * 90).setTint(0xbfd9e6);
      const piece: PlacedPiece = { sprite: spr, kind: sol.kind, rot: sol.rot, slot: slotIdx, locked: true };
      this.slots[slotIdx] = piece;
      this.pieces.push(piece);
    });
  }

  private spawnTray() {
    if (this.variant === "assist") this.prefillAssist();
    const needed = PATH.map((_, i) => this.solutionFor(i));
    const open = needed.filter((_, i) => !this.slots[i]);
    // 需要的種類 + 2 個干擾件,隨機角度
    const kinds: PieceKind[] = [...open.map((s) => s.kind), "elbow", "straight"];
    Phaser.Utils.Array.Shuffle(kinds);

    kinds.forEach((kind, i) => {
      const x = 180 + i * 78;
      const y = 478;
      const spr = this.add.image(x, y, `pipe_${kind}`).setAngle(Phaser.Math.Between(0, 3) * 90).setScale(0.82);
      const piece: PlacedPiece = {
        sprite: spr,
        kind,
        rot: (spr.angle / 90 + 4) % 4,
        slot: null,
        locked: false,
      };
      spr.setData("piece", piece);
      spr.setInteractive({ useHandCursor: true, draggable: true });
      this.pieces.push(piece);
    });
  }

  private setupDrag() {
    let dragStartSlot: number | null = null;

    this.input.on("drag", (_p: unknown, obj: Phaser.GameObjects.Image, x: number, y: number) => {
      const piece = obj.getData("piece") as PlacedPiece;
      if (piece.locked || this.solved) return;
      obj.setPosition(x, y).setDepth(10).setScale(1);
      if (piece.slot !== null) {
        this.slots[piece.slot] = null;
        dragStartSlot = piece.slot;
        piece.slot = null;
        this.updateFlow();
      }
    });

    this.input.on("dragend", (_p: unknown, obj: Phaser.GameObjects.Image) => {
      const piece = obj.getData("piece") as PlacedPiece;
      if (piece.locked || this.solved) return;
      obj.setDepth(1);
      // 找最近空凹槽
      let best = -1;
      let bestD = 48;
      PATH.forEach((_, i) => {
        if (this.slots[i]) return;
        const { x, y } = this.cellXY(i);
        const d = Phaser.Math.Distance.Between(obj.x, obj.y, x, y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      if (best >= 0) {
        const { x, y } = this.cellXY(best);
        obj.setPosition(x, y);
        piece.slot = best;
        this.slots[best] = piece;
        this.moves += 1;
        sfx.snap();
        this.tweens.add({ targets: obj, scale: { from: 1.15, to: 1 }, duration: 130 });
      } else {
        piece.slot = dragStartSlot !== null && !this.slots[dragStartSlot] ? dragStartSlot : null;
        if (piece.slot !== null) {
          const { x, y } = this.cellXY(piece.slot);
          obj.setPosition(x, y);
          this.slots[piece.slot] = piece;
        } else {
          obj.setScale(0.82).setPosition(obj.x, 478);
        }
      }
      dragStartSlot = null;
      this.updateFlow();
    });

    // 點擊旋轉(放置後)
    this.input.on("gameobjectup", (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
      const piece = (obj as Phaser.GameObjects.Image).getData?.("piece") as PlacedPiece | undefined;
      if (!piece || piece.locked || this.solved) return;
      const pointer = _p;
      if (pointer.getDuration() > 200) return; // 拖曳不旋轉
      if (piece.slot === null) return;
      piece.rot = (piece.rot + 1) % 4;
      this.rotations += 1;
      sfx.rotate();
      this.tweens.add({
        targets: piece.sprite,
        angle: piece.rot * 90,
        duration: 110,
        onComplete: () => this.updateFlow(),
      });
    });
  }

  // ── 連通邏輯 ──
  private conns(piece: PlacedPiece): Dir[] {
    return BASE_CONNS[piece.kind].map((d) => ((d + piece.rot) % 4) as Dir);
  }

  /** 每格的正解(由路徑幾何推導) */
  private solutionFor(i: number): { kind: PieceKind; rot: number } {
    const req = this.requiredConns(i);
    for (const kind of ["straight", "elbow"] as PieceKind[]) {
      for (let rot = 0; rot < 4; rot++) {
        const cs = BASE_CONNS[kind].map((d) => (d + rot) % 4);
        if (req.every((r) => cs.includes(r))) return { kind, rot };
      }
    }
    return { kind: "straight", rot: 0 };
  }

  private requiredConns(i: number): Dir[] {
    const dirTo = (from: Cell, to: Cell): Dir => {
      if (to.gx > from.gx) return 1;
      if (to.gx < from.gx) return 3;
      if (to.gy > from.gy) return 2;
      return 0;
    };
    const inDir: Dir = i === 0 ? ENTRY_DIR : dirTo(PATH[i], PATH[i - 1]);
    const outDir: Dir = i === PATH.length - 1 ? EXIT_DIR : dirTo(PATH[i], PATH[i + 1]);
    return [inDir, outDir];
  }

  /** 回傳目前接通到第幾格(-1=閥門都沒接上) */
  private flowProgress(): number {
    for (let i = 0; i < PATH.length; i++) {
      const piece = this.slots[i];
      if (!piece) return i - 1;
      const need = this.requiredConns(i);
      const have = this.conns(piece);
      if (!need.every((d) => have.includes(d))) return i - 1;
    }
    return PATH.length - 1;
  }

  private updateFlow() {
    if (this.solved) return;
    const prog = this.flowProgress();

    // 已接通管件亮起
    this.slots.forEach((p, i) => {
      if (p) p.sprite.setTint(i <= prog ? 0xffffff : 0x9ab8c6);
    });

    // 水流推進:新接通的段落亮一下脈動(水抵達的感覺)
    if (prog > this.lastProg) {
      for (let i = Math.max(0, this.lastProg + 1); i <= prog; i++) {
        const seg = this.slots[i];
        if (!seg) continue;
        const { x, y } = this.cellXY(i);
        const surge = this.add.image(x, y, `pipe_${seg.kind}`).setAngle(seg.rot * 90).setTint(0x9ef7ec).setAlpha(0.9);
        this.tweens.add({ targets: surge, alpha: 0, scale: 1.25, duration: 320, onComplete: () => surge.destroy() });
      }
      sfx.snap();
    }
    this.lastProg = prog;

    // 蒸氣移到第一個斷點;接通越多,洩漏越弱
    const leakIdx = Math.min(prog + 1, PATH.length - 1);
    const { x, y } = this.cellXY(leakIdx);
    this.steam.setPosition(x, y - 10);
    this.steam.frequency = prog >= PATH.length - 1 ? 9999 : 60 - prog * 6;

    if (prog === PATH.length - 1) this.onSolved();
  }

  private autoSolve() {
    PATH.forEach((_, i) => {
      const sol = this.solutionFor(i);
      let piece = this.slots[i];
      if (piece && (piece.kind !== sol.kind || piece.rot !== sol.rot)) {
        this.slots[i] = null;
        piece.sprite.setPosition(180 + i * 78, 478).setScale(0.82);
        piece.slot = null;
        piece = null;
      }
      if (!piece) {
        const cand = this.pieces.find((p) => p.slot === null && p.kind === sol.kind);
        if (cand) {
          const { x, y } = this.cellXY(i);
          cand.sprite.setPosition(x, y).setScale(1);
          cand.rot = sol.rot;
          cand.sprite.setAngle(sol.rot * 90);
          cand.slot = i;
          this.slots[i] = cand;
        }
      } else if (piece.rot !== sol.rot) {
        piece.rot = sol.rot;
        piece.sprite.setAngle(sol.rot * 90);
      }
    });
    this.updateFlow();
  }

  private onSolved() {
    this.solved = true;
    this.steam.stop();
    sfx.solve();
    this.cameras.main.flash(200, 53, 224, 200);
    riasec.log("minigame_done", {
      id: "pipe",
      ms: Math.round(this.time.now - this.startedAt),
      rotations: this.rotations,
      moves: this.moves,
      variant: this.variant,
    });

    this.ghosts.forEach((g) => g.destroy());
    const toast = this.add
      .text(480, 96, tt("管路壓力:穩定 ▮▮▮▮▮", "Pipe pressure: stable ▮▮▮▮▮"), {
        fontFamily: "sans-serif",
        fontSize: "18px",
        color: "#35e0c8",
        backgroundColor: "#0e1d2a",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({ targets: toast, alpha: 1, duration: 300 });

    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.stop();
        this.scene.resume(this.from);
      });
    });
  }
}
