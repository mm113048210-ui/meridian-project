import Phaser from "phaser";
import { BAYS } from "../game/script";
import { flow, setStage, syncHud, clearSave } from "../game/flow";
import { riasec, type Dim } from "../game/riasec";
import { careerStore } from "../game/storage";
import { openPhone, setPhoneTab } from "./phone";
import { RECOMMENDATIONS } from "../game/recommendations";

type PreviewTarget = "final-story" | "report" | "paths" | "home";

const fakeRaw: Record<Dim, number> = {
  R: 40,
  I: 84,
  A: 66,
  S: 58,
  E: 46,
  C: 72,
};

function game(): Phaser.Game | null {
  return (window as unknown as { __game?: Phaser.Game }).__game ?? null;
}

function stopLiveScenes(g: Phaser.Game) {
  g.scene.getScenes(true).forEach((scene) => {
    if (scene.scene.key !== "boot") scene.scene.stop(scene.scene.key);
  });
}

function seedLateGameState() {
  flow.equipment = "等離子扳手";
  flow.pipeVariant = "hands";
  flow.sporeVariant = "manual";
  flow.completedBays = BAYS.map((bay) => bay.key);
  flow.midpointPlayed = true;
  flow.finalChoice = 1;
  flow.repair = 100;
  setStage("done");
  riasec.deserialize({
    l1: fakeRaw,
    l2: fakeRaw,
    l4: { R: 16, I: 26, A: 22, S: 18, E: 14, C: 24 },
    resonance: { R: 5, I: 10, A: 5, S: 5, E: 0, C: 10 },
  });
  syncHud();
}

async function seedAssessment() {
  const { scores, code } = riasec.report();
  await careerStore.addAssessment({ scores, code, finalChoice: flow.finalChoice });
  await Promise.all([
    careerStore.addAction({ dim: code[0], category: "activities", text: pair(RECOMMENDATIONS[code[0]].activities[0]) }),
    careerStore.addAction({ dim: code[0], category: "portfolio", text: pair(RECOMMENDATIONS[code[0]].portfolio[0]) }),
  ]);
}

function pair(value: string | { zh: string; en: string }) {
  return typeof value === "string" ? { zh: value, en: value } : value;
}

async function preview(target: PreviewTarget) {
  const g = game();
  if (!g) return;
  seedLateGameState();
  stopLiveScenes(g);
  document.getElementById("title-ui")?.classList.add("hidden");
  if (target === "home") {
    await seedAssessment();
    g.scene.start("home");
    window.setTimeout(() => {
      openPhone("dashboard", true);
      setPhoneTab("dashboard");
    }, 350);
    return;
  }
  if (target === "final-story") {
    setStage("final");
    g.scene.start("final");
    return;
  }
  g.scene.start("final", {
    previewReport: target === "report",
    previewPaths: target === "paths",
  });
}

function mountPanel() {
  if (document.getElementById("dev-panel")) return;
  const panel = document.createElement("div");
  panel.id = "dev-panel";
  panel.innerHTML = `
    <div class="dev-title">DEV PREVIEW</div>
    <button data-dev="report">結尾報告</button>
    <button data-dev="paths">推薦成就</button>
    <button data-dev="home">手機星圖</button>
    <button data-dev="final-story">最終劇情</button>
    <button data-dev="clear">清資料</button>
  `;
  document.body.appendChild(panel);
  panel.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.dev;
      if (target === "clear") {
        clearSave();
        void careerStore.clearAll();
        location.reload();
        return;
      }
      void preview(target as PreviewTarget);
    });
  });
}

export function initDevTools() {
  if (!import.meta.env.DEV) return;
  mountPanel();
  (window as unknown as { __meridianDev?: Record<string, unknown> }).__meridianDev = {
    preview,
    seedLateGameState,
    seedAssessment,
  };
}
