import Phaser from "phaser";
import { tt } from "../game/lang";
import { loadDisplayFont } from "../ui/fonts";
import { makeFxTexture } from "../ui/fx";


export class BootScene extends Phaser.Scene {
    constructor() {
        super("boot");
    }

    preload() {
        const bar = this.add.rectangle(480, 280, 4, 8, 0x00f5ff).setOrigin(0, 0.5);
        this.add.text(480, 250, tt("MERIDIAN OS 載入中…", "MERIDIAN OS loading…"), {
            fontFamily: "monospace",
            fontSize: "14px",
            color: "#5e7a8a",
        }).setOrigin(0.5);
        this.load.on("progress", (p: number) => bar.setSize(Math.max(4, 320 * p), 8));
        bar.setX(480 - 160);

        this.load.image("title", "assets/backgrounds/title.png");
        this.load.image("ship_map", "assets/backgrounds/ship_map.png");
        this.load.image("powerbay", "assets/backgrounds/powerbay.png");
        this.load.image("workshop", "assets/backgrounds/workshop.png");
        this.load.image("greenhouse", "assets/backgrounds/greenhouse.png");
        this.load.image("command", "assets/backgrounds/command.png");
        this.load.image("lounge", "assets/backgrounds/lounge.png");
        this.load.image("datalab", "assets/backgrounds/datalab.png");
        this.load.image("medbay", "assets/backgrounds/medbay_white.png");
        this.load.image("muralhall", "assets/backgrounds/muralhall.png");
        this.load.image("eq_plasma_wrench", "assets/equipment/eq_plasma_wrench.png");
        this.load.image("eq_spectrum_scanner", "assets/equipment/eq_spectrum_scanner.png");
        this.load.image("eq_holo_canvas", "assets/equipment/eq_holo_canvas.png");
        this.load.image("eq_bio_resonator", "assets/equipment/eq_bio_resonator.png");
        this.load.image("eq_resource_terminal", "assets/equipment/eq_resource_terminal.png");
        this.load.image("eq_protocol_library", "assets/equipment/eq_protocol_library.png");
        this.load.image("icon_med", "assets/puzzles/icon_med.png");
        this.load.image("icon_fuel", "assets/puzzles/icon_fuel.png");
        this.load.image("icon_food", "assets/puzzles/icon_food.png");
        this.load.image("icon_part", "assets/puzzles/icon_part.png");
        this.load.image("socket", "assets/puzzles/pipe_socket.png");
        this.load.image("pipe_straight", "assets/puzzles/pipe_straight.png");
        this.load.image("pipe_elbow", "assets/puzzles/pipe_elbow.png");
        this.load.image("pipe_valve", "assets/puzzles/pipe_valve.png");
        this.load.image("pipe_mainline", "assets/puzzles/pipe_mainline.png");
        this.load.image("doc_logbook", "assets/puzzles/doc_logbook.png");
        this.load.image("doc_lander_blueprint", "assets/puzzles/doc_lander_blueprint.png");
        this.load.image("doc_resource_report", "assets/puzzles/doc_resource_report.png");
        this.load.image("doc_crisis_log", "assets/puzzles/doc_crisis_log.png");
        this.load.image("sort_items_sheet", "assets/puzzles/generated/sort_items_sheet.png");
        this.load.image("pipe_repair_sheet", "assets/puzzles/generated/pipe_repair_sheet.png");
        this.load.image("memory_panels_sheet", "assets/puzzles/generated/memory_panels_sheet.png");
        this.load.image("ui_controls_sheet", "assets/puzzles/generated/ui_controls_sheet.png");
        this.load.image("greenhouse_task_sheet", "assets/puzzles/generated/greenhouse_task_sheet.png");
        this.load.image("medbay_lab_sheet", "assets/puzzles/generated/medbay_lab_sheet.png");
        this.load.image("medbay_task_sheet", "assets/puzzles/generated/medbay_task_sheet.png");
        this.load.audio("bgm_title_drift", "audio/bgm_title_drift.mp3");
        this.load.audio("bgm_ship_hub", "audio/bgm_ship_hub.mp3");
        this.load.audio("bgm_memory_dialogue", "audio/bgm_memory_dialogue.mp3");
        this.load.audio("bgm_certification_focus", "audio/bgm_certification_focus.mp3");
        this.load.audio("bgm_alarm_pressure", "audio/bgm_alarm_pressure.mp3");
        this.load.audio("bgm_final_release", "audio/bgm_final_release.mp3");
        this.load.audio("bgm_lunar_tide_alt", "audio/bgm_lunar_tide_alt.mp3");
    }

    create() {
        // 程序生成柔邊光點貼圖,給 fx 粒子與環境塵埃共用(無需新美術)。
        makeFxTexture(this);
        // 等顯示字體就緒再開場(避免 canvas 文字用回退字定型);最多等 2s,逾時照常開場。
        void loadDisplayFont().then(() => this.scene.start("title"));
    }
}
