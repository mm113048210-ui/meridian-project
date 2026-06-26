import Phaser from "phaser";
import { tt, speakerName } from "../game/lang";
import type { Dim } from "../game/riasec";
import { sfx } from "./sfx";
import { DISPLAY } from "./fonts";
import { burst } from "./fx";

// ── 艙完成羈絆卡(里程碑反饋)────────────────────────────────────
// 取法 YouScience「每局結束給摘要卡」:每喚醒一位專員,跳一張卡 ——
// 角色用一句話說「他理解了你是什麼樣的人」,並亮起 X/6 進度,埋下
// 「全員理解你之後,星火號會告訴你你是誰」的期待鉤,推動玩家完成全部六艙。
// ⛔ 鐵則:這張卡是角色的主觀感悟,不出現任何 RIASEC 維度名稱/數值。
//    羈絆語只承載「維度的味道」,身分鑑定書仍是唯一揭曉點。

const ACCENT: Record<Dim, number> = {
  R: 0xffab40,
  I: 0x448aff,
  A: 0x69f0ae,
  S: 0xff8a80,
  E: 0xffd700,
  C: 0xb0bec5,
};

// 每位專員一句羈絆感悟 —— 捕捉該艙的「味道」,不點破類型。
const BOND_LINE: Record<string, { zh: string; en: string }> = {
  powerbay: { zh: "你做事的時候,手比嘴快。我信得過這種人。", en: "When you work, your hands move before your mouth. I trust people like that." },
  datalab: { zh: "你會問「為什麼」,不只是要一個答案。這種人我見得不多。", en: "You ask why, not just for the answer. I don't meet many like that." },
  muralhall: { zh: "你看得見一個空間裡,還沒被說出口的東西。", en: "You can see what a room hasn't said out loud yet." },
  medbay: { zh: "你會先看人,再看事。這比任何技術都難學。", en: "You look at the person before the problem. That's harder to learn than any skill." },
  command: { zh: "需要有人拍板的時候,你沒有退。我記住了。", en: "When someone had to make the call, you didn't step back. I'll remember that." },
  workshop: { zh: "你懂得:把事情做對,比做完更重要。", en: "You understand — getting it right matters more than getting it done." },
};

export interface BondCardOpts {
  bayKey: string;
  name: string; // 角色名(原始,經 speakerName 處理)
  dim: Dim;
  count: number; // 已理解你的專員數(含本次,1..6)
}

/** 跳出羈絆里程碑卡,點擊任意處後 resolve。在 Phaser 場景內繪製,無需新美術。 */
export function showBondCard(scene: Phaser.Scene, opts: BondCardOpts): Promise<void> {
  return new Promise((resolve) => {
    const acc = ACCENT[opts.dim];
    const W = 540;
    const H = 296;
    const cx = 480;
    const cy = 270;
    const x0 = cx - W / 2;
    const y0 = cy - H / 2;

    const layer = scene.add.container(0, 0).setDepth(72).setAlpha(0);

    // 壓暗背景並擋住輸入
    const veil = scene.add
      .rectangle(cx, cy, 960, 540, 0x03070b, 0.66)
      .setInteractive();

    // 卡片底:深色玻璃 + 頂部原型色描邊 + 微內光
    const g = scene.add.graphics();
    g.fillStyle(0x0a151f, 0.98);
    g.fillRoundedRect(x0, y0, W, H, 16);
    g.lineStyle(1, 0x2e4a5e, 0.7);
    g.strokeRoundedRect(x0, y0, W, H, 16);
    g.fillStyle(acc, 1);
    g.fillRoundedRect(x0, y0, W, 3, { tl: 16, tr: 16, bl: 0, br: 0 });

    const kicker = scene.add
      .text(cx, y0 + 34, tt("連結建立", "Bond formed"), {
        fontFamily: "sans-serif",
        fontSize: "12px",
        color: "#7fa6b8",
      })
      .setOrigin(0.5);
    kicker.setLetterSpacing?.(3);

    const who = scene.add
      .text(cx, y0 + 64, tt(`${speakerName(opts.name)} 理解了你`, `${speakerName(opts.name)} understands you`), {
        fontFamily: DISPLAY,
        fontSize: "21px",
        fontStyle: "600",
        color: "#e8f6ff",
      })
      .setOrigin(0.5);

    // 羈絆感悟(角色主觀;不露維度)
    const line = BOND_LINE[opts.bayKey] ?? { zh: "", en: "" };
    const quote = scene.add
      .text(cx, y0 + 122, `「${tt(line.zh, line.en)}」`, {
        fontFamily: "serif",
        fontSize: "16px",
        fontStyle: "italic",
        color: "#cfe8f4",
        align: "center",
        wordWrap: { width: W - 72 },
        lineSpacing: 6,
      })
      .setOrigin(0.5);

    // 進度:6 顆點,已完成的亮,本次最亮並用原型色
    const dotsY = y0 + H - 70;
    const gap = 30;
    const startX = cx - (gap * 5) / 2;
    const dots: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 6; i++) {
      const done = i < opts.count;
      const isCurrent = i === opts.count - 1;
      const color = isCurrent ? acc : done ? 0x35e0c8 : 0x2e4a5e;
      const dot = scene.add
        .circle(startX + i * gap, dotsY, isCurrent ? 6 : 5, color, done ? 1 : 0.5)
        .setScale(isCurrent ? 0.1 : 1);
      dots.push(dot);
      layer.add(dot);
    }
    const progress = scene.add
      .text(cx, dotsY + 24, tt(`${opts.count} / 6 位專員理解了你`, `${opts.count} / 6 specialists understand you`), {
        fontFamily: "sans-serif",
        fontSize: "12px",
        color: "#7fa6b8",
      })
      .setOrigin(0.5);

    // 期待鉤(未滿六位才顯示)/ 完成提示(滿六位)
    const hookMsg =
      opts.count >= 6
        ? tt("六位都理解你了。星火號準備好告訴你——你是誰。", "All six understand you now. Meridian is ready to tell you who you are.")
        : tt("六位都理解你之後,星火號會告訴你——你是誰。", "Once all six understand you, Meridian will tell you who you are.");
    const hook = scene.add
      .text(cx, y0 + H - 18, hookMsg, {
        fontFamily: "sans-serif",
        fontSize: "12px",
        color: opts.count >= 6 ? "#9be9ff" : "#5e7a8a",
        align: "center",
        wordWrap: { width: W - 64 },
      })
      .setOrigin(0.5);

    const tapHint = scene.add
      .text(x0 + W - 16, y0 + 18, tt("點擊繼續 ▸", "Tap to continue ▸"), {
        fontFamily: "sans-serif",
        fontSize: "11px",
        color: "#5e7a8a",
      })
      .setOrigin(1, 0.5);

    layer.add([veil, g, kicker, who, quote, progress, hook, tapHint]);

    sfx.solve();
    scene.tweens.add({ targets: layer, alpha: 1, duration: 320, ease: "Sine.easeOut" });
    // 本次的進度點:延遲彈入,作為「剛剛達成」的視覺獎勵
    const current = dots[opts.count - 1];
    if (current) {
      scene.tweens.add({
        targets: current,
        scale: 1,
        delay: 300,
        duration: 420,
        ease: "Back.easeOut",
        onStart: () => {
          sfx.repair();
          burst(scene, current.x, dotsY, { color: acc, count: 12, speed: 95, depth: 73, scale: 0.4 });
        },
      });
    }
    scene.tweens.add({ targets: tapHint, alpha: { from: 1, to: 0.4 }, duration: 1100, yoyo: true, repeat: -1 });

    let closing = false;
    veil.on("pointerdown", () => {
      if (closing) return;
      closing = true;
      sfx.click();
      scene.tweens.add({
        targets: layer,
        alpha: 0,
        duration: 220,
        ease: "Sine.easeIn",
        onComplete: () => {
          layer.destroy(true);
          resolve();
        },
      });
    });
  });
}
