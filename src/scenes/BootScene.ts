import Phaser from "phaser";
import { tt } from "../game/lang";

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

    this.load.image("title", "assets/title.png");
    this.load.image("powerbay", "assets/powerbay.png");
    this.load.image("workshop", "assets/workshop.png");
    this.load.image("greenhouse", "assets/greenhouse.png");
    this.load.image("command", "assets/command.png");
    this.load.image("lounge", "assets/lounge.png");
    this.load.image("datalab", "assets/datalab.png");
    this.load.image("medbay", "assets/medbay.png");
    this.load.image("muralhall", "assets/muralhall.png");
    this.load.image("eq_plasma_wrench", "assets/eq_plasma_wrench.png");
    this.load.image("eq_spectrum_scanner", "assets/eq_spectrum_scanner.png");
    this.load.image("eq_holo_canvas", "assets/eq_holo_canvas.png");
    this.load.image("eq_bio_resonator", "assets/eq_bio_resonator.png");
    this.load.image("eq_resource_terminal", "assets/eq_resource_terminal.png");
    this.load.image("eq_protocol_library", "assets/eq_protocol_library.png");
    this.load.image("icon_med", "assets/icon_med.png");
    this.load.image("icon_fuel", "assets/icon_fuel.png");
    this.load.image("icon_food", "assets/icon_food.png");
    this.load.image("icon_part", "assets/icon_part.png");
    this.load.image("socket", "assets/pipe_socket.png");
    this.load.image("pipe_straight", "assets/pipe_straight.png");
    this.load.image("pipe_elbow", "assets/pipe_elbow.png");
    this.load.image("pipe_valve", "assets/pipe_valve.png");
    this.load.image("pipe_mainline", "assets/pipe_mainline.png");
    this.load.image("doc_logbook", "assets/doc_logbook.png");
    this.load.image("doc_lander_blueprint", "assets/doc_lander_blueprint.png");
    this.load.image("doc_resource_report", "assets/doc_resource_report.png");
    this.load.image("doc_crisis_log", "assets/doc_crisis_log.png");
  }

  create() {
    this.scene.start("title");
  }
}
