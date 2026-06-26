// ── 永久生涯資料儲存層(抽象) ───────────────────────────────────
// 與「劇情進度存檔」(flow.ts)分開:這層存的是熬過 clearSave()、跨越多次遊玩的
// 生涯資料 —— 多次鑑定快照(支撐縱向疊圖)、可勾選的行動清單、回訪統計。
//
// ⚙️ 設計樞紐:介面 async,Phase 1 用 LocalStorageAdapter(立即 resolve),
//    Phase 2 換 SupabaseAdapter(真網路)時 UI 不用改一行。
import type { Dim } from "./riasec";

/** 一次鑑定快照 = 玩家完成一輪後的六維結果 */
export interface AssessmentSnapshot {
  id: string;
  createdAt: number; // epoch ms
  scores: Record<Dim, number>;
  code: Dim[];
  finalChoice: number; // 0/1/-1
  helpful?: number; // 鑑定書後自陳:1–5「這份結果對你有幫助嗎」(唯一滿意度訊號)
}

export type ActionStatus = "todo" | "doing" | "done";
export type ActionCategory = "majors" | "careers" | "activities" | "portfolio";

/** 行動清單項目(由推薦「＋加入計畫」產生,可勾選) */
export interface ActionItem {
  id: string;
  createdAt: number;
  updatedAt: number;
  dim: Dim; // 來源維度
  category: ActionCategory;
  text: { zh: string; en: string };
  status: ActionStatus;
  forPortfolio?: boolean; // 學生標記「這項可用於備審/作品集」(Unifrog 式:把留存掛在升學需求)
}

/** 成就牆條目 = 學生回來「自己紀錄」為某方向做了什麼(自由輸入,非預設清單) */
export interface AchievementEvidence {
  type: "link" | "file";
  label: string;
  href: string;
  name?: string;
  size?: number;
  mime?: string;
}

export interface Achievement {
  id: string;
  createdAt: number;
  text: string; // 我做了什麼
  dim: Dim | null; // 對應方向(可選)
  note?: string; // 反思/證據(可選)
  targetMajor?: string; // 這筆經驗想支援的大學科系 / 學群 / 二專方向
  skillTags?: string[]; // 這筆經驗展現的技能標籤
  evidence?: AchievementEvidence[]; // 學生附上的證據連結或小檔案
  forPortfolio?: boolean; // 標記「可用於備審/作品集」
}

/** 學齡階段(決定旅程地圖的呈現語言;不存生日,資料最小化) */
export type SchoolLevel = "junior" | "senior" | "college";

/** 回訪統計(streak 等) */
export interface ProfileMeta {
  firstVisit: number;
  lastVisit: number;
  streakDays: number;
  level: SchoolLevel | null; // 首次進「旅程」頁時選一次
  background: string; // 玩家自己填的「現在底子」(科系/專長/做過的事);供跨域解讀用
}

export interface CareerStore {
  listAssessments(): Promise<AssessmentSnapshot[]>;
  addAssessment(snap: Omit<AssessmentSnapshot, "id" | "createdAt">): Promise<AssessmentSnapshot>;
  /** 記錄鑑定書後的自陳分數(1–5) */
  setAssessmentFeedback(id: string, helpful: number): Promise<void>;

  listActions(): Promise<ActionItem[]>;
  /** 加入行動項;若同來源(dim+category+text.zh)已存在則回傳既有,不重複加入 */
  addAction(
    item: Omit<ActionItem, "id" | "createdAt" | "updatedAt" | "status">,
  ): Promise<ActionItem>;
  updateAction(id: string, patch: Partial<Pick<ActionItem, "status" | "forPortfolio">>): Promise<void>;
  removeAction(id: string): Promise<void>;

  /** 成就牆:學生回來自由紀錄做過的事 */
  listAchievements(): Promise<Achievement[]>;
  addAchievement(item: Omit<Achievement, "id" | "createdAt">): Promise<Achievement>;
  removeAchievement(id: string): Promise<void>;
  /** 切換成就的「可用於備審」標記 */
  setAchievementPortfolio(id: string, flag: boolean): Promise<void>;

  getMeta(): Promise<ProfileMeta>;
  /** 記錄一次造訪;以日為單位更新 streak,回傳更新後 meta */
  touchVisit(): Promise<ProfileMeta>;
  /** 設定學齡階段(旅程地圖用) */
  setLevel(level: SchoolLevel): Promise<ProfileMeta>;
  /** 設定玩家自填的「現在底子」(跨域解讀用) */
  setBackground(text: string): Promise<ProfileMeta>;

  /** 匯出全部生涯資料為 JSON 字串(資料可攜 + 試點 baseline 蒐集;不含個資) */
  exportJSON(): Promise<string>;

  /** 清空所有生涯資料(供「刪除我的資料」與測試用) */
  clearAll(): Promise<void>;
}

// ── LocalStorageAdapter ───────────────────────────────────────────
const KEY = "meridian.career.v1";
const DAY_MS = 24 * 60 * 60 * 1000;

interface Persisted {
  assessments: AssessmentSnapshot[];
  actions: ActionItem[];
  achievements: Achievement[];
  meta: ProfileMeta;
}

function uid(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* noop */
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 兩個 epoch ms 相隔幾個「日界」(以本地午夜為界,非 24h 整除) */
function dayDiff(a: number, b: number): number {
  const d0 = new Date(a);
  const d1 = new Date(b);
  const m0 = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate()).getTime();
  const m1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime();
  return Math.round((m1 - m0) / DAY_MS);
}

export class LocalStorageAdapter implements CareerStore {
  private read(): Persisted {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<Persisted>;
        return {
          assessments: Array.isArray(p.assessments) ? p.assessments : [],
          actions: Array.isArray(p.actions) ? p.actions : [],
          achievements: Array.isArray(p.achievements) ? p.achievements : [],
          meta: { ...this.freshMeta(), ...(p.meta ?? {}) }, // 補欄位(舊存檔可能無 level)
        };
      }
    } catch {
      /* fall through to fresh */
    }
    return { assessments: [], actions: [], achievements: [], meta: this.freshMeta() };
  }

  private write(p: Persisted): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(p));
    } catch {
      /* storage full / unavailable — silently ignore in Phase 1 */
    }
  }

  private freshMeta(): ProfileMeta {
    const now = Date.now();
    return { firstVisit: now, lastVisit: now, streakDays: 0, level: null, background: "" };
  }

  async listAssessments(): Promise<AssessmentSnapshot[]> {
    return this.read().assessments.slice().sort((a, b) => a.createdAt - b.createdAt);
  }

  async addAssessment(
    snap: Omit<AssessmentSnapshot, "id" | "createdAt">,
  ): Promise<AssessmentSnapshot> {
    const p = this.read();
    const full: AssessmentSnapshot = { ...snap, id: uid(), createdAt: Date.now() };
    p.assessments.push(full);
    this.write(p);
    return full;
  }

  async setAssessmentFeedback(id: string, helpful: number): Promise<void> {
    const p = this.read();
    const a = p.assessments.find((x) => x.id === id);
    if (!a) return;
    a.helpful = Math.max(1, Math.min(5, Math.round(helpful)));
    this.write(p);
  }

  async listActions(): Promise<ActionItem[]> {
    return this.read().actions.slice().sort((a, b) => b.createdAt - a.createdAt);
  }

  async addAction(
    item: Omit<ActionItem, "id" | "createdAt" | "updatedAt" | "status">,
  ): Promise<ActionItem> {
    const p = this.read();
    const existing = p.actions.find(
      (a) => a.dim === item.dim && a.category === item.category && a.text.zh === item.text.zh,
    );
    if (existing) return existing;
    const now = Date.now();
    const full: ActionItem = { ...item, id: uid(), createdAt: now, updatedAt: now, status: "todo" };
    p.actions.push(full);
    this.write(p);
    return full;
  }

  async updateAction(id: string, patch: Partial<Pick<ActionItem, "status" | "forPortfolio">>): Promise<void> {
    const p = this.read();
    const a = p.actions.find((x) => x.id === id);
    if (!a) return;
    if (patch.status) a.status = patch.status;
    if (patch.forPortfolio !== undefined) a.forPortfolio = patch.forPortfolio;
    a.updatedAt = Date.now();
    this.write(p);
  }

  async removeAction(id: string): Promise<void> {
    const p = this.read();
    p.actions = p.actions.filter((x) => x.id !== id);
    this.write(p);
  }

  async listAchievements(): Promise<Achievement[]> {
    return this.read().achievements.slice().sort((a, b) => b.createdAt - a.createdAt);
  }

  async addAchievement(item: Omit<Achievement, "id" | "createdAt">): Promise<Achievement> {
    const p = this.read();
    const full: Achievement = { ...item, id: uid(), createdAt: Date.now() };
    p.achievements.push(full);
    this.write(p);
    return full;
  }

  async removeAchievement(id: string): Promise<void> {
    const p = this.read();
    p.achievements = p.achievements.filter((x) => x.id !== id);
    this.write(p);
  }

  async setAchievementPortfolio(id: string, flag: boolean): Promise<void> {
    const p = this.read();
    const a = p.achievements.find((x) => x.id === id);
    if (!a) return;
    a.forPortfolio = flag;
    this.write(p);
  }

  async getMeta(): Promise<ProfileMeta> {
    return this.read().meta;
  }

  async touchVisit(): Promise<ProfileMeta> {
    const p = this.read();
    const now = Date.now();
    const gap = dayDiff(p.meta.lastVisit, now);
    if (gap >= 1) {
      // 同日多次造訪不重複加;隔一日 +1 連續;斷天則重置為 1
      p.meta.streakDays = gap === 1 ? p.meta.streakDays + 1 : 1;
    } else if (p.meta.streakDays === 0) {
      p.meta.streakDays = 1; // 首次造訪
    }
    p.meta.lastVisit = now;
    this.write(p);
    return p.meta;
  }

  async setLevel(level: SchoolLevel): Promise<ProfileMeta> {
    const p = this.read();
    p.meta.level = level;
    this.write(p);
    return p.meta;
  }

  async setBackground(text: string): Promise<ProfileMeta> {
    const p = this.read();
    p.meta.background = text.slice(0, 200);
    this.write(p);
    return p.meta;
  }

  async exportJSON(): Promise<string> {
    return JSON.stringify({ schema: "meridian.career.v1", exportedAt: Date.now(), ...this.read() }, null, 2);
  }

  async clearAll(): Promise<void> {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
  }
}

/** 全域單例。Phase 2 只需在此換成 SupabaseAdapter。 */
export const careerStore: CareerStore = new LocalStorageAdapter();
