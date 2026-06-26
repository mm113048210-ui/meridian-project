// ── 生涯面板(DOM 疊層)──────────────────────────────────────────
// 鑑定書「之後」開啟。兩頁:① 生涯推薦(主型完整 + 輔型補充,每項可「＋加入計畫」)
//                          ② 我的行動計畫(可勾選、可移除,含進度條)。
// 沿用 #phone-panel 的視覺語言(backdrop blur / scroll)。資料走 careerStore(async)。
import { careerStore, type ActionItem, type ActionCategory, type AchievementEvidence } from "../game/storage";
import { RECOMMENDATIONS, REC_CATEGORY_LABEL, type RecCategory } from "../game/recommendations";
import { type Dim } from "../game/riasec";
import { loc, tt, type LS } from "../game/lang";
import { ARCHETYPE } from "../game/script";
import { sfx } from "./sfx";
import { DIM_REWARD_ASSET, REC_CATEGORY_ASSET } from "./rewardAssets";

const ACCENT: Record<Dim, string> = {
  R: "#ffab40",
  I: "#448aff",
  A: "#69f0ae",
  S: "#ff8a80",
  E: "#ffd700",
  C: "#b0bec5",
};

const DIMS: Dim[] = ["R", "I", "A", "S", "E", "C"];

// 單色線性圖示(取代彩色 emoji:📎 等)。fill=none + stroke=currentColor → 吃文字色 / --acc。
const ICON_PIN = `<svg class="ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4h12v16l-6-4-6 4z"/></svg>`;
const ICON_X = `<svg class="ico" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>`;

// 載入骨架:async store(localStorage 現況/未來 Supabase)解析前的佔位,取代空白閃爍。
const SKELETON = `<div class="career-skeleton" aria-hidden="true"><div class="sk-row short"></div><div class="sk-row tall"></div><div class="sk-row"></div><div class="sk-row"></div></div>`;
/** 容器尚無內容(冷開啟 / 切分頁)時才放骨架;就地重繪不重置,避免閃爍。 */
function showSkeleton(el: HTMLElement) {
  if (!el.childElementCount) el.innerHTML = SKELETON;
}

// RIASEC 代號徽章 = Dim 字母本身(R/I/A/S/E/C),用各原型色。
// 僅用於鑑定書「之後」的生涯平台;隱性評估鐵則(palette.ts)只規範揭曉前的遊戲畫面。
const riasecCode = (dim: Dim): string =>
  `<span class="riasec-code" style="--rc:${ACCENT[dim]}">${dim}</span>`;

// 玩家自填的「現在底子」(從 careerStore.meta.background 載入,於各 async render 前刷新)。
let playerBackground = "";

// 推薦頁的「深入探索」摺疊區:漸進揭露,預設收合,避免一頁塞滿。
// 用 Set 記住展開狀態,撐過重繪(route 切換 / 底子存檔等)。
const openFolds = new Set<string>(["bridge"]); // 底子預設展開(輕量且重要)
function fold(id: string, title: LS, sub: LS, bodyHtml: string): string {
  return `<details class="rec-fold" data-fold="${id}" ${openFolds.has(id) ? "open" : ""}>
    <summary class="rec-fold-head">
      <span class="rec-fold-titles"><b>${esc(loc(title))}</b><small>${esc(loc(sub))}</small></span>
      <span class="rec-fold-chevron" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
      </span>
    </summary>
    <div class="rec-fold-body">${bodyHtml}</div>
  </details>`;
}

// 底子解讀:把玩家「自己填」的底子接到該航線需要的可轉用能力。
// ⚙️ 目前是本地啟發式(echo 玩家輸入 + 對位 SKILL_DEMANDS);Phase 2 接真 LLM 時
//    只改本函式內部,回傳型別不變 —— 跟 storage 的 Adapter 模式同一套路。
interface BridgeReading {
  translate: LS;
  nextStep: LS;
}
function interpretBackground(raw: string, dim: Dim): BridgeReading | null {
  const text = raw.trim();
  if (!text) return null;
  const demand = SKILL_DEMANDS[dim];
  const skills = listText(demand.skills, 3);
  const roleEn = lsPair(demand.roles[0]).en;
  return {
    translate: {
      zh: `把「${text}」當成底子,可以接到「${loc(ARCHETYPE[dim])}」這條線重視的「${skills}」。重點不是換掉你會的,而是把它翻譯成這條線聽得懂的能力。`,
      en: `Treat “${text}” as your base — it can bridge into what this route values (${skills}). The point is not replacing what you know, but translating it.`,
    },
    nextStep: {
      zh: `下一步:找 3 則跟「${text}」+「${loc(demand.roles[0])}」有關的職缺或訪談,圈出重複出現的技能,再把你做過的事改寫成一句能力證明。`,
      en: `Next: find three job posts or interviews linking “${text}” with ${roleEn}, mark repeated skills, then rewrite one thing you did as ability evidence.`,
    },
  };
}

// 各原型對應的房間背景(閒置美術)當裝飾底圖,讓頁面生動。
const DIM_BG: Record<Dim, string> = {
  R: "powerbay",
  I: "greenhouse",
  A: "lounge",
  S: "medbay_white",
  E: "command",
  C: "workshop",
};

// 原型等級:玩家在成就牆記錄(對應該維度)→ 累積 XP → 升級。
// 漸增門檻(Lv1 需 1、Lv2 再 +2、Lv3 再 +3…),早期好升、後期有挑戰。
function levelFromXp(xp: number): { lv: number; into: number; span: number } {
  let lv = 0;
  let need = 1;
  let acc = 0;
  while (acc + need <= xp) {
    acc += need;
    lv++;
    need++;
  }
  return { lv, into: xp - acc, span: need };
}

const CATS: RecCategory[] = ["majors", "careers", "activities", "portfolio"];

let root: HTMLElement | null = null; // 彈窗模式的 overlay 容器
// 統一分頁外殼:彈窗(FinalScene)與手機「生涯」分頁共用同一套 5 分頁 renderShell。
// shellHost = 目前要渲染進的容器;shellEmbedded = 是否內嵌(內嵌不畫 backdrop / 關閉鈕)。
let shellHost: HTMLElement | null = null;
let shellEmbedded = false;
let currentCode: Dim[] = [];
let composerDim: Dim | null = null; // 成就牆 composer 目前選的方向
let wallPortfolioOnly = false; // 成就牆是否只看「可用於備審」的項目
let recActiveDim: Dim | null = null;
let recCat: RecCategory = "majors"; // 推薦頁:目前顯示的類別(一次只攤開一類,漸進揭露)
type CareerView = "home" | "rec" | "actions" | "proof" | "archetypes";
type WallView = "overview" | "actions" | "proof" | "archetypes";
let careerView: CareerView = "home";
let embeddedWallView: WallView = "overview";
let selectedRec: { dim: Dim; cat: RecCategory; zh: string; en: string } | null = null;
let selectedActionId: string | null = null;
let selectedWall: { id: string; kind: "action" | "ach" } | null = null;
let selectedDim: Dim | null = null;
let assistantReply: { dim: Dim; question: string; answer: string } | null = null;
const bridgeSelection: Record<Dim, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
let mythStage: 1 | 2 | 3 = 1;
const selectedMythRole: Record<Dim, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

const REC_SUMMARY: Record<Dim, LS> = {
  R: {
    zh: "你比較容易從實作、拆解、修復與測試裡找到方向。先做出一個能運作的小作品,會比只讀科系介紹更有感。",
    en: "You tend to learn through building, fixing, testing, and improving real things. A working mini project will tell you more than a brochure.",
  },
  I: {
    zh: "你會被問題背後的規律吸引。適合用研究、資料、實驗或程式把好奇心整理成可以被驗證的證據。",
    en: "You are drawn to the pattern behind a question. Research, data, experiments, and code can turn curiosity into evidence.",
  },
  A: {
    zh: "你在意感受、敘事與表達。把想法做成作品,再整理成一套清楚的創作脈絡,會很適合你。",
    en: "You care about feeling, story, and expression. Turning ideas into work and documenting the creative logic will suit you well.",
  },
  S: {
    zh: "你會注意人需要什麼、怎麼被支持。從服務、教學、陪伴或溝通場域累積真實經驗,最能看出你的方向。",
    en: "You notice what people need and how they can be supported. Service, teaching, care, and facilitation are strong places to test your direction.",
  },
  E: {
    zh: "你適合在有目標、有對象、有資源限制的情境裡練習帶頭。企劃、提案、活動與團隊協作會讓能力變具體。",
    en: "You work well when there is a goal, an audience, and limited resources. Planning, pitching, events, and team coordination make your ability visible.",
  },
  C: {
    zh: "你擅長把混亂的資訊整理成穩定流程。資料表、SOP、財務紀錄、知識庫或自動化工具都能成為很好的證據。",
    en: "You are good at turning messy information into stable systems. Spreadsheets, SOPs, finance logs, knowledge bases, and automation are strong evidence.",
  },
};

const RESOURCE_LINKS: { title: LS; desc: LS; source: string; url: string }[] = [
  {
    title: { zh: "IOH 學長姐經驗", en: "IOH student stories" },
    desc: { zh: "從真實科系與職涯訪談補足想像。", en: "Use real major and career interviews to fill in the picture." },
    source: "IOH",
    url: "https://ioh.tw/learning_categories",
  },
  {
    title: { zh: "ColleGo! 認識學群", en: "ColleGo! study clusters" },
    desc: { zh: "用官方學群分類對照科系。", en: "Compare majors through official study-cluster categories." },
    source: "ColleGo!",
    url: "https://collego.edu.tw/Highschool/CollegeList",
  },
  {
    title: { zh: "ColleGo! 探索興趣類型", en: "ColleGo! interest explorer" },
    desc: { zh: "不確定時,用興趣回推可能學群。", en: "When unsure, map interests back to possible fields." },
    source: "ColleGo!",
    url: "https://collego.edu.tw/Learningplan/interest",
  },
];

const SOLUTION_CARDS: { label: LS; title: LS; body: LS }[] = [
  {
    label: { zh: "資訊落差", en: "Reality gap" },
    title: { zh: "先看日常,不是只看頭銜", en: "See the daily work, not only the title" },
    body: {
      zh: "每個推薦都會拆成真實日常、可能不適應的地方,再接到可信外部資料。",
      en: "Every suggestion is split into daily work, possible friction, and trusted external resources.",
    },
  },
  {
    label: { zh: "驗錯成本", en: "Low-cost test" },
    title: { zh: "用一週小任務先試水溫", en: "Try a one-week mission first" },
    body: {
      zh: "收藏方向後,它會變成行動計畫。完成前只是待辦,完成後才會進證據牆。",
      en: "Saved routes become action items. They stay as to-dos until completed and logged as proof.",
    },
  },
  {
    label: { zh: "決策負荷", en: "Decision load" },
    title: { zh: "把模糊選擇拆成可比較證據", en: "Turn vague choices into comparable proof" },
    body: {
      zh: "成就牆不放職業標籤,只放你做過的事、連結、檔案與反思。",
      en: "The wall stores actions, links, files, and reflection, not career labels.",
    },
  },
];

const DIM_REALITY: Record<Dim, { daily: LS; friction: LS; proof: LS }> = {
  R: {
    daily: { zh: "每天多半在測試、拆裝、修正規格,把抽象需求變成能運作的東西。", en: "Much of the work is testing, assembling, fixing specs, and turning needs into working systems." },
    friction: { zh: "可能會遇到重複測試、工具限制、現場髒亂或長時間排錯。", en: "Expect repeated testing, tool limits, messy field conditions, and long debugging sessions." },
    proof: { zh: "照片、拆解紀錄、CAD 圖、維修前後對照。", en: "Photos, teardown logs, CAD files, or before/after repair notes." },
  },
  I: {
    daily: { zh: "日常是查資料、設計問題、整理數據、驗證假設,不只是想很酷的點子。", en: "The daily work is reading, framing questions, cleaning data, and testing hypotheses, not only having cool ideas." },
    friction: { zh: "可能會卡在資料很髒、結果不顯著、研究進度慢。", en: "You may face messy data, insignificant results, and slow research progress." },
    proof: { zh: "Notebook、研究摘要、資料視覺化、實驗紀錄。", en: "Notebooks, research summaries, visualizations, or experiment logs." },
  },
  A: {
    daily: { zh: "日常是反覆草稿、改版、聽回饋,把感覺整理成別人看得懂的形式。", en: "The work is drafting, revising, receiving feedback, and shaping feelings into communicable forms." },
    friction: { zh: "可能會遇到主觀評價、改稿壓力、靈感不穩定。", en: "Expect subjective critique, revision pressure, and uneven inspiration." },
    proof: { zh: "作品連結、草稿演進、設計說明、展演紀錄。", en: "Portfolio links, draft evolution, design notes, or public-show records." },
  },
  S: {
    daily: { zh: "日常是聽懂人的狀態、陪伴、教學、協調資源,而且常常需要耐心。", en: "The daily work is listening, supporting, teaching, coordinating resources, and being patient." },
    friction: { zh: "可能會遇到情緒消耗、界線拿捏、成果很慢才看得見。", en: "You may face emotional labor, boundary issues, and slow visible outcomes." },
    proof: { zh: "服務時數、活動紀錄、教案、反思短文。", en: "Service hours, activity logs, lesson plans, or reflection notes." },
  },
  E: {
    daily: { zh: "日常是定目標、說服人、排資源、處理變數,成果會被外部反應檢驗。", en: "The daily work is setting goals, persuading people, allocating resources, and reacting to external feedback." },
    friction: { zh: "可能會遇到被拒絕、時程壓力、團隊衝突與不確定性。", en: "Expect rejection, schedule pressure, team conflict, and uncertainty." },
    proof: { zh: "企劃書、活動成果、提案簡報、成效數據。", en: "Plans, event results, pitch decks, or performance metrics." },
  },
  C: {
    daily: { zh: "日常是建立表格、規則、流程與檢核,讓資訊可以被穩定交接。", en: "The work is building tables, rules, workflows, and checks so information can be handed off reliably." },
    friction: { zh: "可能會覺得瑣碎、重複,也需要長時間維持精準。", en: "It can feel detailed and repetitive, and it demands sustained accuracy." },
    proof: { zh: "資料表、SOP、索引、報表、自動化腳本。", en: "Spreadsheets, SOPs, indexes, reports, or automation scripts." },
  },
};

const SKILL_DEMANDS: Record<Dim, { industries: LS[]; roles: LS[]; skills: LS[]; tools: LS[]; signals: LS[]; reality: LS[] }> = {
  R: {
    industries: [
      { zh: "半導體設備", en: "Semiconductor equipment" },
      { zh: "製造 / 自動化", en: "Manufacturing / automation" },
      { zh: "航太 / 車輛", en: "Aerospace / vehicles" },
    ],
    roles: [
      { zh: "機械 / 設備工程", en: "Mechanical / equipment engineering" },
      { zh: "自動化 / 機器人", en: "Automation / robotics" },
      { zh: "現場維修技術", en: "Field maintenance" },
    ],
    skills: [
      { zh: "讀懂圖面與規格", en: "Read drawings and specs" },
      { zh: "故障排查", en: "Troubleshooting" },
      { zh: "安全意識", en: "Safety awareness" },
      { zh: "動手實作", en: "Hands-on building" },
    ],
    tools: [
      { zh: "CAD", en: "CAD" },
      { zh: "量測工具", en: "Measurement tools" },
      { zh: "PLC / 感測器基礎", en: "PLC / sensor basics" },
    ],
    signals: [
      { zh: "有完整修繕或改裝紀錄", en: "A complete repair or modification log" },
      { zh: "能說明失敗原因與修正", en: "Can explain failures and fixes" },
    ],
    reality: [
      { zh: "現場與排班可能影響生活節奏", en: "Field work and shifts can affect daily rhythm" },
      { zh: "薪資常與產業、輪班、出差、證照綁在一起", en: "Pay often depends on industry, shifts, travel, and certificates" },
    ],
  },
  I: {
    industries: [
      { zh: "AI / 軟體", en: "AI / software" },
      { zh: "生技 / 醫療", en: "Biotech / healthcare" },
      { zh: "金融科技", en: "Fintech" },
    ],
    roles: [
      { zh: "資料分析 / 資料科學", en: "Data analysis / data science" },
      { zh: "研究助理", en: "Research assistant" },
      { zh: "生醫 / 實驗分析", en: "Biomedical / lab analysis" },
    ],
    skills: [
      { zh: "問題定義", en: "Problem framing" },
      { zh: "資料整理", en: "Data cleaning" },
      { zh: "統計與假設驗證", en: "Statistics and hypothesis testing" },
      { zh: "閱讀技術文件", en: "Reading technical material" },
    ],
    tools: [
      { zh: "Python / R", en: "Python / R" },
      { zh: "SQL", en: "SQL" },
      { zh: "Notebook / 實驗紀錄", en: "Notebook / lab logs" },
    ],
    signals: [
      { zh: "能把一份資料做成可重現分析", en: "Can make a reproducible analysis" },
      { zh: "能清楚寫出研究問題與限制", en: "Can state the question and limitations" },
    ],
    reality: [
      { zh: "不同產業的資料品質與商業壓力差很多", en: "Data quality and business pressure vary a lot by industry" },
      { zh: "薪資通常受工具能力、作品深度、產業獲利影響", en: "Pay is shaped by tools, project depth, and industry profitability" },
    ],
  },
  A: {
    industries: [
      { zh: "遊戲 / 影像內容", en: "Games / media content" },
      { zh: "品牌 / 電商", en: "Branding / ecommerce" },
      { zh: "產品設計", en: "Product design" },
    ],
    roles: [
      { zh: "UI / UX 設計", en: "UI / UX design" },
      { zh: "視覺 / 插畫", en: "Visual / illustration" },
      { zh: "內容創作", en: "Content creation" },
    ],
    skills: [
      { zh: "視覺表達", en: "Visual expression" },
      { zh: "敘事與概念整理", en: "Story and concept development" },
      { zh: "接受回饋並改版", en: "Iterating from feedback" },
      { zh: "作品集包裝", en: "Portfolio presentation" },
    ],
    tools: [
      { zh: "Figma / Photoshop", en: "Figma / Photoshop" },
      { zh: "作品集網站", en: "Portfolio website" },
      { zh: "影像 / 音訊工具", en: "Media tools" },
    ],
    signals: [
      { zh: "有草稿到完成品的演進", en: "Shows progress from draft to final" },
      { zh: "能說明設計選擇", en: "Can explain design decisions" },
    ],
    reality: [
      { zh: "作品集比科系名稱更常被拿來判斷", en: "Portfolio often matters more than the major label" },
      { zh: "薪資差異常來自產業預算、商業轉換率與專案規模", en: "Pay varies with industry budget, conversion impact, and project scale" },
    ],
  },
  S: {
    industries: [
      { zh: "教育科技", en: "EdTech" },
      { zh: "醫療照護", en: "Healthcare and care" },
      { zh: "社福 / 公共服務", en: "Social service / public service" },
    ],
    roles: [
      { zh: "教育 / 教學", en: "Education / teaching" },
      { zh: "心理 / 諮詢助人", en: "Counseling / helping" },
      { zh: "社福 / 公共服務", en: "Social service / public service" },
    ],
    skills: [
      { zh: "傾聽與提問", en: "Listening and questioning" },
      { zh: "同理與界線", en: "Empathy and boundaries" },
      { zh: "活動帶領", en: "Facilitation" },
      { zh: "個案紀錄", en: "Case notes" },
    ],
    tools: [
      { zh: "教案 / 活動設計", en: "Lesson / activity plans" },
      { zh: "服務紀錄", en: "Service logs" },
      { zh: "回饋表", en: "Feedback forms" },
    ],
    signals: [
      { zh: "有持續服務或帶領經驗", en: "Ongoing service or facilitation experience" },
      { zh: "能反思人的需求與限制", en: "Can reflect on needs and boundaries" },
    ],
    reality: [
      { zh: "成就感高,但情緒勞動與制度限制要先看清楚", en: "Meaning can be high, but emotional labor and institutional limits matter" },
      { zh: "薪資常受公私部門、證照、年資與制度影響", en: "Pay depends on public/private sector, licenses, seniority, and policy" },
    ],
  },
  E: {
    industries: [
      { zh: "新創 / SaaS", en: "Startup / SaaS" },
      { zh: "金融 / 顧問", en: "Finance / consulting" },
      { zh: "品牌 / 零售", en: "Brand / retail" },
    ],
    roles: [
      { zh: "產品 / 專案管理", en: "Product / project management" },
      { zh: "行銷企劃", en: "Marketing planning" },
      { zh: "業務開發 / 創業", en: "Business development / entrepreneurship" },
    ],
    skills: [
      { zh: "需求整理", en: "Requirement gathering" },
      { zh: "溝通協調", en: "Communication and coordination" },
      { zh: "目標與指標設定", en: "Goal and metric setting" },
      { zh: "提案說服", en: "Pitching" },
    ],
    tools: [
      { zh: "簡報", en: "Slides" },
      { zh: "專案看板", en: "Project boards" },
      { zh: "數據儀表板", en: "Dashboards" },
    ],
    signals: [
      { zh: "有主辦活動或帶隊成果", en: "Led an event or team outcome" },
      { zh: "能用數據說明成效", en: "Can explain impact with data" },
    ],
    reality: [
      { zh: "職稱漂亮不代表權限大,要看公司階段與責任範圍", en: "A polished title does not always mean authority; company stage and scope matter" },
      { zh: "薪資常與產業營收、績效、客戶或產品規模綁定", en: "Pay is often tied to revenue, performance, clients, or product scale" },
    ],
  },
  C: {
    industries: [
      { zh: "金融 / 會計", en: "Finance / accounting" },
      { zh: "物流 / 營運", en: "Logistics / operations" },
      { zh: "企業資訊系統", en: "Enterprise information systems" },
    ],
    roles: [
      { zh: "會計 / 財務分析", en: "Accounting / financial analysis" },
      { zh: "資訊管理", en: "Information management" },
      { zh: "營運 / 資料管理", en: "Operations / data management" },
    ],
    skills: [
      { zh: "資料正確性", en: "Data accuracy" },
      { zh: "流程設計", en: "Process design" },
      { zh: "報表整理", en: "Reporting" },
      { zh: "細節檢核", en: "Detail checking" },
    ],
    tools: [
      { zh: "Excel / Google Sheets", en: "Excel / Google Sheets" },
      { zh: "SQL", en: "SQL" },
      { zh: "SOP / 文件系統", en: "SOP / documentation systems" },
    ],
    signals: [
      { zh: "能把混亂資訊整理成可交接流程", en: "Can turn messy info into a handoff-ready process" },
      { zh: "有自動化或索引作品", en: "Has automation or indexing work" },
    ],
    reality: [
      { zh: "工作價值常在降低錯誤與讓流程穩定,不一定很外顯", en: "The value is often reducing errors and stabilizing workflows, not always visible" },
      { zh: "薪資與產業規模、法規責任、系統熟悉度有關", en: "Pay relates to industry scale, compliance responsibility, and system knowledge" },
    ],
  },
};

const INTEL_SOURCES: { kind: LS; trust: LS; use: LS; examples: { label: string; url: string }[] }[] = [
  {
    kind: { zh: "官方基準", en: "Official baseline" },
    trust: { zh: "高可信,但更新慢", en: "High trust, slower updates" },
    use: { zh: "用來看職業分類、工作活動、薪資與行業統計底線。", en: "Use for occupation taxonomy, work activities, wages, and industry baselines." },
    examples: [
      { label: "O*NET", url: "https://www.onetonline.org/" },
      { label: "BLS OEWS", url: "https://www.bls.gov/oes/" },
      { label: "勞動部統計", url: "https://statdb.mol.gov.tw/" },
    ],
  },
  {
    kind: { zh: "求職市場", en: "Job-market layer" },
    trust: { zh: "即時,但職缺文案會包裝", en: "Timely, but job posts are marketing copy" },
    use: { zh: "抓技能頻率、工具、年資、產業、薪資區間與職缺數量。", en: "Extract skill frequency, tools, seniority, industry, salary range, and posting volume." },
    examples: [
      { label: "104", url: "https://www.104.com.tw/jobs/main/" },
      { label: "LinkedIn", url: "https://www.linkedin.com/jobs/" },
      { label: "Indeed", url: "https://www.indeed.com/" },
    ],
  },
  {
    kind: { zh: "真實經驗", en: "Lived-experience layer" },
    trust: { zh: "主觀樣本,適合看踩雷點", en: "Subjective samples, useful for hidden risks" },
    use: { zh: "看加班、文化、壓力、成長速度、離職原因與日常感受。", en: "Read for overtime, culture, stress, growth, churn reasons, and daily feeling." },
    examples: [
      { label: "Dcard", url: "https://www.dcard.tw/f/job" },
      { label: "PTT Salary", url: "https://www.ptt.cc/bbs/Salary/index.html" },
      { label: "Reddit Careers", url: "https://www.reddit.com/r/careerguidance/" },
    ],
  },
];

const FIELD_BRIDGES: Record<Dim, { current: LS[]; bridge: LS; paths: LS[]; myth: LS; reframe: LS }> = {
  R: {
    current: [
      { zh: "數理 / 工程底子", en: "Math / engineering background" },
      { zh: "設計 / 製作經驗", en: "Design / making experience" },
    ],
    bridge: { zh: "如果你現在的領域有實作或系統概念,可以往設備、產品、硬體、維修、自動化延伸。", en: "If your current field includes making or systems thinking, it can bridge into equipment, product, hardware, maintenance, or automation." },
    paths: [
      { zh: "數學 → 運籌最佳化 / 製程資料", en: "Math -> operations optimization / process data" },
      { zh: "設計 → 工業設計 / 原型製作", en: "Design -> industrial design / prototyping" },
      { zh: "商管 → 供應鏈 / 營運改善", en: "Business -> supply chain / operations improvement" },
    ],
    myth: { zh: "工科只能做現場或修機器。", en: "Engineering only means field work or fixing machines." },
    reframe: { zh: "實作能力也可以進產品、製程、資料化維護、供應鏈與技術管理。", en: "Hands-on ability also maps to product, process, data-driven maintenance, supply chain, and technical management." },
  },
  I: {
    current: [
      { zh: "數學 / 自然科學", en: "Math / natural sciences" },
      { zh: "商管 / 社科", en: "Business / social science" },
    ],
    bridge: { zh: "如果你喜歡找規律,原本領域可以變成資料、研究、模型或證據推理的素材。", en: "If you like finding patterns, your current field can become material for data, research, modeling, or evidence-based reasoning." },
    paths: [
      { zh: "數學 → 資料科學 / 風控 / AI", en: "Math -> data science / risk / AI" },
      { zh: "生命科學 → 生物資訊 / 臨床資料", en: "Life science -> bioinformatics / clinical data" },
      { zh: "心理 / 社科 → 使用者研究 / 行為資料", en: "Psychology / social science -> user research / behavioral data" },
    ],
    myth: { zh: "數學系只能當老師或做純研究。", en: "Math majors can only teach or do pure research." },
    reframe: { zh: "數學訓練的是抽象化、建模、邏輯與誤差感,可以進金融、AI、資料、物流、遊戲平衡與風險管理。", en: "Math trains abstraction, modeling, logic, and error awareness, which fit finance, AI, data, logistics, game balancing, and risk management." },
  },
  A: {
    current: [
      { zh: "文組 / 傳播", en: "Humanities / communication" },
      { zh: "工程 / 資訊", en: "Engineering / computing" },
    ],
    bridge: { zh: "如果你在意表達與體驗,可以把原領域知識轉成設計、內容、互動或產品敘事。", en: "If you care about expression and experience, your field knowledge can become design, content, interaction, or product narrative." },
    paths: [
      { zh: "資工 → UX 工程 / 遊戲 UI", en: "CS -> UX engineering / game UI" },
      { zh: "文學 → 內容策略 / 編劇 / 敘事設計", en: "Literature -> content strategy / writing / narrative design" },
      { zh: "商管 → 品牌策略 / 服務設計", en: "Business -> brand strategy / service design" },
    ],
    myth: { zh: "設計或藝術只能靠天份,很難和其他科系結合。", en: "Design or art is only talent and hard to combine with other fields." },
    reframe: { zh: "設計其實需要領域知識、問題定義、使用者理解與系統表達,很適合跨域。", en: "Design needs domain knowledge, problem framing, user understanding, and system expression, so it is highly cross-disciplinary." },
  },
  S: {
    current: [
      { zh: "教育 / 心理", en: "Education / psychology" },
      { zh: "醫護 / 社福", en: "Healthcare / social service" },
    ],
    bridge: { zh: "如果你在意人的需求,原本領域可以轉成教育產品、服務設計、社群營運或照護科技。", en: "If you care about human needs, your field can bridge into education products, service design, community operations, or care tech." },
    paths: [
      { zh: "護理 → 健康教育 / 醫療產品", en: "Nursing -> health education / healthcare product" },
      { zh: "心理 → UX research / 人才發展", en: "Psychology -> UX research / talent development" },
      { zh: "教育 → 課程設計 / EdTech", en: "Education -> curriculum design / EdTech" },
    ],
    myth: { zh: "助人領域只有老師、社工或諮商。", en: "Helping fields only lead to teacher, social worker, or counselor." },
    reframe: { zh: "理解人的能力也可以進產品研究、教育科技、HR、社群經營、公共政策與服務設計。", en: "Understanding people also fits product research, EdTech, HR, community, public policy, and service design." },
  },
  E: {
    current: [
      { zh: "商管 / 法政", en: "Business / law / politics" },
      { zh: "技術 / 設計背景", en: "Technical / design background" },
    ],
    bridge: { zh: "如果你喜歡推動事情,原本領域可以成為你做產品、專案、策略或創業的專業場域。", en: "If you like moving things forward, your field can become the domain for product, project, strategy, or entrepreneurship." },
    paths: [
      { zh: "工程 → 產品經理 / 技術 PM", en: "Engineering -> product manager / technical PM" },
      { zh: "設計 → 品牌 / 創意策略", en: "Design -> brand / creative strategy" },
      { zh: "法律 → 法遵科技 / 政策顧問", en: "Law -> legal tech / policy consulting" },
    ],
    myth: { zh: "想做管理一定要先讀商管,不然沒有資格。", en: "Management requires a business major first." },
    reframe: { zh: "很多管理角色需要領域專業加溝通協調;技術、設計、法律、科學背景都能變成優勢。", en: "Many management roles need domain expertise plus coordination; technical, design, legal, and scientific backgrounds can be advantages." },
  },
  C: {
    current: [
      { zh: "商管 / 會計", en: "Business / accounting" },
      { zh: "資訊 / 數據", en: "Information / data" },
    ],
    bridge: { zh: "如果你喜歡整理混亂,原本領域可以延伸到營運系統、資料治理、財務分析或流程自動化。", en: "If you like organizing mess, your field can bridge into operating systems, data governance, financial analysis, or process automation." },
    paths: [
      { zh: "會計 → 資料分析 / 稽核科技", en: "Accounting -> data analysis / audit tech" },
      { zh: "資管 → ERP / 資料治理", en: "MIS -> ERP / data governance" },
      { zh: "統計 → 商業分析 / 風險控管", en: "Statistics -> business analysis / risk control" },
    ],
    myth: { zh: "會計、統計、資管只能做很固定的內勤。", en: "Accounting, statistics, and MIS only lead to fixed back-office jobs." },
    reframe: { zh: "整理與檢核能力可以進營運、金融科技、資料產品、風控、商業分析與自動化。", en: "Organization and checking skills fit operations, fintech, data products, risk, business analysis, and automation." },
  },
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const lsPair = (ls: LS): { zh: string; en: string } =>
  typeof ls === "string" ? { zh: ls, en: ls } : ls;

function validationPlan(dim: Dim, cat: RecCategory, label: string): { test: string; proof: string; question: string } {
  const reality = DIM_REALITY[dim];
  if (cat === "majors") {
    return {
      test: tt(`查 2 門「${label}」相關課程,再看 1 篇 IOH 或 ColleGo! 介紹,整理你真正想學的是哪一段。`, `Review two courses related to “${label}”, then read one IOH or ColleGo! page and summarize what you actually want to learn.`),
      proof: tt("一頁課程比較筆記、截圖或學群整理。", "A one-page course comparison, screenshot, or study-cluster note."),
      question: tt("我喜歡的是科系名稱,還是它每天要做的練習?", "Do I like the label, or the daily practice behind it?"),
    };
  }
  if (cat === "careers") {
    return {
      test: tt(`找 1 個「${label}」訪談或職缺,把一天工作拆成 5 個動作。`, `Find one interview or job post for “${label}” and break one workday into five actions.`),
      proof: tt("訪談摘要、職缺截圖、日常工作拆解表。", "An interview summary, job-post screenshot, or daily-work breakdown."),
      question: tt("我願不願意接受它無聊、壓力或重複的部分?", "Can I accept the boring, stressful, or repetitive parts?"),
    };
  }
  if (cat === "activities") {
    return {
      test: tt(`把「${label}」縮成 7 天內能完成的小版本,先做一次。`, `Shrink “${label}” into a small version you can finish within seven days, then do it once.`),
      proof: tt("照片、過程紀錄、成果連結或一句反思。", "A photo, process log, result link, or one-sentence reflection."),
      question: tt("做完以後,我想繼續加深,還是只覺得鬆一口氣?", "After finishing, do I want to go deeper, or am I just relieved it is over?"),
    };
  }
  return {
    test: tt(`先做「${label}」的 v0,不用完美,但要能被別人看懂。`, `Make a v0 of “${label}”. It does not need to be perfect, but someone else should understand it.`),
    proof: loc(reality.proof),
    question: tt("這份作品能不能證明我真的試過這個方向?", "Does this artifact prove I actually tried this route?"),
  };
}

function listText(items: LS[], limit = 4): string {
  return items.slice(0, limit).map((x) => loc(x)).join("、");
}

function compactSearchText(text: string): string {
  return text.replace(/\s*\/\s*/g, " ").replace(/→|->/g, " ").replace(/\s+/g, " ").trim();
}

function sourceLinksFor(dim: Dim, layerIndex: number): { label: string; url: string }[] {
  const data = SKILL_DEMANDS[dim];
  const roleZh = compactSearchText(listText(data.roles, 2));
  const roleEn = compactSearchText(data.roles.slice(0, 2).map((x) => lsPair(x).en).join(" "));
  const industryZh = compactSearchText(listText(data.industries, 2));
  const skillZh = compactSearchText(listText(data.skills, 3));
  const jobQueryZh = encodeURIComponent(`${roleZh} ${industryZh}`);
  const jobQueryEn = encodeURIComponent(roleEn);
  const realityQuery = encodeURIComponent(`${roleZh} ${industryZh} 薪資 工時 心得 加班`);
  const officialQueryZh = encodeURIComponent(`${roleZh} ${industryZh} 薪資 職業 工作內容`);
  const officialQueryEn = encodeURIComponent(`${roleEn} occupation work activities wage`);
  if (layerIndex === 0) {
    // 官方資料層:每個都進站內查詢或官方頁,不再丟去 Google 貼關鍵字。
    return [
      { label: "O*NET 職業活動", url: `https://www.onetonline.org/find/quick?s=${officialQueryEn}` },
      { label: "BLS 職業手冊", url: "https://www.bls.gov/ooh/" },
      { label: "勞動部薪資統計", url: "https://statdb.mol.gov.tw/" },
    ];
  }
  if (layerIndex === 1) {
    return [
      { label: "104 對應職缺", url: `https://www.104.com.tw/jobs/search/?keyword=${jobQueryZh}` },
      { label: "LinkedIn Jobs", url: `https://www.linkedin.com/jobs/search/?keywords=${jobQueryEn}` },
      { label: "Indeed Jobs", url: `https://www.indeed.com/jobs?q=${jobQueryEn}` },
      { label: "104 技能職缺", url: `https://www.104.com.tw/jobs/search/?keyword=${encodeURIComponent(`${roleZh} ${skillZh}`)}` },
    ];
  }
  // 真實心得層:用各站自己的搜尋,而非 Google site: 包裝。
  return [
    { label: "Dcard 工作版", url: "https://www.dcard.tw/f/job" },
    { label: "PTT Salary 搜尋", url: `https://www.ptt.cc/bbs/Salary/search?q=${realityQuery}` },
    { label: "Reddit Careers", url: `https://www.reddit.com/r/careerguidance/search/?q=${jobQueryEn}&restrict_sr=1` },
  ];
}

function renderIndustryIntelPanel(dim: Dim): string {
  const data = SKILL_DEMANDS[dim];
  const liveJobQuery = encodeURIComponent(compactSearchText(`${listText(data.roles, 2)} ${listText(data.industries, 1)}`));
  return `<section class="skill-demand-panel industry-intel-panel" style="--acc:${ACCENT[dim]}">
    <div class="skill-demand-head">
      <img class="raw-asset career-detail-icon" src="${DIM_REWARD_ASSET[dim]}" alt="" loading="lazy" />
      <div>
        <span>${tt("產業情報站", "Industry intel station")}</span>
        <h3>${esc(loc(ARCHETYPE[dim]))}${riasecCode(dim)}</h3>
      </div>
    </div>
    <div class="skill-demand-grid">
      <div>
        <span>${tt("常見產業", "Common industries")}</span>
        <p>${esc(listText(data.industries, 3))}</p>
      </div>
      <div>
        <span>${tt("工作類型", "Work types")}</span>
        <p>${esc(listText(data.roles, 3))}</p>
      </div>
      <div>
        <span>${tt("職缺高頻技能", "High-frequency skills")}</span>
        <p>${esc(listText(data.skills, 4))}</p>
      </div>
      <div>
        <span>${tt("常見工具 / 作品", "Tools / artifacts")}</span>
        <p>${esc(listText(data.tools, 3))}</p>
      </div>
      <div>
        <span>${tt("雇主會看的證據", "Evidence employers notice")}</span>
        <p>${esc(listText(data.signals, 2))}</p>
      </div>
      <div>
        <span>${tt("真實樣貌提醒", "Reality signals")}</span>
        <p>${esc(listText(data.reality, 2))}</p>
      </div>
    </div>
    <a class="skill-search-link" href="https://www.104.com.tw/jobs/search/?keyword=${liveJobQuery}" target="_blank" rel="noopener noreferrer">
      ${tt("到 104 看即時職缺與技能", "Browse live jobs & skills on 104")}
    </a>
  </section>`;
}

function renderBridgePanel(dim: Dim): string {
  const data = FIELD_BRIDGES[dim];
  const reading = interpretBackground(playerBackground, dim);
  return `<section class="bridge-panel" style="--acc:${ACCENT[dim]}">
    <div class="bridge-head">
      <span>${tt("跨域橋接", "Field bridge")}</span>
      <b>${tt("不用先否定原本領域", "Do not discard your current field first")}</b>
    </div>
    <p>${esc(loc(data.bridge))}</p>
    <div class="bridge-input-row">
      <input class="bridge-input" type="text" maxlength="80" autocomplete="off"
        value="${esc(playerBackground)}"
        placeholder="${tt("填你現在的底子:科系 / 專長 / 做過的事,例如:高中數理資優、剪過短片、社團總務", "Your base: major, strength, or what you've done")}"
        aria-label="${tt("你現在的底子", "Your current base")}" />
      <button class="bridge-save" data-act="save-background">${tt("解讀", "Read")}</button>
    </div>
    ${reading ? `
      <div class="bridge-reading">
        <div class="bridge-reading-card strong">
          <span>${tt("系統解讀(內測)", "System reading (preview)")}</span>
          <p>${esc(loc(reading.translate))}</p>
        </div>
        <div class="bridge-reading-card">
          <span>${tt("可以先做", "Try first")}</span>
          <p>${esc(loc(reading.nextStep))}</p>
        </div>
      </div>`
      : `<p class="bridge-empty">${tt("填上你現在的底子,系統會把它翻譯成這條航線可用的能力——不用先放棄你原本會的。", "Add your base and the system will translate it into skills this route can use — no need to drop what you already know.")}</p>`}
    <div class="bridge-reframe">
      <div>
        <span>${tt("破解迷思", "Myth breaker")}</span>
        <p>${esc(loc(data.myth))}</p>
      </div>
      <div>
        <span>${tt("重新理解", "Reframe")}</span>
        <p>${esc(loc(data.reframe))}</p>
      </div>
    </div>
  </section>`;
}

function renderMythBreakerPanel(dim: Dim): string {
  const demand = SKILL_DEMANDS[dim];
  const bridge = FIELD_BRIDGES[dim];
  const bridgeIndex = Math.min(bridgeSelection[dim] ?? 0, bridge.current.length - 1);
  const activeRoleIndex = Math.min(selectedMythRole[dim] ?? 0, demand.roles.length - 1);
  const activeRole = demand.roles[activeRoleIndex];
  const activeIndustry = demand.industries[activeRoleIndex % demand.industries.length];
  const activePath = bridge.paths[bridgeIndex % bridge.paths.length];
  const roleLinks = sourceLinksFor(dim, 1).slice(0, 3);
  const realityLinks = sourceLinksFor(dim, 2).slice(0, 2);
  const stages: { id: 1 | 2 | 3; title: LS; sub: LS }[] = [
    { id: 1, title: { zh: "能力拆解", en: "Skill Decode" }, sub: { zh: "撕下科系標籤", en: "Break the label" } },
    { id: 2, title: { zh: "跨域反應爐", en: "Fusion Reactor" }, sub: { zh: "底子 × 興趣", en: "Base x interest" } },
    { id: 3, title: { zh: "職涯星圖", en: "Career Map" }, sub: { zh: "典型與非典型", en: "Typical and surprising" } },
  ];
  const stageBody = mythStage === 1
    ? `<div class="myth-stage-grid decode">
        <div class="myth-orb">
          <span>${tt("正在裂解", "Decoding")}</span>
          <b>${esc(loc(ARCHETYPE[dim]))}${riasecCode(dim)}</b>
          <small>${tt("不是職業答案,是底層能力", "Not a job answer, but underlying abilities")}</small>
        </div>
        <div class="myth-skill-grid">
          ${demand.skills.map((skill, i) => `
            <button class="myth-skill-card" style="--slot:${i}">
              <span>${tt("能力", "SKILL")} 0${i + 1}</span>
              <b>${esc(loc(skill))}</b>
              <small>${esc(loc(demand.signals[i % demand.signals.length]))}</small>
            </button>`).join("")}
        </div>
      </div>`
    : mythStage === 2
      ? `<div class="myth-reactor">
          <div class="myth-rack">
            <span>${tt("你的既有底子", "Your current base")}</span>
            <b class="myth-base ${playerBackground ? "" : "empty"}">${playerBackground ? esc(playerBackground) : tt("尚未填寫 — 到下方「跨域橋接」填你的底子", "Not set — fill it in the Field Bridge below")}</b>
          </div>
          <div class="myth-core">
            <span>${tt("融合核心", "Fusion core")}</span>
            <b>${playerBackground ? esc(playerBackground) : tt("你的底子", "your base")}</b>
            <i>＋</i>
            <b>${esc(listText(demand.skills, 2))}</b>
          </div>
          <div class="myth-result">
            <span>${tt("融合後可以嘗試", "Try after fusion")}</span>
            <b>${esc(loc(activeRole))}</b>
            <p>${tt("先做一個低成本任務,完成後把連結或檔案放進成就牆,不要只停在想像。", "Run a low-cost test first, then put the link or file on the proof wall instead of staying in imagination.")}</p>
          </div>
        </div>`
      : `<div class="myth-constellation">
          <div class="myth-star-map">
            <div class="myth-map-ring one"></div>
            <div class="myth-map-ring two"></div>
            <div class="myth-map-core">
              <b>${esc(loc(ARCHETYPE[dim]))}${riasecCode(dim)}</b>
              <span>${tt("主傾向", "Primary")}</span>
            </div>
            ${demand.roles.map((role, i) => {
              const angle = (-90 + i * 118) * (Math.PI / 180);
              const radius = i === 0 ? 118 : 155;
              const x = Math.round(Math.cos(angle) * radius);
              const y = Math.round(Math.sin(angle) * radius);
              return `<button class="myth-star ${i === activeRoleIndex ? "active" : ""}" data-act="myth-role" data-dim="${dim}" data-index="${i}" style="--x:${x}px;--y:${y}px">
                <i></i><span>${esc(loc(role))}</span>
              </button>`;
            }).join("")}
          </div>
          <div class="myth-career-detail">
            <span>${tt("星點解密", "Star detail")}</span>
            <h4>${esc(loc(activeRole))}</h4>
            <p>${tt(
              `可從「${loc(activePath)}」切入,常出現在「${loc(activeIndustry)}」。先查職缺技能,再用作品或活動證明你真的試過。`,
              `You can enter through “${loc(activePath)}”, often seen in “${loc(activeIndustry)}”. Check job-post skills first, then prove it with a project or activity.`,
            )}</p>
            <div class="myth-mini-tags">
              ${demand.tools.map((tool) => `<span>${esc(loc(tool))}</span>`).join("")}
            </div>
            <div class="myth-link-row">
              ${roleLinks.map((link) => `<a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.label)}</a>`).join("")}
              ${realityLinks.map((link) => `<a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.label)}</a>`).join("")}
            </div>
          </div>
        </div>`;
  return `<section class="mythbreaker-panel" style="--acc:${ACCENT[dim]}">
    <div class="mythbreaker-head">
      <div>
        <span>MERIDIAN TERMINAL</span>
        <h3>${tt("科系迷思破除與職涯星圖探索儀", "Major Mythbreaker and Career Star Map")}</h3>
      </div>
      <b>${tt(`第 ${mythStage} / 3 步`, `Step ${mythStage} / 3`)}</b>
    </div>
    <div class="myth-steps">
      ${stages.map((stage) => `
        <button class="myth-step ${mythStage === stage.id ? "active" : ""}" data-act="myth-stage" data-stage="${stage.id}">
          <span>0${stage.id}</span>
          <b>${esc(loc(stage.title))}</b>
          <small>${esc(loc(stage.sub))}</small>
        </button>`).join("")}
    </div>
    ${stageBody}
  </section>`;
}

function buildAssistantAnswer(dim: Dim, question: string, actions: ActionItem[], wall: { dim?: Dim | null }[]): string {
  const data = SKILL_DEMANDS[dim];
  const openCount = actions.filter((a) => a.status !== "done" && a.dim === dim).length;
  const proofCount = wall.filter((e) => e.dim === dim).length;
  const industry = tt(
    `這個方向要同時看產業與工作類型。常見產業包含「${listText(data.industries, 3)}」;常見工作型態包含「${listText(data.roles, 3)}」。`,
    `Read this through both industry and work type. Common industries include ${listText(data.industries, 3)}; common work types include ${listText(data.roles, 3)}.`,
  );
  const sources = tt(
    "資料要分三層:官方統計看薪資基準,求職網站看高頻技能與薪資區間,論壇/訪談看工時、文化、壓力與踩雷點。不要把論壇心得當成唯一事實。",
    "Use three layers: official data for wage baselines, job boards for skill frequency and pay ranges, and forums/interviews for hours, culture, stress, and hidden risks. Do not treat forum stories as the only truth.",
  );
  const base = tt(
    `先不要急著決定職業。你現在要驗證的是「${listText(data.skills, 3)}」這幾個能力,並確認自己能不能接受「${listText(data.reality, 1)}」。建議先找 5 則職缺與 3 則真實心得,圈出重複出現的技能、薪資條件與負面訊號。`,
    `Do not decide the job too early. First validate these skills: ${listText(data.skills, 3)}, and check whether you can accept this reality: ${listText(data.reality, 1)}. Find five job posts and three lived-experience posts, then mark repeated skills, pay conditions, and risk signals.`,
  );
  const next = openCount
    ? tt(`你目前有 ${openCount} 個相關待辦。先完成其中一個,完成後回證據牆補連結或檔案。`, `You have ${openCount} related open action(s). Finish one, then add a link or file to the proof wall.`)
    : tt("你現在缺的是待辦。先從推薦頁收藏一個方向,讓它變成可執行的小任務。", "You are missing an action item. Save one route from recommendations so it becomes a small task.");
  const proof = proofCount
    ? tt(`你已經有 ${proofCount} 筆相關證據。下一步是挑一筆標記成備審素材,並補一句你學到什麼。`, `You already have ${proofCount} related proof item(s). Next, pin one for portfolio use and add what you learned.`)
    : tt("目前還沒有相關證據。做完任務後,請至少留下作品連結、截圖、報告或一句反思。", "There is no related proof yet. After doing a task, keep at least a link, screenshot, report, or short reflection.");
  const userNeed = question.trim()
    ? tt(`你問的是：「${question.trim()}」。我會先把它拆成:職缺要求、可試做任務、可上牆證據。`, `You asked: “${question.trim()}”. I would split it into job requirements, a test mission, and wall-ready proof.`)
    : "";
  const bridge = FIELD_BRIDGES[dim];
  const bridgeText = tt(
    `如果玩家已經在某個領域,不要直接叫他換跑道。先看能不能用原本背景接到新方向:例如 ${listText(bridge.paths, 2)}。要破解的迷思是「${loc(bridge.myth)}」;更準確的說法是:${loc(bridge.reframe)}`,
    `If the player already has a field, do not push a full switch first. Check how the current background can bridge into this direction, such as ${listText(bridge.paths, 2)}. The myth to break is “${loc(bridge.myth)}”; a better frame is: ${loc(bridge.reframe)}`,
  );
  return [userNeed, bridgeText, industry, sources, base, next, proof].filter(Boolean).join("\n");
}

function renderAssistantPanel(dim: Dim): string {
  const reply = assistantReply?.dim === dim ? assistantReply : null;
  return `<section class="ai-assistant-panel" style="--acc:${ACCENT[dim]}">
    <div class="ai-assistant-head">
      <span>${tt("情報助手 · 內測", "Intel Assistant · preview")}</span>
      <b>${tt("幫我整理產業、薪資、技能與真實樣貌", "Map industry, pay, skills, and reality")}</b>
    </div>
    <p>${tt(
      "輸入你想查的產業、工作類型或科系。這版先用內建情報回答;正式版可接後端抓職缺、薪資與論壇心得,再統計高頻技能與風險訊號。",
      "Enter an industry, work type, or major. This version answers with built-in intel; a production backend can aggregate job posts, pay data, and forum reports into repeated skills and risk signals.",
    )}</p>
    <div class="ai-assistant-inputrow">
      <input class="ai-assistant-input" type="text" maxlength="80" autocomplete="off"
        placeholder="${tt("例如:遊戲產業企劃真實薪資和技能?", "e.g. Game planning industry pay and skills?")}" />
      <button class="dash-btn primary" data-act="ask-ai">${tt("詢問", "Ask")}</button>
    </div>
    ${reply ? `<pre class="ai-assistant-reply">${esc(reply.answer)}</pre>` : ""}
  </section>`;
}

function renderSourceMapPanel(dim: Dim): string {
  return `<section class="source-map-panel">
    <div class="rec-resource-title">${tt("情報來源分層", "Intel source layers")} · ${esc(loc(ARCHETYPE[dim]))}</div>
    <div class="source-map-grid">
      ${INTEL_SOURCES.map((source, index) => `
        <div class="source-map-card">
          <span>${esc(loc(source.kind))}</span>
          <b>${esc(loc(source.trust))}</b>
          <p>${esc(loc(source.use))}</p>
          <div class="source-map-links">
            ${sourceLinksFor(dim, index).map((ex) => `<a href="${esc(ex.url)}" target="_blank" rel="noopener noreferrer">${esc(ex.label)}</a>`).join("")}
          </div>
        </div>`).join("")}
    </div>
  </section>`;
}

export function openCareerPanel(code: Dim[], tab: "rec" | "plan" = "rec"): void {
  currentCode = code;
  careerView = tab === "rec" ? "rec" : "home";
  if (!root) {
    root = document.createElement("div");
    root.id = "career-overlay";
    document.body.appendChild(root);
  }
  root.classList.remove("hidden");
  shellHost = root;
  shellEmbedded = false;
  renderShell(careerView);
}

export function closeCareerPanel(): void {
  root?.classList.add("hidden");
}

/** 手機「生涯」分頁:把完整的 5 分頁生涯外殼「內嵌」進容器(同一套 renderShell,不畫彈窗外框)。 */
export function mountCareerEmbedded(container: HTMLElement, code?: Dim[]): void {
  if (code && code.length) currentCode = code;
  shellHost = container;
  shellEmbedded = true;
  renderShell(careerView);
}

/** 螢幕閱讀器即時通報區(懶建立) */
let liveRegion: HTMLElement | null = null;
function announce(msg: string): void {
  if (!liveRegion) {
    liveRegion = document.createElement("div");
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.className = "sr-only";
    document.body.appendChild(liveRegion);
  }
  liveRegion.textContent = "";
  // 強制 DOM 變動 → SR 重新朗讀
  window.setTimeout(() => liveRegion && (liveRegion.textContent = msg), 50);
}

function renderShell(view: CareerView = careerView) {
  const host = shellHost;
  if (!host) return;
  careerView = view;
  const tab = (v: CareerView, zh: string, en: string) =>
    `<button class="career-tab ${view === v ? "active" : ""}" data-nav="${v}">${tt(zh, en)}</button>`;
  host.innerHTML = `
    ${shellEmbedded ? "" : `<div class="career-backdrop" data-close="1"></div>`}
    <div class="career-card ${shellEmbedded ? "embedded" : ""}" role="${shellEmbedded ? "region" : "dialog"}" aria-label="${tt("生涯探索", "Career Explorer")}">
      <div class="career-head">
        <div class="career-tabs">
          ${tab("home", "總覽", "Overview")}
          ${tab("rec", "推薦", "Routes")}
          ${tab("actions", "行動", "Actions")}
          ${tab("proof", "證據", "Proof")}
          ${tab("archetypes", "原型", "Types")}
        </div>
        ${shellEmbedded ? "" : `<button class="career-close" data-close="1" aria-label="${tt("關閉", "Close")}">${ICON_X}</button>`}
      </div>
      <div class="career-body" id="career-body"></div>
    </div>`;

  host.querySelectorAll<HTMLElement>("[data-close]").forEach((el) =>
    el.addEventListener("click", () => {
      sfx.click();
      closeCareerPanel();
    }),
  );
  host.querySelectorAll<HTMLElement>("[data-nav]").forEach((el) =>
    el.addEventListener("click", () => {
      sfx.click();
      const next = el.dataset.nav as CareerView;
      selectedActionId = null;
      selectedWall = null;
      if (next !== "rec") selectedRec = null;
      if (next !== "archetypes") selectedDim = null;
      renderShell(next);
    }),
  );

  const body = host.querySelector<HTMLElement>("#career-body")!;
  if (view === "home") void renderCareerHome(body);
  else if (view === "rec") void renderRec(body, currentCode[0], currentCode[1]);
  else if (view === "actions") void renderWall(body, () => renderShell("rec"), "actions");
  else if (view === "proof") void renderWall(body, () => renderShell("rec"), "proof");
  else void renderWall(body, () => renderShell("rec"), "archetypes");
}

async function renderCareerHome(body: HTMLElement) {
  showSkeleton(body);
  const [actions, achievements, bgMeta] = await Promise.all([
    careerStore.listActions(),
    careerStore.listAchievements(),
    careerStore.getMeta(),
  ]);
  playerBackground = bgMeta.background ?? "";
  const goals = actions.filter((a) => a.status !== "done");
  const doneActions = actions.filter((a) => a.status === "done");
  const portfolioCount = [
    ...doneActions.filter((a) => a.forPortfolio),
    ...achievements.filter((a) => a.forPortfolio),
  ].length;
  const progress = actions.length ? Math.round((doneActions.length / actions.length) * 100) : 0;
  const primary = currentCode[0];
  const secondary = currentCode[1];
  // 「下一步」單一情境 CTA(取代與分頁列重複的四宮格導覽):依目前狀態指一條最該做的路。
  const nextStep: { nav: CareerView; label: string; sub: string } =
    actions.length === 0
      ? { nav: "rec", label: tt("先收藏一個方向", "Save your first route"), sub: tt("到「推薦」挑一條航線,把想試的科系或職業加入計畫。", "Open Routes, pick one, and add a major or job to your plan.") }
      : goals.length > 0
        ? { nav: "actions", label: tt(`完成下一個行動(還有 ${goals.length} 件)`, `Finish your next action (${goals.length} open)`), sub: tt("做完一件小任務,它就會變成能放進證據牆的準備。", "Complete one small task; it becomes proof you can log.") }
        : portfolioCount === 0
          ? { nav: "proof", label: tt("補一筆證據", "Log one proof"), sub: tt("把做過的事、連結或檔案放進證據牆,並標記能不能放進備審。", "Add what you did to the proof wall and tag it for applications.") }
          : { nav: "rec", label: tt("探索別條航線", "Explore another route"), sub: tt("興趣會變——點開其他原型,比較它們的科系與職業。", "Interests change — open other archetypes and compare.") };
  body.innerHTML = `
    <div class="terminal-home">
      <section class="terminal-hero" style="--acc:${ACCENT[primary]};background-image:url(assets/backgrounds/${DIM_BG[primary]}.png)">
        <div class="terminal-hero-copy">
          <span class="terminal-kicker">${tt("MERIDIAN CAREER TERMINAL", "MERIDIAN CAREER TERMINAL")}</span>
          <h2>${esc(loc(ARCHETYPE[primary]))}${riasecCode(primary)}${secondary && secondary !== primary ? ` <small>＋ ${esc(loc(ARCHETYPE[secondary]))}${riasecCode(secondary)}</small>` : ""}</h2>
          <p>${tt(
            "這裡不是答案牆,而是一個可回訪的準備系統。先看航線,收藏一個行動,做完後把證據放進牆裡。",
            "This is not an answer wall. It is a returnable preparation system: choose a route, save an action, then log proof when you finish it.",
          )}</p>
        </div>
        <div class="terminal-hero-stats">
          <div><span>${tt("行動完成", "Actions")}</span><b>${doneActions.length}/${actions.length}</b></div>
          <div><span>${tt("證據紀錄", "Proof")}</span><b>${achievements.length}</b></div>
          <div><span>${tt("備審素材", "Portfolio")}</span><b>${portfolioCount}</b></div>
        </div>
      </section>
      <section class="terminal-loop">
        <div><span>${tt("回訪循環", "Return loop")}</span><strong>${progress}%</strong></div>
        <i><em style="width:${progress}%"></em></i>
        <p>${tt("現有領域 → 興趣傾向 → 產業情報 → 行動驗證 → 證據牆。每一層都可以點進去看細節。", "Current field -> interest pattern -> industry intel -> action validation -> proof wall. Every layer opens into detail.")}</p>
      </section>
      <section class="solution-grid">
        ${SOLUTION_CARDS.map((card) => `
          <div class="solution-card">
            <span>${esc(loc(card.label))}</span>
            <b>${esc(loc(card.title))}</b>
            <p>${esc(loc(card.body))}</p>
          </div>`).join("")}
      </section>
      <button class="terminal-next" data-nav="${nextStep.nav}">
        <span class="terminal-next-kicker">${tt("下一步", "Next step")}</span>
        <b>${esc(nextStep.label)}</b>
        <p>${esc(nextStep.sub)}</p>
        <span class="terminal-next-go" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </span>
      </button>
    </div>`;

  body.querySelectorAll<HTMLElement>("[data-nav]").forEach((el) =>
    el.addEventListener("click", () => {
      sfx.click();
      renderShell(el.dataset.nav as CareerView);
    }),
  );
}

async function renderRec(body: HTMLElement, primary: Dim, secondary?: Dim) {
  showSkeleton(body);
  const [existing, meta, achievements] = await Promise.all([
    careerStore.listActions(),
    careerStore.getMeta(),
    careerStore.listAchievements(),
  ]);
  playerBackground = meta.background ?? "";
  // 情報助手用的輕量證據清單(只需要 dim 來算數量)
  const assistantWall = [
    ...existing.filter((a) => a.status === "done").map((a) => ({ dim: a.dim })),
    ...achievements.map((a) => ({ dim: a.dim })),
  ];
  const saved = new Set(
    existing.map((a) => `${a.dim}|${a.category}|${lsPair(a.text).zh}|${lsPair(a.text).en}`),
  );
  // 你的主/副航線排前面,其餘四型也全部開放探索(興趣會變,可以去試別條)。
  const own = [primary, secondary].filter((d, i, arr): d is Dim => !!d && arr.indexOf(d) === i);
  const dims: Dim[] = [...own, ...DIMS.filter((d) => !own.includes(d))];
  const active = recActiveDim && dims.includes(recActiveDim) ? recActiveDim : primary;
  recActiveDim = active;
  const block = (dim: Dim) => {
    const data = RECOMMENDATIONS[dim];
    const arche = loc(ARCHETYPE[dim]);
    // 漸進揭露:一次只攤開一個類別(科系/職涯/現在可以做/作品集),用上方類別列切換。
    const facets = CATS.map((cat) => `
        <button class="rec-facet ${cat === recCat ? "active" : ""}" data-rec-cat="${cat}">
          <img class="raw-asset" src="${REC_CATEGORY_ASSET[cat]}" alt="" loading="lazy" />
          <span>${esc(loc(REC_CATEGORY_LABEL[cat]))}</span>
          <b>${data[cat].length}</b>
        </button>`).join("");
    const items = data[recCat]
      .map((ls) => {
        const p = lsPair(ls);
        const label = loc(ls);
        const isSaved = saved.has(`${dim}|${recCat}|${p.zh}|${p.en}`);
        const selected = selectedRec?.dim === dim && selectedRec.cat === recCat && selectedRec.zh === p.zh;
        return `<button class="rec-chip rec-item ${isSaved ? "added" : ""} ${selected ? "selected" : ""}"
                  data-act="rec-detail" data-dim="${dim}" data-cat="${recCat}" data-zh="${esc(p.zh)}" data-en="${esc(p.en)}">
                  <img class="rec-chip-asset raw-asset" src="${REC_CATEGORY_ASSET[recCat]}" alt="" loading="lazy" />
                  <span>${esc(label)}</span><span class="rec-plus">${isSaved ? "✓" : "›"}</span>
                </button>`;
      })
      .join("");
    return `<div class="rec-block" style="--acc:${ACCENT[dim]}">
              <div class="rec-block-head has-bg" style="background-image:url(assets/backgrounds/${DIM_BG[dim]}.png)">
                <img class="rec-hero-asset raw-asset" src="${DIM_REWARD_ASSET[dim]}" alt="" loading="lazy" />
                <span class="rec-dot"></span>
                <span class="rec-arche">${esc(arche)}</span>
              </div>
              <p class="rec-summary-text">${esc(loc(REC_SUMMARY[dim]))}</p>
              <div class="rec-facets" role="tablist" aria-label="${tt("推薦類別", "Suggestion categories")}">${facets}</div>
              <div class="rec-chips">${items}</div>
            </div>`;
  };

  body.innerHTML = `
    <div class="rec-shell">
      <div class="career-section-head">
        <div>
          <h3>${tt("星圖探險航線 · 生涯推薦與行動提示", "Star Routes · Career Suggestions")}</h3>
          <p>${tt("這些不是標準答案。前兩條是你的鑑定結果,其餘四條也都打開了——興趣會變,想試別條隨時點開。", "Not fixed answers. The first two are your result; all six are open to explore — interests change.")}</p>
        </div>
      </div>
      <div class="rec-route-tabs" aria-label="${tt("切換探索的原型航線", "Switch archetype route")}">
        ${dims.map((dim) => {
          const role = dim === primary ? tt("你的主航線", "Your primary") : dim === secondary ? tt("你的副航線", "Your secondary") : tt("探索航線", "Explore");
          const mine = dim === primary || dim === secondary;
          return `<button class="rec-route-tab ${dim === active ? "active" : ""} ${mine ? "mine" : ""}" data-dim="${dim}" style="--acc:${ACCENT[dim]}">
            <span>${role}</span>
            <b>${esc(loc(ARCHETYPE[dim]))}${riasecCode(dim)}</b>
          </button>`;
        }).join("")}
      </div>
      <p class="career-intro">${tt(
        "點任一條航線探索。每條再分成科系、職涯、現在可以做的事、作品集四層,點「＋」才會加入行動計畫。",
        "Open any route to explore. Each splits into majors, careers, things to do now, and portfolio ideas. Tap “＋” to save it to your plan.",
      )}</p>
      ${block(active)}
      ${selectedRec ? renderRecDetail(selectedRec, saved) : ""}
      <div class="rec-fold-group">
        <div class="rec-fold-lead">${tt("深入探索(點開展開)", "Explore deeper (tap to expand)")}</div>
        ${fold("bridge", { zh: "我的底子怎麼接這條線", en: "How my base bridges in" }, { zh: "填你的科系/專長,系統幫你翻譯", en: "Add your base; the system translates it" }, renderBridgePanel(active))}
        ${fold("myth", { zh: "撕掉科系標籤 · 迷思破除", en: "Break the major label" }, { zh: "能力拆解 → 跨域反應爐 → 職涯星圖", en: "Decode → fuse → map" }, renderMythBreakerPanel(active))}
        ${fold("intel", { zh: "產業情報 · 薪資與真實樣貌", en: "Industry intel · pay & reality" }, { zh: "常見產業、技能、雇主看的證據", en: "Industries, skills, what employers notice" }, renderIndustryIntelPanel(active))}
        ${fold("source", { zh: "情報來源 · 自己查證", en: "Source map · verify it yourself" }, { zh: "官方資料 / 職缺 / 真實心得三層", en: "Official data / jobs / lived experience" }, renderSourceMapPanel(active))}
        ${fold("assistant", { zh: "問問產業情報(內測)", en: "Ask the intel assistant (preview)" }, { zh: "輸入產業 / 職類,系統幫你整理", en: "Ask about an industry or role" }, renderAssistantPanel(active))}
      </div>
      <div class="rec-resource-panel">
        <div class="rec-resource-title">${tt("可信探索入口", "Trusted exploration links")}</div>
        <div class="rec-resource-grid">
          ${RESOURCE_LINKS.map((r) => `
            <a class="rec-resource-card" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">
              <span class="rec-resource-source">${esc(r.source)}</span>
              <b>${esc(loc(r.title))}</b>
              <small>${esc(loc(r.desc))}</small>
            </a>`).join("")}
        </div>
      </div>
    </div>`;

  body.querySelectorAll<HTMLElement>(".rec-route-tab").forEach((btn) =>
    btn.addEventListener("click", () => {
      const dim = btn.dataset.dim as Dim;
      if (!dim || dim === recActiveDim) return;
      sfx.click();
      recActiveDim = dim;
      void renderRec(body, primary, secondary);
    }),
  );

  // 類別切換(科系/職涯/行動/作品集):一次只攤開一類。
  body.querySelectorAll<HTMLElement>("[data-rec-cat]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const cat = btn.dataset.recCat as RecCategory;
      if (!cat || cat === recCat) return;
      sfx.click();
      recCat = cat;
      selectedRec = null;
      void renderRec(body, primary, secondary);
    }),
  );

  // 深入探索摺疊區:用原生 <details> toggle,只同步展開狀態(撐過重繪),不重繪、不閃。
  body.querySelectorAll<HTMLDetailsElement>("details.rec-fold").forEach((d) =>
    d.addEventListener("toggle", () => {
      const id = d.dataset.fold;
      if (!id) return;
      if (d.open) openFolds.add(id);
      else openFolds.delete(id);
    }),
  );

  // 情報助手(內測):問產業/職類 → 內建解讀,接到目前航線。
  const askAssistant = () => {
    const q = body.querySelector<HTMLInputElement>(".ai-assistant-input")?.value.trim() ?? "";
    sfx.click();
    openFolds.add("assistant"); // 答完保持展開
    assistantReply = { dim: active, question: q, answer: buildAssistantAnswer(active, q, existing, assistantWall) };
    void renderRec(body, primary, secondary);
  };
  body.querySelector<HTMLElement>("[data-act=ask-ai]")?.addEventListener("click", askAssistant);
  body.querySelector<HTMLInputElement>(".ai-assistant-input")?.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    askAssistant();
  });

  body.querySelectorAll<HTMLElement>("[data-act=rec-detail]").forEach((chip) =>
    chip.addEventListener("click", () => {
      sfx.click();
      selectedRec = {
        dim: chip.dataset.dim as Dim,
        cat: chip.dataset.cat as RecCategory,
        zh: chip.dataset.zh ?? "",
        en: chip.dataset.en ?? "",
      };
      void renderRec(body, primary, secondary);
    }),
  );
  body.querySelectorAll<HTMLElement>("[data-act=myth-stage]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const stage = Number(btn.dataset.stage) as 1 | 2 | 3;
      if (![1, 2, 3].includes(stage) || mythStage === stage) return;
      sfx.click();
      mythStage = stage;
      void renderRec(body, primary, secondary);
    }),
  );
  body.querySelectorAll<HTMLElement>("[data-act=myth-role]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const dim = btn.dataset.dim as Dim;
      const index = Number(btn.dataset.index ?? 0);
      if (!DIMS.includes(dim)) return;
      sfx.click();
      selectedMythRole[dim] = index;
      void renderRec(body, primary, secondary);
    }),
  );
  // 底子輸入:玩家自己填 → 存進 careerStore → 重繪(系統重新解讀)。
  const bridgeInput = body.querySelector<HTMLInputElement>(".bridge-input");
  const saveBackground = async () => {
    if (!bridgeInput) return;
    const val = bridgeInput.value.trim();
    if (val === playerBackground) return;
    sfx.click();
    await careerStore.setBackground(val);
    playerBackground = val;
    announce(val ? tt(`已記住你的底子:${val}`, `Saved your base: ${val}`) : tt("已清空底子", "Base cleared"));
    await renderRec(body, primary, secondary);
  };
  body.querySelector<HTMLElement>("[data-act=save-background]")?.addEventListener("click", () => void saveBackground());
  bridgeInput?.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      void saveBackground();
    }
  });
  body.querySelector<HTMLElement>("[data-act=add-selected-rec]")?.addEventListener("click", async (ev) => {
      const btn = ev.currentTarget as HTMLElement;
      if (btn.getAttribute("aria-disabled") === "true" || !selectedRec) return;
      sfx.click();
      await careerStore.addAction({
        dim: selectedRec.dim,
        category: selectedRec.cat as ActionCategory,
        text: { zh: selectedRec.zh, en: selectedRec.en },
      });
      announce(tt(`已加入計畫：${loc({ zh: selectedRec.zh, en: selectedRec.en })}`, `Added to plan: ${selectedRec.en}`));
      await renderRec(body, primary, secondary);
    });
  body.querySelector<HTMLElement>("[data-act=open-actions]")?.addEventListener("click", () => {
    sfx.click();
    renderShell("actions");
  });
}

function renderRecDetail(item: { dim: Dim; cat: RecCategory; zh: string; en: string }, saved: Set<string>): string {
  const already = saved.has(`${item.dim}|${item.cat}|${item.zh}|${item.en}`);
  const title = loc({ zh: item.zh, en: item.en });
  const cat = loc(REC_CATEGORY_LABEL[item.cat]);
  const reality = DIM_REALITY[item.dim];
  const plan = validationPlan(item.dim, item.cat, title);
  const why = tt(
    "這不是最後答案,而是一個可以先試的小方向。把它加入行動後,你可以回來記錄做過的事,再把連結或檔案放進證據牆。",
    "This is not a final answer. It is a small direction to test. Save it as an action, then come back to log what you did and attach proof.",
  );
  const next = item.cat === "majors"
    ? tt("先用 ColleGo! 查這個學群,再找一篇 IOH 學長姐經驗。", "Check the cluster on ColleGo!, then read one IOH student story.")
    : item.cat === "careers"
      ? tt("先找一個真實從業者訪談,寫下這份工作每天在做什麼。", "Find one real interview and write down what this work actually does each day.")
      : item.cat === "activities"
        ? tt("把它拆成一個本週能完成的小任務,完成後回來登錄證據。", "Break it into one task you can finish this week, then log proof after doing it.")
        : tt("先收集一個作品、報告或截圖,用一句話說明你做了什麼。", "Collect one artifact, report, or screenshot, then describe what you made in one sentence.");
  return `<aside class="career-detail-panel rec-detail-panel" style="--acc:${ACCENT[item.dim]}">
    <div class="career-detail-head">
      <img class="raw-asset career-detail-icon" src="${REC_CATEGORY_ASSET[item.cat]}" alt="" loading="lazy" />
      <div>
        <span>${esc(cat)} · ${esc(loc(ARCHETYPE[item.dim]))}</span>
        <h3>${esc(title)}</h3>
      </div>
    </div>
    <p>${esc(why)}</p>
    <div class="career-reality-grid">
      <div>
        <span>${tt("真實日常", "Daily reality")}</span>
        <p>${esc(loc(reality.daily))}</p>
      </div>
      <div>
        <span>${tt("可能不適應", "Possible friction")}</span>
        <p>${esc(loc(reality.friction))}</p>
      </div>
    </div>
    <div class="career-detail-callout">
      <span>${tt("建議下一步", "Suggested next step")}</span>
      <b>${esc(next)}</b>
    </div>
    <div class="validation-card">
      <span>${tt("低成本驗錯任務", "Low-cost validation task")}</span>
      <b>${esc(plan.test)}</b>
      <small>${tt("留下證據", "Proof to keep")} · ${esc(plan.proof)}</small>
      <em>${esc(plan.question)}</em>
    </div>
    <div class="career-detail-actions">
      <button class="dash-btn primary" data-act="add-selected-rec" ${already ? `aria-disabled="true"` : ""}>${already ? tt("✓ 已加入行動", "✓ Added") : tt("＋ 加入行動計畫", "+ Add to action plan")}</button>
      <button class="dash-btn" data-act="open-actions">${tt("查看行動計畫", "Open actions")}</button>
    </div>
  </aside>`;
}

interface WallEntry {
  id: string;
  kind: "action" | "ach";
  text: string;
  dim: Dim | null;
  at: number;
  forPortfolio: boolean; // 學生標記「可用於備審/作品集」
  evidence: AchievementEvidence[];
  targetMajor?: string;
  skillTags?: string[];
}

const fmtDate = (at: number) => {
  const d = new Date(at);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const MAX_EVIDENCE_FILE = 1.5 * 1024 * 1024;

function normalizeEvidenceLink(raw: string): AchievementEvidence | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return { type: "link", label: url.hostname.replace(/^www\./, ""), href: url.toString() };
  } catch {
    return null;
  }
}

function fileToEvidence(file: File): Promise<AchievementEvidence> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_EVIDENCE_FILE) {
      reject(new Error("file-too-large"));
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      resolve({
        type: "file",
        label: file.name,
        href: String(reader.result ?? ""),
        name: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
      });
    });
    reader.addEventListener("error", () => reject(reader.error ?? new Error("file-read-failed")));
    reader.readAsDataURL(file);
  });
}

function renderActionDetail(it: ActionItem | null): string {
  if (!it) {
    return `<aside class="career-detail-panel empty">
      <span>${tt("ACTION DETAIL", "ACTION DETAIL")}</span>
      <p>${tt("先從推薦頁加入一個方向,這裡就會出現任務詳情。", "Add a direction from recommendations first, then its mission details will appear here.")}</p>
    </aside>`;
  }
  const done = it.status === "done";
  return `<aside class="career-detail-panel" style="--acc:${ACCENT[it.dim]}">
    <div class="career-detail-head">
      <img class="raw-asset career-detail-icon" src="${REC_CATEGORY_ASSET[it.category as RecCategory]}" alt="" loading="lazy" />
      <div>
        <span>${esc(loc(REC_CATEGORY_LABEL[it.category as RecCategory]))} · ${esc(loc(ARCHETYPE[it.dim]))}</span>
        <h3>${esc(loc(it.text))}</h3>
      </div>
    </div>
    <p>${tt(
      "這張卡是待辦,不是成就。做完後再把它標記完成,它才會被計入原型進度與證據牆。",
      "This card is a to-do, not an achievement. Mark it done only after you actually complete it; then it counts toward archetype progress and the proof wall.",
    )}</p>
    <div class="career-detail-callout">
      <span>${tt("如何留下證據", "How to keep proof")}</span>
      <b>${tt("完成後到證據牆補一筆連結、檔案或一句紀錄。", "After finishing, add a link, file, or short note in the proof wall.")}</b>
    </div>
    <div class="career-detail-actions">
      <button class="dash-btn primary" data-act="detail-done" data-id="${it.id}" ${done ? `aria-disabled="true"` : ""}>${done ? tt("✓ 已完成", "✓ Done") : tt("標記完成", "Mark done")}</button>
      <button class="dash-btn" data-act="detail-pin-action" data-id="${it.id}">${it.forPortfolio ? tt("取消備審標記", "Unmark portfolio") : tt("標為備審素材", "Mark portfolio")}</button>
      <button class="dash-btn" data-act="detail-del-action" data-id="${it.id}">${tt("移除", "Remove")}</button>
    </div>
  </aside>`;
}

function renderWallDetail(e: WallEntry | null): string {
  if (!e) {
    return `<aside class="career-detail-panel empty">
      <span>${tt("PROOF DETAIL", "PROOF DETAIL")}</span>
      <p>${tt("證據牆還是空的。完成行動或手動登錄一件做過的事後,這裡會顯示詳情。", "The proof wall is empty. Finish an action or log something you did, then details appear here.")}</p>
    </aside>`;
  }
  const tag = e.dim ? loc(ARCHETYPE[e.dim]) : tt("綜合", "General");
  const acc = e.dim ? ACCENT[e.dim] : "#8fb3c4";
  const evidence = e.evidence.length
    ? e.evidence.map((ev) => `<a href="${esc(ev.href)}" ${ev.type === "file" ? `download="${esc(ev.name ?? ev.label)}"` : `target="_blank" rel="noopener noreferrer"`}>${ev.type === "file" ? tt("檔案", "File") : tt("連結", "Link")} · ${esc(ev.label)}</a>`).join("")
    : `<span>${tt("尚未附證據。可以新增一筆自由紀錄並貼上連結或檔案。", "No attachment yet. Add a manual proof entry with a link or file.")}</span>`;
  const target = e.targetMajor?.trim();
  const skills = e.skillTags?.filter(Boolean) ?? [];
  const portfolioAdvice = target
    ? renderPortfolioPositioning(e, target, skills)
    : "";
  return `<aside class="career-detail-panel" style="--acc:${acc}">
    <div class="career-detail-head">
      ${e.dim ? `<img class="raw-asset career-detail-icon" src="${DIM_REWARD_ASSET[e.dim]}" alt="" loading="lazy" />` : ""}
      <div>
        <span>${esc(tag)} · ${e.kind === "action" ? tt("完成行動", "Completed action") : tt("自由紀錄", "Manual proof")}</span>
        <h3>${esc(e.text)}</h3>
      </div>
    </div>
    <div class="career-detail-proof">${evidence}</div>
    ${target || skills.length ? `<div class="portfolio-tags">
      ${target ? `<span>${tt("目標", "Target")} · ${esc(target)}</span>` : ""}
      ${skills.map((s) => `<span>${esc(s)}</span>`).join("")}
    </div>` : ""}
    ${portfolioAdvice}
    <div class="career-detail-callout">
      <span>${tt("備審判斷", "Portfolio use")}</span>
      <b>${e.forPortfolio ? tt("已標記為可用於申請、履歷或作品集。", "Marked for applications, resumes, or portfolios.") : tt("尚未標記。若它能證明你的準備,可以釘選成備審素材。", "Not marked yet. If it proves your preparation, pin it as portfolio material.")}</b>
    </div>
    <div class="career-detail-actions">
      <button class="dash-btn primary" data-act="detail-pin-wall" data-id="${e.id}" data-kind="${e.kind}">${e.forPortfolio ? tt("取消釘選", "Unpin") : `${ICON_PIN} ${tt("釘選備審", "Pin proof")}`}</button>
      ${e.kind === "ach" ? `<button class="dash-btn" data-act="detail-del-ach" data-id="${e.id}">${tt("移除紀錄", "Remove proof")}</button>` : ""}
    </div>
  </aside>`;
}

function renderPortfolioPositioning(e: WallEntry, target: string, skills: string[]): string {
  const dim = e.dim ?? currentCode[0] ?? "I";
  const bridge = FIELD_BRIDGES[dim];
  const skillText = skills.length ? skills.join("、") : listText(SKILL_DEMANDS[dim].skills, 3);
  return `<div class="portfolio-positioning" style="--acc:${ACCENT[dim]}">
    <span>${tt("備審定位", "Application positioning")}</span>
    <b>${tt(
      `這筆經驗可以支援「${target}」,重點不是說你適合某職業,而是證明你已經練過 ${skillText}。`,
      `This proof can support “${target}”. The point is not claiming a job fit; it proves you practiced ${skillText}.`,
    )}</b>
    <p>${esc(loc(bridge.reframe))}</p>
  </div>`;
}

function renderArchetypeDetail(dim: Dim | null, xpByDim: Record<Dim, number>, wall: WallEntry[]): string {
  if (!dim) return "";
  const xp = xpByDim[dim];
  const { lv, into, span } = levelFromXp(xp);
  const related = wall.filter((e) => e.dim === dim).slice(0, 5);
  return `<aside class="career-detail-panel archetype-detail" style="--acc:${ACCENT[dim]}">
    <div class="career-detail-head">
      <img class="raw-asset career-detail-icon" src="${DIM_REWARD_ASSET[dim]}" alt="" loading="lazy" />
      <div>
        <span>${currentCode[0] === dim ? tt("主原型", "Primary archetype") : tt("原型模組", "Archetype module")}</span>
        <h3>${esc(loc(ARCHETYPE[dim]))}${riasecCode(dim)} · Lv ${lv}</h3>
      </div>
    </div>
    <div class="career-detail-level"><i><em style="width:${Math.round((into / span) * 100)}%"></em></i><span>${into}/${span} ${tt("到下一級", "to next")}</span></div>
    <p>${esc(loc(REC_SUMMARY[dim]))}</p>
    <div class="career-detail-callout">
      <span>${tt("升級來源", "Level sources")}</span>
      <b>${related.length ? tt("以下紀錄正在推動這個原型。", "These records are pushing this archetype forward.") : tt("還沒有紀錄。先完成一個相關行動。", "No records yet. Complete one related action first.")}</b>
    </div>
    <div class="career-detail-list">
      ${related.map((e) => `<button data-wall-ref="${e.kind}|${e.id}">${esc(e.text)}<span>${fmtDate(e.at)}</span></button>`).join("") || ""}
    </div>
  </aside>`;
}

function renderSpectrumPanel(xpByDim: Record<Dim, number>, total: number): string {
  const max = Math.max(1, ...DIMS.map((d) => xpByDim[d]));
  return `<aside class="spectrum-panel">
    <div class="spectrum-head">
      <span>${tt("RIASEC SPECTRUM", "RIASEC SPECTRUM")}</span>
      <b>${total}</b>
    </div>
    <p>${tt("基於目前已登錄的成就與完成行動。", "Based on logged proof and completed actions.")}</p>
    <div class="spectrum-bars">
      ${DIMS.map((d) => {
        const value = xpByDim[d];
        const pct = Math.max(3, Math.round((value / max) * 100));
        return `<button class="spectrum-row" data-act="dim-detail" data-dim="${d}" style="--acc:${ACCENT[d]}">
          <span>${esc(loc(ARCHETYPE[d]))}${riasecCode(d)}</span>
          <i><em style="width:${pct}%"></em></i>
          <b>${value}</b>
        </button>`;
      }).join("")}
    </div>
    <small>${tt("點任一原型可查看升級來源。", "Tap any archetype to review its level sources.")}</small>
  </aside>`;
}

// 成就牆:① 自由紀錄 composer(回訪登錄迴圈)② 進行中目標(勾完→上牆)③ 成就牆(已做的事，越疊越多)
async function renderWall(body: HTMLElement, onGoRec?: () => void, forcedView?: WallView) {
  showSkeleton(body);
  const view: WallView = forcedView ?? embeddedWallView;
  const [actions, achievements, bgMeta] = await Promise.all([
    careerStore.listActions(),
    careerStore.listAchievements(),
    careerStore.getMeta(),
  ]);
  playerBackground = bgMeta.background ?? "";
  const goals = actions.filter((a) => a.status !== "done");
  const doneActions = actions.filter((a) => a.status === "done");

  // 原型 XP:已完成行動 + 自由紀錄,各依其維度累加(1 件 = 1 XP)。
  const xpByDim: Record<Dim, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  doneActions.forEach((a) => { if (a.dim) xpByDim[a.dim] += 1; });
  achievements.forEach((a) => { if (a.dim) xpByDim[a.dim] += 1; });
  const archGrid = `
    <div class="wall-section arch-section">
      <div class="wall-section-title">${tt("原型進度", "Archetype Levels")}<span class="wall-count">${DIMS.filter((d) => xpByDim[d] > 0).length}/6</span></div>
      <p class="wall-hint">${tt("你在牆上記錄的每一件事,都會讓對應的原型升級。", "Everything you log on the wall levels up its matching archetype.")}</p>
      <div class="arch-grid">
        ${DIMS.map((d) => {
          const xp = xpByDim[d];
          const { lv, into, span } = levelFromXp(xp);
          const primary = currentCode[0] === d;
          const pct = Math.round((into / span) * 100);
          const left = span - into;
          return `<button class="arch-card ${primary ? "primary" : ""} ${xp ? "active" : "dormant"}" data-act="dim-detail" data-dim="${d}" style="--acc:${ACCENT[d]}">
            <div class="arch-icon">
              <img class="arch-asset raw-asset" src="${DIM_REWARD_ASSET[d]}" alt="" loading="lazy" />
            </div>
            <div class="arch-card-in">
              <div class="arch-top">
                <span class="arch-kicker">${primary ? tt("主原型", "Primary") : tt("原型", "Archetype")}</span>
                <span class="arch-lv">Lv ${lv}</span>
              </div>
              <div class="arch-name">${esc(loc(ARCHETYPE[d]))}${riasecCode(d)}</div>
              <div class="arch-bar"><i style="width:${pct}%"></i></div>
              <div class="arch-foot">
                <span>${xp} ${tt("件記錄", "logged")}</span>
                <span>${left} ${tt("件到下一級", "to next")}</span>
              </div>
            </div>
          </button>`;
        }).join("")}
      </div>
    </div>`;

  const wall: WallEntry[] = [
    ...doneActions.map((a) => ({
      id: a.id,
      kind: "action" as const,
      text: loc(a.text),
      dim: a.dim,
      at: a.updatedAt,
      forPortfolio: !!a.forPortfolio,
      evidence: [] as AchievementEvidence[],
    })),
    ...achievements.map((a) => ({
      id: a.id,
      kind: "ach" as const,
      text: a.text,
      dim: a.dim,
      at: a.createdAt,
      forPortfolio: !!a.forPortfolio,
      evidence: a.evidence ?? [],
      targetMajor: a.targetMajor,
      skillTags: a.skillTags,
    })),
  ].sort((x, y) => y.at - x.at);

  const portfolioCount = wall.filter((e) => e.forPortfolio).length;
  if (wallPortfolioOnly && portfolioCount === 0) wallPortfolioOnly = false; // 沒有備審項時自動關閉篩選
  const shownWall = wallPortfolioOnly ? wall.filter((e) => e.forPortfolio) : wall;
  const planProgress = actions.length ? Math.round((doneActions.length / actions.length) * 100) : 0;
  const assistantDim: Dim = selectedDim ?? currentCode[0] ?? "I";

  if (composerDim === null) composerDim = currentCode[0] ?? null;
  const dirs: (Dim | null)[] = [...currentCode.filter((d, i, a) => a.indexOf(d) === i), null];

  const dirChip = (d: Dim | null) => {
    const on = composerDim === d;
    const label = d ? loc(ARCHETYPE[d]) : tt("綜合", "General");
    const acc = d ? ACCENT[d] : "#8fb3c4";
    return `<button class="wall-dir ${on ? "on" : ""}" data-dir="${d ?? ""}" style="--acc:${acc}">${esc(label)}</button>`;
  };

  const card = (e: WallEntry, i: number) => {
    const acc = e.dim ? ACCENT[e.dim] : "#8fb3c4";
    const tag = e.dim ? loc(ARCHETYPE[e.dim]) : tt("綜合", "General");
    const target = e.targetMajor?.trim();
    const skills = e.skillTags?.filter(Boolean) ?? [];
    const evidence = e.evidence.length
      ? `<div class="wall-evidence">${e.evidence.map((ev) => `
          <a href="${esc(ev.href)}" ${ev.type === "file" ? `download="${esc(ev.name ?? ev.label)}"` : `target="_blank" rel="noopener noreferrer"`}>
            ${ev.type === "file" ? "檔案" : "連結"} · ${esc(ev.label)}
          </a>
        `).join("")}</div>`
      : "";
    const pin = `<button class="wall-pin ${e.forPortfolio ? "on" : ""}" data-act="pin"
        aria-pressed="${e.forPortfolio}"
        title="${tt("可用於備審 / 作品集", "Mark for portfolio")}"
        aria-label="${e.forPortfolio ? tt("已標為備審素材,點此取消", "Tagged for portfolio, tap to remove") : tt("標為可用於備審", "Tag for portfolio")}">${ICON_PIN}</button>`;
    return `<div class="wall-card ${e.forPortfolio ? "is-portfolio" : ""}" data-id="${e.id}" data-kind="${e.kind}" data-act="wall-detail" style="--acc:${acc};--i:${i}">
        ${e.dim ? `<img class="wall-card-art raw-asset" src="${DIM_REWARD_ASSET[e.dim]}" alt="" loading="lazy" />` : ""}
        <div class="wall-card-head">
          <span class="wall-date" style="font-variant-numeric:tabular-nums">${fmtDate(e.at)}</span>
          <span class="wall-tag">${esc(tag)}</span>
          <span class="wall-head-actions">
            ${pin}
            ${e.kind === "ach"
              ? `<button class="wall-del" data-act="del-ach" aria-label="${tt("移除", "Remove")}">${ICON_X}</button>`
              : `<span class="wall-badge">${tt("達成", "done")}</span>`}
          </span>
        </div>
        <div class="wall-card-text">${esc(e.text)}</div>
        ${target || skills.length ? `<div class="wall-card-tags">
          ${target ? `<span>${tt("目標", "Target")} · ${esc(target)}</span>` : ""}
          ${skills.slice(0, 2).map((s) => `<span>${esc(s)}</span>`).join("")}
        </div>` : ""}
        ${evidence}
      </div>`;
  };

  const goalRow = (it: ActionItem) => `
    <div class="goal-row ${selectedActionId === it.id ? "selected" : ""}" data-id="${it.id}" data-act="action-detail" style="--acc:${ACCENT[it.dim]}">
      <button class="goal-check" data-act="done" aria-label="${tt("標記達成", "Mark done")}"></button>
      <span class="goal-text">${esc(loc(it.text))}</span>
      <span class="goal-cat">${esc(loc(REC_CATEGORY_LABEL[it.category as RecCategory]))}</span>
      <button class="goal-del" data-act="del-goal" aria-label="${tt("移除", "Remove")}">${ICON_X}</button>
    </div>`;

  const wallNav = `
    <div class="wall-subtabs" aria-label="${tt("成就牆分頁", "Wall sections")}">
      <button class="wall-subtab ${view === "overview" ? "active" : ""}" data-wall-view="overview">${tt("總覽", "Overview")}</button>
      <button class="wall-subtab ${view === "actions" ? "active" : ""}" data-wall-view="actions">${tt("行動計畫", "Action Plan")}<span>${goals.length}</span></button>
      <button class="wall-subtab ${view === "proof" ? "active" : ""}" data-wall-view="proof">${tt("證據牆", "Proof Wall")}<span>${wall.length}</span></button>
      <button class="wall-subtab ${view === "archetypes" ? "active" : ""}" data-wall-view="archetypes">${tt("原型", "Types")}</button>
    </div>`;

  const dashboard = `
    <div class="wall-dashboard">
      <section class="wall-metric">
        <span>${tt("推薦任務", "Plan Items")}</span>
        <b>${actions.length}</b>
        <small>${tt("收藏方向只是待辦，不會直接變成成就", "Saved directions are to-dos, not achievements yet")}</small>
      </section>
      <section class="wall-metric">
        <span>${tt("已完成", "Completed")}</span>
        <b>${doneActions.length}</b>
        <small>${tt("只有完成的準備行動會進牆", "Only completed prep actions move onto the wall")}</small>
      </section>
      <section class="wall-metric">
        <span>${tt("備審素材", "Portfolio Proof")}</span>
        <b>${portfolioCount}</b>
        <small>${tt("可用於申請、履歷、作品集", "Useful for applications, resumes, portfolios")}</small>
      </section>
    </div>`;

  const loop = `
    <div class="wall-loop">
      <div>
        <span>${tt("星火號回訪循環", "Return Loop")}</span>
        <strong>${planProgress}%</strong>
      </div>
      <div class="wall-loop-bar"><i style="width:${planProgress}%"></i></div>
      <p>${tt(
        "收藏方向 → 做一件小事 → 上傳連結或檔案 → 標記能不能放進備審。",
        "Save a direction -> do one small task -> upload a link or file -> tag it for applications.",
      )}</p>
    </div>`;

  const composer = `
    <div class="wall-composer">
      <div class="wall-input-row">
        <input class="wall-input" type="text" maxlength="120" autocomplete="off"
          placeholder="${tt("記錄一件你為目標做的事…", "Log one thing you did toward your goal…")}"
          aria-label="${tt("紀錄成就", "Log an achievement")}" />
        <button class="wall-add" data-act="add-ach">${tt("✦ 記錄", "✦ Log")}</button>
      </div>
      <div class="portfolio-target-row">
        <input class="wall-target-major" type="text" maxlength="42" autocomplete="off"
          placeholder="${tt("目標科系 / 學群 / 二專方向,例如:數學系、資工、商業設計", "Target major / cluster, e.g. math, CS, business design")}"
          aria-label="${tt("目標科系", "Target major")}" />
        <input class="wall-skill-tags" type="text" maxlength="80" autocomplete="off"
          placeholder="${tt("這筆經驗展現的技能,用逗號分隔", "Skills shown here, separated by commas")}"
          aria-label="${tt("技能標籤", "Skill tags")}" />
      </div>
      <div class="wall-proof-row">
        <input class="wall-proof-link" type="url" inputmode="url" autocomplete="off"
          placeholder="${tt("貼上作品、活動、證書或雲端連結", "Paste a project, activity, certificate, or cloud link")}"
          aria-label="${tt("證據連結", "Evidence link")}" />
        <label class="wall-file">
          <input class="wall-proof-file" type="file" />
          <span>${tt("附檔案", "Attach file")}</span>
        </label>
      </div>
      <div class="portfolio-target-hint">
        ${tt("有填目標科系時,這筆會自動標為備審素材。重點是證明能力如何接到科系,不是把職業當成唯一出路。", "When a target major is filled, this entry is automatically marked for applications. The point is connecting skills to a major, not locking into one career.")}
      </div>
      <div class="wall-dirs">${dirs.map(dirChip).join("")}</div>
    </div>
  `;

  const actionView = `
    <div class="career-section-head">
      <div>
        <h3>${tt("航行行動計畫", "Action Plan")}</h3>
        <p>${tt("不用一次決定未來,先完成下一個小任務。", "You do not need to decide the future now. Finish the next small mission first.")}</p>
      </div>
      <span>${doneActions.length}/${actions.length}</span>
    </div>
    <div class="career-tip">
      <span>${tt("系統提示", "System Tip")}</span>
      <p>${tt("每完成一個任務,它才會從待辦變成可以放進成就牆的準備證據。", "Only completed missions become preparation proof that can enter the wall.")}</p>
    </div>
    ${loop}
    <div class="terminal-split">
      <div>
    ${goals.length
      ? `<div class="wall-section">
          <div class="wall-section-title">${tt("進行中的目標", "In progress")}<span class="wall-count">${goals.length}</span></div>
          <div class="goal-list">${goals.map(goalRow).join("")}</div>
        </div>`
      : `<div class="wall-empty">
          <p>${tt("目前沒有進行中的行動。先到生涯推薦頁收藏一兩個方向,再回來把它們完成。", "No active actions yet. Save one or two suggestions first, then come back and complete them.")}</p>
          ${onGoRec ? `<button class="dash-btn primary" data-act="go-rec">${tt("✦ 去看生涯推薦", "✦ Browse suggestions")}</button>` : ""}
        </div>`}
      </div>
      ${renderActionDetail(actions.find((a) => a.id === selectedActionId) ?? goals[0] ?? actions[0] ?? null)}
    </div>
  `;

  const proofView = `
    <div class="career-section-head">
      <div>
        <h3>${tt("成就牆與準備證據庫", "Proof Wall & Evidence Vault")}</h3>
        <p>${tt("這裡放學生真的做過的事,不是放職業或科系名稱。", "This stores what the student actually did, not career or major labels.")}</p>
      </div>
      <button class="dash-btn primary" data-act="focus-composer">${tt("＋ 登錄證據", "+ Add Proof")}</button>
    </div>
    <div class="career-tip">
      <span>${tt("證據牆提示", "Proof Wall Tip")}</span>
      <p>${tt("把作品、活動、報告、志工或證書留下來。之後可以整理成備審、履歷或作品集素材。", "Save projects, activities, reports, service work, or certificates. Later, use them for applications, resumes, or portfolios.")}</p>
    </div>
    ${composer}
    <div class="terminal-split proof-split">
      ${renderSpectrumPanel(xpByDim, wall.length)}
      <div>
    <div class="wall-section">
      <div class="wall-section-title">
        ${tt("準備證據牆", "Preparation Proof Wall")}<span class="wall-count">${wall.length}</span>
        ${portfolioCount
          ? `<button class="wall-filter ${wallPortfolioOnly ? "on" : ""}" data-act="filter" aria-pressed="${wallPortfolioOnly}">${ICON_PIN} ${portfolioCount} ${tt("備審素材", "for portfolio")}</button>`
          : ""}
      </div>
      ${wall.length
        ? `<p class="wall-hint">${tt("點任一張卡右上的書籤,把它標成「可用於備審」——之後做備審 / 作品集時直接調出來用。", "Tap the bookmark on any card to mark it “for portfolio” — pull them up later when you build your application.")}</p>
           <div class="wall-grid">${shownWall.map(card).join("")}</div>`
        : `<div class="wall-empty">
            <p>${tt("這面牆還是空的。完成上面的目標，或直接記下你做過的一件事——它會留在這裡，越疊越高。", "This wall is empty. Finish a goal above, or just log one thing you did — it stays here and stacks up over time.")}</p>
            ${onGoRec && !goals.length ? `<button class="dash-btn primary" data-act="go-rec">${tt("✦ 去看生涯推薦", "✦ Browse suggestions")}</button>` : ""}
          </div>`}
    </div>
      </div>
      ${renderWallDetail(wall.find((e) => e.id === selectedWall?.id && e.kind === selectedWall.kind) ?? shownWall[0] ?? null)}
    </div>`;

  const overviewView = `
    <div class="career-section-head">
      <div>
        <h3>${tt("生涯探索終端", "Career Exploration Terminal")}</h3>
        <p>${tt("先看總覽,再進推薦、行動、證據與原型詳情。", "Start with the overview, then open routes, actions, proof, and archetype detail.")}</p>
      </div>
    </div>
    ${dashboard}
    ${loop}
    <div class="rec-fold-group">
      <div class="rec-fold-lead">${tt("深入探索(點開展開)", "Explore deeper (tap to expand)")}</div>
      ${fold("bridge", { zh: "我的底子怎麼接", en: "How my base bridges in" }, { zh: "填你的科系/專長,系統幫你翻譯", en: "Add your base; the system translates it" }, renderBridgePanel(assistantDim))}
      ${fold("myth", { zh: "撕掉科系標籤 · 迷思破除", en: "Break the major label" }, { zh: "能力拆解 → 跨域反應爐 → 職涯星圖", en: "Decode → fuse → map" }, renderMythBreakerPanel(assistantDim))}
      ${fold("intel", { zh: "產業情報 · 薪資與真實樣貌", en: "Industry intel · pay & reality" }, { zh: "常見產業、技能、雇主看的證據", en: "Industries, skills, what employers notice" }, renderIndustryIntelPanel(assistantDim))}
      ${fold("assistant", { zh: "問問產業情報(內測)", en: "Ask the intel assistant (preview)" }, { zh: "輸入產業 / 職類,系統幫你整理", en: "Ask about an industry or role" }, renderAssistantPanel(assistantDim))}
    </div>
    ${archGrid}
    <div class="wall-section">
      <div class="wall-section-title">${tt("下一步", "Next step")}</div>
      <div class="wall-next-grid">
        <button class="wall-next-card" data-jump-view="actions">
          <span>${tt("完成一個行動", "Complete one action")}</span>
          <b>${goals.length ? goals.length : "0"}</b>
          <small>${tt("把收藏的方向變成真正做過的事", "Turn saved directions into things you actually did")}</small>
        </button>
        <button class="wall-next-card" data-jump-view="proof">
          <span>${tt("補一筆證據", "Add one proof")}</span>
          <b>${portfolioCount}</b>
          <small>${tt("貼連結、附檔案,或標記備審素材", "Paste a link, attach a file, or mark portfolio proof")}</small>
        </button>
      </div>
    </div>`;

  const archetypeView = `
    ${archGrid}
    ${renderArchetypeDetail(selectedDim ?? currentCode[0], xpByDim, wall)}
  `;

  // forcedView = 從生涯面板頂部分頁進入 → 頂部分頁已負責導覽,內層 wallNav 會重複;只有獨立嵌入(手機成就牆)才需要 wallNav。
  body.innerHTML = `${forcedView ? "" : wallNav}${view === "overview" ? overviewView : view === "actions" ? actionView : view === "proof" ? proofView : archetypeView}`;

  body.querySelectorAll<HTMLElement>("[data-wall-view]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const next = btn.dataset.wallView as WallView;
      if (!next || next === view) return;
      sfx.click();
      embeddedWallView = next;
      if (forcedView) {
        renderShell(next === "overview" ? "home" : next === "archetypes" ? "archetypes" : next);
        return;
      }
      await renderWall(body, onGoRec, forcedView);
    }),
  );
  body.querySelectorAll<HTMLElement>("[data-jump-view]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const next = btn.dataset.jumpView as WallView;
      if (!next) return;
      sfx.click();
      embeddedWallView = next;
      await renderWall(body, onGoRec, forcedView);
    }),
  );

  body.querySelectorAll<HTMLElement>("[data-act=action-detail]").forEach((row) =>
    row.addEventListener("click", async () => {
      selectedActionId = row.dataset.id ?? null;
      sfx.click();
      await renderWall(body, onGoRec, "actions");
    }),
  );
  body.querySelectorAll<HTMLElement>("[data-act=wall-detail]").forEach((cardEl) =>
    cardEl.addEventListener("click", async () => {
      selectedWall = { id: cardEl.dataset.id ?? "", kind: (cardEl.dataset.kind as "action" | "ach") ?? "ach" };
      sfx.click();
      await renderWall(body, onGoRec, "proof");
    }),
  );
  body.querySelectorAll<HTMLElement>("[data-act=dim-detail]").forEach((cardEl) =>
    cardEl.addEventListener("click", async () => {
      selectedDim = cardEl.dataset.dim as Dim;
      sfx.click();
      await renderWall(body, onGoRec, "archetypes");
    }),
  );
  body.querySelector<HTMLElement>("[data-act=focus-composer]")?.addEventListener("click", () => {
    sfx.click();
    body.querySelector<HTMLInputElement>(".wall-input")?.focus();
    body.querySelector<HTMLElement>(".wall-composer")?.classList.add("pulse-focus");
    window.setTimeout(() => body.querySelector<HTMLElement>(".wall-composer")?.classList.remove("pulse-focus"), 700);
  });
  body.querySelector<HTMLElement>("[data-act=ask-ai]")?.addEventListener("click", async () => {
    const inputEl = body.querySelector<HTMLInputElement>(".ai-assistant-input");
    const question = inputEl?.value.trim() ?? "";
    sfx.click();
    assistantReply = {
      dim: assistantDim,
      question,
      answer: buildAssistantAnswer(assistantDim, question, actions, wall),
    };
    await renderWall(body, onGoRec, forcedView);
  });
  body.querySelector<HTMLInputElement>(".ai-assistant-input")?.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    body.querySelector<HTMLElement>("[data-act=ask-ai]")?.click();
  });
  body.querySelectorAll<HTMLElement>("[data-act=myth-stage]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const stage = Number(btn.dataset.stage) as 1 | 2 | 3;
      if (![1, 2, 3].includes(stage) || mythStage === stage) return;
      sfx.click();
      mythStage = stage;
      await renderWall(body, onGoRec, forcedView);
    }),
  );
  body.querySelectorAll<HTMLElement>("[data-act=myth-role]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const dim = btn.dataset.dim as Dim;
      const index = Number(btn.dataset.index ?? 0);
      if (!DIMS.includes(dim)) return;
      sfx.click();
      selectedMythRole[dim] = index;
      await renderWall(body, onGoRec, forcedView);
    }),
  );
  // 底子輸入(成就牆總覽也會出現跨域橋接面板)
  const wallBridgeInput = body.querySelector<HTMLInputElement>(".bridge-input");
  const saveWallBackground = async () => {
    if (!wallBridgeInput) return;
    const val = wallBridgeInput.value.trim();
    if (val === playerBackground) return;
    sfx.click();
    await careerStore.setBackground(val);
    playerBackground = val;
    announce(val ? tt(`已記住你的底子:${val}`, `Saved your base: ${val}`) : tt("已清空底子", "Base cleared"));
    await renderWall(body, onGoRec, forcedView);
  };
  body.querySelector<HTMLElement>("[data-act=save-background]")?.addEventListener("click", () => void saveWallBackground());
  wallBridgeInput?.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      void saveWallBackground();
    }
  });
  // 深入探索摺疊區:同步展開狀態(撐過重繪),不重繪
  body.querySelectorAll<HTMLDetailsElement>("details.rec-fold").forEach((d) =>
    d.addEventListener("toggle", () => {
      const id = d.dataset.fold;
      if (!id) return;
      if (d.open) openFolds.add(id);
      else openFolds.delete(id);
    }),
  );

  // composer
  const input = body.querySelector<HTMLInputElement>(".wall-input");
  const targetInput = body.querySelector<HTMLInputElement>(".wall-target-major");
  const skillInput = body.querySelector<HTMLInputElement>(".wall-skill-tags");
  const linkInput = body.querySelector<HTMLInputElement>(".wall-proof-link");
  const fileInput = body.querySelector<HTMLInputElement>(".wall-proof-file");
  const fileLabel = body.querySelector<HTMLElement>(".wall-file span");
  fileInput?.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (fileLabel) fileLabel.textContent = file ? file.name : tt("附檔案", "Attach file");
  });
  const submit = async () => {
    const text = input?.value.trim();
    if (!text) return;
    const evidence: AchievementEvidence[] = [];
    const link = normalizeEvidenceLink(linkInput?.value ?? "");
    if ((linkInput?.value.trim() ?? "") && !link) {
      announce(tt("連結格式不正確，請貼 http 或 https 開頭的網址。", "Invalid link. Please use an http or https URL."));
      linkInput?.focus();
      return;
    }
    if (link) evidence.push(link);
    const file = fileInput?.files?.[0];
    if (file) {
      try {
        evidence.push(await fileToEvidence(file));
      } catch {
        announce(tt("檔案太大，原型階段請先附 1.5MB 以下的小檔案，或改貼雲端連結。", "File too large. In this prototype, attach files under 1.5MB or paste a cloud link."));
        fileInput.value = "";
        if (fileLabel) fileLabel.textContent = tt("附檔案", "Attach file");
        return;
      }
    }
    sfx.solve();
    const targetMajor = targetInput?.value.trim() ?? "";
    const skillTags = (skillInput?.value ?? "")
      .split(/[，,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);
    await careerStore.addAchievement({
      text,
      dim: composerDim,
      evidence,
      targetMajor: targetMajor || undefined,
      skillTags: skillTags.length ? skillTags : undefined,
      forPortfolio: !!targetMajor,
    });
    announce(tt(`已記錄：${text}`, `Logged: ${text}`));
    await renderWall(body, onGoRec, forcedView);
  };
  body.querySelector("[data-act=add-ach]")?.addEventListener("click", submit);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") void submit();
  });
  body.querySelectorAll<HTMLElement>(".wall-dir").forEach((b) =>
    b.addEventListener("click", () => {
      const d = b.dataset.dir;
      composerDim = d ? (d as Dim) : null;
      body.querySelectorAll(".wall-dir").forEach((x) => x.classList.toggle("on", x === b));
    }),
  );

  // goals: 勾選達成 → 上牆 / 移除
  body.querySelectorAll<HTMLElement>(".goal-row").forEach((rowEl) => {
    const id = rowEl.dataset.id!;
    rowEl.querySelector("[data-act=done]")?.addEventListener("click", async (e) => {
      e.stopPropagation();
      sfx.solve();
      rowEl.classList.add("completing");
      await careerStore.updateAction(id, { status: "done" });
      window.setTimeout(() => void renderWall(body, onGoRec, forcedView), 300);
    });
    rowEl.querySelector("[data-act=del-goal]")?.addEventListener("click", async (e) => {
      e.stopPropagation();
      sfx.click();
      await careerStore.removeAction(id);
      await renderWall(body, onGoRec, forcedView);
    });
  });

  // 牆上自由紀錄可移除
  body.querySelectorAll<HTMLElement>(".wall-card[data-kind=ach] [data-act=del-ach]").forEach((b) =>
    b.addEventListener("click", async (e) => {
      e.stopPropagation();
      sfx.click();
      const id = (b.closest(".wall-card") as HTMLElement).dataset.id!;
      await careerStore.removeAchievement(id);
      await renderWall(body, onGoRec, forcedView);
    }),
  );

  // 📎 備審切換:依卡片來源寫回對應 store(done 目標 → action;自由紀錄 → achievement)
  body.querySelectorAll<HTMLElement>(".wall-pin").forEach((b) =>
    b.addEventListener("click", async (e) => {
      e.stopPropagation();
      const cardEl = b.closest(".wall-card") as HTMLElement;
      const id = cardEl.dataset.id!;
      const kind = cardEl.dataset.kind;
      const next = !(b.getAttribute("aria-pressed") === "true");
      sfx.click();
      if (kind === "ach") await careerStore.setAchievementPortfolio(id, next);
      else await careerStore.updateAction(id, { forPortfolio: next });
      announce(
        next
          ? tt("已標為可用於備審", "Tagged for portfolio")
          : tt("已取消備審標記", "Removed portfolio tag"),
      );
      await renderWall(body, onGoRec, forcedView);
    }),
  );

  body.querySelector<HTMLElement>("[data-act=detail-done]")?.addEventListener("click", async (e) => {
    const btn = e.currentTarget as HTMLElement;
    if (btn.getAttribute("aria-disabled") === "true") return;
    const id = btn.dataset.id;
    if (!id) return;
    sfx.solve();
    await careerStore.updateAction(id, { status: "done" });
    await renderWall(body, onGoRec, "actions");
  });
  body.querySelector<HTMLElement>("[data-act=detail-pin-action]")?.addEventListener("click", async (e) => {
    const id = (e.currentTarget as HTMLElement).dataset.id;
    const it = actions.find((a) => a.id === id);
    if (!id || !it) return;
    sfx.click();
    await careerStore.updateAction(id, { forPortfolio: !it.forPortfolio });
    await renderWall(body, onGoRec, "actions");
  });
  body.querySelector<HTMLElement>("[data-act=detail-del-action]")?.addEventListener("click", async (e) => {
    const id = (e.currentTarget as HTMLElement).dataset.id;
    if (!id) return;
    sfx.click();
    await careerStore.removeAction(id);
    selectedActionId = null;
    await renderWall(body, onGoRec, "actions");
  });
  body.querySelector<HTMLElement>("[data-act=detail-pin-wall]")?.addEventListener("click", async (e) => {
    const btn = e.currentTarget as HTMLElement;
    const id = btn.dataset.id;
    const kind = btn.dataset.kind;
    const entry = wall.find((x) => x.id === id && x.kind === kind);
    if (!id || !entry) return;
    sfx.click();
    if (kind === "ach") await careerStore.setAchievementPortfolio(id, !entry.forPortfolio);
    else await careerStore.updateAction(id, { forPortfolio: !entry.forPortfolio });
    await renderWall(body, onGoRec, "proof");
  });
  body.querySelector<HTMLElement>("[data-act=detail-del-ach]")?.addEventListener("click", async (e) => {
    const id = (e.currentTarget as HTMLElement).dataset.id;
    if (!id) return;
    sfx.click();
    await careerStore.removeAchievement(id);
    selectedWall = null;
    await renderWall(body, onGoRec, "proof");
  });
  body.querySelectorAll<HTMLElement>("[data-wall-ref]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const [kind, id] = (btn.dataset.wallRef ?? "").split("|") as ["action" | "ach", string];
      if (!id) return;
      selectedWall = { kind, id };
      sfx.click();
      await renderWall(body, onGoRec, "proof");
    }),
  );

  // 篩選:只看備審素材 / 看全部
  body.querySelector("[data-act=filter]")?.addEventListener("click", async () => {
    sfx.click();
    wallPortfolioOnly = !wallPortfolioOnly;
    await renderWall(body, onGoRec, forcedView);
  });

  body.querySelector("[data-act=go-rec]")?.addEventListener("click", () => {
    sfx.click();
    onGoRec?.();
  });
}
