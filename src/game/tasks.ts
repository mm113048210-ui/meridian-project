// ── 任務狀態(Among Us 式任務列表)──────────────────────────────
// 收進手機「任務」頁。主畫面保持乾淨。
// ⛔ 純任務導引,絕不出現任何 RIASEC 數值/維度。表現/成敗不在此呈現。
import { loc, type LS } from "./lang";
import { hoursLeft } from "./flow";

export type StepStatus = "locked" | "active" | "done";

export interface TaskStep {
  label: LS;
  status: StepStatus;
  /** 多階段任務的子步驟(例:掃描 → 隔離)。最後一個子步完成才算整步完成。 */
  sub?: { label: LS; status: StepStatus }[];
}

interface TaskState {
  bayName: LS | null;
  steps: TaskStep[];
  clues: LS[];
}

const state: TaskState = { bayName: null, steps: [], clues: [] };

/** 進入艙區時設定該艙任務清單(第一步 active,其餘 locked)。 */
export function setTasks(bayName: LS, steps: { label: LS }[]) {
  state.bayName = bayName;
  state.steps = steps.map((s, i) => ({ label: s.label, status: i === 0 ? "active" : "locked" }));
  state.clues = [];
  renderTasks();
}

/** 將第 index 步設為 active(之前的都標記完成)。 */
export function setActiveStep(index: number) {
  state.steps.forEach((s, i) => {
    if (i < index) s.status = "done";
    else if (i === index) s.status = s.status === "done" ? "done" : "active";
    else s.status = "locked";
  });
  renderTasks();
}

/** 完成目前 active 的那一步。 */
export function completeActiveStep() {
  const i = state.steps.findIndex((s) => s.status === "active");
  if (i >= 0) {
    state.steps[i].status = "done";
    if (state.steps[i].sub) state.steps[i].sub!.forEach((ss) => (ss.status = "done"));
  }
  renderTasks();
}

/** 為目前 active 步驟掛上子步驟(多階段任務開始時呼叫)。 */
export function setSubSteps(subs: LS[]) {
  const step = state.steps.find((s) => s.status === "active");
  if (!step) return;
  step.sub = subs.map((label, i) => ({ label, status: i === 0 ? "active" : "locked" }));
  renderTasks();
}

/** 推進 active 步驟內的子步驟(完成一個階段)。 */
export function completeSubStep() {
  const step = state.steps.find((s) => s.status === "active");
  if (!step?.sub) return;
  const i = step.sub.findIndex((ss) => ss.status === "active");
  if (i >= 0) {
    step.sub[i].status = "done";
    if (step.sub[i + 1]) step.sub[i + 1].status = "active";
  }
  renderTasks();
}

export function addClue(clue: LS) {
  if (!state.clues.some((c) => loc(c) === loc(clue))) state.clues.push(clue);
  renderTasks();
}

export function clearTasks() {
  state.bayName = null;
  state.steps = [];
  state.clues = [];
  renderTasks();
}

const ICON: Record<StepStatus, string> = { done: "✓", active: "▸", locked: "•" };

/** 重繪手機任務頁。語言切換或狀態變動時呼叫。 */
export function renderTasks() {
  const page = document.getElementById("phone-tab-tasks");
  if (!page) return;

  if (!state.bayName || state.steps.length === 0) {
    page.innerHTML =
      `<div class="task-empty">${loc({ zh: "目前沒有進行中的艙區任務。", en: "No active bay task right now." })}</div>`;
    return;
  }

  const stepHtml = state.steps
    .map((s) => {
      const sub = s.sub
        ? `<ul class="task-sub">${s.sub
            .map(
              (ss) =>
                `<li class="task-step ${ss.status}"><span class="task-ico">${ICON[ss.status]}</span>${loc(ss.label)}</li>`,
            )
            .join("")}</ul>`
        : "";
      return `<li class="task-step ${s.status}"><span class="task-ico">${ICON[s.status]}</span>${loc(s.label)}</li>${sub}`;
    })
    .join("");

  const clueHtml = state.clues.length
    ? `<h3 class="task-h">${loc({ zh: "線索", en: "Clues" })}</h3>
       <ul class="task-clues">${state.clues.map((c) => `<li>${loc(c)}</li>`).join("")}</ul>`
    : "";

  page.innerHTML = `
    <div class="task-head">
      <span class="task-bay">${loc(state.bayName)}</span>
      <span class="task-hours">${loc({ zh: "剩餘", en: "Left" })} ${hoursLeft()}h</span>
    </div>
    <ul class="task-list">${stepHtml}</ul>
    ${clueHtml}
  `;
}
