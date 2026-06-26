import Phaser from "phaser";
import { sfx } from "./sfx";
import { pacing } from "./pacing";
import { loc, speakerName, tt } from "../game/lang";
import { flow, saveFlow, currentDay, hoursLeft, crewAwakened } from "../game/flow";
import { renderTasks } from "../game/tasks";
import { renderDashboard } from "./dashboard";
import { mountCareerEmbedded } from "./careerpanel";
import { renderJourney } from "./journeymap";
import { renderDiscover } from "./discover";
import { EGGS, collectedEggs, collectedCount, totalEggs, allCollected } from "../game/eggs";
import { careerStore } from "../game/storage";
import { motionPref, setMotionPref, type MotionPref } from "./motion";
import { ARCHETYPE, BAYS, type Bay } from "../game/script";
import { MODULES } from "../scenes/ModulesScene";
import { EGG_REWARD_ASSET } from "./rewardAssets";

type PhoneTab = "status" | "tasks" | "chat" | "crew" | "dashboard" | "career" | "discover" | "journey" | "collection";

const qs = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;
const pausedScenes = new Set<string>();
let manualOpen = false;
let activeTab: PhoneTab = "status";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const stationName = (bay: Bay): string => {
  if (bay.key === "muralhall") return tt("交誼廳", "Lounge");
  if (bay.key === "datalab") return tt("溫室", "Greenhouse");
  return loc(bay.name);
};

// 動態偏好按鈕:循環 系統 → 完整 → 簡化。覆寫系統 prefers-reduced-motion。
const MOTION_ORDER: MotionPref[] = ["system", "full", "reduced"];
function motionLabel(p: MotionPref): string {
  return p === "full"
    ? tt("動態:完整", "Motion: Full")
    : p === "reduced"
      ? tt("動態:簡化", "Motion: Reduced")
      : tt("動態:系統", "Motion: System");
}
function refreshMotionButton() {
  const b = qs<HTMLButtonElement>("motion-pref");
  if (b) b.textContent = motionLabel(motionPref());
}

export function initPhoneUI() {
  const dock = qs<HTMLDivElement>("phone-dock");
  const toggle = qs<HTMLButtonElement>("phone-toggle");
  const panel = qs<HTMLDivElement>("phone-panel");
  if (!dock || !toggle || !panel) return;

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    sfx.click();
    togglePhone();
  });

  qs("phone-backdrop")?.addEventListener("click", () => {
    sfx.click();
    closePhone(true);
  });

  qs<HTMLButtonElement>("phone-save")?.addEventListener("click", (event) => {
    event.stopPropagation();
    sfx.click();
    doSave();
  });

  document.querySelectorAll<HTMLButtonElement>(".phone-tab").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      sfx.click();
      setPhoneTab(button.dataset.phoneTab as PhoneTab);
    });
  });

  qs<HTMLButtonElement>("phone-pause")?.addEventListener("click", (event) => {
    event.stopPropagation();
    sfx.click();
    togglePause();
  });

  qs<HTMLButtonElement>("motion-pref")?.addEventListener("click", (event) => {
    event.stopPropagation();
    sfx.click();
    const next = MOTION_ORDER[(MOTION_ORDER.indexOf(motionPref()) + 1) % MOTION_ORDER.length];
    setMotionPref(next);
    refreshMotionButton();
  });
  refreshMotionButton();

  window.addEventListener("keydown", (event) => {
    if (event.key !== " ") return;
    const target = event.target;
    if (target instanceof HTMLElement && target.closest("button, textarea, input, #dialogue")) return;
    const dialogueOpen = !qs("dialogue")?.classList.contains("hidden");
    if (dialogueOpen) return;
    event.preventDefault();
    togglePhone();
  });

  const sync = () => {
    const titleOpen = !qs("title-ui")?.classList.contains("hidden");
    dock.classList.toggle("hidden", Boolean(titleOpen));
    if (titleOpen) closePhone(true);
  };

  ["title-ui", "hud", "dialogue"].forEach((id) => {
    const el = qs(id);
    if (!el) return;
    new MutationObserver(sync).observe(el, { attributes: true, attributeFilter: ["class"] });
  });
  window.addEventListener("meridian-lang-change", () => {
    setPhoneTab(activeTab);
    refreshMotionButton();
  });
  sync();
}

export function openPhone(tab: PhoneTab = "status", manual = false) {
  const panel = qs<HTMLDivElement>("phone-panel");
  if (!panel) return;
  if (manual) manualOpen = true;
  setPhoneTab(tab);
  panel.classList.remove("hidden");
  qs("phone-backdrop")?.classList.add("visible");
  document.body.classList.add("phone-open");
}

/** 目前是否在「可存檔的航程場景」(Hub / 艙區 / 過場)。回傳安全檢查點 stage 或 null。 */
function voyageSceneActive(): boolean {
  const game = (window as unknown as { __game?: Phaser.Game }).__game;
  if (!game) return false;
  const live = new Set(game.scene.getScenes(true).map((s) => s.scene.key));
  return live.has("hub") || live.has("bay") || live.has("modules");
}

/** 依目前場景顯示/隱藏手機存檔鈕(只在航程中可存)。 */
function updateSaveButton() {
  const btn = qs<HTMLButtonElement>("phone-save");
  const hint = qs<HTMLParagraphElement>("phone-save-hint");
  if (!btn) return;
  const show = voyageSceneActive();
  btn.classList.toggle("hidden", !show);
  hint?.classList.toggle("hidden", !show);
}

function doSave() {
  const btn = qs<HTMLButtonElement>("phone-save");
  if (!btn) return;
  const ok = saveFlow();
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  btn.classList.toggle("saved", ok);
  btn.textContent = ok ? `${tt("已存檔", "Saved")} ✓ ${time}` : tt("存檔失敗", "Save failed");
  window.setTimeout(() => {
    btn.classList.remove("saved");
    btn.textContent = tt("✦ 存檔", "✦ Save Progress");
  }, 1800);
}

export function closePhone(force = false) {
  if (!force && manualOpen) return;
  const panel = qs<HTMLDivElement>("phone-panel");
  if (!panel) return;
  panel.classList.add("hidden");
  qs("phone-backdrop")?.classList.remove("visible");
  document.body.classList.remove("phone-open");
  manualOpen = false;
}

export function togglePhone() {
  const panel = qs<HTMLDivElement>("phone-panel");
  if (!panel) return;
  if (panel.classList.contains("hidden")) openPhone("status", true);
  else closePhone(true);
}

export function setPhoneTab(tab: PhoneTab) {
  activeTab = tab;
  document.querySelectorAll<HTMLButtonElement>(".phone-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.phoneTab === tab);
  });
  document.querySelectorAll<HTMLElement>(".phone-page").forEach((page) => {
    page.classList.toggle("active", page.id === `phone-tab-${tab}`);
  });
  if (tab === "status") void renderStatusTab();
  if (tab === "tasks") renderTasks(); // 確保開頁時內容與目前語言/進度同步
  if (tab === "chat") void renderChatTab();
  if (tab === "crew") renderCrewTab();
  if (tab === "dashboard") void renderDashboard(qs("phone-tab-dashboard")!);
  if (tab === "career") void renderCareerTab();
  if (tab === "discover") void renderDiscover(qs("phone-tab-discover")!);
  if (tab === "journey") void renderJourney(qs("phone-tab-journey")!);
  if (tab === "collection") renderCollectionTab();
}

// 艙內收藏:已發現的彩蛋顯示圖示+風味,未發現的以剪影呈現(給探索動機)。
function renderCollectionTab() {
  const page = qs<HTMLElement>("phone-tab-collection");
  if (!page) return;
  const got = collectedEggs();
  page.innerHTML = `
    <div class="phone-section-title">${tt("艙內收藏", "Ship Finds")} · ${collectedCount()}/${totalEggs()}</div>
    ${allCollected() ? `<div class="egg-complete">${tt("✦ 全艙收藏已收齊!你把整艘船都走遍了。", "✦ All finds collected! You've explored every corner of the ship.")}</div>` : ""}
    <div class="egg-grid">
      ${EGGS.map((e) => {
        const has = got.has(e.id);
        const asset = EGG_REWARD_ASSET[e.id];
        return `
          <div class="egg-card ${has ? "got" : "locked"}">
            <div class="egg-icon">
              ${has && asset ? `<img class="egg-asset raw-asset" src="${asset}" alt="" loading="lazy" />` : has ? e.icon : "❔"}
            </div>
            <div class="egg-name">${has ? esc(loc(e.name)) : tt("未發現", "Undiscovered")}</div>
            ${has ? `<div class="egg-flavor">${esc(loc(e.flavor))}</div>` : ""}
          </div>`;
      }).join("")}
    </div>`;
}

async function renderStatusTab() {
  updateSaveButton();
  const page = qs<HTMLElement>("phone-tab-status");
  const hud = qs<HTMLElement>("hud");
  if (!page || !hud) return;

  page.querySelector("#phone-status-extra")?.remove();
  const latest = (await careerStore.listAssessments()).at(-1);
  const awakened = crewAwakened();
  const nextBay = BAYS.find((bay) => !flow.completedBays.includes(bay.key));
  const mission =
    flow.stage === "done" || latest
      ? tt("航程完成。可查看星圖、生涯計畫與旅程地圖。", "Voyage complete. Review your Star Map, career plan, and journey map.")
      : flow.stage === "modules"
        ? tt("最終航段：完成艦船認證。", "Final leg: complete ship certifications.")
        : nextBay
          ? tt(`下一步：前往${stationName(nextBay)}，喚醒${nextBay.char.name}。`, `Next: enter ${stationName(nextBay)} and wake ${nextBay.char.name}.`)
          : tt("全員甦醒，準備進入最終航段。", "All crew awake. Prepare for the final leg.");

  const completeCerts = flow.stage === "done" || latest ? MODULES.length : 0;
  const resultHtml = latest
    ? `<div class="phone-info-card result">
         <div class="phone-card-kicker">${tt("最新鑑定", "Latest Assessment")}</div>
         <div class="phone-card-title">${esc(loc(ARCHETYPE[latest.code[0]]))}</div>
         <div class="phone-card-meta">Holland ${latest.code.join(" · ")}</div>
       </div>`
    : "";

  page.insertBefore(
    htmlToNode(`
      <div id="phone-status-extra">
        <div class="phone-section-title">${tt("航程狀態", "Voyage Status")}</div>
        <div class="phone-info-card">
          <div class="phone-card-title">${esc(mission)}</div>
          <div class="phone-mini-grid">
            <span><b>${currentDay()}</b>${tt("日", " day")}</span>
            <span><b>${hoursLeft()}</b>${tt("小時", "h left")}</span>
            <span><b>${awakened}/6</b>${tt("專員", " crew")}</span>
            <span><b>${completeCerts}/${MODULES.length}</b>${tt("認證", " certs")}</span>
          </div>
        </div>
        ${resultHtml}
      </div>
    `),
    hud,
  );
}

async function renderChatTab() {
  const page = qs<HTMLElement>("phone-tab-chat");
  if (!page) return;
  const latest = (await careerStore.listAssessments()).at(-1);
  const nextBay = BAYS.find((bay) => !flow.completedBays.includes(bay.key));
  const lines = [
    {
      from: "OTIS",
      body:
        latest || flow.stage === "done"
          ? tt("航程記錄已封存。建議定期回到星圖追蹤興趣變化。", "Voyage record sealed. Return to the Star Map periodically to track interest shifts.")
          : nextBay
            ? tt(`下一個可進入艙區：${stationName(nextBay)}。`, `Next accessible bay: ${stationName(nextBay)}.`)
            : tt("所有專員已甦醒。請完成降落前認證。", "All specialists are awake. Complete pre-landing certifications."),
    },
    {
      from: tt("系統", "System"),
      body: tt(`維生倒數剩餘 ${hoursLeft()} 小時。已喚醒 ${crewAwakened()} / 6 位專員。`, `Life-support countdown: ${hoursLeft()} hours. Crew awakened: ${crewAwakened()} / 6.`),
    },
    {
      from: tt("任務", "Task"),
      body:
        flow.stage === "modules"
          ? tt(`艦船認證共有 ${MODULES.length} 項，完成後進入休眠艙。`, `${MODULES.length} ship certifications remain before cryo.`)
          : tt("開啟「任務」分頁可查看目前互動點與線索。", "Open Tasks to review current interaction points and clues."),
    },
  ];
  page.innerHTML = `
    <div class="phone-section-title">${tt("訊息紀錄", "Message Log")}</div>
    <div class="phone-message-list">
      ${lines
        .map(
          (line) => `
            <div class="phone-message">
              <div class="phone-message-from">${esc(line.from)}</div>
              <div class="phone-message-body">${esc(line.body)}</div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderCrewTab() {
  const page = qs<HTMLElement>("phone-tab-crew");
  if (!page) return;
  page.innerHTML = `
    <div class="phone-section-title">${tt("專員狀態", "Crew Status")}</div>
    <div class="contact-list">
      ${BAYS.map((bay) => {
        const awake = flow.completedBays.includes(bay.key);
        return `
          <button class="contact-card ${awake ? "awake" : ""}" type="button" data-bay="${bay.key}">
            <span>
              <span class="contact-name">${esc(speakerName(bay.char.name))}</span>
              <small>${esc(stationName(bay))}</small>
            </span>
            <span class="contact-state">${awake ? tt("已甦醒", "Awake") : tt("休眠中", "Stasis")}</span>
          </button>
        `;
      }).join("")}
    </div>
    <p id="contact-reply" class="phone-note">${tt("選擇一位專員查看目前狀態。", "Select a crew member to view their current status.")}</p>
  `;

  page.querySelectorAll<HTMLButtonElement>(".contact-card").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      sfx.click();
      const bay = BAYS.find((b) => b.key === button.dataset.bay);
      if (!bay) return;
      const awake = flow.completedBays.includes(bay.key);
      const reply = qs<HTMLParagraphElement>("contact-reply");
      if (reply) {
        reply.textContent = awake
          ? tt(`${bay.char.name} 已回到${stationName(bay)}協助艦船穩定。`, `${speakerName(bay.char.name)} is back at ${stationName(bay)} helping stabilize the ship.`)
          : tt(`${bay.char.name} 仍在${stationName(bay)}等待喚醒。`, `${speakerName(bay.char.name)} is still in stasis at ${stationName(bay)}.`);
      }
    });
  });
}

function htmlToNode(html: string): HTMLElement {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild as HTMLElement;
}

/** 生涯分頁:內嵌完整 5 分頁生涯外殼(總覽/推薦/行動/證據/原型),與彈窗同一套。 */
async function renderCareerTab() {
  const page = qs<HTMLElement>("phone-tab-career");
  if (!page) return;
  const list = await careerStore.listAssessments();
  const latest = list[list.length - 1];
  if (!latest) {
    page.innerHTML = `
      <div class="career-tab-empty">
        <p>${tt("完成一次航程鑑定後,這裡會打開你的生涯探索終端。", "Finish a voyage assessment and your career terminal opens here.")}</p>
      </div>`;
    return;
  }
  mountCareerEmbedded(page, latest.code);
}

function togglePause() {
  const game = (window as unknown as { __game?: Phaser.Game }).__game;
  if (!game) return;
  const button = qs<HTMLButtonElement>("phone-pause");

  if (pausedScenes.size) {
    [...pausedScenes].forEach((key) => game.scene.resume(key));
    pausedScenes.clear();
    if (button) button.textContent = loc({ zh: "暫停", en: "Pause" });
    document.body.classList.remove("game-paused");
    return;
  }

  game.scene.getScenes(true).forEach((scene) => {
    if (scene.scene.key === "boot" || scene.scene.key === "title") return;
    pausedScenes.add(scene.scene.key);
    game.scene.pause(scene.scene.key);
  });
  if (button) button.textContent = loc({ zh: "繼續", en: "Resume" });
  document.body.classList.add("game-paused");
}
