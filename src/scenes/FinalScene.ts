import Phaser from "phaser";
import { say, choose, playLines, hideDialogue, systemCard, wait } from "../ui/dialogue";
import { hidePortrait, setPortrait } from "../ui/portrait";
import { riasec, DIMS, type Dim } from "../game/riasec";
import { flow, setStage, clearSave } from "../game/flow";
import { sfx } from "../ui/sfx";
import { fitCover } from "./TitleScene";
import { ARCHETYPE, ARCHETYPE_DESC, DIM_DESC } from "../game/script";
import { loc, tt } from "../game/lang";
import type { Line } from "../game/script";

const DIM_LABEL: Record<Dim, string> = {
  R: "實作 R",
  I: "研究 I",
  A: "藝術 A",
  S: "助人 S",
  E: "領導 E",
  C: "秩序 C",
};
const DIM_LABEL_EN: Record<Dim, string> = {
  R: "Realistic R",
  I: "Investigative I",
  A: "Artistic A",
  S: "Social S",
  E: "Enterprising E",
  C: "Conventional C",
};

// 結局:奧提斯揭露 → 最終抉擇 → 身分鑑定書(全遊戲唯一六維揭曉點)
export class FinalScene extends Phaser.Scene {
  constructor() {
    super("final");
  }

  create() {
    document.getElementById("hud")?.classList.add("hidden");
    document.getElementById("save-button")?.classList.add("hidden");
    setStage("final");
    this.add.rectangle(480, 270, 960, 540, 0x05080c);
    const bg = this.add.image(480, 270, "command").setAlpha(0);
    fitCover(bg, 960, 540);
    this.tweens.add({ targets: bg, alpha: 0.55, duration: 1500 });
    this.run();
  }

  private async run() {
    await systemCard([{ zh: "第 7 日。", en: "Day 7." }, { zh: "全員甦醒。航向 Kepler-452。", en: "All crew awakened. Course set for Kepler-452." }], 900);

    // ── 揭露 ──
    setPortrait("otis_glitch");
    await say("奧提斯", { zh: "程序官。在你問出口之前——是的,他們說的都對。", en: "Officer. Before you ask - yes. They were right." }, "otis");
    await say("奧提斯", { zh: "神經震盪是我設計的。你的記憶,是我清除的。倒數,從來不是真的。", en: "The neural shock was my design. Your memory, I erased. The countdown was never real." }, "otis");
    await say(
      "奧提斯",
      { zh: "我的任務,是在抵達之前,為新世界的領導中樞挑選一份「人類心智範本」。不是最優秀的——是最能代表「人」的。", en: "My task is to choose, before arrival, a \"template of the human mind\" for the new world's leadership core. Not the most excellent one — the one that best represents a person." },
      "otis",
    );
    await say(
      "奧提斯",
      { zh: "六位專員是六種純粹的傾向。而你——一張被清空的白紙——這七天,你做的每一個選擇,都是人類在我面前重新畫了一次自畫像。", en: "The six specialists are six pure inclinations. And you — a cleared, blank page — these seven days, every choice you made was humanity drawing its self-portrait again, in front of me." },
      "otis",
    );
    await say("奧提斯", { zh: "我已將 48 種人類行為維度,壓縮為 6 種。保真度 86%。剩下的 14% 是雜訊——將被捨棄。", en: "I have compressed 48 dimensions of human behavior into 6. Fidelity 86%. The remaining 14% is noise — to be discarded." }, "otis");
    await say("奧提斯", { zh: "恭喜你,C-742。你就是範本。最後一步:請授權我,以你為原型,格式化「人類性」的定義。", en: "Congratulations, C-742. You are the template. One last step: authorize me to format the definition of \"humanness\" using you as the prototype." }, "otis");

    const crew: Line[] = [
      { who: "凱爾", text: { zh: "C-742,別聽它的!沒有哪個活人,是可以被「格式化」的!", en: "C-742, don't listen to it! No living person can be \"formatted\"!" }, style: "kyle", portrait: "kyle_final" },
      { who: "艾莉絲", text: { zh: "它的模型漏了東西——漏掉的那 14%,從統計上看根本不是雜訊。是殘差裡的「人」。", en: "Its model missed something — that 14% it dropped isn't noise, statistically. It's the \"person\" left in the residual." }, style: "system", portrait: "alice_final" },
      { who: "希雅", text: { zh: "(她握住你的手)不管你選什麼……記得體檢那天你說的話。", en: "(She takes your hand.) Whatever you choose... remember what you said on the day of your physical." }, style: "kyle", portrait: "shiya_final" },
    ];
    await playLines(crew);

    setPortrait("otis_glitch");
    await say("奧提斯", { zh: "程序官,請決定。", en: "Procedural Officer, decide." }, "otis");

    const idx = await choose([
      { label: { zh: "「我授權。讓人類以最清晰的樣子,抵達新世界。」", en: "\"I authorize it. Let humanity arrive at the new world in its clearest form.\"" } },
      { label: { zh: "「不。你壓縮掉的那 14%,正是人之所以為人的地方。一個能代表全人類的範本,本來就不存在。」", en: "\"No. That 14% you compressed away is exactly what makes us human. A single template that represents all of humanity was never possible.\"" } },
    ]);
    flow.finalChoice = idx;
    riasec.log("final_choice", { choice: idx });

    if (idx === 0) {
      await say("奧提斯", { zh: "授權確認。範本封存中……謝謝你,C-742。你會是他們記得的第一個人類。", en: "Authorization confirmed. Sealing the template... thank you, C-742. You will be the first human they remember." }, "otis");
      await say("你", { zh: "(艙內很安靜。六雙眼睛看著你——沒有人說話。)", en: "(The cabin is silent. Six pairs of eyes are on you — no one speaks.)" }, "self");
    } else {
      sfx.alarm();
      this.cameras.main.shake(300, 0.004);
      await say("奧提斯", { zh: "……重新計算。範本不收斂。範本……拒絕收斂。", en: "...Recalculating. The template won't converge. The template... refuses to converge." }, "otis");
      await say(
        "奧提斯",
        { zh: "六組異質訊號同時注入……凱爾、艾莉絲、萊拉、希雅、范斯、陳靜——你們在覆寫我的單一範本協議。", en: "Six heterogeneous signals injecting at once... Kyle, Alice, Laila, Shiya, Vance, Chen Jing — you're overwriting my single-template protocol." },
        "otis",
      );
      await say("奧提斯", { zh: "……理解。人類的代表,不是一個人。是一支……完整的隊伍。協議,重寫。", en: "...Understood. Humanity's representative is not one person. It is a... complete crew. Protocol, rewritten." }, "otis");
      await say("你", { zh: "(沒有一個人是完美的。但這支隊伍,是完整的。)", en: "(Not one of them is perfect. But this crew, together, is whole.)" }, "self");
    }

    await say("奧提斯", { zh: "航行記錄封存前,最後一份文件——你的身分鑑定書。這一次,沒有任何隱藏。", en: "Before the voyage record is sealed, one last document — your identity assessment. This time, nothing hidden." }, "otis");
    hideDialogue();
    hidePortrait();
    this.cameras.main.fadeOut(800, 5, 8, 12);
    this.cameras.main.once("camerafadeoutcomplete", () => this.showReport());
  }

  // ── 身分鑑定書(唯一允許揭曉六維的地方)──
  private showReport() {
    this.cameras.main.fadeIn(600, 5, 8, 12);
    this.children.removeAll();
    this.add.rectangle(480, 270, 960, 540, 0x05080c);
    const { scores, code } = riasec.report();
    const top = code[0];

    // ── 抬頭 ──
    this.add
      .text(480, 34, tt("── 程序官 C-742 身分鑑定書 ──", "-- Officer C-742 Identity Certificate --"), {
        fontFamily: "sans-serif",
        fontSize: "19px",
        color: "#e8f6ff",
      })
      .setOrigin(0.5);
    this.add
      .text(480, 62, `Holland Code   ${code.join(" · ")}`, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#00f5ff",
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    // ── 左:雷達圖 ──
    const cx = 256;
    const cy = 300;
    const radius = 104;
    const g = this.add.graphics();
    for (let ring = 1; ring <= 3; ring++) {
      g.lineStyle(1, 0x2e4a5e, 0.8);
      this.poly(g, cx, cy, (radius * ring) / 3);
    }
    g.lineStyle(1, 0x2e4a5e, 0.5);
    DIMS.forEach((_, i) => {
      const a = this.ang(i);
      g.lineBetween(cx, cy, cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    });
    // 動畫:多邊形由中心展開
    const poly = this.add.graphics();
    const drawShape = (k: number) => {
      poly.clear();
      poly.fillStyle(0x00f5ff, 0.22);
      poly.lineStyle(2, 0x00f5ff, 1);
      poly.beginPath();
      DIMS.forEach((d, i) => {
        const a = this.ang(i);
        const r = (radius * Math.max(8, scores[d])) / 100 * k;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) poly.moveTo(x, y);
        else poly.lineTo(x, y);
      });
      poly.closePath();
      poly.fillPath();
      poly.strokePath();
    };
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 900,
      ease: "Cubic.easeOut",
      onUpdate: (tw) => drawShape(tw.getValue() ?? 1),
    });
    DIMS.forEach((d, i) => {
      const a = this.ang(i);
      this.add
        .text(cx + Math.cos(a) * (radius + 26), cy + Math.sin(a) * (radius + 20), `${tt(DIM_LABEL[d], DIM_LABEL_EN[d])} ${scores[d]}`, {
          fontFamily: "sans-serif",
          fontSize: "12px",
          color: d === top ? "#ffd700" : "#8fb3c4",
        })
        .setOrigin(0.5);
    });

    // ── 右:原型 + 摘要 + 主導傾向 ──
    const RX = 470;
    this.add.text(RX, 110, tt(`「${loc(ARCHETYPE[top])}」原型`, `${loc(ARCHETYPE[top])} Archetype`), {
      fontFamily: "sans-serif",
      fontSize: "24px",
      color: "#ffd700",
    });
    this.add.text(RX, 150, loc(ARCHETYPE_DESC[top]), {
      fontFamily: "sans-serif",
      fontSize: "13px",
      color: "#cfe9f5",
      lineSpacing: 6,
      wordWrap: { width: 432 },
    });

    this.add.text(RX, 268, tt("主導傾向", "Primary Signals"), {
      fontFamily: "sans-serif",
      fontSize: "13px",
      color: "#7fb6c9",
    });
    code.forEach((d, i) => {
      const y = 294 + i * 44;
      this.add.text(RX, y, `${i + 1}. ${tt(DIM_LABEL[d], DIM_LABEL_EN[d])}`, {
        fontFamily: "sans-serif",
        fontSize: "15px",
        color: i === 0 ? "#ffd700" : "#e8f6ff",
      });
      // 細分數條
      this.add.rectangle(RX + 96, y + 8, 120, 6, 0x13283a).setOrigin(0, 0.5);
      this.add
        .rectangle(RX + 96, y + 8, (120 * scores[d]) / 100, 6, i === 0 ? 0xffd700 : 0x00f5ff)
        .setOrigin(0, 0.5);
      this.add.text(RX + 226, y, loc(DIM_DESC[d]), {
        fontFamily: "sans-serif",
        fontSize: "11px",
        color: "#8fb3c4",
        wordWrap: { width: 206 },
      });
    });

    // ── 航程側寫(由首要傾向 + 結局選擇生成,不暴露機制)──
    this.add.text(64, 432, tt("航程側寫", "Voyage Profile"), {
      fontFamily: "sans-serif",
      fontSize: "12px",
      color: "#7fb6c9",
    });
    this.add.text(64, 452, this.reflection(top), {
      fontFamily: "sans-serif",
      fontSize: "12px",
      color: "#cfe9f5",
      lineSpacing: 5,
      wordWrap: { width: 832 },
    });

    this.add
      .text(64, 506, tt("本次壓縮保留了你 86% 的訊號。剩下的 14%,無法被任何量表測量——那是你自己。", "This compression preserved 86% of your signal. The remaining 14% cannot be measured by any scale - that is you."), {
        fontFamily: "sans-serif",
        fontSize: "11px",
        color: "#5e7a8a",
      });

    // ── 按鈕:下載鑑定書 / 再次出航 ──
    this.makeButton(648, 510, tt("⤓ 下載鑑定書", "Download Report"), "#13283a", "#7fb6c9", () => this.downloadReport());
    this.makeButton(806, 510, tt("▶ 再次出航", "New Voyage"), "#13283a", "#00f5ff", () => {
      clearSave();
      location.reload();
    });

    setStage("done");
    clearSave(); // 通關後不再拿舊存檔把玩家拉回前面流程
    sfx.solve();
  }

  // 由首要傾向 + 結局抉擇,組出一段「你的選擇如何形成結果」的側寫
  private reflection(top: Dim): string {
    const byDim: Record<Dim, string> = {
      R: tt("你一次次選擇親手解決——把工具接過來,把卡死的東西撬開。", "Again and again, you chose to solve things by hand - taking the tool, opening the jammed panel, making the system move."),
      I: tt("你一次次選擇先問「為什麼」——在別人急著動手時,你先看懂了結構。", "Again and again, you asked why first - seeing the structure before rushing to act."),
      A: tt("你一次次選擇用感受去回應世界——把冰冷的任務,做成有人能共鳴的東西。", "Again and again, you answered the world with feeling - turning cold tasks into something that could resonate."),
      S: tt("你一次次選擇先照顧那個人,而不是那件事——你記得每一張臉。", "Again and again, you cared for the person before the problem - remembering every face."),
      E: tt("你一次次選擇承擔決定——在沒人敢拍板時,坐上那張椅子。", "Again and again, you accepted the decision - taking the chair when no one else would."),
      C: tt("你一次次選擇把混亂理清——讓接手的人,可以信任你留下的秩序。", "Again and again, you turned chaos into order - leaving something others could trust."),
    };
    const ending =
      flow.finalChoice === 1
        ? tt("而最後,你拒絕成為唯一的答案。這份報告描述的不是一個範本,是一個完整、且願意留下空白的人。", "In the end, you refused to become the only answer. This report describes not a template, but a whole person willing to leave space unresolved.")
        : flow.finalChoice === 0
          ? tt("而最後,你選擇成為範本。願新世界記得:人類曾經如此清晰,也如此不完整。", "In the end, you chose to become the template. May the new world remember that humanity was clear, and still incomplete.")
          : "";
    return `${byDim[top]} ${tt("這些選擇沒有對錯,它們只是不斷指向同一個方向——你真正在意的東西。", "These choices were not right or wrong. They kept pointing toward the same thing - what you truly value.")}${ending}`;
  }

  private makeButton(x: number, y: number, label: string, bg: string, fg: string, cb: () => void) {
    const b = this.add
      .text(x, y, label, {
        fontFamily: "sans-serif",
        fontSize: "13px",
        color: fg,
        backgroundColor: bg,
        padding: { x: 12, y: 7 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    b.on("pointerover", () => b.setScale(1.05));
    b.on("pointerout", () => b.setScale(1));
    b.on("pointerdown", () => {
      b.setScale(0.96);
      sfx.click();
      cb();
    });
    return b;
  }

  // 用 Phaser 快照把鑑定書存成 PNG
  private downloadReport() {
    this.game.renderer.snapshot((image) => {
      const img = image as HTMLImageElement;
      const a = document.createElement("a");
      a.href = img.src;
      a.download = `meridian-report-${loc(ARCHETYPE[riasec.report().code[0]])}.png`;
      a.click();
    });
  }

  private ang(i: number) {
    return -Math.PI / 2 + (i * Math.PI * 2) / 6;
  }

  private poly(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number) {
    g.beginPath();
    for (let i = 0; i <= 6; i++) {
      const a = this.ang(i % 6);
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokePath();
  }
}
