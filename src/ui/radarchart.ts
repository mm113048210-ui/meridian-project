// ── SVG 雷達圖(DOM 用)─────────────────────────────────────────
// 供手機「星圖」Dashboard 使用。支援多快照疊圖(縱向重測軌跡):舊的淡、最新的亮,
// 讓玩家一眼看出興趣怎麼變化。純 SVG 字串,直接注入 DOM。
import { DIMS, type Dim } from "../game/riasec";
import { lang } from "../game/lang";

const LABEL: Record<Dim, { zh: string; en: string }> = {
  R: { zh: "實作 R", en: "Realistic R" },
  I: { zh: "研究 I", en: "Investigative I" },
  A: { zh: "藝術 A", en: "Artistic A" },
  S: { zh: "助人 S", en: "Social S" },
  E: { zh: "領導 E", en: "Enterprising E" },
  C: { zh: "秩序 C", en: "Conventional C" },
};

export interface RadarSeries {
  scores: Record<Dim, number>;
  color: string;
  fillOpacity: number;
  strokeOpacity: number;
  strokeWidth?: number;
}

const ang = (i: number) => -Math.PI / 2 + (i * Math.PI * 2) / 6;

export function radarSVG(series: RadarSeries[], size = 280): string {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.34;

  // 同心格線(3 圈)
  let grid = "";
  for (let ring = 1; ring <= 3; ring++) {
    const rr = (r * ring) / 3;
    const pts = DIMS.map((_, i) => `${cx + Math.cos(ang(i)) * rr},${cy + Math.sin(ang(i)) * rr}`).join(" ");
    grid += `<polygon points="${pts}" fill="none" stroke="#2e4a5e" stroke-opacity="0.7" stroke-width="1"/>`;
  }
  // 軸線
  let axes = "";
  DIMS.forEach((_, i) => {
    axes += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(ang(i)) * r}" y2="${cy + Math.sin(ang(i)) * r}" stroke="#2e4a5e" stroke-opacity="0.5" stroke-width="1"/>`;
  });
  // 軸標籤
  let labels = "";
  DIMS.forEach((d, i) => {
    const lx = cx + Math.cos(ang(i)) * (r + 22);
    const ly = cy + Math.sin(ang(i)) * (r + 16);
    labels += `<text x="${lx}" y="${ly}" fill="#8fb3c4" font-size="11" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">${LABEL[d][lang === "en" ? "en" : "zh"]}</text>`;
  });
  // 資料多邊形
  let shapes = "";
  for (const s of series) {
    const pts = DIMS.map((d, i) => {
      const rr = (r * Math.max(6, s.scores[d] ?? 0)) / 100;
      return `${cx + Math.cos(ang(i)) * rr},${cy + Math.sin(ang(i)) * rr}`;
    }).join(" ");
    shapes += `<polygon points="${pts}" fill="${s.color}" fill-opacity="${s.fillOpacity}" stroke="${s.color}" stroke-opacity="${s.strokeOpacity}" stroke-width="${s.strokeWidth ?? 2}" stroke-linejoin="round"/>`;
  }

  return `<svg viewBox="0 0 ${size} ${size}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">${grid}${axes}${shapes}${labels}</svg>`;
}
