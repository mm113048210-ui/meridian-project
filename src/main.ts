import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { EquipScene } from "./scenes/EquipScene";
import { AwakeningScene } from "./scenes/AwakeningScene";
import { HubScene } from "./scenes/HubScene";
import { BayScene } from "./scenes/BayScene";
import { ModulesScene } from "./scenes/ModulesScene";
import { DecodeScene } from "./scenes/DecodeScene";
import { PipePuzzleScene } from "./scenes/PipePuzzleScene";
import { PowerGridScene } from "./scenes/PowerGridScene";
import { SortPuzzleScene } from "./scenes/SortPuzzleScene";
import { SeqPuzzleScene } from "./scenes/SeqPuzzleScene";
import { RankingScene } from "./scenes/RankingScene";
import { FinalScene } from "./scenes/FinalScene";
import { riasec } from "./game/riasec";
import { flow } from "./game/flow";
import { initPacing } from "./ui/pacing";
import "./styles.css";

initPacing();

// ── 銳利度修正:超取樣(supersampling)───────────────────────────────
// 問題:畫布內部只有 960×540,在 hi-DPI / 放大視窗時被拉伸 → canvas 內的
// 文字(小遊戲、報告)糊掉。DOM 對話文字不受影響(原生解析度)。
// 解法:以 SS 倍解析度繪製整個畫布,座標數學維持 960×540 不變(靠相機 zoom)。
const SS = Math.min(3, Math.max(2, Math.ceil(window.devicePixelRatio || 1)));

// 讓每個 this.add.text 以 SS 倍解析度算圖(配合相機 zoom,文字才不會被放大糊掉)
const factory = Phaser.GameObjects.GameObjectFactory.prototype as unknown as {
  text: (
    x: number,
    y: number,
    text: string | string[],
    style?: Phaser.Types.GameObjects.Text.TextStyle,
  ) => Phaser.GameObjects.Text;
};
const _text = factory.text;
factory.text = function (this: Phaser.GameObjects.GameObjectFactory, x, y, text, style) {
  return _text.call(this, x, y, text, { resolution: SS, ...(style || {}) });
};

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-root",
  backgroundColor: "#0d1b2a",
  render: {
    antialias: true,
    antialiasGL: true,
    pixelArt: false,
    roundPixels: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // 高解析緩衝區:座標仍是 960×540,只是用更多實體像素繪製
    width: 960 * SS,
    height: 540 * SS,
  },
  scene: [
    BootScene,
    TitleScene,
    EquipScene,
    AwakeningScene,
    HubScene,
    BayScene,
    ModulesScene,
    DecodeScene,
    PipePuzzleScene,
    PowerGridScene,
    SortPuzzleScene,
    SeqPuzzleScene,
    RankingScene,
    FinalScene,
  ],
};

const game = new Phaser.Game(config);

// 每個場景啟動時:把相機 zoom 設為 SS,並對齊 (0,0)~(960,540) 的世界範圍。
// 這樣所有場景仍用 480/270 等 960×540 座標,但畫到 (960·SS)×(540·SS) 的緩衝區 → 銳利。
const applyHiDPI = (scene: Phaser.Scene) => {
  const cam = scene.cameras?.main;
  if (!cam) return;
  cam.setZoom(SS);
  cam.centerOn(480, 270);
};
game.events.once(Phaser.Core.Events.READY, () => {
  game.scene.scenes.forEach((scene) => {
    // START 早於繪製(修正 Boot 載入條位置);CREATE 在重啟場景時再套用一次
    scene.sys.events.on(Phaser.Scenes.Events.START, () => applyHiDPI(scene));
    scene.sys.events.on(Phaser.Scenes.Events.CREATE, () => applyHiDPI(scene));
  });
});

// 開發除錯用(不影響遊戲)
const w = window as unknown as Record<string, unknown>;
w.__game = game;
w.__riasec = riasec;
w.__flow = flow;
w.__ss = SS;
