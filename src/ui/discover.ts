// ── 探索 Feed(手機「發現」分頁)──────────────────────────────────
// 取法 Xello 的個性化動態:依玩家 Holland code 推「貼近他的探索線索」——
// 學長姐經驗(IOH)、認識學群(ColleGo!)、現在可以學的東西。內容會隨主型/輔型變,
// 形成「回來看看有什麼新線索」的回訪拉力。所有目的地都是台灣穩定的教育資源,
// 卡片在新分頁開啟(rel=noopener)。⛔ 鐵則:不顯示 RIASEC 維度名稱/數值,只用職位原型。
import { careerStore } from "../game/storage";
import { ARCHETYPE } from "../game/script";
import type { Dim } from "../game/riasec";
import { loc, tt, type LS } from "../game/lang";
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

type FeedKind = "story" | "explore" | "learn";

interface FeedItem {
  kind: FeedKind;
  title: LS;
  desc: LS;
  source: string; // 來源平台(顯示用)
  url: string; // 真實、穩定的台灣教育資源
}

const KIND_LABEL: Record<FeedKind, LS> = {
  story: { zh: "學長姐經驗", en: "Real stories" },
  explore: { zh: "認識學群", en: "Explore fields" },
  learn: { zh: "現在可以學", en: "Learn now" },
};
const KIND_GLYPH: Record<FeedKind, string> = { story: "✎", explore: "◎", learn: "▸" };

// 穩定錨點(已查證存在):
//   IOH https://ioh.tw —— 900+ 學長姐科系/職涯經驗(台灣版 Xello 故事流)
//   ColleGo! https://collego.edu.tw —— 大考中心官方,18 學群 × 興趣對位
const IOH_GROUPS = "https://ioh.tw/learning_categories"; // 18 學群科系比拼
const COLLEGO_GROUPS = "https://collego.edu.tw/Highschool/CollegeList"; // 認識學群
const JUNYI = "https://www.junyiacademy.org/"; // 均一教育平台(免費)
const HAHOW = "https://hahow.in/"; // Hahow 好學校(技能課)

// 每個原型 3 條線索:一個真實故事、一個學群探索、一個可以馬上做的學習入口。
// 卡片標題點出「該看哪個學群」,目的地是真實的 section 頁(不造假深連結)。
const FEED: Record<Dim, FeedItem[]> = {
  R: [
    { kind: "story", source: "IOH", url: IOH_GROUPS,
      title: { zh: "工程科系的人,後來都在做什麼?", en: "Where do engineering students end up?" },
      desc: { zh: "聽機械、電機、土木的學長姐,講他們真實的一天。", en: "Hear mechanical, electrical, and civil students describe a real day." } },
    { kind: "explore", source: "ColleGo!", url: COLLEGO_GROUPS,
      title: { zh: "認識「工程學群」在學什麼", en: "What the Engineering cluster actually studies" },
      desc: { zh: "大考中心官方:工程、數理化學群的課程與出路。", en: "Official: courses and paths in the Engineering and Math/Science clusters." } },
    { kind: "learn", source: tt("均一教育平台", "Junyi Academy"), url: JUNYI,
      title: { zh: "動手做:從電子與程式基礎開始", en: "Get hands-on with electronics and code basics" },
      desc: { zh: "免費課程,挑一個小主題,這週做出一個能動的東西。", en: "Free courses — pick one topic and build something that works this week." } },
  ],
  I: [
    { kind: "story", source: "IOH", url: IOH_GROUPS,
      title: { zh: "資訊與生命科學科系的真實樣貌", en: "Inside CS and life-science majors" },
      desc: { zh: "做研究、寫程式、跑實驗的人,怎麼走到今天。", en: "How people who research, code, and run experiments got here." } },
    { kind: "explore", source: "ColleGo!", url: COLLEGO_GROUPS,
      title: { zh: "認識「資訊・生命科學」學群", en: "Explore the Info & Life-Science clusters" },
      desc: { zh: "官方學群介紹:看哪一個最像你想追的「為什麼」。", en: "Official cluster guides — find which one matches the questions you chase." } },
    { kind: "learn", source: "Hahow", url: HAHOW,
      title: { zh: "用一堂線上課,開一個你好奇的題目", en: "Open a question you're curious about with one online course" },
      desc: { zh: "資料分析、程式、科學主題,挑一個追到底。", en: "Data, coding, or science — pick one and follow it all the way." } },
  ],
  A: [
    { kind: "story", source: "IOH", url: IOH_GROUPS,
      title: { zh: "設計與傳播科系,學長姐怎麼說", en: "Design and media students, in their own words" },
      desc: { zh: "視覺設計、影像、文字創作的人,怎麼把興趣變成路。", en: "How designers, filmmakers, and writers turned passion into a path." } },
    { kind: "explore", source: "ColleGo!", url: COLLEGO_GROUPS,
      title: { zh: "認識「藝術・建築設計・大眾傳播」學群", en: "Explore the Arts, Design & Media clusters" },
      desc: { zh: "官方介紹:這些學群在做的,比你想的更廣。", en: "Official guides — these fields are wider than they look." } },
    { kind: "learn", source: "Hahow", url: HAHOW,
      title: { zh: "把作品放上線:設計與創作課", en: "Get your work out there: design & creation courses" },
      desc: { zh: "一堂課 + 一件作品,就是作品集的第一頁。", en: "One course plus one piece — that's page one of your portfolio." } },
  ],
  S: [
    { kind: "story", source: "IOH", url: IOH_GROUPS,
      title: { zh: "教育・心理・醫護科系的人怎麼說", en: "Education, psych, and care majors speak" },
      desc: { zh: "把「想幫到人」這件事,變成專業的真實經驗。", en: "Real stories of turning “I want to help” into a profession." } },
    { kind: "explore", source: "ColleGo!", url: COLLEGO_GROUPS,
      title: { zh: "認識「社會心理・醫藥衛生・教育」學群", en: "Explore the Social, Health & Education clusters" },
      desc: { zh: "官方學群介紹:助人也有很多種不同的路。", en: "Official guides — there are many ways to help people." } },
    { kind: "learn", source: tt("均一教育平台", "Junyi Academy"), url: JUNYI,
      title: { zh: "從當一次課輔/志工開始", en: "Start by tutoring or volunteering once" },
      desc: { zh: "搭配免費課程,把陪伴與教學變成可以累積的事。", en: "Pair it with free courses and make mentoring something you build on." } },
  ],
  E: [
    { kind: "story", source: "IOH", url: IOH_GROUPS,
      title: { zh: "管理・法政科系經驗談", en: "Business and law majors, candidly" },
      desc: { zh: "帶團隊、做決策、談判的人,大學怎麼準備。", en: "How people who lead, decide, and negotiate prepared in college." } },
    { kind: "explore", source: "ColleGo!", url: COLLEGO_GROUPS,
      title: { zh: "認識「管理・財經・法政」學群", en: "Explore the Management, Finance & Law clusters" },
      desc: { zh: "官方介紹:適合「想動起來、想帶頭」的人的學群。", en: "Official guides — clusters for people who like to move first." } },
    { kind: "learn", source: "Hahow", url: HAHOW,
      title: { zh: "練一個本事:簡報、提案、辦活動", en: "Build one skill: pitching, presenting, running events" },
      desc: { zh: "找一堂課,然後在學校真的主辦一件事。", en: "Take a course, then actually organize something at school." } },
  ],
  C: [
    { kind: "story", source: "IOH", url: IOH_GROUPS,
      title: { zh: "財經・資管科系的真實日常", en: "A real day in finance and info-management majors" },
      desc: { zh: "把秩序、數據、流程做到位的人,在哪裡發光。", en: "Where people who master order, data, and process shine." } },
    { kind: "explore", source: "ColleGo!", url: COLLEGO_GROUPS,
      title: { zh: "認識「財經・管理」學群", en: "Explore the Finance & Management clusters" },
      desc: { zh: "官方學群介紹:看數字與系統怎麼變成專業。", en: "Official guides — how numbers and systems become a profession." } },
    { kind: "learn", source: "Hahow", url: HAHOW,
      title: { zh: "Excel・資料整理,從入門課開始", en: "Excel and data wrangling, from the basics" },
      desc: { zh: "一份你自己整理過的資料,就是很實在的能力證明。", en: "A dataset you organized yourself is solid proof of skill." } },
  ],
};

// 給所有人看的「繼續探索」線索:不確定方向時的入口。
const UNIVERSAL: FeedItem[] = [
  { kind: "explore", source: "ColleGo!", url: "https://collego.edu.tw/Learningplan/interest",
    title: { zh: "還不確定?用興趣直接找學群", en: "Not sure yet? Find a cluster by interest" },
    desc: { zh: "大考中心官方的興趣對位工具,選你喜歡的,它幫你找方向。", en: "The official interest-matching tool — pick what you like, it points the way." } },
  { kind: "story", source: "IOH", url: "https://ioh.tw/learning_categories",
    title: { zh: "18 學群科系比拼,一次看完", en: "All 18 study clusters, side by side" },
    desc: { zh: "把整張地圖攤開,看看還有哪些你沒想過的路。", en: "Open the whole map and find paths you hadn't considered." } },
];

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

interface Card extends FeedItem {
  dim: Dim | null; // null = 通用(中性色)
}

export async function renderDiscover(container: HTMLElement): Promise<void> {
  const list = await careerStore.listAssessments();
  const latest = list[list.length - 1];

  if (!latest) {
    container.innerHTML = `<div class="disc-empty">${tt(
      "完成一次航程後,這裡會依你的結果,推給你最貼近的科系故事、學群與可以馬上做的事。",
      "After your first voyage, this feed fills with stories, fields, and next steps matched to your result.",
    )}</div>`;
    return;
  }

  const primary = latest.code[0];
  const secondary = latest.code[1];

  // 依主型(完整 3 條)+ 輔型(前 2 條)+ 通用 交織成動態
  const cards: Card[] = [
    ...FEED[primary].map((f) => ({ ...f, dim: primary })),
    ...(secondary && secondary !== primary ? FEED[secondary].slice(0, 2).map((f) => ({ ...f, dim: secondary })) : []),
    ...UNIVERSAL.map((f) => ({ ...f, dim: null })),
  ];

  const cardHTML = (c: Card, i: number) => {
    const acc = c.dim ? ACCENT[c.dim] : "#8fb3c4";
    const asset = c.dim ? DIM_REWARD_ASSET[c.dim] : REC_CATEGORY_ASSET.majors;
    return `
      <a class="disc-card" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer"
         style="--acc:${acc};--i:${i}" data-kind="${c.kind}">
        <img class="disc-asset raw-asset" src="${asset}" alt="" loading="lazy" />
        <span class="disc-kind"><span class="disc-glyph" aria-hidden="true">${KIND_GLYPH[c.kind]}</span>${esc(loc(KIND_LABEL[c.kind]))}</span>
        <span class="disc-title">${esc(loc(c.title))}</span>
        <span class="disc-desc">${esc(loc(c.desc))}</span>
        <span class="disc-foot">
          <span class="disc-source">${esc(c.source)}</span>
          <span class="disc-go" aria-hidden="true">${tt("開啟", "Open")} ↗</span>
        </span>
      </a>`;
  };

  container.innerHTML = `
    <div class="disc-head">
      <div class="disc-kicker">${tt("為你整理的探索線索", "Picked for you")}</div>
      <div class="disc-arche">${esc(loc(ARCHETYPE[primary]))}${secondary && secondary !== primary ? ` <span class="disc-amp">＋</span> ${esc(loc(ARCHETYPE[secondary]))}` : ""}</div>
    </div>
    <div class="disc-feed">${cards.map(cardHTML).join("")}</div>
    <p class="disc-note">${tt(
      "興趣會隨成長改變——回來重測,這些線索也會跟著更新。",
      "Interests shift as you grow — re-assess, and these picks update with you.",
    )}</p>`;

  // 點卡片時的音效(連結照常在新分頁開啟)
  container.querySelectorAll<HTMLAnchorElement>(".disc-card").forEach((a) =>
    a.addEventListener("click", () => sfx.click()),
  );
}
