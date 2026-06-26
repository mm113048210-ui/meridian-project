import type { Dim } from "../game/riasec";

// ── 原型色(單一資料源)──────────────────────────────────────────
// 六型 RIASEC 的識別色。HEX 給 DOM/CSS,NUM 給 Phaser(tint/fill 用數字)。
// ⛔ 鐵則:這只是「色」,不在任何畫面標示維度字母/名稱。

export const ACCENT_HEX: Record<Dim, string> = {
  R: "#ffab40",
  I: "#448aff",
  A: "#69f0ae",
  S: "#ff8a80",
  E: "#ffd700",
  C: "#b0bec5",
};

export const ACCENT_NUM: Record<Dim, number> = {
  R: 0xffab40,
  I: 0x448aff,
  A: 0x69f0ae,
  S: 0xff8a80,
  E: 0xffd700,
  C: 0xb0bec5,
};
