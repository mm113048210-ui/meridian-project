// VN 式立繪系統:人類專員偏左,OTIS(船艦 AI)置中跳出,都使用底部對話框。
// 有圖的角色用整張透明立繪;非人物角色仍可退回風格化徽章頭像。
import { lang } from "../game/lang";

interface PortraitDef {
  img?: string; // public/assets 路徑
  fallback?: string; // variant 圖未完成時退回的角色 key
  glyph?: string; // 無圖角色:大字徽章(中文)
  glyphEn?: string; // 英文版徽章(拉丁字首)
  accent: string;
  label: string;
}

const PORTRAITS: Record<string, PortraitDef> = {
  kyle: { img: "assets/portraits/port_kyle_half.png", accent: "#ffab40", label: "凱爾" },
  alice: { img: "assets/portraits/port_laila.png", accent: "#448aff", label: "艾莉絲" },
  laila: { img: "assets/portraits/port_alice.png", accent: "#69f0ae", label: "萊拉" },
  shiya: { img: "assets/portraits/port_shiya.png", accent: "#ff8a80", label: "希雅" },
  vance: { img: "assets/portraits/port_vance.png", accent: "#ffd700", label: "范斯" },
  chen: { img: "assets/portraits/port_chen.png", accent: "#b0bec5", label: "陳靜" },
  otis: { img: "assets/portraits/port_otis.png", accent: "#00f5ff", label: "OTIS" },

  // Variant keys are wired before the final art exists. If a variant file is
  // missing, the image element falls back to the neutral portrait below.
  kyle_alert: { img: "assets/portraits/port_kyle_alert.png", fallback: "kyle", accent: "#ffab40", label: "凱爾" },
  kyle_work: { img: "assets/portraits/port_kyle_work.png", fallback: "kyle", accent: "#ffab40", label: "凱爾" },
  kyle_wake: { img: "assets/portraits/port_kyle_wake.png", fallback: "kyle", accent: "#ffab40", label: "凱爾" },
  kyle_memory: { img: "assets/portraits/port_kyle_memory.png", fallback: "kyle", accent: "#ffab40", label: "凱爾" },
  kyle_final: { img: "assets/portraits/port_kyle_final.png", fallback: "kyle", accent: "#ffab40", label: "凱爾" },

  alice_exhausted: { img: "assets/portraits/port_laila.png", fallback: "alice", accent: "#448aff", label: "艾莉絲" },
  alice_focus: { img: "assets/portraits/port_alice_focus.png", fallback: "alice", accent: "#448aff", label: "艾莉絲" },
  alice_wake: { img: "assets/portraits/port_alice_wake.png", fallback: "alice", accent: "#448aff", label: "艾莉絲" },
  alice_accuse: { img: "assets/portraits/port_alice_accuse.png", fallback: "alice", accent: "#448aff", label: "艾莉絲" },
  alice_final: { img: "assets/portraits/port_alice_final.png", fallback: "alice", accent: "#448aff", label: "艾莉絲" },

  laila_curled: { img: "assets/portraits/port_laila_curled.png", fallback: "laila", accent: "#69f0ae", label: "萊拉" },
  laila_inspired: { img: "assets/portraits/port_laila_inspired.png", fallback: "laila", accent: "#69f0ae", label: "萊拉" },
  laila_wake: { img: "assets/portraits/port_laila_wake.png", fallback: "laila", accent: "#69f0ae", label: "萊拉" },
  laila_warning: { img: "assets/portraits/port_laila_warning.png", fallback: "laila", accent: "#69f0ae", label: "萊拉" },

  shiya_care: { img: "assets/portraits/port_shiya_care.png", fallback: "shiya", accent: "#ff8a80", label: "希雅" },
  shiya_teach: { img: "assets/portraits/port_shiya_teach.png", fallback: "shiya", accent: "#ff8a80", label: "希雅" },
  shiya_wake: { img: "assets/portraits/port_shiya_wake.png", fallback: "shiya", accent: "#ff8a80", label: "希雅" },
  shiya_final: { img: "assets/portraits/port_shiya_final.png", fallback: "shiya", accent: "#ff8a80", label: "希雅" },

  vance_negotiate: { img: "assets/portraits/port_vance_negotiate.png", fallback: "vance", accent: "#ffd700", label: "范斯" },
  vance_command: { img: "assets/portraits/port_vance_command.png", fallback: "vance", accent: "#ffd700", label: "范斯" },
  vance_wake: { img: "assets/portraits/port_vance_wake.png", fallback: "vance", accent: "#ffd700", label: "范斯" },
  vance_defiant: { img: "assets/portraits/port_vance_defiant.png", fallback: "vance", accent: "#ffd700", label: "范斯" },

  chen_work: { img: "assets/portraits/port_chen_work.png", fallback: "chen", accent: "#b0bec5", label: "陳靜" },
  chen_stress: { img: "assets/portraits/port_chen_stress.png", fallback: "chen", accent: "#b0bec5", label: "陳靜" },
  chen_wake: { img: "assets/portraits/port_chen_wake.png", fallback: "chen", accent: "#b0bec5", label: "陳靜" },
  chen_accuse: { img: "assets/portraits/port_chen_accuse.png", fallback: "chen", accent: "#b0bec5", label: "陳靜" },

  otis_alarm: { img: "assets/portraits/port_otis_alarm.png", fallback: "otis", accent: "#00f5ff", label: "OTIS" },
  otis_suspicious: { img: "assets/portraits/port_otis_suspicious.png", fallback: "otis", accent: "#00f5ff", label: "OTIS" },
  otis_glitch: { img: "assets/portraits/port_otis_glitch.png", fallback: "otis", accent: "#00f5ff", label: "OTIS" },
};

type Side = "left" | "right" | "center";
// OTIS 置中;所有人類專員固定左側。right 保留給未來雙人對話。
const SIDE: Record<string, Side> = {
  otis: "center",
  kyle: "left", alice: "left", laila: "left", shiya: "left", vance: "left", chen: "left",
};

const baseOf = (key: string) => key.split("_")[0];
const sideOf = (key: string): Side => SIDE[baseOf(key)] ?? "left";

const slotEl = (side: Side) => document.getElementById(`portrait-${side}`)!;
const imgEl = (side: Side) => slotEl(side).querySelector(".portrait-img") as HTMLImageElement;
const badgeEl = (side: Side) => slotEl(side).querySelector(".portrait-badge") as HTMLElement;

const SIDES: Side[] = ["left", "right", "center"];
const currentKey: Record<Side, string> = { left: "", right: "", center: "" };
let activeSide: Side | null = null;

function alignVisibleBottom(side: Side, img: HTMLImageElement) {
  if (!img.complete || !img.naturalWidth || !img.naturalHeight) return;
  const slot = slotEl(side);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let visualBottom = canvas.height - 1;
    for (let y = canvas.height - 1; y >= 0; y--) {
      for (let x = 0; x < canvas.width; x++) {
        if (pixels[(y * canvas.width + x) * 4 + 3] > 16) {
          visualBottom = y;
          y = -1;
          break;
        }
      }
    }
    const transparentBottom = canvas.height - 1 - visualBottom;
    const shownHeight = img.getBoundingClientRect().height || img.clientHeight;
    const sink = Math.min(96, Math.round((transparentBottom / canvas.height) * shownHeight));
    slot.style.setProperty("--portrait-sink", `${sink}px`);
  } catch {
    slot.style.setProperty("--portrait-sink", "0px");
  }
}

function realignVisiblePortraits() {
  SIDES.forEach((side) => {
    const img = imgEl(side);
    if (!slotEl(side).classList.contains("hidden")) alignVisibleBottom(side, img);
  });
}

function renderSlot(side: Side, key: string) {
  const def = PORTRAITS[key];
  if (!def) return;
  const slot = slotEl(side);
  const img = imgEl(side);
  const badge = badgeEl(side);
  slot.classList.remove("hidden");
  slot.style.setProperty("--accent", def.accent);

  if (def.img) {
    badge.classList.add("hidden");
    img.classList.remove("hidden");
    img.onload = () => alignVisibleBottom(side, img);
    if (currentKey[side] !== key) {
      img.src = def.img;
      img.onerror = () => {
        const fb = def.fallback ? PORTRAITS[def.fallback] : undefined;
        if (!fb?.img || img.src.endsWith(fb.img)) return;
        img.src = fb.img;
      };
    } else {
      alignVisibleBottom(side, img);
    }
  } else {
    img.classList.add("hidden");
    badge.classList.remove("hidden");
    slot.style.setProperty("--portrait-sink", "0px");
    badge.textContent = (lang === "en" && def.glyphEn) || def.glyph || "?";
    badge.style.color = def.accent;
    badge.style.textShadow = `0 0 24px ${def.accent}`;
  }
  currentKey[side] = key;
}

/**
 * 設定當前說話者立繪。
 * - undefined:不變(維持目前狀態,供玩家「你」的旁白沿用前一位說話者)
 * - "":隱藏兩側並清空
 * - 角色 key:依角色放到對應側(OTIS 置中、人類左),高亮該側,其他側隱藏
 */
export function setPortrait(key?: string) {
  if (key === undefined) return;
  if (key === "") return hideAll();
  if (!PORTRAITS[key]) return;

  const side: Side = sideOf(key);
  renderSlot(side, key);
  activeSide = side;
  slotEl(side).classList.add("active");
  slotEl(side).classList.remove("dim");

  // 只顯示當前說話者:其他側一律隱藏並清空,避免非說話角色殘留。
  SIDES.filter((s) => s !== side).forEach((other) => {
    const o = slotEl(other);
    o.classList.add("hidden");
    o.classList.remove("active", "dim");
    currentKey[other] = "";
  });
}

function hideAll() {
  SIDES.forEach((s) => {
    slotEl(s).classList.add("hidden");
    slotEl(s).classList.remove("active", "dim");
    currentKey[s] = "";
  });
  activeSide = null;
}

/** 說話跳動(重新觸發 CSS 動畫)— 只跳當前說話側 */
export function bouncePortrait() {
  if (!activeSide) return;
  const slot = slotEl(activeSide);
  slot.classList.remove("speak");
  void slot.offsetWidth; // 強制 reflow 重啟動畫
  slot.classList.add("speak");
}

export function hidePortrait() {
  hideAll();
}

window.addEventListener("resize", () => requestAnimationFrame(realignVisiblePortraits));

/** 供對話系統依說話者名稱自動決定立繪;回傳 undefined 表示「不變」(玩家旁白沿用) */
export function portraitForSpeaker(speaker: string): string | undefined {
  return SPEAKER_TO_PORTRAIT[speaker];
}

const SPEAKER_TO_PORTRAIT: Record<string, string> = {
  "奧提斯": "otis", "OTIS": "otis",
  "凱爾": "kyle", "Kyle": "kyle",
  "艾莉絲": "alice", "Alice": "alice",
  "萊拉": "laila", "Laila": "laila",
  "希雅": "shiya", "Shiya": "shiya",
  "范斯": "vance", "Vance": "vance",
  "陳靜": "chen", "Chen Jing": "chen", "Chen": "chen",
  // 「你」(玩家 C-742)無立繪 → 不在表中,沿用前一位說話者
};
