// ── 招牌抉擇:單一資料源 ─────────────────────────────────────────
// 六艙小遊戲完成後各問一題「偏好抉擇」(維度純化,14 高/7 中/2 低)。
// 這裡集中六題,供「快速重測」(不跑劇情、不玩小遊戲,只回答 6 題情境)使用 —— 即
// 短式量表(short-form):跳過敘事仍保留驗證過的計分題,可無限重測看興趣變化。
//
// ⚠️ 內容與各艙場景內 askSignature 相同;此為重測用的權威來源。
import type { Dim } from "./riasec";
import type { SigOption } from "../ui/minichoice";
import type { LS } from "./lang";

export interface SignatureItem {
  dim: Dim;
  nodeId: string;
  speaker: string;
  accent: number;
  prompt: LS;
  options: SigOption[];
}

/** 重測題序(依 RIASEC 環狀排列) */
export const SIGNATURE_ORDER: Dim[] = ["R", "I", "A", "S", "E", "C"];

export const SIGNATURES: Record<Dim, SignatureItem> = {
  R: {
    dim: "R",
    nodeId: "R-3",
    speaker: "凱爾",
    accent: 0xffab40,
    prompt: { zh: "管路修好了。收工之前,你會?", en: "The line's fixed. Before you wrap up, you?" },
    options: [
      { label: { zh: "把整排接頭都鎖緊,徹底修到好。", en: "Tighten every joint and fix it thoroughly." }, weights: { R: 14 } },
      { label: { zh: "做完該做的就收工。", en: "Do what's needed and call it done." }, weights: { R: 7 } },
      { label: { zh: "交給維修無人機去處理。", en: "Leave it to the repair drone." }, weights: { R: 2 } },
    ],
  },
  I: {
    dim: "I",
    nodeId: "I-3",
    speaker: "艾莉絲",
    accent: 0x448aff,
    prompt: { zh: "孢子封存了。接下來,你會?", en: "The spores are sealed. What do you do next?" },
    options: [
      { label: { zh: "追下去 —— 我想弄清楚它為什麼這樣擴散。", en: "Dig deeper — I want to understand why it spread like this." }, weights: { I: 14 } },
      { label: { zh: "把結果記錄下來就好。", en: "Just log the results." }, weights: { I: 7 } },
      { label: { zh: "結案,不再深究。", en: "Close it out. No need to dig further." }, weights: { I: 2 } },
    ],
  },
  A: {
    dim: "A",
    nodeId: "A-3",
    speaker: "萊拉",
    accent: 0x69f0ae,
    prompt: { zh: "壁畫亮起來了。面對它,你會?", en: "The mural lights up. Facing it, you?" },
    options: [
      { label: { zh: "再加幾筆自己的詮釋,讓它變成新的東西。", en: "Add a few strokes of my own — make it something new." }, weights: { A: 14 } },
      { label: { zh: "照原樣復原就好。", en: "Just restore it as it was." }, weights: { A: 7 } },
      { label: { zh: "拍照存檔,交給系統歸檔。", en: "Photograph it and let the system archive it." }, weights: { A: 2 } },
    ],
  },
  S: {
    dim: "S",
    nodeId: "S-3",
    speaker: "希雅",
    accent: 0xff8a80,
    prompt: { zh: "他需要的不只是儀器。你會怎麼陪他?", en: "He needs more than machines. How do you stay with him?" },
    options: [
      { label: { zh: "握住他的手,陪他直到他睡著。", en: "Hold his hand and stay until he falls asleep." }, weights: { S: 14 } },
      { label: { zh: "確認數值穩定、記錄後,巡下一床。", en: "Confirm the readings, log them, move to the next bed." }, weights: { S: 7 } },
      { label: { zh: "交給監測儀,你先去忙別的。", en: "Leave him to the monitor; there's other work to do." }, weights: { S: 2 } },
    ],
  },
  E: {
    dim: "E",
    nodeId: "E-3",
    speaker: "范斯",
    accent: 0xffd700,
    prompt: { zh: "報表完成。簽核之前,你會?", en: "The report's done. Before you sign off, you?" },
    options: [
      { label: { zh: "主動重配、爭取更多餘裕,並下達後續指令。", en: "Reallocate to claim more margin, then issue the next orders." }, weights: { E: 14 } },
      { label: { zh: "按標準配置簽核就好。", en: "Sign off on the standard allocation." }, weights: { E: 7 } },
      { label: { zh: "讓系統自動最佳化,我不插手。", en: "Let the system auto-optimize; I won't intervene." }, weights: { E: 2 } },
    ],
  },
  C: {
    dim: "C",
    nodeId: "C-3",
    speaker: "陳靜",
    accent: 0xb0bec5,
    prompt: { zh: "分類完成。正式歸檔前,你會?", en: "Sorting's done. Before you file it for real, you?" },
    options: [
      { label: { zh: "再三核對、建立索引規則,確保零誤。", en: "Double-check everything and set indexing rules — zero errors." }, weights: { C: 14 } },
      { label: { zh: "檢查一遍就歸檔。", en: "Give it one pass, then file." }, weights: { C: 7 } },
      { label: { zh: "差不多就好,直接送出。", en: "Close enough — just submit it." }, weights: { C: 2 } },
    ],
  },
};
