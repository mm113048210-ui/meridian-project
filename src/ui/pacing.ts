// 對話節奏控制:只允許調整文字速度。
// 評測型敘事不能提供跳過或自動推進,避免玩家漏讀脈絡後作答。
export type TextSpeed = "slow" | "normal" | "fast";

const SPEED_MS: Record<TextSpeed, number> = { slow: 40, normal: 22, fast: 11 };
const SPEED_LABEL: Record<TextSpeed, string> = { slow: "慢", normal: "標準", fast: "快" };
const SPEED_LABEL_EN: Record<TextSpeed, string> = { slow: "Slow", normal: "Normal", fast: "Fast" };
const KEY = "meridian.textspeed";

const savedSpeed = localStorage.getItem(KEY) as TextSpeed | null;
let speed: TextSpeed = savedSpeed && savedSpeed in SPEED_MS ? savedSpeed : "normal";

export const pacing = {
  /** 目前每字間隔 */
  charMs(): number {
    return SPEED_MS[speed];
  },
  setSpeed(s: TextSpeed) {
    speed = s;
    localStorage.setItem(KEY, s);
    refreshUI();
  },
  cycleSpeed() {
    const order: TextSpeed[] = ["slow", "normal", "fast"];
    this.setSpeed(order[(order.indexOf(speed) + 1) % order.length]);
  },
};

let speedBtn: HTMLElement | null = null;

function refreshUI() {
  if (speedBtn) speedBtn.textContent = lang === "en" ? `Text speed: ${SPEED_LABEL_EN[speed]}` : `文字速度:${SPEED_LABEL[speed]}`;
}

/** 在 main 啟動時呼叫一次:綁定鍵盤與控制列 */
export function initPacing() {
  speedBtn = document.getElementById("pace-speed");
  speedBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    pacing.cycleSpeed();
  });
  window.addEventListener("meridian-lang-change", refreshUI);
  refreshUI();
}
import { lang } from "../game/lang";
