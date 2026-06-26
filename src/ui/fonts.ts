// ── 顯示字體(Display font)──────────────────────────────────────
// Orbitron = sci-fi 幾何展示體,用在「展示型」表面:標題 wordmark、原型名、
// Holland code、鑑定書標頭、羈絆卡標題。字串裡的中文字會自動回退到系統 CJK 字
// (PingFang / JhengHei),所以混排「建構者 Builder」時:Builder 走 Orbitron、
// 建構者 走系統字。內文與對話保持原本 sans 堆疊,不動可讀性。

/** 展示型文字用的字體堆疊(Phaser canvas 會逐字回退)。 */
export const DISPLAY = '"Orbitron", "PingFang TC", "Microsoft JhengHei", sans-serif';

/** HUD / 數字 / Holland code 用的等寬展示堆疊(Orbitron 數字感強)。 */
export const DISPLAY_MONO = '"Orbitron", "Courier New", monospace';

/**
 * 等字體就緒再開場 —— Phaser canvas text 在字體載入前繪製會用回退字且不會自動重繪,
 * 所以開場前先確保 Orbitron ready。失敗或超時(預設 2s)就以系統回退繼續,絕不卡住。
 */
export function loadDisplayFont(timeoutMs = 2000): Promise<void> {
  const fontSet = (typeof document !== "undefined" ? document.fonts : undefined) as
    | FontFaceSet
    | undefined;
  if (!fontSet) return Promise.resolve();
  const ready = Promise.all([
    fontSet.load('500 24px "Orbitron"'),
    fontSet.load('700 24px "Orbitron"'),
    fontSet.load('800 24px "Orbitron"'),
  ])
    .then(() => undefined)
    .catch(() => undefined);
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
  return Promise.race([ready, timeout]);
}
