// 動態(動畫)偏好。預設跟隨系統 prefers-reduced-motion,玩家也可在手機「狀態」頁
// 手動覆寫成「完整」或「簡化」。用於關閉無限循環的裝飾動畫、縮短轉場 —— 無障礙 + 省電。
export type MotionPref = "system" | "full" | "reduced";

const KEY = "meridian.motion";

export function motionPref(): MotionPref {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "full" || v === "reduced" || v === "system") return v;
  } catch {
    /* noop */
  }
  return "system";
}

export function setMotionPref(p: MotionPref): void {
  try {
    localStorage.setItem(KEY, p);
  } catch {
    /* noop */
  }
}

function systemReduced(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** 目前是否該「減少動態」:玩家覆寫優先,否則跟隨系統。 */
export function reducedMotion(): boolean {
  const p = motionPref();
  if (p === "reduced") return true;
  if (p === "full") return false;
  return systemReduced();
}
