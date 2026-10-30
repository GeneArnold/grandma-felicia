// A scratch-off ticket, won on the slots. There are four kinds (rules.js scratchTicket), each with its
// own look and rule, but they all play the same: tap each silver spot to uncover it. When every spot
// is uncovered, the winning spots light up and one big button goes back to the slots.
import * as audio from "../audio.js";
import * as store from "../storage.js";
import { BIG_WIN } from "../rules.js";
import { shareWin, snapshot } from "../share.js";
import { listenForTaps, near } from "../taps.js";
import { W, backdrop, button, coinShower, coins, setupCamera, snow, text } from "../ui.js";

const SHARE = { x: 50, y: 808, w: 440, h: 68 };
const BACK_LOW = { x: 50, y: 886, w: 440, h: 66 };  // under SHARE
const BACK_BIG = { x: 50, y: 818, w: 440, h: 120 }; // on its own

const grid = (xs, ys, w, h) => ys.flatMap((y) => xs.map((x) => ({ x: x - w / 2, y: y - h / 2, w, h })));
const SIX = grid([160, 380], [352, 498, 644], 200, 132);

// Each kind of ticket: its name, colour, rule (and where it goes), and where its spots are.
const LOOKS = {
  match3: { name: "LUCKY CHRISTMAS", colour: 0xe63946, rule: () => "MATCH 3 TO WIN!", ruleAt: { x: W / 2, y: 268, size: 32 }, spots: SIX },
  gifts: {
    name: "GIFT FINDER", colour: 0x1f7a2c, rule: () => "🎁 WINS THE PRIZE!\n⭐ DOUBLES IT · 🎅 WINS IT ALL",
    ruleAt: { x: W / 2, y: 266, size: 24 }, spots: grid([160, 380], [374, 508, 642], 200, 120),
  },
  lucky: {
    name: "LUCKY NUMBER", colour: 0x2a6f9d, rule: () => "MATCH THE LUCKY NUMBER!", ruleAt: { x: 395, y: 300, size: 28, wrap: 190 },
    spots: [{ x: 50, y: 248, w: 220, h: 104 }, ...grid([130, 270, 410], [520, 650], 128, 112)],
  },
  tictac: {
    name: "TIC-TAC-SNOW", colour: 0x6a4c93, rule: (t) => `3 IN A ROW WINS ${coins(t.shows)}!`,
    ruleAt: { x: W / 2, y: 268, size: 32 }, spots: grid([150, 270, 390], [374, 500, 626], 116, 116),
  },
};

// The ticket pictures, drawn with the slot machines' art.
const ICONS = {
  gift: "jingle-gift", star: "jingle-star", tree: "jingle-tree", bell: "jingle-bell", snowman: "jingle-snowman",
  stocking: "jingle-stocking", santa: "shop-santa", flake: "snow-flake",
};

export class ScratchScene extends Phaser.Scene {
  constructor() {
    super("Scratch");
  }

  create() {
    setupCamera(this);
    this.run = store.get("game");
    this.ticket = this.run?.ticket;
    if (!this.ticket) {
      this.scene.start(this.run ? "Play" : "Title");
      return;
    }
    this.look = LOOKS[this.ticket.type] ?? LOOKS.match3;
    this.open = this.look.spots.map(() => false);
    this.buttons = null;

    backdrop(this);
    snow(this, 25);
    this.drawTicket();

    this.prompt = text(this, W / 2, 864, "TAP A SILVER SPOT!", 40, { color: "#ffe066", strokeThickness: 8 });
    this.tweens.add({ targets: this.prompt, scale: 1.08, duration: 500, yoyo: true, repeat: -1 });

    listenForTaps(this, (x, y) => {
      if (this.buttons) return this.buttons(x, y);
      const i = this.look.spots.findIndex((r) => near(x, y, r, 8));
      if (i >= 0 && !this.open[i]) this.uncover(i);
    }, { lockMs: 500, gapMs: 250 });
  }

  drawTicket() {
    const { name, colour, rule, ruleAt } = this.look;
    const g = this.add.graphics();
    g.fillStyle(0x2a0a14).fillRoundedRect(22, 92, W - 44, 702, 30);
    g.fillStyle(0xd4a017).fillRoundedRect(28, 98, W - 56, 690, 26);
    g.fillStyle(0xfff6dc).fillRoundedRect(40, 110, W - 80, 666, 18);
    g.fillStyle(colour).fillRoundedRect(40, 110, W - 80, 118, { tl: 18, tr: 18, bl: 0, br: 0 });
    text(this, W / 2, 134, "CHRISTMAS SCRATCH-OFF", 22, { color: "#fff3c4", strokeThickness: 4 });
    const title = text(this, W / 2, 184, name, 52, { color: "#ffe066", strokeThickness: 9 });
    if (title.width > W - 110) title.setScale((W - 110) / title.width);
    text(this, ruleAt.x, ruleAt.y, rule(this.ticket), ruleAt.size, { color: "#2a0a14", stroke: "#ffffff", strokeThickness: 3, wrap: ruleAt.wrap ?? 440 });
    if (this.ticket.type === "lucky") text(this, W / 2, 440, "YOUR NUMBERS", 28, { color: "#2a6f9d", stroke: "#ffffff", strokeThickness: 3 });

    this.faces = [];
    this.covers = [];
    this.look.spots.forEach((r, i) => {
      const under = this.add.graphics();
      under.fillStyle(0xffffff).fillRoundedRect(r.x, r.y, r.w, r.h, 16);
      under.lineStyle(3, 0xd4a017).strokeRoundedRect(r.x, r.y, r.w, r.h, 16);
      this.faces.push(this.drawSpot(this.ticket.spots[i], r));
      this.covers.push(this.drawCover(r, this.ticket.type === "lucky" && i === 0 ? "LUCKY NUMBER" : "TAP"));
    });
  }

  // What's under spot r, by kind of ticket. → a container, so it can bounce as one.
  drawSpot(spot, r) {
    const box = this.add.container(r.x + r.w / 2, r.y + r.h / 2);
    const picture = (key, x, size) => {
      const img = this.add.image(x, 0, key);
      return img.setScale(size / Math.max(img.width, img.height));
    };
    const amount = (n, x, y, size) => text(this, x, y, coins(n), size, { color: "#a3122a", stroke: "#ffffff", strokeThickness: 4 });
    switch (this.ticket.type) {
      case "gifts":
        box.add([picture(ICONS[spot.icon], -54, 84), amount(spot.amount, 40, 0, 46)]);
        break;
      case "lucky":
        if (spot.lucky) box.add(text(this, 0, 0, String(spot.number), 72, { color: "#e63946", stroke: "#2a0a14", strokeThickness: 6 }));
        else box.add([text(this, 0, -14, String(spot.number), 50, { color: "#2a6f9d", stroke: "#ffffff", strokeThickness: 4 }), amount(spot.amount, 0, 34, 24)]);
        break;
      case "tictac":
        box.add(picture(ICONS[spot], 0, 92));
        break;
      default: // match 3
        box.add([picture("coin", -58, 46), amount(spot, 16, 0, 54)]);
    }
    return box;
  }

  drawCover(r, words) {
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const small = r.h < 120;
    const silver = this.add.graphics();
    silver.fillStyle(0x6f7680).fillRoundedRect(r.x, r.y, r.w, r.h, 16);
    silver.fillStyle(0xb9c0c8).fillRoundedRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8, 13);
    silver.fillStyle(0xd7dce2);
    for (let x = r.x + 16; x < r.x + r.w - 20; x += 30) silver.fillRect(x, r.y + 10, 10, r.h - 20);
    return this.add.container(0, 0, [
      silver,
      this.add.text(cx, cy - (small ? 14 : 18), "❄️", { fontSize: small ? "34px" : "40px", resolution: 2, padding: { y: 6 } }).setOrigin(0.5),
      text(this, cx, cy + (small ? 28 : 36), words, words.length > 4 ? 20 : 28, { color: "#ffffff", strokeThickness: 5 }),
    ]);
  }

  uncover(i) {
    this.open[i] = true;
    audio.play("scratch");
    const r = this.look.spots[i];
    for (let k = 0; k < 12; k++) {
      const flake = this.add.rectangle(r.x + Math.random() * r.w, r.y + Math.random() * r.h, 10, 10, 0xb9c0c8).setDepth(50);
      this.tweens.add({ targets: flake, y: flake.y + 120 + Math.random() * 80, x: flake.x + (Math.random() - 0.5) * 80, angle: 200, alpha: 0, duration: 650, onComplete: () => flake.destroy() });
    }
    this.tweens.add({ targets: this.covers[i], alpha: 0, duration: 220, onComplete: () => this.covers[i].destroy() });
    this.tweens.add({ targets: this.faces[i], scale: { from: 0.6, to: 1 }, duration: 300, ease: "Back.easeOut" });
    if (this.open.every(Boolean)) this.time.delayedCall(500, () => this.finish());
  }

  finish() {
    const run = this.run;
    const { prize, winners } = this.ticket;
    run.ticket = null;
    if (prize) store.addWin(run, prize);
    else store.save();
    this.prompt.destroy();

    if (!prize) {
      text(this, W / 2, 748, "NO WIN THIS TIME", 34, { color: "#7d5a3c", stroke: "#ffffff", strokeThickness: 5 });
      audio.play("sadTrombone");
      this.showBack(BACK_BIG);
      return;
    }
    // light up the spots that win
    const g = this.add.graphics();
    g.lineStyle(8, 0x2a9d3a);
    for (const i of winners ?? []) {
      const r = this.look.spots[i];
      g.strokeRoundedRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4, 18);
      this.tweens.add({ targets: this.faces[i], scale: 1.15, duration: 300, yoyo: true, repeat: 3 });
    }
    const won = text(this, W / 2, 748, `YOU WIN ${coins(prize)} COINS!`, 42, { color: "#2a9d3a", stroke: "#ffffff", strokeThickness: 7 });
    this.tweens.add({ targets: won, scale: 1.08, duration: 400, yoyo: true, repeat: -1 });
    audio.play(prize >= BIG_WIN ? "bigWin" : "win");
    audio.say(prize >= BIG_WIN ? "bigWin" : "win", 0.2);
    coinShower(this, W / 2, 748, W / 2, 40, Math.ceil(prize / 10));

    if (prize < BIG_WIN) return this.showBack(BACK_BIG);
    // A big win: a picture of the ticket to share, then the buttons.
    this.time.delayedCall(700, () => {
      snapshot(this.game).then((png) => (this.picture = png));
      const share = button(this, SHARE, 0xe63946, "📣 SHARE MY WIN", 36);
      this.showBack(BACK_LOW, (x, y) => {
        if (!near(x, y, SHARE, 10)) return false;
        audio.play("pop");
        shareWin(`I won ${coins(prize)} coins on a scratch-off at Grandma Felicia's Christmas Casino! 🎟️🎄`, this.picture || null)
          .then((outcome) => outcome !== "cancelled" && share.label.setText("📣 SHARED! AGAIN?"));
        return true;
      });
    });
  }

  showBack(r, other) {
    const back = button(this, r, 0x2a9d3a, "▶ BACK TO THE SLOTS", r.h > 100 ? 36 : 32);
    this.tweens.add({ targets: back.label, scale: 1.06, duration: 550, yoyo: true, repeat: -1 });
    this.buttons = (x, y) => {
      if (other?.(x, y)) return;
      if (near(x, y, r, other ? 10 : 24)) this.scene.start("Play");
    };
  }
}
