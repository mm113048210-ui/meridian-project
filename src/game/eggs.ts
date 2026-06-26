// ── 艙內收藏(彩蛋)──────────────────────────────────────────────
// 每個房間藏 3 個對準背景真實物件的隱藏點。點到 → 物件「跳出來」收進手機收藏頁。
// 純探索收集:⛔ 不計分、不影響 RIASEC、不洩維度。位置以 fitCover 後的世界座標(960×540)標定。
import type { LS } from "./lang";

export interface Egg {
  id: string;
  scene: string; // bay.key:powerbay / datalab / muralhall / medbay / command / workshop
  x: number;
  y: number;
  icon: string; // 收藏頁顯示的圖示
  name: LS;
  flavor: LS;
}

export const EGGS: Egg[] = [
  // ── 交誼廳(lounge 背景)──
  { id: "egg_jukebox", scene: "muralhall", x: 115, y: 291, icon: "🎵", name: { zh: "老點唱機", en: "Old Jukebox" }, flavor: { zh: "投幣口卡著一枚來自地球的舊硬幣。", en: "An old Earth coin is jammed in the slot." } },
  { id: "egg_neon", scene: "muralhall", x: 216, y: 148, icon: "🪧", name: { zh: "霓虹招牌", en: "Neon Sign" }, flavor: { zh: "字早就不完整了,但沒人捨得關掉它。", en: "The letters are half-dead, but no one's had the heart to switch it off." } },
  { id: "egg_planet", scene: "muralhall", x: 797, y: 134, icon: "🪐", name: { zh: "舷窗行星", en: "Porthole Planet" }, flavor: { zh: "一顆沒有名字的行星,慢慢轉過舷窗。", en: "A nameless planet drifts slowly past the porthole." } },

  // ── 動力艙(powerbay 背景)──
  { id: "egg_turbine", scene: "powerbay", x: 403, y: 270, icon: "⚙️", name: { zh: "主渦輪", en: "Main Turbine" }, flavor: { zh: "葉片上有人用粉筆寫:「拜託撐住」。", en: "Someone chalked on a blade: \"please hold.\"" } },
  { id: "egg_warnsign", scene: "powerbay", x: 230, y: 97, icon: "⚠️", name: { zh: "高壓警示牌", en: "High-Voltage Sign" }, flavor: { zh: "三國語言的警告,最底下被劃了一個笑臉。", en: "Warnings in three languages — and a tiny smiley scratched at the bottom." } },
  { id: "egg_conduit", scene: "powerbay", x: 787, y: 184, icon: "🔧", name: { zh: "備用管路", en: "Backup Conduit" }, flavor: { zh: "纏滿了臨時補丁,卻一次都沒漏過。", en: "Wrapped in field patches — and it's never once leaked." } },

  // ── 溫室 / 資料艙(greenhouse 背景)──
  { id: "egg_plants", scene: "datalab", x: 192, y: 243, icon: "🌿", name: { zh: "發光植栽", en: "Glowing Crops" }, flavor: { zh: "其中一株不在任何種子清單上。", en: "One of these isn't on any seed manifest." } },
  { id: "egg_armrail", scene: "datalab", x: 480, y: 335, icon: "🦾", name: { zh: "軌道機械臂", en: "Rail Arm" }, flavor: { zh: "夾爪上掛著一片乾掉的葉子,像個吊飾。", en: "A dried leaf hangs from its claw like a charm." } },
  { id: "egg_dome", scene: "datalab", x: 480, y: 66, icon: "🔆", name: { zh: "穹頂燈", en: "Dome Light" }, flavor: { zh: "模擬日照的燈,設定停在一個地球的午後。", en: "The sun-lamp is frozen on one particular Earth afternoon." } },

  // ── 醫療艙(medbay 背景)──
  { id: "egg_cryopod", scene: "medbay", x: 461, y: 322, icon: "🛏️", name: { zh: "休眠艙", en: "Cryo Pod" }, flavor: { zh: "艙蓋內側貼著一張小孩的塗鴉。", en: "A child's drawing is taped inside the lid." } },
  { id: "egg_alarm", scene: "medbay", x: 503, y: 150, icon: "🚨", name: { zh: "警示燈", en: "Alarm Light" }, flavor: { zh: "紅燈轉著,但它其實已經很久沒響了。", en: "The light keeps turning, though it hasn't sounded in a long time." } },
  { id: "egg_hatch", scene: "medbay", x: 695, y: 326, icon: "🚪", name: { zh: "圓形艙門", en: "Round Hatch" }, flavor: { zh: "門邊刻著一排逐漸變淡的身高記號。", en: "A row of fading height-marks is carved by the frame." } },

  // ── 指揮中心(command 背景)──
  { id: "egg_galaxy", scene: "command", x: 480, y: 210, icon: "🌌", name: { zh: "星圖投影", en: "Star Display" }, flavor: { zh: "Kepler-452 被標了一顆小小的、手畫的星。", en: "Kepler-452 is marked with a tiny, hand-drawn star." } },
  { id: "egg_console_l", scene: "command", x: 195, y: 300, icon: "🎛️", name: { zh: "左控制台", en: "Left Console" }, flavor: { zh: "一排開關裡,只有一個貼著「別碰」。", en: "Among the switches, exactly one is labeled \"do not touch.\"" } },
  { id: "egg_console_r", scene: "command", x: 770, y: 300, icon: "📡", name: { zh: "通訊台", en: "Comm Console" }, flavor: { zh: "收件匣裡躺著一封永遠送不出去的家書。", en: "The outbox holds one letter home that will never send." } },

  // ── 資料艙工坊(workshop 背景)──
  { id: "egg_clock", scene: "workshop", x: 528, y: 188, icon: "🕰️", name: { zh: "牆上時鐘", en: "Wall Clock" }, flavor: { zh: "它走的是地球時間,慢了整整三年。", en: "It keeps Earth time — running three years behind." } },
  { id: "egg_bench", scene: "workshop", x: 432, y: 324, icon: "🛠️", name: { zh: "工作台", en: "Workbench" }, flavor: { zh: "每件工具都歸位,只有一把不見了。", en: "Every tool is in its place — except one that's missing." } },
  { id: "egg_gauges", scene: "workshop", x: 290, y: 216, icon: "🎚️", name: { zh: "校準量表", en: "Calibration Gauges" }, flavor: { zh: "指針全部對齊,像有人天天來校。", en: "Every needle is aligned, as if someone calibrates them daily." } },
];

const KEY = "meridian.eggs.v1";

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const a = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(a) ? (a as string[]) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* noop */
  }
}

export function collectedEggs(): Set<string> {
  return new Set(read());
}

export function isCollected(id: string): boolean {
  return read().includes(id);
}

/** 收集一個彩蛋;若是新收集回傳 true。 */
export function collectEgg(id: string): boolean {
  const ids = read();
  if (ids.includes(id)) return false;
  ids.push(id);
  write(ids);
  return true;
}

export function eggsForScene(scene: string): Egg[] {
  return EGGS.filter((e) => e.scene === scene);
}

export function totalEggs(): number {
  return EGGS.length;
}

export function collectedCount(): number {
  const got = collectedEggs();
  return EGGS.filter((e) => got.has(e.id)).length;
}

/** 該場景的彩蛋是否已全部收集(用於本艙收集完成回饋)。 */
export function sceneAllCollected(scene: string): boolean {
  const list = eggsForScene(scene);
  if (!list.length) return false;
  const got = collectedEggs();
  return list.every((e) => got.has(e.id));
}

/** 全部 18 顆是否收齊。 */
export function allCollected(): boolean {
  return collectedCount() >= totalEggs();
}
