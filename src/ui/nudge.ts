import Phaser from "phaser";
import { loc, type LS } from "../game/lang";
import { flow } from "../game/flow";

// 漸進式鷹架(心流框架「入门→练习→心流」+ Buster 暗中调整):
// 依玩家完成的艙數縮放「第一句提示」出現時機 —— 越早期越快搭手,越後期越給空間。
// 玩家不會感知這個調整,只會覺得入門時 OTIS/角色更願意幫忙。
function scaledFirstMs(): number {
  const done = flow.completedBays.length;
  if (done <= 1) return 9000; // 入门:早点搭手
  if (done <= 3) return 14000; // 练习
  return 18000; // 心流:多留空间自己想
}

// 卡關提示泡:玩家解不出來時,該艙角色從旁邊跳出小對話框,先吐槽、再給提示。
// 逐級升級:lines[0] 多為調侃,最後一句是真正的提示。表現不計分,純體驗。
// 用 Phaser 容器繪製(無需新美術),靠 scene.time / tweens(專案既有可用)。

export interface NudgeOpts {
  speaker: string; // 角色顯示名
  accent?: number; // 主色
  lines: LS[]; // 由調侃 → 提示,逐級升級
  firstMs?: number; // 第一次跳出前的卡關等待(預設 14s)
  repeatMs?: number; // 之後每級間隔(預設 12s)
  anchor?: { x: number; y: number }; // 泡泡左上角錨點(預設左上)
}

export interface NudgeHandle {
  progress: () => void; // 玩家有進展 → 把下一句往後延,別嘮叨
  fail: () => void; // 玩家做錯 → 立刻吐槽下一句
  solved: () => void; // 解開 → 給句收尾並停止
  destroy: () => void;
}

const HEX = (c: number) => `#${c.toString(16).padStart(6, "0")}`;

export function createNudge(scene: Phaser.Scene, opts: NudgeOpts): NudgeHandle {
  const accent = opts.accent ?? 0x7fb6c9;
  const firstMs = opts.firstMs ?? scaledFirstMs();
  const repeatMs = opts.repeatMs ?? 12000;
  const ax = opts.anchor?.x ?? 30;
  const ay = opts.anchor?.y ?? 88;
  const W = 312;

  const layer = scene.add.container(ax, ay).setDepth(60).setAlpha(0);
  const bg = scene.add.graphics();
  const bar = scene.add.rectangle(0, 0, 4, 10, accent).setOrigin(0, 0);
  const name = scene.add.text(16, 11, opts.speaker, { fontFamily: "sans-serif", fontSize: "13px", color: HEX(accent), fontStyle: "bold" });
  const body = scene.add.text(16, 32, "", { fontFamily: "sans-serif", fontSize: "13px", color: "#e8f6ff", wordWrap: { width: W - 32 }, lineSpacing: 4 });
  layer.add([bg, bar, name, body]);

  let idx = 0;
  let alive = true;
  let pending: Phaser.Time.TimerEvent | undefined;
  let hideEvt: Phaser.Time.TimerEvent | undefined;

  const draw = () => {
    const h = 32 + body.height + 14;
    bg.clear();
    bg.fillStyle(0x081016, 0.92);
    bg.fillRoundedRect(0, 0, W, h, 10);
    bg.lineStyle(1, accent, 0.5);
    bg.strokeRoundedRect(0, 0, W, h, 10);
    bar.height = h - 16;
    bar.setPosition(0, 8);
  };

  const show = (line: LS) => {
    if (!alive) return;
    body.setText(loc(line));
    draw();
    scene.tweens.killTweensOf(layer);
    layer.setAlpha(0).setScale(0.96);
    scene.tweens.add({ targets: layer, alpha: 1, scale: 1, duration: 220, ease: "Back.easeOut" });
    hideEvt?.remove();
    hideEvt = scene.time.delayedCall(6500, () => {
      scene.tweens.add({ targets: layer, alpha: 0, duration: 400 });
    });
  };

  const schedule = (ms: number) => {
    pending?.remove();
    pending = scene.time.delayedCall(ms, showNext);
  };

  function showNext() {
    if (!alive || opts.lines.length === 0) return;
    show(opts.lines[Math.min(idx, opts.lines.length - 1)]);
    idx++;
    if (idx < opts.lines.length) schedule(repeatMs); // 還有更深的提示
  }

  schedule(firstMs);

  return {
    progress: () => {
      if (!alive) return;
      schedule(idx === 0 ? firstMs : repeatMs); // 有進展 → 把下一句往後延
    },
    fail: () => {
      if (alive) showNext();
    },
    solved: () => {
      alive = false;
      pending?.remove();
      hideEvt?.remove();
      scene.tweens.add({ targets: layer, alpha: 0, duration: 300, onComplete: () => layer.destroy() });
    },
    destroy: () => {
      alive = false;
      pending?.remove();
      hideEvt?.remove();
      layer.destroy();
    },
  };
}
