// The Christmas album: a card for every three in a row on every machine, collected on this phone
// and kept for good. A row for each machine; a card not won yet is a "?". One big BACK button.
import * as store from "../storage.js";
import { MACHINES, art } from "../machines.js";
import { SYMBOLS } from "../rules.js";
import { listenForTaps, near } from "../taps.js";
import { W, backdrop, button, marquee, setupCamera, text } from "../ui.js";

const BACK = { x: W / 2 - 170, y: 856, w: 340, h: 86 };
const CARD = { w: 78, h: 104 };
const KINDS = [0, 1, 2, 3, 4, 5];

export class AlbumScene extends Phaser.Scene {
  constructor() {
    super("Album");
  }

  create() {
    setupCamera(this);
    backdrop(this);
    marquee(this, W / 2, 96, 460, 132);
    text(this, W / 2, 80, "CHRISTMAS ALBUM", 44, { color: "#ffe066", strokeThickness: 8 });
    const total = MACHINES.length * KINDS.length;
    text(this, W / 2, 124, `${store.albumCount()} OF ${total} CARDS`, 24, { color: "#fff3c4", strokeThickness: 5 });

    const album = store.get("album");
    const unlocked = store.get("unlocked");
    MACHINES.forEach((m, row) => {
      const top = 186 + row * 164;
      const open = unlocked.includes(m.id);
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.45).fillRoundedRect(14, top, W - 28, 154, 18);
      text(this, W / 2, top + 22, open ? m.name : `🔒 ${m.name}`, 24, { color: open ? m.title : "#b9c0c8", strokeThickness: 5 });
      KINDS.forEach((kind, i) => {
        const x = 24 + i * 84 + 3;
        const y = top + 42;
        const got = (album[m.id] ?? []).includes(kind);
        g.fillStyle(0x2a0a14).fillRoundedRect(x - 2, y - 2, CARD.w + 4, CARD.h + 4, 10);
        if (got) {
          g.fillStyle(m.rim).fillRoundedRect(x, y, CARD.w, CARD.h, 8);
          g.fillStyle(0xfffbea).fillRoundedRect(x + 4, y + 4, CARD.w - 8, CARD.h - 8, 6);
          const img = this.add.image(x + CARD.w / 2, y + 40, art(m, kind));
          img.setScale(60 / Math.max(img.width, img.height));
          text(this, x + CARD.w / 2, y + CARD.h - 16, String(SYMBOLS[kind].pay), 20, { color: "#a3122a", stroke: "#ffffff", strokeThickness: 3 });
        } else {
          g.fillStyle(0x4a3a44).fillRoundedRect(x, y, CARD.w, CARD.h, 8);
          text(this, x + CARD.w / 2, y + CARD.h / 2, "?", 44, { color: "#8a7a84", strokeThickness: 0 });
        }
      });
    });

    button(this, BACK, 0x7d5a3c, "BACK", 44);
    listenForTaps(this, (x, y) => near(x, y, BACK, 30) && this.scene.start("Floor"), { lockMs: 500 });
  }
}
