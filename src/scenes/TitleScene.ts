import Phaser from "phaser";
import { sfx } from "../ui/sfx";
import { playMusic } from "../ui/music";
import { hasSave, restoreFlow, clearSave, type Stage } from "../game/flow";
import { applyLangToDOM, lang, setLang, type Lang } from "../game/lang";
import { careerStore } from "../game/storage";
import { installAmbientDrift, installPointerParallax, installRoomAmbience } from "../ui/ambient";

const STAGE_SCENE: Record<Stage, string> = {
  intro: "prologue",
  hub: "hub",
  modules: "modules",
  ranking: "ranking",
  final: "final",
  done: "prologue",
};

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("title");
  }

  create() {
    document.getElementById("save-button")?.classList.add("hidden");
    playMusic(this, "bgm_title_drift", 0.24);
    const bg = this.add.image(480, 270, "title");
    fitCover(bg, 960, 540);
    // 左側壓暗,讓文字區乾淨(galaxy 在右)
    const grad = this.add.graphics();
    grad.fillGradientStyle(0x05080c, 0x05080c, 0x05080c, 0x05080c, 0.92, 0.25, 0.92, 0.25);
    grad.fillRect(0, 0, 560, 540);
    this.add.rectangle(480, 270, 960, 540, 0x05080c, 0.25);
    installAmbientDrift(this, { color: 0x7fb6c9, count: 16, depth: 4, alphaScale: 1.2, sizeScale: 1.1 });
    installRoomAmbience(this, "title", 5);
    installPointerParallax(this, bg, { strength: 8, duration: 520 });

    const ui = document.getElementById("title-ui")!;
    const cta = document.getElementById("title-cta")!;
    const actions = document.getElementById("title-actions")!;
    ui.classList.remove("hidden");
    applyLangToDOM();
    this.bindLanguageButtons();

    const goto = (sceneKey: string) => {
      sfx.click();
      ui.classList.add("hidden");
      this.cameras.main.fadeOut(600, 5, 8, 12);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start(sceneKey));
    };

    if (hasSave()) {
      // 有存檔:顯示「繼續 / 重新開始」,停用整片點擊
      cta.classList.add("hidden");
      actions.classList.remove("hidden");
      const cont = document.getElementById("btn-continue")!;
      const fresh = document.getElementById("btn-newgame")!;
      const onContinue = () => {
        const stage = restoreFlow() ?? "intro";
        goto(STAGE_SCENE[stage]);
      };
      const onFresh = () => {
        clearSave();
        goto("prologue");
      };
      cont.addEventListener("click", onContinue, { once: true });
      fresh.addEventListener("click", onFresh, { once: true });
    } else {
      // 無存檔:點擊任意處開始
      cta.classList.remove("hidden");
      actions.classList.add("hidden");
      this.input.once("pointerdown", () => goto("prologue"));
    }

    // 回訪者:完成過航程(有鑑定快照)→ 顯示「進入星圖」直接落到家,不必重跑劇情。
    const starmap = document.getElementById("btn-starmap");
    if (starmap) {
      void careerStore.listAssessments().then((list) => {
        if (!list.length) return;
        starmap.classList.remove("hidden");
        cta.classList.add("hidden");
        starmap.addEventListener("click", () => goto("home"), { once: true });
      });
    }

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => ui.classList.add("hidden"));
  }

  private bindLanguageButtons() {
    const bind = (id: string, next: Lang) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.classList.toggle("active", lang === next);
      btn.onclick = (event) => {
        event.stopPropagation();
        sfx.click();
        setLang(next);
        document.getElementById("lang-zh")?.classList.toggle("active", next === "zh");
        document.getElementById("lang-en")?.classList.toggle("active", next === "en");
      };
    };
    bind("lang-zh", "zh");
    bind("lang-en", "en");
  }
}

export function fitCover(img: Phaser.GameObjects.Image, w: number, h: number) {
  const s = Math.max(w / img.width, h / img.height);
  img.setScale(s);
}
