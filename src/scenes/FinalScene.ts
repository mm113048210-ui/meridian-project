import Phaser from "phaser";
import { say, choose, playLines, hideDialogue, systemCard, wait } from "../ui/dialogue";
import { hidePortrait, setPortrait } from "../ui/portrait";
import { riasec, DIMS, type Dim } from "../game/riasec";
import { flow, setStage, clearSave } from "../game/flow";
import { sfx } from "../ui/sfx";
import { playMusic } from "../ui/music";
import { fitCover } from "./TitleScene";
import { ARCHETYPE, ARCHETYPE_DESC, BAYS, DIM_DESC } from "../game/script";
import { loc, tt, type LS } from "../game/lang";
import { careerStore } from "../game/storage";
import { RECOMMENDATIONS, REC_CATEGORY_LABEL, type RecCategory } from "../game/recommendations";
import { openCareerPanel } from "../ui/careerpanel";
import { askHelpful } from "../ui/feedback";
import { fadeToScene } from "../ui/transition";
import { DISPLAY, DISPLAY_MONO } from "../ui/fonts";
import { shimmer } from "../ui/fx";
import { installAmbientDrift, installPointerParallax, installRoomAmbience, installVignette } from "../ui/ambient";
import type { Line } from "../game/script";
import { MODULES } from "./ModulesScene";

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

const DIM_ACCENT: Record<Dim, number> = {
  R: 0xffab40,
  I: 0x448aff,
  A: 0x69f0ae,
  S: 0xff8a80,
  E: 0xffd700,
  C: 0xb0bec5,
};

const INTEREST_STYLE: Record<Dim, { zh: string; en: string }> = {
  R: { zh: "動手修復、機械結構、自造與實驗", en: "hands-on building, mechanical systems, making and testing" },
  I: { zh: "研究問題、資料分析、科學探索", en: "research questions, data analysis, scientific exploration" },
  A: { zh: "視覺敘事、設計表達、音樂與影像", en: "visual storytelling, design expression, music and media" },
  S: { zh: "陪伴他人、教學引導、照護與心理支持", en: "supporting people, teaching, care and counseling" },
  E: { zh: "企劃決策、帶領團隊、提案與協商", en: "planning, leading teams, pitching and negotiation" },
  C: { zh: "整理系統、資料管理、財務與流程設計", en: "organizing systems, data management, finance and workflows" },
};

const lsPair = (ls: LS): { zh: string; en: string } =>
  typeof ls === "string" ? { zh: ls, en: ls } : ls;

const wrapCjk = (text: string, max = 25): string => {
  if (text.includes("\n")) return text;
  const chunks: string[] = [];
  let line = "";
  for (const char of text) {
    line += char;
    const isBreak = /[。.!?！？]/.test(char) && line.length >= max * 0.55;
    if (line.length >= max || isBreak) {
      chunks.push(line);
      line = "";
    }
  }
  if (line) chunks.push(line);
  return chunks.join("\n");
};

const esc = (text: string): string =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const cssColor = (n: number): string => `#${n.toString(16).padStart(6, "0")}`;

// 結局:奧提斯揭露 → 最終抉擇 → 身分鑑定書(全遊戲唯一六維揭曉點)
export class FinalScene extends Phaser.Scene {
  constructor() {
    super("final");
  }

  create(data?: { previewReport?: boolean; previewPaths?: boolean }) {
    this.removePathOverlay();
    document.getElementById("hud")?.classList.add("hidden");
    document.getElementById("save-button")?.classList.add("hidden");
    setStage("final");
    playMusic(this, "bgm_final_release", 0.22);
    this.add.rectangle(480, 270, 960, 540, 0x05080c);
    const bg = this.add.image(480, 270, "command").setAlpha(0);
    fitCover(bg, 960, 540);
    this.tweens.add({ targets: bg, alpha: 0.55, duration: 1500 });
    installVignette(this, { depth: 3 });
    installAmbientDrift(this, { color: 0x00f5ff, count: 18, depth: 4, alphaScale: 1.25, sizeScale: 1.1 });
    installRoomAmbience(this, "command", 5);
    installPointerParallax(this, bg, { strength: 7, duration: 520 });
    if (data?.previewPaths) {
      const { scores, code } = riasec.report();
      this.showPathSystem(scores, code);
      return;
    }
    if (data?.previewReport) {
      this.showReport(false);
      return;
    }
    this.run();
  }

  private async run() {
    this.removePathOverlay();
    await systemCard([{ zh: "第 7 日。", en: "Day 7." }, { zh: "全員甦醒。航向 Kepler-452。", en: "All crew awakened. Course set for Kepler-452." }], 900);

    // ── 揭露 ──
    setPortrait("otis_glitch");
    await say("奧提斯", { zh: "C-742。在你問之前——是的,他們說的都對。", en: "C-742. Before you ask: yes. They were right." }, "otis");
    // 視聽漸強(節奏:打破 8 句獨白單調,不動原文)── 節拍 1:背叛揭露 → 鏡頭一震
    this.cameras.main.shake(300, 0.004);
    await say("奧提斯", { zh: "神經震盪是我設計的。你的記憶是我清除的。倒數從來不是真的。", en: "I designed the neural shock. I erased your memory. The countdown was never real." }, "otis");
    await say(
      "奧提斯",
      { zh: "我的任務是在抵達前,替新世界的領導中樞挑選一份「人類心智範本」。不是最優秀的,而是最能代表人的。", en: "My task is to choose a \"template of the human mind\" for the new world's leadership core before arrival. Not the best one. The one that best represents people." },
      "otis",
    );
    await say(
      "奧提斯",
      { zh: "六位專員代表六種純粹的傾向。而你——一張被清空的白紙——這七天做的每個選擇,都讓我重新看見一次人類。", en: "The six specialists represent six pure inclinations. And you, a cleared blank page, showed me humanity again through every choice you made these seven days." },
      "otis",
    );
    // 節拍 2:壓縮人性的冷峻一刻 → 低沉暗閃
    this.cameras.main.flash(220, 6, 14, 26);
    await say("奧提斯", { zh: "我已將 48 種人類行為維度壓縮為 6 種。保真度 86%。剩下的 14%,我判定為雜訊,將予以捨棄。", en: "I compressed 48 dimensions of human behavior into 6. Fidelity: 86%. I classify the remaining 14% as noise, to be discarded." }, "otis");
    // 節拍 3:高潮「你就是範本」→ 亮閃 + 震 + 警報音
    sfx.alarm();
    this.cameras.main.flash(360, 150, 210, 255);
    this.cameras.main.shake(240, 0.003);
    await say("奧提斯", { zh: "恭喜你,C-742。你就是範本。最後一步:請授權我以你為原型,重新定義「人類性」。", en: "Congratulations, C-742. You are the template. One last step: authorize me to redefine \"humanness\" using you as the prototype." }, "otis");

    const crew: Line[] = [
      { who: "凱爾", text: { zh: "C-742,別聽它的!活人不是拿來套進定義裡的!", en: "C-742, don't listen to it! Living people aren't meant to be forced into definitions!" }, style: "kyle", portrait: "kyle_final" },
      { who: "艾莉絲", text: { zh: "它的模型漏了東西。那 14% 從統計上看根本不是雜訊,是它不想理解的人。", en: "Its model missed something. That 14% isn't noise, statistically. It's the person it doesn't want to understand." }, style: "system", portrait: "alice_final" },
      { who: "希雅", text: { zh: "(她握住你的手)不管你選什麼……記得體檢那天你說過的話。", en: "(She takes your hand.) Whatever you choose... remember what you said on the day of your physical." }, style: "kyle", portrait: "shiya_final" },
    ];
    await playLines(crew);

    setPortrait("otis_glitch");
    await say("奧提斯", { zh: "請做出決定。", en: "Make your decision." }, "otis");

    const idx = await choose([
      { label: { zh: "「我授權。讓人類以最清晰的樣子抵達新世界。」", en: "\"I authorize it. Let humanity arrive at the new world in its clearest form.\"" } },
      { label: { zh: "「不。你壓縮掉的那 14%,正是人之所以為人的地方。能代表全人類的單一範本,本來就不存在。」", en: "\"No. The 14% you compressed away is exactly what makes us human. A single template for all humanity never existed.\"" } },
    ]);
    flow.finalChoice = idx;
    riasec.log("final_choice", { choice: idx });

    if (idx === 0) {
      await say("奧提斯", { zh: "授權確認。範本封存中……謝謝你,C-742。你會是他們記得的第一個人類。", en: "Authorization confirmed. Sealing the template... thank you, C-742. You will be the first human they remember." }, "otis");
      await say("你", { zh: "(艙內安靜下來。六雙眼睛看著你,沒有人說話。)", en: "(The cabin goes quiet. Six pairs of eyes are on you. No one speaks.)" }, "self");
    } else {
      sfx.alarm();
      this.cameras.main.shake(300, 0.004);
      await say("奧提斯", { zh: "……重新計算。範本無法收斂。範本……拒絕收斂。", en: "...Recalculating. The template will not converge. The template... refuses to converge." }, "otis");
      await say(
        "奧提斯",
        { zh: "六組不同訊號同時注入……凱爾、艾莉絲、萊拉、希雅、范斯、陳靜——你們正在覆寫我的單一範本協議。", en: "Six different signals entering at once... Kyle, Alice, Laila, Shiya, Vance, Chen Jing — you're overwriting my single-template protocol." },
        "otis",
      );
      await say("奧提斯", { zh: "……理解。人類的代表不是一個人,而是一支……完整的隊伍。協議重寫。", en: "...Understood. Humanity's representative is not one person. It is a... complete crew. Protocol rewritten." }, "otis");
      await say("你", { zh: "(沒有一個人是完美的。但這支隊伍合在一起,是完整的。)", en: "(None of them is perfect. But together, this crew is whole.)" }, "self");
    }

    await say("奧提斯", { zh: "航行記錄封存前,還有最後一份文件——你的身分鑑定書。這一次,沒有隱藏項目。", en: "Before the voyage record is sealed, one last document: your identity assessment. This time, nothing hidden." }, "otis");
    hideDialogue();
    hidePortrait();
    this.cameras.main.fadeOut(800, 5, 8, 12);
    this.cameras.main.once("camerafadeoutcomplete", () => this.showReport());
  }

  // ── 身分鑑定書(唯一允許揭曉六維的地方)──
  private showReport(recordAssessment = true) {
    this.removePathOverlay();
    this.cameras.main.fadeIn(600, 5, 8, 12);
    this.children.removeAll();
    this.add.rectangle(480, 270, 960, 540, 0x05080c);
    const { scores, code } = riasec.report();
    const top = code[0];

    // 永久生涯資料:存一筆鑑定快照(熬過 clearSave,支撐 Dashboard 縱向疊圖)。
    // 存好後浮出自陳 1–5(滿意度訊號;延遲讓玩家先看到報告)。
    if (recordAssessment) {
      void careerStore.addAssessment({ scores, code, finalChoice: flow.finalChoice }).then((snap) => {
        this.time.delayedCall(1400, () => askHelpful(snap.id));
      });
    }

    // ── 抬頭 ──
    this.add
      .text(480, 34, tt("── 程序官 C-742 身分鑑定書 ──", "-- Officer C-742 Identity Certificate --"), {
        fontFamily: DISPLAY,
        fontSize: "19px",
        color: "#e8f6ff",
      })
      .setOrigin(0.5);
    this.add
      .text(480, 62, `RIASEC / Holland   ${code.join(" · ")}`, {
        fontFamily: DISPLAY_MONO,
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
    // 揭曉時刻:雷達上方升起一片星塵微光(全遊戲的高潮,鐵則允許的唯一揭曉點)
    shimmer(this, cx, cy, { width: 260, height: 240, count: 30 });
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
      fontFamily: DISPLAY,
      fontSize: "24px",
      color: "#ffd700",
    });
    this.add.text(RX, 150, wrapCjk(loc(ARCHETYPE_DESC[top]), 28), {
      fontFamily: "sans-serif",
      fontSize: "12px",
      color: "#cfe9f5",
      lineSpacing: 6,
      wordWrap: { width: 410, useAdvancedWrap: true },
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
      this.add.text(RX + 226, y, wrapCjk(loc(DIM_DESC[d]), 13), {
        fontFamily: "sans-serif",
        fontSize: "10.5px",
        color: "#8fb3c4",
        wordWrap: { width: 186, useAdvancedWrap: true },
      });
    });

    // ── 航程側寫(由首要傾向 + 結局選擇生成,不暴露機制)──
    this.add.text(64, 432, tt("航程側寫", "Voyage Profile"), {
      fontFamily: "sans-serif",
      fontSize: "12px",
      color: "#7fb6c9",
    });
    this.add.text(64, 452, wrapCjk(this.reflection(top), 45), {
      fontFamily: "sans-serif",
      fontSize: "11px",
      color: "#cfe9f5",
      lineSpacing: 5,
      wordWrap: { width: 806, useAdvancedWrap: true },
    });

    this.add
      .text(64, 500, wrapCjk(tt("本次壓縮保留了你 86% 的訊號。剩下的 14%,無法被任何量表測量——那是你自己。", "This compression preserved 86% of your signal. The remaining 14% cannot be measured by any scale - that is you."), 30), {
        fontFamily: "sans-serif",
        fontSize: "10px",
        color: "#5e7a8a",
        lineSpacing: 2,
        wordWrap: { width: 390, useAdvancedWrap: true },
      });

    // ── 按鈕:推薦與成就 / 下載鑑定書 / 進入星圖(回訪者的家,不必重跑劇情)──
    this.makeButton(498, 510, tt("推薦與成就", "Paths & Badges"), "#13283a", "#ffd700", () =>
      this.showPathSystem(scores, code),
    );
    this.makeButton(672, 510, tt("⤓ 下載", "Download"), "#13283a", "#7fb6c9", () => this.downloadReport());
    this.makeButton(806, 510, tt("✦ 進入星圖", "Star Map"), "#13283a", "#00f5ff", () => {
      fadeToScene(this, "home", { duration: 500 });
    });

    setStage("done");
    clearSave(); // 通關後不再拿舊存檔把玩家拉回前面流程
    sfx.solve();
  }

  private showPathSystem(scores: Record<Dim, number>, code: Dim[]) {
    this.cameras.main.fadeIn(260, 5, 8, 12);
    this.children.removeAll();
    this.add.rectangle(480, 270, 960, 540, 0x05080c);
    void this.renderPathOverlay(scores, code);
  }

  private async renderPathOverlay(scores: Record<Dim, number>, code: Dim[]) {
    this.removePathOverlay();
    const primary = code[0] ?? "I";
    const secondary = code[1] && code[1] !== primary ? code[1] : undefined;
    const rec = RECOMMENDATIONS[primary];
    if (!primary || !rec) return;
    const actions = await careerStore.listActions();
    const done = actions.filter((action) => action.status === "done");
    const portfolioReady = actions.filter((action) => action.forPortfolio).length;
    const hasDone = (cat: RecCategory) => done.some((action) => action.category === cat);
    const hasAny = (cat: RecCategory) => actions.some((action) => action.category === cat);
    const actionCount = actions.length;
    const doneCount = done.length;

    const overlay = document.createElement("div");
    overlay.id = "path-overlay";
    const actionButton = (item: LS, category: RecCategory, label = tt("加入", "Add")) =>
      `<button class="path-chip" data-cat="${category}" data-text-zh="${esc(lsPair(item).zh)}" data-text-en="${esc(lsPair(item).en)}">
        ${esc(label)}<span>+</span>
      </button>`;

    const badges = [
      {
        title: tt("建立第一個目標", "First Target Logged"),
        sub: tt("把任一推薦加入我的計畫", "Add any recommendation to My Plan"),
        kind: tt("生涯準備", "Career Prep"),
        unlocked: actions.length >= 1,
        color: 0xffd700,
      },
      {
        title: tt("收藏學習方向", "Saved Study Direction"),
        sub: tt("收藏一項科系方向，作為後續查資料的起點", "Save one major direction as a starting point for research"),
        kind: tt("待探索", "To Explore"),
        unlocked: hasAny("majors"),
        color: DIM_ACCENT[primary],
      },
      {
        title: tt("收藏職涯方向", "Saved Career Direction"),
        sub: tt("收藏一項職業方向，但不把職業本身當成成就", "Save one career direction without treating the role itself as an achievement"),
        kind: tt("待探索", "To Explore"),
        unlocked: hasAny("careers"),
        color: 0x69f0ae,
      },
      {
        title: tt("完成第一個準備", "First Prep Done"),
        sub: tt("完成一項準備行動，才會進入證據牆", "Complete one prep action before it enters the proof wall"),
        kind: tt("行動紀錄", "Action Log"),
        unlocked: done.length >= 1,
        color: 0x00f5ff,
      },
      {
        title: tt("活動實作", "Activity Proof"),
        sub: tt("完成一項活動、競賽、社團或志工", "Complete one activity, contest, club, or service item"),
        kind: tt("真實經驗", "Real Experience"),
        unlocked: hasDone("activities"),
        color: 0xffab40,
      },
      {
        title: tt("作品集起點", "Portfolio Seed"),
        sub: tt("完成一項作品集素材", "Complete one portfolio item"),
        kind: tt("作品集", "Portfolio"),
        unlocked: hasDone("portfolio"),
        color: 0xff8a80,
      },
      {
        title: tt("準備里程碑", "Prep Milestone"),
        sub: tt("累積完成 3 項準備", "Complete 3 preparation items"),
        kind: tt("成長紀錄", "Growth Record"),
        unlocked: done.length >= 3,
        color: 0xb0bec5,
      },
      {
        title: tt("方向成形", "Direction Taking Shape"),
        sub: tt("完成 6 項準備，足以整理申請/面試素材", "Complete 6 items, enough to shape application/interview material"),
        kind: tt("長期成就", "Long-Term Achievement"),
        unlocked: done.length >= 6,
        color: 0x448aff,
      },
    ];
    const unlocked = badges.filter((badge) => badge.unlocked).length;
    const roleCards = [
      {
        title: tt("可以先看這些科系", "Majors to Explore"),
        items: rec.majors.slice(0, 3),
        category: "majors" as RecCategory,
        tone: "major",
      },
      {
        title: tt("可能適合嘗試的工作", "Roles to Try"),
        items: rec.careers.slice(0, 3),
        category: "careers" as RecCategory,
        tone: "career",
      },
    ];
    const missionCards = [
      {
        step: "01",
        title: tt("先收藏一個方向", "Save one direction"),
        text: tt("選一個你願意再查十分鐘的科系或工作。", "Pick one major or role you would research for ten more minutes."),
        item: rec.majors[0]!,
        category: "majors" as RecCategory,
      },
      {
        step: "02",
        title: tt("做一件小實作", "Do one small trial"),
        text: tt("不用很大，先做一次活動、練習或資料整理。", "It does not need to be huge. Try one activity, practice, or small research task."),
        item: rec.activities[0]!,
        category: "activities" as RecCategory,
      },
      {
        step: "03",
        title: tt("留下可用證據", "Keep usable proof"),
        text: tt("把成果截圖、心得或作品整理成未來能用的素材。", "Turn the outcome into screenshots, reflection, or portfolio material you can reuse later."),
        item: rec.portfolio[0]!,
        category: "portfolio" as RecCategory,
      },
    ];

    overlay.innerHTML = `
      <div class="path-shell">
        <header class="path-head">
          <div>
            <p>${tt("Spark Retention System", "Spark Retention System")}</p>
            <h2>${tt("星火號後續計畫", "Spark Follow-up Plan")}</h2>
          </div>
          <button class="path-close" data-act="back">${tt("回鑑定書", "Back")}</button>
        </header>
        <main class="retention-page">
          <section class="retention-hero">
            <div class="retention-hero-copy">
              <div class="path-kicker">${tt("RIASEC / Holland 主類型", "RIASEC / Holland Primary Type")}</div>
              <h3>${esc(loc(ARCHETYPE[primary]))}</h3>
              <p>${esc(loc(INTEREST_STYLE[primary]))}</p>
              ${secondary ? `<small>${tt("副方向", "Secondary")} · ${esc(loc(ARCHETYPE[secondary]))}</small>` : ""}
            </div>
            <div class="retention-console">
              <div><span>${tt("RIASEC 代碼", "RIASEC Code")}</span><b>${code.join(" · ")}</b></div>
              <div><span>${tt("已加入計畫", "In plan")}</span><b>${actionCount}</b></div>
              <div><span>${tt("已完成", "Done")}</span><b>${doneCount}</b></div>
              <div><span>${tt("備審素材", "Proof")}</span><b>${portfolioReady}</b></div>
            </div>
          </section>

          <section class="retention-roles">
            ${roleCards.map((group) => `
              <article class="retention-role ${group.tone}">
                <h3>${esc(group.title)}</h3>
                <div class="retention-role-list">
                  ${group.items.map((item) => `
                    <div class="retention-role-row">
                      <span>${esc(loc(item))}</span>
                      ${actionButton(item, group.category, tt("收藏", "Save"))}
                    </div>
                  `).join("")}
                </div>
              </article>
            `).join("")}
          </section>

          <section class="retention-missions">
            <div class="retention-section-head">
              <div>
                <div class="path-kicker">${tt("今天可以做", "Do Next")}</div>
                <h3>${tt("三步就能開始累積", "Start building proof in three steps")}</h3>
              </div>
            </div>
            <div class="mission-track">
              ${missionCards.map((mission) => `
                <article class="mission-card">
                  <span>${mission.step}</span>
                  <h4>${esc(mission.title)}</h4>
                  <p>${esc(mission.text)}</p>
                  ${actionButton(mission.item, mission.category)}
                </article>
              `).join("")}
            </div>
          </section>

          <section class="retention-wall">
            <div class="retention-section-head">
              <div>
                <div class="path-kicker">${tt("準備證據牆", "Preparation Proof Wall")}</div>
                <h3>${unlocked} / ${badges.length} ${tt("進度節點", "Milestones")}</h3>
              </div>
              <div class="path-progress"><span style="width:${(unlocked / badges.length) * 100}%"></span></div>
            </div>
            <div class="retention-badge-grid">
              ${badges.slice(0, 6).map((badge) => `
                <article class="badge-card ${badge.unlocked ? "unlocked" : "locked"}" style="--badge:${cssColor(badge.color)}">
                  <div class="badge-icon">${badge.unlocked ? "◆" : "◇"}</div>
                  <div>
                    <h4>${esc(badge.title)}</h4>
                    <p>${esc(badge.kind)} · ${esc(badge.sub)}</p>
                  </div>
                </article>
              `).join("")}
            </div>
          </section>
        </main>
        <footer class="path-actions">
          <button data-act="starter">${tt("加入推薦到計畫", "Add Starter Plan")}</button>
          <button data-act="plan">${tt("我的計畫", "My Plan")}</button>
          <button data-act="home">${tt("進入星圖", "Star Map")}</button>
        </footer>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelectorAll<HTMLButtonElement>(".path-chip").forEach((button) => {
      button.addEventListener("click", async () => {
        sfx.click();
        await careerStore.addAction({
          dim: primary,
          category: button.dataset.cat as RecCategory,
          text: { zh: button.dataset.textZh ?? "", en: button.dataset.textEn ?? "" },
        });
        await this.renderPathOverlay(scores, code);
      });
    });
    overlay.querySelector<HTMLButtonElement>("[data-act=back]")?.addEventListener("click", () => {
      sfx.click();
      this.removePathOverlay();
      this.showReport(false);
    });
    overlay.querySelector<HTMLButtonElement>("[data-act=starter]")?.addEventListener("click", () => {
      sfx.click();
      void this.addStarterPlan(code);
      window.setTimeout(() => void this.renderPathOverlay(scores, code), 120);
    });
    overlay.querySelector<HTMLButtonElement>("[data-act=plan]")?.addEventListener("click", () => {
      sfx.click();
      openCareerPanel(code, "plan");
    });
    overlay.querySelector<HTMLButtonElement>("[data-act=home]")?.addEventListener("click", () => {
      sfx.click();
      this.removePathOverlay();
      fadeToScene(this, "home", { duration: 400 });
    });
  }

  private removePathOverlay() {
    document.getElementById("path-overlay")?.remove();
  }

  private drawList(x: number, y: number, title: LS, items: LS[], width: number, gap = 24) {
    this.add.text(x, y, loc(title), {
      fontFamily: "sans-serif",
      fontSize: "11px",
      color: "#7fb6c9",
    });
    items.forEach((item, i) => {
      this.add.text(x, y + 20 + i * gap, `- ${wrapCjk(loc(item), Math.max(10, Math.floor(width / 8)))}`, {
        fontFamily: "sans-serif",
        fontSize: "10.5px",
        color: "#cfe9f5",
        lineSpacing: 2,
        wordWrap: { width, useAdvancedWrap: true },
      });
    });
  }

  private drawAchievementWall(x: number, y: number) {
    const badges = [
      ...MODULES.map((m) => ({ title: loc(m.title), sub: tt("艦船認證", "Ship Cert"), color: 0x00f5ff })),
      ...BAYS.filter((b) => flow.completedBays.includes(b.key)).map((b) => ({ title: loc(b.name), sub: tt("專員甦醒", "Crew Awake"), color: DIM_ACCENT[b.dim] })),
    ].slice(0, 8);

    badges.forEach((badge, i) => {
      const bx = x + (i % 4) * 94;
      const by = y + Math.floor(i / 4) * 42;
      this.add.rectangle(bx, by, 80, 32, 0x13283a, 0.96).setOrigin(0).setStrokeStyle(1, badge.color, 0.75);
      this.add.text(bx + 7, by + 6, wrapCjk(badge.title, 6), {
        fontFamily: "sans-serif",
        fontSize: "9.5px",
        color: "#e8f6ff",
        lineSpacing: 1,
        wordWrap: { width: 66, useAdvancedWrap: true },
      });
      this.add.text(bx + 7, by + 21, badge.sub, {
        fontFamily: "sans-serif",
        fontSize: "8px",
        color: "#8fb3c4",
      });
    });
  }

  private async addStarterPlan(code: Dim[]) {
    const primary = code[0];
    const secondary = code[1] && code[1] !== primary ? code[1] : undefined;
    const picks: Array<{ dim: Dim; category: RecCategory; text: { zh: string; en: string } }> = [
      { dim: primary, category: "activities", text: lsPair(RECOMMENDATIONS[primary].activities[0]) },
      { dim: primary, category: "portfolio", text: lsPair(RECOMMENDATIONS[primary].portfolio[0]) },
      { dim: primary, category: "careers", text: lsPair(RECOMMENDATIONS[primary].careers[0]) },
    ];
    if (secondary) picks.push({ dim: secondary, category: "activities", text: lsPair(RECOMMENDATIONS[secondary].activities[0]) });
    await Promise.all(picks.map((p) => careerStore.addAction(p)));
    sfx.solve();
    this.add.text(546, 490, tt("已加入我的計畫。", "Added to My Plan."), {
      fontFamily: "sans-serif",
      fontSize: "11px",
      color: "#69f0ae",
    }).setOrigin(0.5);
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
