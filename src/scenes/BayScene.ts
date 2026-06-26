import Phaser from "phaser";
import { say, choose, playLines, hideDialogue, wait } from "../ui/dialogue";
import { hidePortrait } from "../ui/portrait";
import { riasec } from "../game/riasec";
import { flow, addRepair } from "../game/flow";
import { sfx } from "../ui/sfx";
import { playMusic } from "../ui/music";
import { fitCover } from "./TitleScene";
import { BAYS, type Bay } from "../game/script";
import { setTasks, setActiveStep, completeActiveStep, clearTasks } from "../game/tasks";
import { showBondCard } from "../ui/bondcard";
import { installAmbientDrift, installPointerParallax, installRoomAmbience, installVignette, type AmbientRoom } from "../ui/ambient";
import { burst } from "../ui/fx";
import { installEggSpots } from "../ui/eggspots";
import { fadeToScene } from "../ui/transition";
import { ACCENT_NUM } from "../ui/palette";
import { loc, tt, type LS } from "../game/lang";

interface TaskSpot {
  id: string;
  x: number;
  y: number;
  label: LS;
  task: LS;
  flavor: LS; // 點擊非當前設備時的感官風味描述(無計分、不洩維度)
}

interface ReactLine {
  text: LS;
  portrait: string; // 既有立繪 key;缺圖會自動回退到基礎立繪(鐵則:不重生成美術)
}

// 共振反應立繪:剛甦醒的專員依玩家的主觀共振回應,露出對應神情並道別。
// warm = 玩家投入(露出投入/溫暖的表情變體);cool = 純義務(收回到中性基礎立繪)。
// ⛔ 表現不計分;這只反映既有的偏好訊號,讓「神情」隨玩家回應變化(把 Expression 從靜態變反應)。
const BAY_REACT: Record<string, { warm: ReactLine; cool: ReactLine }> = {
  powerbay: {
    warm: { portrait: "kyle_work", text: { zh: "(他用扳手敲了敲你肩上的護甲)下次有硬仗,記得找我。", en: "(He taps your shoulder plate with his wrench.) Next time there's a hard job, come find me." } },
    cool: { portrait: "kyle", text: { zh: "(他點點頭,轉回儀表前)……保重。", en: "(He nods and turns back to the gauges.) ...Take care." } },
  },
  datalab: {
    warm: { portrait: "alice_focus", text: { zh: "(她難得地對你笑了一下)會問對問題的人,值得共事。", en: "(A rare small smile.) People who ask the right questions are worth working with." } },
    cool: { portrait: "alice", text: { zh: "(她已經轉身盯著數據)嗯,做完了。", en: "(Already turning back to the data.) Mm. We're done." } },
  },
  muralhall: {
    warm: { portrait: "laila_inspired", text: { zh: "(她輕輕哼起剛才那段旋律)你聽見了,對吧?那就夠了。", en: "(She hums that melody softly.) You heard it too, didn't you? That's enough." } },
    cool: { portrait: "laila", text: { zh: "(她把杯子擺正)謝謝你過來。", en: "(She straightens a cup.) Thanks for coming by." } },
  },
  medbay: {
    warm: { portrait: "shiya_care", text: { zh: "(她握了握你的手)你做得比你以為的更好。記住這種感覺。", en: "(She squeezes your hand.) You did better than you think. Remember this feeling." } },
    cool: { portrait: "shiya", text: { zh: "(她已經走向下一張病床)辛苦了。", en: "(Already moving to the next bed.) Thank you for your help." } },
  },
  command: {
    warm: { portrait: "vance_command", text: { zh: "(他頷首,像在評估一名軍官)你有站到前面的膽識。我記住了。", en: "(He nods, sizing you up like an officer.) You've got the nerve to step forward. I'll remember that." } },
    cool: { portrait: "vance", text: { zh: "(他整了整衣領)記錄在案。", en: "(He straightens his collar.) Noted for the record." } },
  },
  workshop: {
    warm: { portrait: "chen_work", text: { zh: "(她罕見地鬆了口氣)終於有人懂這份講究的重量。", en: "(A rare breath of relief.) Finally, someone who understands why this care matters." } },
    cool: { portrait: "chen", text: { zh: "(她已經開始下一份歸檔)已登錄。", en: "(Already starting the next file.) Logged." } },
  },
};

const ROOM_AMBIENCE: Record<string, AmbientRoom> = {
  powerbay: "powerbay",
  datalab: "greenhouse",
  muralhall: "lounge",
  medbay: "medbay",
  command: "command",
  workshop: "workshop",
};

// 通用艙區場景:吃劇本資料,跑「3 節點 → 共振 → 喚醒 → 記憶碎片」
export class BayScene extends Phaser.Scene {
  private bay!: Bay;
  private enteredAt = 0;
  private completedNodeIds = new Set<string>();

  constructor() {
    super("bay");
  }

  create(data: { bayKey: string }) {
    this.bay = BAYS.find((b) => b.key === data.bayKey)!;
    this.enteredAt = this.time.now;
    this.completedNodeIds.clear();
    document.getElementById("save-button")?.classList.add("hidden");
    riasec.log("bay_enter", { bay: this.bay.key });
    this.cameras.main.fadeIn(500, 0, 0, 0);
    playMusic(this, "bgm_memory_dialogue", 0.22);
    const bg = this.add.image(480, 270, this.bay.bg);
    fitCover(bg, 960, 540);
    this.add.rectangle(480, 270, 960, 540, 0x05080c, 0.3);
    // 暗角 + 環境塵埃:一致的聚焦中央電影感,讓靜態背景「呼吸」(壓在背景之上、互動層之下)
    installVignette(this, { depth: 3 });
    installAmbientDrift(this, { color: ACCENT_NUM[this.bay.dim], count: 20, depth: 4, alphaScale: 1.35, sizeScale: 1.15 });
    installRoomAmbience(this, ROOM_AMBIENCE[this.bay.key] ?? "command", 5);
    installPointerParallax(this, bg, { strength: 9, duration: 460 });
    // 隱藏彩蛋點:對準房間裡的真實物件,點到收進手機收藏頁(探索向,不計分)
    installEggSpots(this, this.bay.key);
    // 手機任務列表:把這個艙的三個任務點寫進「任務」頁(逐步勾選)
    setTasks(
      this.bay.name,
      this.taskSpots(this.bay.key).map((s) => ({ label: s.label })),
    );
    this.run();
  }

  private async run() {
    const bay = this.bay;
    // 進場警示(動力艙為教學關,額外震動)
    if (bay.key === "powerbay") {
      sfx.alarm();
      this.cameras.main.shake(220, 0.003);
    }

    for (let n = 0; n < bay.nodes.length; n++) {
      const node = bay.nodes[n];
      setActiveStep(n); // 手機任務頁:標記目前進行中的步驟
      const spot = await this.waitForInteraction(node.id);
      await playLines(node.intro);
      const idx = await choose(node.choices.map((c) => ({ label: c.label })));
      // ⛔ 唯一計分點:選擇=偏好。小遊戲表現不計分。
      riasec.addChoice(node.choices[idx].weights, node.id);
      // 方法選擇 → 小遊戲操作變體(都能過關,只有「選擇」計分)
      if (node.id === "R-1") flow.pipeVariant = (["hands", "manual", "assist"] as const)[idx];
      if (node.id === "I-3") flow.sporeVariant = (["manual", "inquire", "verify"] as const)[idx];
      await playLines(node.choices[idx].reaction);
      hideDialogue();
      // 方法選擇 idx 一併傳給小遊戲(改變操作手感;不影響計分)
      if (node.minigame) await this.runMinigame(node.minigame, idx);
      this.completedNodeIds.add(node.id);
      completeActiveStep(); // 任務頁打勾
      if (spot) this.taskDoneFeedback(spot.x, spot.y); // 艙內可見回饋(綠光)
      addRepair(5);
    }

    // 喚醒
    this.cameras.main.flash(300, 53, 224, 200);
    burst(this, 480, 250, { color: ACCENT_NUM[bay.dim], count: 22, speed: 170 });
    sfx.solve();
    await playLines(bay.awaken);
    const woke = flow.completedBays.length + 1;
    await say("奧提斯", { zh: `專員喚醒進度:${woke} / 6。`, en: `Crew revival progress: ${woke} / 6.` }, "otis");

    // 主觀共振(偽裝成校準提問 — 偏好訊號)
    await say("奧提斯", { zh: "校準提問:剛才的作業,您做起來感覺如何?", en: "Calibration question: how did that work feel to you?" }, "otis");
    const liked = await choose([
      { label: { zh: "比想像中順手。", en: "More natural than expected." } },
      { label: { zh: "只是不得不完成。", en: "Just something I had to finish." } },
    ]);
    riasec.addResonance(bay.dim, liked === 0, bay.key);
    await say(
      "奧提斯",
      liked === 0
        ? { zh: "已記錄。這段反應很清楚。", en: "Recorded. That response is clear." }
        : { zh: "已記錄。感謝您的誠實。", en: "Recorded. Thank you for your honesty." },
      "otis",
    );

    // 反應立繪:剛甦醒的專員依玩家的主觀共振,露出對應神情並道別(神情隨回應變化)。
    const react = BAY_REACT[bay.key];
    if (react) {
      const r = liked === 0 ? react.warm : react.cool;
      await say(bay.char.name, r.text, bay.char.style, r.portrait);
    }

    // 記憶碎片(身分拼圖 + 奧提斯伏筆)
    await playLines(bay.shard);

    flow.completedBays.push(bay.key);
    // 停留時間遙測(日常活動:停留與互動記錄,不計分)
    riasec.log("bay_complete", { bay: bay.key, ms: Math.round(this.time.now - this.enteredAt) });
    addRepair(3);
    hideDialogue();
    hidePortrait();
    clearTasks(); // 離開艙區清空任務頁

    // 羈絆里程碑卡:剛喚醒的專員「理解了你」+ X/6 進度 + 期待鉤(不露維度,鐵則)
    await showBondCard(this, {
      bayKey: bay.key,
      name: bay.char.name,
      dim: bay.dim,
      count: flow.completedBays.length,
    });

    fadeToScene(this, "hub");
  }

  /** 任務完成的艙內視覺回饋:綠光環擴散(Among Us "Task Completed" 感)。 */
  private taskDoneFeedback(x: number, y: number) {
    sfx.solve();
    burst(this, x, y, { color: 0x35e0c8, count: 14, speed: 130, depth: 42, scale: 0.42 });
    const ring = this.add.circle(x, y, 12, 0x35e0c8, 0).setStrokeStyle(3, 0x35e0c8, 0.9).setDepth(40);
    this.tweens.add({ targets: ring, radius: 70, alpha: 0, duration: 620, ease: "Cubic.easeOut", onComplete: () => ring.destroy() });
    const tick = this.add
      .text(x, y - 2, "✓", { fontFamily: "sans-serif", fontSize: "30px", color: "#35e0c8" })
      .setOrigin(0.5)
      .setDepth(41);
    this.tweens.add({ targets: tick, y: y - 26, alpha: 0, duration: 720, ease: "Cubic.easeOut", onComplete: () => tick.destroy() });
  }

  /** 點擊房間物件的浮動風味字幕:緩緩上升淡出。 */
  private popCaption(x: number, y: number, text: string) {
    const t = this.add
      .text(x, y, text, {
        fontFamily: "sans-serif",
        fontSize: "12px",
        color: "#dceefb",
        backgroundColor: "rgba(4, 10, 14, 0.82)",
        padding: { x: 9, y: 6 },
        align: "center",
        wordWrap: { width: 210 },
      })
      .setOrigin(0.5)
      .setDepth(60);
    this.tweens.add({ targets: t, y: y - 22, alpha: 0, duration: 1500, ease: "Cubic.easeOut", onComplete: () => t.destroy() });
  }

  private runMinigame(key: string, variant = 0): Promise<void> {
    return new Promise((resolve) => {
      document.getElementById("hud")?.classList.add("hidden");
      document.getElementById("save-button")?.classList.add("hidden");
      this.events.once(Phaser.Scenes.Events.RESUME, () => {
        document.getElementById("hud")?.classList.remove("hidden");
        this.cameras.main.fadeIn(300, 0, 0, 0);
        resolve();
      });
      this.scene.launch(key, { from: "bay", variant });
      this.scene.pause();
    });
  }

  private waitForInteraction(nodeId: string): Promise<TaskSpot | null> {
    const spots = this.taskSpots(this.bay.key);
    const active = spots.find((spot) => spot.id === nodeId);
    if (!active) return Promise.resolve(null);

    return new Promise((resolve) => {
      hideDialogue();
      const layer = this.add.container(0, 0).setDepth(30);
      const title = this.add
        .text(480, 52, tt("走到亮起的設備並互動", "Go to the lit device and interact"), {
          fontFamily: "sans-serif",
          fontSize: "15px",
          color: "#d8f4ff",
          backgroundColor: "rgba(4, 10, 14, 0.7)",
          padding: { x: 12, y: 7 },
        })
        .setOrigin(0.5);
      // 指向當前設備的黃箭頭(Among Us 導引感),在設備上方上下漂動
      const arrow = this.add
        .text(active.x, active.y - 40, "▾", { fontFamily: "sans-serif", fontSize: "18px", color: "#ffffff" })
        .setOrigin(0.5)
        .setAlpha(0.75);
      this.tweens.add({ targets: arrow, y: active.y - 32, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      const prompt = this.add
        .text(480, 482, tt("移到設備上查看任務,點擊互動", "Hover a device to inspect, click to interact"), {
          fontFamily: "sans-serif",
          fontSize: "13px",
          color: "#d8f4ff",
          backgroundColor: "rgba(4, 10, 14, 0.78)",
          padding: { x: 12, y: 8 },
          align: "center",
        })
        .setOrigin(0.5);
      layer.add([title, prompt, arrow]);

      spots.forEach((spot) => {
        const isDone = this.completedNodeIds.has(spot.id);
        const isActive = spot.id === nodeId;
        // 互動點:只用白色小亮點(低調)。命中區透明,本身不顯眼。
        const dotA = isActive ? 0.95 : isDone ? 0.5 : 0.32;
        const glowA = isActive ? 0.28 : isDone ? 0.14 : 0.08;
        const glow = this.add.circle(spot.x, spot.y, 13, 0xffffff, glowA).setBlendMode(Phaser.BlendModes.ADD);
        const dot = this.add.circle(spot.x, spot.y, 5, 0xffffff, dotA);
        const zone = this.add
          .rectangle(spot.x, spot.y, 92, 72, 0xffffff, 0)
          .setInteractive({ useHandCursor: isActive });
        layer.add([glow, dot, zone]);

        const pulse = isActive
          ? this.tweens.add({
              targets: [glow, dot],
              alpha: { from: 0.5, to: 1 },
              scale: { from: 0.92, to: 1.18 },
              duration: 880,
              yoyo: true,
              repeat: -1,
              ease: "Sine.easeInOut",
            })
          : null;

        zone.on("pointerover", () => {
          sfx.hover();
          if (!isActive) dot.setAlpha(1);
          glow.setAlpha(Math.min(0.42, glowA + 0.16));
          prompt.setText(`${loc(spot.label)}\n${loc(spot.task)}${isActive ? tt("  ▶ 互動", "  ▶ interact") : isDone ? tt(" · 已完成", " · complete") : tt(" · 尚未解鎖", " · locked")}`);
        });
        zone.on("pointerout", () => {
          if (!isActive) dot.setAlpha(dotA);
          glow.setAlpha(glowA);
          prompt.setText(tt("滑鼠移到設備上查看任務", "Hover a device to inspect the task"));
        });
        zone.on("pointerdown", () => {
          if (!isActive) {
            // 非當前設備:可點,但只給風味反饋(輕脈動 + 浮動描述),不推進、不計分。
            sfx.hover();
            this.tweens.add({ targets: [glow, dot], scale: 1.25, duration: 140, yoyo: true, ease: "Sine.easeOut" });
            this.popCaption(spot.x, spot.y - 40, `${isDone ? "✓ " : ""}${loc(spot.flavor)}`);
            return;
          }
          sfx.repair();
          pulse?.stop();
          zone.disableInteractive();
          this.tweens.add({
            targets: [glow, dot],
            scale: 1.6,
            alpha: 1,
            duration: 200,
            ease: "Cubic.easeOut",
            yoyo: true,
            onComplete: () => {
              layer.destroy(true);
              resolve(active);
            },
          });
        });
      });
    });
  }

  private taskSpots(bayKey: string): TaskSpot[] {
    const defaults = [
      { x: 255, y: 330 },
      { x: 480, y: 300 },
      { x: 705, y: 330 },
    ];
    const byBay: Record<string, Omit<TaskSpot, "x" | "y">[]> = {
      powerbay: [
        { id: "R-1", label: { zh: "冷卻管", en: "Coolant Line" }, task: { zh: "封住洩漏,穩定艙壓", en: "Seal the leak and stabilize pressure" }, flavor: { zh: "管壁還在滲冷凝水,摸上去冰得刺骨。", en: "Coolant still beads on the pipe — cold enough to bite." } },
        { id: "R-2", label: { zh: "推進器零件", en: "Thruster Parts" }, task: { zh: "依圖紙重組備用推進器", en: "Reassemble backup thruster parts" }, flavor: { zh: "零件編號被磨掉了大半,得靠手感認。", en: "Half the part numbers are worn off — you'd go by feel." } },
        { id: "R-3", label: { zh: "鑽臂超控", en: "Drill Override" }, task: { zh: "解除卡死的採礦鑽臂", en: "Release the jammed mining arm" }, flavor: { zh: "鑽頭卡著一塊礦渣,低低地嗡著。", en: "A chunk of slag jams the drill head, buzzing low." } },
      ],
      datalab: [
        { id: "I-1", label: { zh: "樣本定序", en: "Sample Sequencer" }, task: { zh: "比對外星有機樣本", en: "Analyze the alien organic sample" }, flavor: { zh: "序列在螢幕上滾動,快得讓人頭暈。", en: "Sequences scroll past fast enough to make you dizzy." } },
        { id: "I-2", label: { zh: "植栽掃描", en: "Crop Scanner" }, task: { zh: "找出病斑源頭", en: "Trace the crop infection source" }, flavor: { zh: "葉片邊緣有一圈不該出現的螢光。", en: "A ring of fluorescence edges the leaves — it shouldn't be there." } },
        { id: "I-3", label: { zh: "孢子隔離", en: "Spore Containment" }, task: { zh: "按順序完成隔離程序", en: "Complete containment in order" }, flavor: { zh: "隔離艙的負壓在低鳴。", en: "The containment chamber hums under negative pressure." } },
      ],
      muralhall: [
        { id: "A-1", label: { zh: "點唱機", en: "Jukebox" }, task: { zh: "重建交誼廳的聲音記憶", en: "Restore the lounge's sound memory" }, flavor: { zh: "你按了一下,它哼出半句舊歌就卡住了。", en: "You tap it; it hums half an old tune, then sticks." } },
        { id: "A-2", label: { zh: "座位燈光", en: "Seating Lights" }, task: { zh: "調整讓人願意停留的氣氛", en: "Tune the room so people want to stay" }, flavor: { zh: "燈光忽明忽暗,像在猶豫。", en: "The lights waver, as if hesitating." } },
        { id: "A-3", label: { zh: "紀念杯架", en: "Memory Cups" }, task: { zh: "整理失聯艦員留下的杯子", en: "Arrange cups left by missing crew" }, flavor: { zh: "每只杯底,都有人刻了一個名字。", en: "Someone carved a name into the base of each cup." } },
      ],
      medbay: [
        { id: "S-1", label: { zh: "通訊椅", en: "Comm Chair" }, task: { zh: "陪伴等待延遲訊息的人", en: "Support someone waiting on delayed comms" }, flavor: { zh: "椅墊還留著上一個人的形狀。", en: "The seat still holds the shape of whoever sat here last." } },
        { id: "S-2", label: { zh: "訓練投影", en: "Training Holo" }, task: { zh: "安排緊急逃生訓練", en: "Run emergency egress training" }, flavor: { zh: "投影一遍遍循環播著逃生路線。", en: "The holo loops an egress route, over and over." } },
        { id: "S-3", label: { zh: "照護站", en: "Care Station" }, task: { zh: "協助戒斷中的艦員", en: "Support a crew member in withdrawal" }, flavor: { zh: "監測儀規律地嗶著,意外地讓人安心。", en: "The monitor beeps steadily — strangely reassuring." } },
      ],
      command: [
        { id: "E-1", label: { zh: "航線桌", en: "Nav Table" }, task: { zh: "校準風險航線", en: "Calibrate the risk route" }, flavor: { zh: "桌面標滿了被劃掉又重畫的航線。", en: "The table is crossed out and redrawn a dozen times over." } },
        { id: "E-2", label: { zh: "廣播台", en: "Broadcast Console" }, task: { zh: "安排艦內指令與分工", en: "Coordinate orders and assignments" }, flavor: { zh: "麥克風的開關還亮著紅燈。", en: "The mic switch still glows red." } },
        { id: "E-3", label: { zh: "決策面板", en: "Decision Panel" }, task: { zh: "處理危機選擇", en: "Resolve a crisis decision" }, flavor: { zh: "面板上兩個選項都閃著黃光。", en: "Two options blink amber on the panel." } },
      ],
      workshop: [
        { id: "C-1", label: { zh: "資料櫃", en: "Archive Cabinet" }, task: { zh: "分類失序檔案", en: "Sort scrambled records" }, flavor: { zh: "抽屜標籤貼得一絲不苟,卻有一格是空的。", en: "The drawer labels are meticulous — but one slot sits empty." } },
        { id: "C-2", label: { zh: "表單終端", en: "Form Terminal" }, task: { zh: "修復缺漏欄位", en: "Repair missing form fields" }, flavor: { zh: "游標停在一個沒填完的欄位上。", en: "The cursor waits on a half-filled field." } },
        { id: "C-3", label: { zh: "審核列印機", en: "Audit Printer" }, task: { zh: "核對最後清單", en: "Verify the final checklist" }, flavor: { zh: "出紙口卡著一張只蓋了一半的章。", en: "A half-stamped sheet is caught in the tray." } },
      ],
    };
    return (byBay[bayKey] ?? []).map((spot, index) => ({ ...spot, ...defaults[index] }));
  }
}
