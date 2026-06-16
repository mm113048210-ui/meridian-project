// 極簡 8-bit 音效(WebAudio,無外部檔案)
let ctx: AudioContext | null = null;
function ac() {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function beep(freq: number, dur = 0.06, type: OscillatorType = "square", gain = 0.025) {
  try {
    const a = ac();
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g).connect(a.destination);
    o.start();
    o.stop(a.currentTime + dur);
  } catch {
    /* autoplay 未解鎖前靜默 */
  }
}

export const sfx = {
  type: () => beep(880 + Math.random() * 220, 0.03, "square", 0.012),
  click: () => beep(660, 0.05),
  hover: () => beep(440, 0.03, "square", 0.01),
  snap: () => beep(520, 0.07, "triangle", 0.05),
  rotate: () => beep(700, 0.04, "triangle", 0.035),
  alarm: () => {
    beep(310, 0.25, "sawtooth", 0.03);
    setTimeout(() => beep(260, 0.25, "sawtooth", 0.03), 300);
  },
  solve: () => {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.12, "triangle", 0.05), i * 90));
  },
};
