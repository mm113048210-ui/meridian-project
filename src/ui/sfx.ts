// 音效播放:優先使用 public/audio 裡的 wav;失敗時退回 WebAudio beep。
let ctx: AudioContext | null = null;
const cache = new Map<string, HTMLAudioElement>();

function file(name: string, volume = 0.45): boolean {
  try {
    let base = cache.get(name);
    if (!base) {
      base = new Audio(`/audio/${name}`);
      base.preload = "auto";
      cache.set(name, base);
    }
    const a = base.cloneNode(true) as HTMLAudioElement;
    a.volume = volume;
    void a.play();
    return true;
  } catch {
    return false;
  }
}

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

// 逐字打字音:柔和的低頻 sine 細點,帶緩起緩收包絡(避免方波那種尖銳嗶聲)。
// 直接合成、不讀 wav,音量極低,連續逐字播放時聽起來像輕柔的紙頁敲點。
function softTick() {
  try {
    const a = ac();
    const now = a.currentTime;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = "triangle"; // 比 sine 多一點諧波 → 小喇叭也聽得到,但仍不刺耳
    o.frequency.value = 440 + Math.random() * 70; // 提高到中頻,清楚但柔和
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.075, now + 0.006); // 緩起,消除起音爆點
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05); // 緩收
    o.connect(g).connect(a.destination);
    o.start(now);
    o.stop(now + 0.06);
  } catch {
    /* autoplay 未解鎖前靜默 */
  }
}

export const sfx = {
  type: () => softTick(),
  click: () => file("sfx_ui_click.wav", 0.42) || beep(660, 0.05),
  hover: () => file("sfx_ui_hover.wav", 0.2) || beep(440, 0.03, "square", 0.01),
  snap: () => file("sfx_card_snap.wav", 0.38) || beep(520, 0.07, "triangle", 0.05),
  rotate: () => file("sfx_pipe_rotate.wav", 0.38) || beep(700, 0.04, "triangle", 0.035),
  alarm: () => {
    if (file("sfx_alarm_pressure.wav", 0.38)) return;
    beep(310, 0.25, "sawtooth", 0.03);
    setTimeout(() => beep(260, 0.25, "sawtooth", 0.03), 300);
  },
  solve: () => {
    if (file("sfx_solved_chime.wav", 0.42)) return;
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.12, "triangle", 0.05), i * 90));
  },
  cryoWake: () => file("sfx_cryo_wake.wav", 0.4),
  save: () => file("sfx_save.wav", 0.38),
  panelOpen: () => file("sfx_panel_open.wav", 0.32),
  panelClose: () => file("sfx_panel_close.wav", 0.3),
  error: () => file("sfx_error_soft.wav", 0.28),
  memory: () => file("sfx_memory_flash.wav", 0.3),
  glitch: () => file("sfx_otis_glitch.wav", 0.34),
  repair: () => file("sfx_repair_progress.wav", 0.34),
};
