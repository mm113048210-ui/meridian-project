// DOM 對話系統:打字機效果 + 選項。CJK 用 DOM 渲染比 canvas 清晰。
import { sfx } from "./sfx";
import { setPortrait, bouncePortrait } from "./portrait";
import { pacing } from "./pacing";
import { loc, speakerName, type LS } from "../game/lang";
import type { Line } from "../game/script";

const box = () => document.getElementById("dialogue")!;
const nameEl = () => document.getElementById("speaker")!;
const textEl = () => document.getElementById("dialogue-text")!;
const hintEl = () => document.getElementById("continue-hint")!;
const choicesEl = () => document.getElementById("choices")!;
const paceBar = () => document.getElementById("pacing");

export type SpeakerStyle = "otis" | "kyle" | "self" | "system";

export function showDialogue() {
  box().classList.remove("hidden");
  paceBar()?.classList.remove("hidden");
}
export function hideDialogue() {
  box().classList.add("hidden");
  choicesEl().classList.add("hidden");
  paceBar()?.classList.add("hidden");
}

/** 依序播放一段 Line[](含立繪切換) */
export async function playLines(lines: Line[]): Promise<void> {
  for (const line of lines) {
    setPortrait(line.portrait);
    await say(line.who, line.text, line.style);
  }
}

/** 打字機顯示一句話,點擊先跳完、再點繼續。評測流程不提供跳過/自動推進。 */
export function say(speaker: string, text: LS, style: SpeakerStyle = "otis"): Promise<void> {
  return new Promise((resolve) => {
    const shownText = loc(text);
    showDialogue();
    bouncePortrait();
    nameEl().textContent = speakerName(speaker);
    nameEl().dataset.style = style;
    hintEl().classList.add("hidden");
    const el = textEl();
    el.textContent = "";
    let i = 0;
    let done = false;
    let typeTimer: number | undefined;

    step();

    function step() {
      if (i < shownText.length) {
        el.textContent = shownText.slice(0, ++i);
        if (i % 2 === 0) sfx.type();
        typeTimer = window.setTimeout(step, pacing.charMs());
      } else {
        finish();
      }
    }
    function finish() {
      if (typeTimer) clearTimeout(typeTimer);
      el.textContent = shownText;
      done = true;
      hintEl().classList.remove("hidden");
    }
    function end() {
      window.removeEventListener("pointerdown", onClick);
      window.removeEventListener("keydown", onKey);
      resolve();
    }
    function onClick(e?: Event) {
      // 忽略來自 UI 控制項(存檔鈕、節奏列、HUD)的點擊,避免誤推進對話
      const t = e?.target;
      if (t instanceof Element && t.closest("button, #hud, #pacing")) return;
      if (!done) {
        if (typeTimer) clearTimeout(typeTimer);
        finish();
        return;
      }
      end();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Enter") onClick();
    }
    window.addEventListener("pointerdown", onClick);
    window.addEventListener("keydown", onKey);
  });
}

export interface Choice {
  label: LS;
}

/** 顯示選項(等寬等色 — 不暗示任何選項較佳),回傳索引 */
export function choose(options: Choice[]): Promise<number> {
  return new Promise((resolve) => {
    const wrap = choicesEl();
    wrap.innerHTML = "";
    wrap.classList.remove("hidden");
    hintEl().classList.add("hidden");
    options.forEach((opt, idx) => {
      const b = document.createElement("button");
      b.className = "choice";
      b.textContent = loc(opt.label);
      b.addEventListener("mouseenter", () => sfx.hover());
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        sfx.click();
        wrap.classList.add("hidden");
        resolve(idx);
      });
      wrap.appendChild(b);
    });
  });
}

/** 全幕系統字卡(黑底置中,用於開場/結尾) */
export function systemCard(lines: LS[], holdMs = 900): Promise<void> {
  return new Promise(async (resolve) => {
    const card = document.getElementById("syscard")!;
    const inner = document.getElementById("syscard-text")!;
    card.classList.remove("hidden");
    inner.textContent = "";
    for (const line of lines) {
      await say2(inner, loc(line));
      await wait(holdMs);
    }
    card.classList.add("hidden");
    resolve();
  });
}

function say2(el: HTMLElement, text: string): Promise<void> {
  return new Promise((resolve) => {
    let i = 0;
    el.textContent = "";
    const step = () => {
      if (i < text.length) {
        el.textContent = text.slice(0, ++i);
        if (i % 2 === 0) sfx.type();
        setTimeout(step, pacing.charMs() + 6);
      } else {
        resolve();
      }
    };
    step();
  });
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
