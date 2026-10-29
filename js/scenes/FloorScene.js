// The casino floor: every slot machine as a big card. Tap an open one to sit down at it. A locked
// one says how many coins open it (a goal reached in any game on this phone opens it for good).
import * as audio from "../audio.js";
import * as store from "../storage.js";
import { MACHINES, art } from "../machines.js";
import { listenForTaps, near } from "../taps.js";
import { W, backdrop, button, coins, marquee, setupCamera, snow, text } from "../ui.js";

const CARDS = [210, 520].flatMap((y) => [24, 276].map((x) => ({ x, y, w: 240, h: 290 })));
const MENU = { x: W / 2 - 110, y: 850, w: 220, h: 80 };

export class FloorScene extends Phaser.Scene {
  constructor() {
    super("Floor");
  }

  create() {
    setupCamera(this);
    this.run = store.get("game") ?? store.newGame();
    backdrop(this);
    snow(this, 20);

    marquee(this, W / 2, 112, W - 40, 150);
    text(this, W / 2, 86, "PICK A MACHINE!", 46, { color: "#ffe066", strokeThickness: 8 });
    this.add.image(W / 2 - 110, 140, "coin").setScale(0.55);
    text(this, W / 2 - 86, 141, `${coins(this.run.coins)} COINS`, 30, { originX: 0, color: "#ffffff", strokeThickness: 6 });

    const unlocked = store.get("unlocked");
    MACHINES.forEach((m, i) => this.drawCard(m, CARDS[i], unlocked.includes(m.id)));
    this.hint = text(this, W / 2, 822, "", 24, { color: "#fff3c4", strokeThickness: 5 });

    button(this, MENU, 0x7d5a3c, "MENU", 34);
    listenForTaps(this, (x, y) => {
      if (near(x, y, MENU, 16)) return this.scene.start("Title");
      const i = CARDS.findIndex((r) => near(x, y, r, 6));
      if (i < 0) return;
      const m = MACHINES[i];
      if (store.get("unlocked").includes(m.id)) {
        audio.play("lever");
        this.scene.start("Play", { machine: m.id });
      } else {
        audio.play("miss");
        this.hint.setText(`WIN UP TO ${coins(m.unlockAt)} COINS TO OPEN ${m.name}!`).setScale(0.8);
        this.tweens.add({ targets: this.hint, scale: 1, duration: 250, ease: "Back.easeOut" });
      }
    }, { lockMs: 500 });
  }

  drawCard(m, r, open) {
    const g = this.add.graphics();
    g.fillStyle(0x2a0a14).fillRoundedRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8, 24);
    g.fillStyle(m.rim).fillRoundedRect(r.x, r.y, r.w, r.h, 20);
    g.fillStyle(m.cabinet).fillRoundedRect(r.x + 8, r.y + 8, r.w - 16, r.h - 16, 16);
    const cx = r.x + r.w / 2;
    const name = text(this, cx, r.y + 56, m.name.replace(" ", "\n"), 30, { color: m.title, strokeThickness: 7 });
    if (name.width > r.w - 24) name.setScale((r.w - 24) / name.width);
    g.fillStyle(0xfffbea).fillRoundedRect(r.x + 18, r.y + 112, r.w - 36, 86, 12);
    for (const dx of [-66, 0, 66]) {
      const img = this.add.image(cx + dx, r.y + 155, art(m, 0));
      img.setScale(62 / Math.max(img.width, img.height));
    }
    if (open) {
      const play = text(this, cx, r.y + 244, "▶ PLAY", 40, { color: "#7CFC9A", strokeThickness: 8 });
      if (m.id === this.run.machine) this.tweens.add({ targets: play, scale: 1.1, duration: 500, yoyo: true, repeat: -1 });
      return;
    }
    // locked: dimmed, with a padlock and the goal
    g.fillStyle(0x000000, 0.6).fillRoundedRect(r.x, r.y, r.w, r.h, 20);
    this.add.text(cx, r.y + 150, "🔒", { fontSize: "64px", resolution: 2, padding: { y: 8 } }).setOrigin(0.5);
    text(this, cx, r.y + 236, `OPENS AT\n${coins(m.unlockAt)} COINS`, 26, { color: "#ffe066", strokeThickness: 6 });
  }
}
