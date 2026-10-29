// Fun Shed kit v1.4
// HIGH SCORES: this phone's ten best games, by the most coins held. One big BACK button.
import * as store from "../storage.js";
import { listenForTaps, near } from "../taps.js";
import { W, backdrop, button, coins, marquee, setupCamera, text } from "../ui.js";

const BACK = { x: W / 2 - 170, y: 846, w: 340, h: 92 };
const DAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export class BoardScene extends Phaser.Scene {
  constructor() {
    super("Board");
  }

  create() {
    setupCamera(this);
    backdrop(this);
    marquee(this, W / 2, 120, 440, 140);
    text(this, W / 2, 106, "HIGH SCORES", 52, { color: "#ffe066", strokeThickness: 9 });
    text(this, W / 2, 152, "ON THIS PHONE", 20, { color: "#fff3c4", strokeThickness: 4 });

    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.45).fillRoundedRect(36, 220, W - 72, 600, 20);
    const board = store.board();
    if (!board.length) {
      text(this, W / 2, 470, "No games yet.\nGo win some coins!", 34, { strokeThickness: 6 });
    }
    board.forEach((row, i) => {
      const y = 254 + i * 56;
      const colour = i === 0 ? "#ffe066" : "#ffffff";
      text(this, 70, y, `${i + 1}.`, 30, { originX: 0, color: colour, strokeThickness: 5 });
      text(this, 128, y, DAY.format(row.at), 28, { originX: 0, color: "#fff3c4", strokeThickness: 5 });
      text(this, W - 104, y, coins(row.score), 34, { originX: 1, color: colour, strokeThickness: 6 });
      this.add.image(W - 76, y, "coin").setScale(0.5);
    });

    button(this, BACK, 0x7d5a3c, "BACK", 44);
    listenForTaps(this, (x, y) => near(x, y, BACK, 30) && this.scene.start("Title"), { lockMs: 500 });
  }
}
