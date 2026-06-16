// VN 式立繪系統:角色顯示在對話框上方,說話時跳動
// 有圖的角色用裁切顯示;非人物角色仍可退回風格化徽章頭像。
import { lang } from "../game/lang";

interface PortraitDef {
  img?: string; // public/assets 路徑
  fallback?: string; // variant 圖未完成時退回的角色 key
  zoom?: number; // 圖寬相對框寬的倍率(裁掉表情差分欄)
  glyph?: string; // 無圖角色:大字徽章(中文)
  glyphEn?: string; // 英文版徽章(拉丁字首)
  accent: string;
  label: string;
}

const PORTRAITS: Record<string, PortraitDef> = {
  kyle: { img: "assets/port_kyle.png", zoom: 1.0, accent: "#ffab40", label: "凱爾" },
  alice: { img: "assets/port_alice.png", zoom: 1.0, accent: "#448aff", label: "艾莉絲" },
  laila: { img: "assets/port_laila.png", zoom: 1.0, accent: "#69f0ae", label: "萊拉" },
  shiya: { img: "assets/port_shiya.png", zoom: 1.0, accent: "#ff8a80", label: "希雅" },
  vance: { img: "assets/port_vance.png", zoom: 1.0, accent: "#ffd700", label: "范斯" },
  chen: { img: "assets/port_chen.png", zoom: 1.0, accent: "#b0bec5", label: "陳靜" },
  otis: { img: "assets/port_otis.png", zoom: 1.0, accent: "#00f5ff", label: "OTIS" },

  // Variant keys are wired before the final art exists. If a variant file is
  // missing, the image element falls back to the neutral portrait below.
  kyle_alert: { img: "assets/port_kyle_alert.png", fallback: "kyle", zoom: 1.0, accent: "#ffab40", label: "凱爾" },
  kyle_work: { img: "assets/port_kyle_work.png", fallback: "kyle", zoom: 1.0, accent: "#ffab40", label: "凱爾" },
  kyle_wake: { img: "assets/port_kyle_wake.png", fallback: "kyle", zoom: 1.0, accent: "#ffab40", label: "凱爾" },
  kyle_memory: { img: "assets/port_kyle_memory.png", fallback: "kyle", zoom: 1.0, accent: "#ffab40", label: "凱爾" },
  kyle_final: { img: "assets/port_kyle_final.png", fallback: "kyle", zoom: 1.0, accent: "#ffab40", label: "凱爾" },

  alice_exhausted: { img: "assets/port_alice_exhausted.png", fallback: "alice", zoom: 1.0, accent: "#448aff", label: "艾莉絲" },
  alice_focus: { img: "assets/port_alice_focus.png", fallback: "alice", zoom: 1.0, accent: "#448aff", label: "艾莉絲" },
  alice_wake: { img: "assets/port_alice_wake.png", fallback: "alice", zoom: 1.0, accent: "#448aff", label: "艾莉絲" },
  alice_accuse: { img: "assets/port_alice_accuse.png", fallback: "alice", zoom: 1.0, accent: "#448aff", label: "艾莉絲" },
  alice_final: { img: "assets/port_alice_final.png", fallback: "alice", zoom: 1.0, accent: "#448aff", label: "艾莉絲" },

  laila_curled: { img: "assets/port_laila_curled.png", fallback: "laila", zoom: 1.0, accent: "#69f0ae", label: "萊拉" },
  laila_inspired: { img: "assets/port_laila_inspired.png", fallback: "laila", zoom: 1.0, accent: "#69f0ae", label: "萊拉" },
  laila_wake: { img: "assets/port_laila_wake.png", fallback: "laila", zoom: 1.0, accent: "#69f0ae", label: "萊拉" },
  laila_warning: { img: "assets/port_laila_warning.png", fallback: "laila", zoom: 1.0, accent: "#69f0ae", label: "萊拉" },

  shiya_care: { img: "assets/port_shiya_care.png", fallback: "shiya", zoom: 1.0, accent: "#ff8a80", label: "希雅" },
  shiya_teach: { img: "assets/port_shiya_teach.png", fallback: "shiya", zoom: 1.0, accent: "#ff8a80", label: "希雅" },
  shiya_wake: { img: "assets/port_shiya_wake.png", fallback: "shiya", zoom: 1.0, accent: "#ff8a80", label: "希雅" },
  shiya_final: { img: "assets/port_shiya_final.png", fallback: "shiya", zoom: 1.0, accent: "#ff8a80", label: "希雅" },

  vance_negotiate: { img: "assets/port_vance_negotiate.png", fallback: "vance", zoom: 1.0, accent: "#ffd700", label: "范斯" },
  vance_command: { img: "assets/port_vance_command.png", fallback: "vance", zoom: 1.0, accent: "#ffd700", label: "范斯" },
  vance_wake: { img: "assets/port_vance_wake.png", fallback: "vance", zoom: 1.0, accent: "#ffd700", label: "范斯" },
  vance_defiant: { img: "assets/port_vance_defiant.png", fallback: "vance", zoom: 1.0, accent: "#ffd700", label: "范斯" },

  chen_work: { img: "assets/port_chen_work.png", fallback: "chen", zoom: 1.0, accent: "#b0bec5", label: "陳靜" },
  chen_stress: { img: "assets/port_chen_stress.png", fallback: "chen", zoom: 1.0, accent: "#b0bec5", label: "陳靜" },
  chen_wake: { img: "assets/port_chen_wake.png", fallback: "chen", zoom: 1.0, accent: "#b0bec5", label: "陳靜" },
  chen_accuse: { img: "assets/port_chen_accuse.png", fallback: "chen", zoom: 1.0, accent: "#b0bec5", label: "陳靜" },

  otis_alarm: { img: "assets/port_otis_alarm.png", fallback: "otis", zoom: 1.0, accent: "#00f5ff", label: "OTIS" },
  otis_suspicious: { img: "assets/port_otis_suspicious.png", fallback: "otis", zoom: 1.0, accent: "#00f5ff", label: "OTIS" },
  otis_glitch: { img: "assets/port_otis_glitch.png", fallback: "otis", zoom: 1.0, accent: "#00f5ff", label: "OTIS" },
};

let current = "";

export function setPortrait(key?: string) {
  if (key === undefined) return; // 不變
  const wrap = document.getElementById("portrait")!;
  if (key === "") {
    wrap.classList.add("hidden");
    current = "";
    return;
  }
  const def = PORTRAITS[key];
  if (!def) return;
  wrap.classList.remove("hidden");
  const img = document.getElementById("portrait-img") as HTMLImageElement;
  const badge = document.getElementById("portrait-badge")!;
  const frame = document.getElementById("portrait-frame")!;
  frame.style.borderColor = def.accent;

  if (def.img) {
    img.classList.remove("hidden");
    badge.classList.add("hidden");
    if (current !== key) {
      img.src = def.img;
      img.style.width = `${(def.zoom ?? 1) * 100}%`;
      img.onerror = () => {
        const fallback = def.fallback ? PORTRAITS[def.fallback] : undefined;
        if (!fallback?.img || img.src.endsWith(fallback.img)) return;
        img.src = fallback.img;
        img.style.width = `${(fallback.zoom ?? def.zoom ?? 1) * 100}%`;
      };
    }
  } else {
    img.classList.add("hidden");
    badge.classList.remove("hidden");
    badge.textContent = (lang === "en" && def.glyphEn) || def.glyph || "?";
    badge.style.color = def.accent;
    badge.style.textShadow = `0 0 24px ${def.accent}`;
  }
  current = key;
}

/** 說話跳動(重新觸發 CSS 動畫) */
export function bouncePortrait() {
  const frame = document.getElementById("portrait-frame")!;
  frame.classList.remove("speak");
  void frame.offsetWidth; // 強制 reflow 重啟動畫
  frame.classList.add("speak");
}

export function hidePortrait() {
  setPortrait("");
}
