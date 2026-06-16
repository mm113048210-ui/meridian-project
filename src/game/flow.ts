// 全域劇情進度。存檔必須由玩家在安全節點主動觸發。
import { riasec } from "./riasec";

export type PipeVariant = "hands" | "manual" | "assist";
/** 續玩錨點:續玩時跳回的關卡 */
export type Stage = "intro" | "hub" | "modules" | "ranking" | "final" | "done";

const SAVE_KEY = "meridian.manualSave.v1";
const LEGACY_SAVE_KEY = "meridian.save.v1";
const STAGES: Stage[] = ["intro", "hub", "modules", "ranking", "final", "done"];
const BAY_KEYS = ["powerbay", "datalab", "muralhall", "medbay", "command", "workshop"];

export const flow = {
  equipment: "" as string,
  pipeVariant: "hands" as PipeVariant,
  /** 已完成的艙區 key */
  completedBays: [] as string[],
  /** 中點轉折是否已播 */
  midpointPlayed: false,
  /** 結局選擇:0=成為範本 1=拒絕壓縮 */
  finalChoice: -1,
  /** 中性「系統修復度」0–100,HUD 唯一允許顯示的進度 */
  repair: 0,
  /** 續玩錨點 */
  stage: "intro" as Stage,
};

export type FlowState = typeof flow;

export function crewAwakened() {
  return flow.completedBays.length;
}

export function currentDay() {
  return Math.min(7, flow.completedBays.length + 1);
}

export function hoursLeft() {
  return 168 - flow.completedBays.length * 24;
}

export function addRepair(n: number) {
  flow.repair = Math.min(100, flow.repair + n);
  syncHud();
}

export function syncHud() {
  const el = document.getElementById("repair-fill");
  if (el) el.style.width = `${flow.repair}%`;
  const t = document.getElementById("hours");
  if (t) t.textContent = `${hoursLeft()}`;
}

// ── 存檔 ──────────────────────────────────────────────────────────
/** 玩家主動寫入存檔。只從安全節點呼叫,避免存到題目或對話中間。 */
export function saveFlow(stage: Stage = flow.stage): boolean {
  try {
    flow.stage = stage;
    const payload = {
      flow: {
        equipment: flow.equipment,
        pipeVariant: flow.pipeVariant,
        completedBays: [...flow.completedBays],
        midpointPlayed: flow.midpointPlayed,
        finalChoice: flow.finalChoice,
        repair: flow.repair,
        stage: flow.stage,
      },
      riasec: riasec.serialize(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/** 設定目前流程階段;不會自動寫入 localStorage。 */
export function setStage(stage: Stage) {
  flow.stage = stage;
}

export function hasSave(): boolean {
  const s = loadRaw();
  return !!s && s.flow.stage !== "intro" && s.flow.stage !== "done";
}

/** 把存檔讀回 flow 與 riasec。回傳續玩階段(無存檔回 null) */
export function restoreFlow(): Stage | null {
  const s = loadRaw();
  if (!s) return null;
  Object.assign(flow, s.flow);
  riasec.deserialize(s.riasec);
  syncHud();
  return flow.stage;
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(LEGACY_SAVE_KEY);
  } catch {
    /* noop */
  }
}

function loadRaw(): { flow: FlowState; riasec: unknown } | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return normalizeSave(JSON.parse(raw));
  } catch {
    return null;
  }
}

function normalizeSave(data: unknown): { flow: FlowState; riasec: unknown } | null {
  if (!data || typeof data !== "object") return null;
  const record = data as { flow?: Partial<FlowState>; riasec?: unknown };
  const saved = record.flow;
  if (!saved || typeof saved !== "object") return null;

  const stage = STAGES.includes(saved.stage as Stage) ? (saved.stage as Stage) : "intro";
  const completedBays = Array.isArray(saved.completedBays)
    ? [...new Set(saved.completedBays)]
        .map(String)
        .filter((key): key is string => BAY_KEYS.includes(key))
    : [];
  const pipeVariant =
    saved.pipeVariant === "manual" || saved.pipeVariant === "assist" ? saved.pipeVariant : "hands";

  return {
    flow: {
      equipment: typeof saved.equipment === "string" ? saved.equipment : "",
      pipeVariant,
      completedBays,
      midpointPlayed: Boolean(saved.midpointPlayed),
      finalChoice: saved.finalChoice === 0 || saved.finalChoice === 1 ? saved.finalChoice : -1,
      repair: clampNumber(saved.repair, 0, 100),
      stage,
    },
    riasec: record.riasec,
  };
}

function clampNumber(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : min;
}
