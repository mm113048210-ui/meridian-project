import Phaser from "phaser";

let currentKey = "";
let currentSound: Phaser.Sound.BaseSound | null = null;
let fadeTween: Phaser.Tweens.Tween | null = null;

type VolumeSound = Phaser.Sound.BaseSound & { setVolume?: (volume: number) => void; volume?: number };

function setVolume(sound: Phaser.Sound.BaseSound | null, volume: number) {
  if (!sound) return;
  const s = sound as VolumeSound;
  if (s.setVolume) s.setVolume(volume);
  else s.volume = volume;
}

export function playMusic(scene: Phaser.Scene, key: string, volume = 0.28, fadeMs = 1400) {
  if (currentKey === key && currentSound?.isPlaying) return;

  if (!scene.cache.audio.exists(key)) return;

  const previous = currentSound;
  fadeTween?.stop();

  currentKey = key;
  currentSound = scene.sound.add(key, { loop: true, volume: 0 });
  currentSound.play();

  const state = { out: previous ? 1 : 0, in: 0 };
  fadeTween = scene.tweens.add({
    targets: state,
    out: 0,
    in: 1,
    duration: fadeMs,
    ease: "Sine.easeInOut",
    onUpdate: () => {
      setVolume(previous, volume * state.out);
      setVolume(currentSound, volume * state.in);
    },
    onComplete: () => {
      if (previous) {
        previous.stop();
        previous.destroy();
      }
      setVolume(currentSound, volume);
      fadeTween = null;
    },
  });
}

export function stopMusic(scene?: Phaser.Scene, fadeMs = 800) {
  if (currentSound) {
    const old = currentSound;
    if (scene && fadeMs > 0) {
      const state = { volume: (old as VolumeSound).volume ?? 0.28 };
      scene.tweens.add({
        targets: state,
        volume: 0,
        duration: fadeMs,
        ease: "Sine.easeInOut",
        onUpdate: () => setVolume(old, state.volume),
        onComplete: () => {
          old.stop();
          old.destroy();
        },
      });
    } else {
      old.stop();
      old.destroy();
    }
  }
  currentSound = null;
  currentKey = "";
}
