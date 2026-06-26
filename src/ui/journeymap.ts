// ── 旅程地圖(手機「旅程」分頁)────────────────────────────────────
// 回訪學生的長期成長地圖。依學齡換「地圖語言」與里程碑(同一份興趣資料,不同框架):
//   國中=星海探索圖(探索期,廣度) / 高中=升階路徑圖(決策期,科系與行動)。
// 大學(college)在資料層保留,Phase 1 先不出 UI(見計畫:大學版需改「校準」價值主張)。
// 鐵則:只給完成鑑定書的回訪者看(合法揭曉區);全程用「職位原型」字樣,不露維度名稱。
import { careerStore, type SchoolLevel } from "../game/storage";
import { tt } from "../game/lang";
import { sfx } from "./sfx";

type ActiveLevel = "junior" | "senior";

interface Ctx {
  assessments: number;
  actions: number;
  actionsDone: number;
}

interface Stage {
  mark: string; // 完成前顯示的小圖示字元
  zh: string;
  en: string;
  done: (c: Ctx) => boolean;
}

interface LevelDef {
  accent: string;
  mapZh: string;
  mapEn: string;
  taskZh: string;
  taskEn: string;
  stages: Stage[];
}

const LEVELS: Record<ActiveLevel, LevelDef> = {
  junior: {
    accent: "#5dcca5",
    mapZh: "星海探索圖",
    mapEn: "Star-Sea Chart",
    taskZh: "興趣剛萌芽。這張圖的任務是廣度探索 —— 多試、多看，先不急著決定。",
    taskEn: "Interests are just forming. This map is about exploring widely — try a lot, decide later.",
    stages: [
      { mark: "✦", zh: "完成第一次航程", en: "Finish your first voyage", done: (c) => c.assessments >= 1 },
      { mark: "＋", zh: "加入第一個探索行動", en: "Add your first action", done: (c) => c.actions >= 1 },
      { mark: "↻", zh: "重測一次，看興趣變化", en: "Re-assess once to see change", done: (c) => c.assessments >= 2 },
    ],
  },
  senior: {
    accent: "#ffb74d",
    mapZh: "升階路徑圖",
    mapEn: "Ascent Path",
    taskZh: "興趣開始結晶、選擇逼近。這張圖把你的職位原型連到科系與真實行動。",
    taskEn: "Interests are crystallizing and choices loom. This map links your archetype to majors and real action.",
    stages: [
      { mark: "◇", zh: "看到你的職位原型", en: "See your role archetype", done: (c) => c.assessments >= 1 },
      { mark: "＋", zh: "累積 3 個科系／活動行動", en: "Stack 3 major/activity actions", done: (c) => c.actions >= 3 },
      { mark: "◎", zh: "完成第一個行動", en: "Complete your first action", done: (c) => c.actionsDone >= 1 },
    ],
  },
};

const PICK: Array<{ level: ActiveLevel; glyph: string; zh: string; en: string; subZh: string; subEn: string }> = [
  { level: "junior", glyph: "✦", zh: "國中", en: "Junior High", subZh: "探索期 · 約 12–15 歲", subEn: "Explore · age 12–15" },
  { level: "senior", glyph: "◇", zh: "高中", en: "Senior High", subZh: "決策期 · 約 15–18 歲", subEn: "Decide · age 15–18" },
];

export async function renderJourney(container: HTMLElement): Promise<void> {
  const meta = await careerStore.getMeta();
  const assess = await careerStore.listAssessments();

  // 還沒完成過鑑定 → 引導先完成航程(旅程地圖是鑑定書之後的內容)
  if (!assess.length) {
    container.innerHTML = `<div class="jm-empty">${tt(
      "完成一次航程、拿到身分鑑定書後，你的成長旅程地圖會在這裡展開。",
      "Finish a voyage and get your identity chart — your growth journey map opens here.",
    )}</div>`;
    return;
  }

  if (meta.level !== "junior" && meta.level !== "senior") {
    renderPicker(container);
    return;
  }
  void renderMap(container, meta.level);
}

function renderPicker(container: HTMLElement): void {
  container.innerHTML = `
    <div class="jm-picker">
      <div class="jm-picker-title">${tt("你現在是？", "Where are you now?")}</div>
      <div class="jm-picker-hint">${tt(
        "選一次就好，之後可以改。我們只用它決定旅程地圖怎麼畫，不會問你生日。",
        "Pick once — you can change it later. We only use it to shape your map, and never ask your birthday.",
      )}</div>
      <div class="jm-pick-grid">
        ${PICK.map(
          (p) => `<button class="jm-pick-card" data-level="${p.level}" style="--acc:${LEVELS[p.level].accent}">
            <span class="jm-pick-glyph">${p.glyph}</span>
            <span class="jm-pick-name">${tt(p.zh, p.en)}</span>
            <span class="jm-pick-sub">${tt(p.subZh, p.subEn)}</span>
          </button>`,
        ).join("")}
      </div>
    </div>`;

  container.querySelectorAll<HTMLButtonElement>(".jm-pick-card").forEach((btn) =>
    btn.addEventListener("click", async () => {
      sfx.click();
      await careerStore.setLevel(btn.dataset.level as SchoolLevel);
      void renderMap(container, btn.dataset.level as ActiveLevel);
    }),
  );
}

async function renderMap(container: HTMLElement, level: ActiveLevel): Promise<void> {
  const def = LEVELS[level];
  const [assess, actions] = await Promise.all([
    careerStore.listAssessments(),
    careerStore.listActions(),
  ]);
  const ctx: Ctx = {
    assessments: assess.length,
    actions: actions.length,
    actionsDone: actions.filter((a) => a.status === "done").length,
  };

  const states = def.stages.map((s) => ({ s, done: s.done(ctx) }));
  const doneCount = states.filter((x) => x.done).length;
  const next = states.find((x) => !x.done);
  const pct = Math.round((doneCount / states.length) * 100);

  const rows = states
    .map(
      ({ s, done }) => `
      <div class="jm-node ${done ? "done" : ""}">
        <span class="jm-node-mark">${done ? "✓" : s.mark}</span>
        <span class="jm-node-label">${tt(s.zh, s.en)}</span>
      </div>`,
    )
    .join("");

  container.innerHTML = `
    <div class="jm" style="--acc:${def.accent}">
      <div class="jm-head">
        <div>
          <div class="jm-map-name">${tt(def.mapZh, def.mapEn)}</div>
          <div class="jm-progress-num"><span style="font-variant-numeric:tabular-nums">${doneCount} / ${states.length}</span> ${tt("里程碑", "milestones")}</div>
        </div>
        <button class="jm-switch" data-act="switch">${tt("切換學齡", "Change stage")}</button>
      </div>
      <p class="jm-task">${tt(def.taskZh, def.taskEn)}</p>
      <div class="jm-bar"><span style="width:${pct}%"></span></div>
      <div class="jm-path">${rows}</div>
      ${
        next
          ? `<div class="jm-next">
               <span class="jm-next-cap">${tt("下一步焦點", "Next focus")}</span>
               <span class="jm-next-text">${tt(next.s.zh, next.s.en)}</span>
             </div>`
          : `<div class="jm-next done">
               <span class="jm-next-text">${tt("這張地圖你已走完 —— 隨成長重測，地圖會再長出新節點。", "You've completed this map — re-assess as you grow and new nodes will appear.")}</span>
             </div>`
      }
    </div>`;

  container.querySelector("[data-act=switch]")?.addEventListener("click", () => {
    sfx.click();
    renderPicker(container);
  });
}
