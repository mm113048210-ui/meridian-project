// ── 隱性 RIASEC 評分引擎 ─────────────────────────────────────────
// ⛔ 鐵則:本模組的任何數值、維度名稱,絕對不可出現在玩家可見 UI 上。
//    唯一允許的揭曉點:最終「身分鑑定書」場景。
// 評分只來自「選擇」與「主觀回饋」,小遊戲表現一律不計分(只記錄遙測)。
//
// 各層在最終分數的「設計上限佔比」(report() 的權重即據此校準):
//   L2 隱性對話選擇 ≈ 50%(核心、主導)
//   L4 休眠艙強迫排序 ≈ 25%(外顯校準,輔助但不主導)
//   L3-resonance 主觀共振 ≈ 15%(每維上限僅來自該艙一次,故權重需放大)
//   L1 裝備選擇 ≈ 10%
//   L3 小遊戲表現:0%(只記遙測)

export type Dim = "R" | "I" | "A" | "S" | "E" | "C";
export const DIMS: Dim[] = ["R", "I", "A", "S", "E", "C"];

export type DimWeights = Partial<Record<Dim, number>>;

interface TelemetryEvent {
  t: number;
  kind: string;
  data?: Record<string, unknown>;
}

class RiasecEngine {
  /** L1 裝備選擇(權重 10%) */
  private l1: Record<Dim, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  /** L2 隱性對話選擇(主導) */
  private l2: Record<Dim, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  /** L4 休眠艙強迫排序(外顯校準,與 L2 分開計權) */
  private l4: Record<Dim, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  /** 主觀共振加成(偏好訊號) */
  private resonance: Record<Dim, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  /** 行為遙測 — 不參與計分,僅供研究分析 */
  private telemetry: TelemetryEvent[] = [];
  private startedAt = Date.now();

  pickEquipment(dim: Dim) {
    this.l1[dim] += 15;
    this.log("equip", { dim });
  }

  addChoice(weights: DimWeights, nodeId: string) {
    for (const [d, v] of Object.entries(weights)) {
      this.l2[d as Dim] += v ?? 0;
    }
    this.log("choice", { nodeId, weights });
  }

  /** L4 強迫排序計分(獨立於 L2,單獨計權) */
  addRanking(weights: DimWeights, nodeId: string) {
    for (const [d, v] of Object.entries(weights)) {
      this.l4[d as Dim] += v ?? 0;
    }
    this.log("ranking", { nodeId, weights });
  }

  /** 「順手嗎?」主觀回饋 → 偏好加成 */
  addResonance(dim: Dim, liked: boolean, nodeId: string) {
    if (liked) this.resonance[dim] += 5;
    this.log("resonance", { nodeId, dim, liked });
  }

  /** 小遊戲遙測:時間/操作數/求助 — 不計分 */
  log(kind: string, data?: Record<string, unknown>) {
    this.telemetry.push({ t: Date.now() - this.startedAt, kind, data });
  }

  /** 存檔:輸出內部分數(遙測不持久化) */
  serialize() {
    return {
      l1: { ...this.l1 },
      l2: { ...this.l2 },
      l4: { ...this.l4 },
      resonance: { ...this.resonance },
    };
  }

  /** 讀檔:還原內部分數 */
  deserialize(data: unknown) {
    const d = data as Partial<Record<"l1" | "l2" | "l4" | "resonance", Partial<Record<Dim, number>>>>;
    if (!d) return;
    if (d.l1) this.l1 = this.normalizeScores(this.l1, d.l1);
    if (d.l2) this.l2 = this.normalizeScores(this.l2, d.l2);
    if (d.l4) this.l4 = this.normalizeScores(this.l4, d.l4);
    if (d.resonance) this.resonance = this.normalizeScores(this.resonance, d.resonance);
  }

  private normalizeScores(
    base: Record<Dim, number>,
    next: Partial<Record<Dim, number>>,
  ): Record<Dim, number> {
    const result = { ...base };
    for (const dim of DIMS) {
      const value = next[dim];
      if (typeof value === "number" && Number.isFinite(value)) result[dim] = value;
    }
    return result;
  }

  /** 最終報告(僅鑑定書場景可呼叫) */
  report() {
    const raw: Record<Dim, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    for (const d of DIMS) {
      // 層權重決定各維的「相對」強弱:L2 主導、L4 輔助、resonance 放大、L1 最小。
      // L4 末位有負分,剪到 0 避免出現負分。
      raw[d] = Math.max(
        0,
        this.l1[d] * 0.3 + this.l2[d] * 0.45 + this.l4[d] * 0.45 + this.resonance[d] * 1.35,
      );
    }
    return { ...normalizeToReport(raw), telemetry: this.telemetry };
  }
}

// 相對化(ipsative)正規化 —— 抽成共用純函式,讓「完整航程」與「快速重測短式量表」
// 用同一套計分數學,雷達圖才可比較。
// RIASEC 是「個人內」的相對興趣;固定基準的絕對累加會讓多數維都很高(雷達圖滿格無特徵)。
// 改以玩家自身分布為基準,把最弱→最強對稱映射到以 50 為中心:
//   • 顯示分數平均恆為 ~50 → 數學上不可能六維全高,一定有高低區別。
//   • concentration:六維差異越大展開越開(明確尖峰);差異很小則收斂中段(不放大雜訊)。
//   • Holland code 仍以原始強度(raw)排序,反映真實偏好順序。
export function normalizeToReport(raw: Record<Dim, number>): {
  scores: Record<Dim, number>;
  code: Dim[];
} {
  const vals = DIMS.map((d) => raw[d]);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const range = hi - lo;
  const concentration = range / (range + 12);
  const half = 44 * concentration; // 最強 ≈ 50+half、最弱 ≈ 50-half
  const scores = Object.fromEntries(
    DIMS.map((d) => {
      const t = range > 0 ? (raw[d] - lo) / range : 0.5; // 0(最弱)..1(最強)
      return [d, Math.max(0, Math.min(100, Math.round(50 + (t - 0.5) * 2 * half)))];
    }),
  ) as Record<Dim, number>;
  const code = [...DIMS].sort((a, b) => raw[b] - raw[a]).slice(0, 3);
  return { scores, code };
}

export const riasec = new RiasecEngine();
