// ── 語言系統(中 / 英)──────────────────────────────────────────────
// 在封面選擇,存 localStorage。劇本資料同時帶 zh/en,顯示時解析。
export type Lang = "zh" | "en";
/** 在地化字串:純字串(兩語通用)或 { zh, en } */
export type LS = string | { zh: string; en: string };

const KEY = "meridian.lang";

export let lang: Lang = (localStorage.getItem(KEY) as Lang) || "zh";

export function setLang(l: Lang) {
  lang = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* noop */
  }
  applyLangToDOM();
  window.dispatchEvent(new CustomEvent("meridian-lang-change"));
}

/** 解析在地化字串 */
export function loc(s: LS): string {
  if (typeof s === "string") return s;
  return s[lang] ?? s.zh;
}

/** 場景內字面字串的即時選擇(create() 在選語言之後執行,故安全) */
export function tt(zh: string, en: string): string {
  return lang === "en" ? en : zh;
}

/** 角色顯示名(劇本 who 用中文鍵,英文時轉換) */
export const NAME_EN: Record<string, string> = {
  奧提斯: "OTIS",
  凱爾: "Kyle",
  艾莉絲: "Alice",
  萊拉: "Laila",
  希雅: "Shiya",
  范斯: "Vance",
  陳靜: "Chen Jing",
  你: "You",
  系統: "System",
  "???": "???",
};

export function speakerName(who: string): string {
  return lang === "en" ? NAME_EN[who] ?? who : who;
}

/** 套用語言到靜態 DOM(凡帶 data-zh/data-en 的元素)+ <html lang> */
export function applyLangToDOM() {
  document.documentElement.lang = lang === "en" ? "en" : "zh-Hant";
  document.querySelectorAll<HTMLElement>("[data-zh]").forEach((el) => {
    const v = lang === "en" ? el.dataset.en : el.dataset.zh;
    if (v != null) el.textContent = v;
  });
}
