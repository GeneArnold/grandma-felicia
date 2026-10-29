// Fun Shed kit v1.4
// After a game: the coins taken home (cashed out: the score, and where it lands on this phone's
// board), or the most coins held (ran out), and how the night went. Scores stay on this phone. Big buttons: NEW GAME, SHARE, HIGH SCORES, MENU.
import * as audio from "../audio.js";
import * as store from "../storage.js";
import { machine } from "../machines.js";
import { shareWin, snapshot } from "../share.js";
import { listenForTaps, near } from "../taps.js";
import { W, backdrop, button, coins, marquee, setupCamera, snow, text } from "../ui.js";

const AGAIN = { x: W / 2 - 180, y: 626, w: 360, h: 92 };
const SHARE = { x: W / 2 - 180, y: 740, w: 360, h: 72 };
const BOARD = { x: W / 2 - 180, y: 836, w: 172, h: 64 };
const MENU = { x: W / 2 + 8, y: 836, w: 172, h: 64 };

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super("Results");
  }

  create({ run, cashedOut = false, rank = 0, previousTop = 0 }) {
    setupCamera(this);
    backdrop(this);
    snow(this, 25);
    this.run = run;
    this.cashedOut = cashedOut;
    this.score = cashedOut ? run.coins : run.best;

    marquee(this, W / 2, 200, 470, 300);
    text(this, W / 2, 92, cashedOut ? "YOU CASHED OUT!" : "OUT OF COINS!", 48, { color: "#ffe066" });
    text(this, W / 2, 140, cashedOut ? "you took home" : "the most coins you had", 24, { color: "#fff3c4", strokeThickness: 5 });
    const scoreText = text(this, W / 2, 214, "0", 90, { color: "#ffffff", strokeThickness: 10 });
    const countUp = Math.min(1400, 300 + this.score / 2);
    this.tweens.addCounter({
      from: 0, to: this.score, duration: countUp, ease: "Cubic.easeOut",
      onUpdate: (t) => scoreText.setText(coins(t.getValue())),
    });

    let headline = `YOUR BEST ${coins(previousTop)}`;
    let colour = "#ffe066";
    let size = 32;
    if (!cashedOut) {
      headline = "NEXT TIME, CASH OUT\nWHILE YOU'RE AHEAD!";
      colour = "#fff3c4";
      size = 26;
    } else if (this.score > previousTop) {
      headline = "NEW HIGH SCORE!";
      colour = "#7CFC9A";
    } else if (rank) {
      headline = `#${rank} ON THIS PHONE`;
    }
    const head = text(this, W / 2, 298, headline, size, { color: colour, strokeThickness: 6 });
    if (colour === "#7CFC9A") this.tweens.add({ targets: head, scale: 1.1, duration: 450, yoyo: true, repeat: -1 });
    audio.play(colour === "#7CFC9A" ? "bigWin" : "win");

    const box = this.add.graphics();
    box.fillStyle(0x000000, 0.45).fillRoundedRect(50, 380, W - 100, 222, 20);
    const rows = [
      ["🎰", "Pulls", run.pulls],
      ["🏆", "Biggest win", run.biggest],
      ["🎟️", "Scratch-offs", run.tickets],
      ["🎅", "Santa's visits", run.santas],
    ];
    rows.forEach(([icon, label, n], i) => {
      const y = 412 + i * 52;
      this.add.text(76, y, icon, { fontSize: "32px", resolution: 2 }).setOrigin(0, 0.5);
      text(this, 126, y, label, 28, { originX: 0, strokeThickness: 5 });
      text(this, W - 76, y, coins(n), 32, { originX: 1, color: "#ffe066", strokeThickness: 5 });
    });

    const buttons = [
      [AGAIN, 0x2a9d3a, "▶ NEW GAME", 44],
      [SHARE, 0xe63946, "📣 SHARE", 34],
      [BOARD, 0x2a6f9d, "HIGH SCORES", 22],
      [MENU, 0x7d5a3c, "MENU", 28],
    ];
    const shown = buttons.map(([r, c, words, size]) => button(this, r, c, words, size));
    this.shareText = shown[1].label;
    this.tweens.add({ targets: shown[0].label, scale: 1.07, duration: 550, yoyo: true, repeat: -1 });

    // The share picture is this screen, taken once the score has finished counting up.
    this.time.delayedCall(countUp + 150, () => snapshot(this.game).then((png) => (this.picture = png)));

    listenForTaps(this, (x, y) => {
      if (near(x, y, AGAIN, 16)) this.again();
      else if (near(x, y, SHARE, 10)) this.share();
      else if (near(x, y, BOARD, 10)) this.scene.start("Board");
      else if (near(x, y, MENU, 10)) this.scene.start("Title");
    }, { lockMs: 900 });
  }

  again() {
    audio.play("lever");
    store.newGame();
    this.scene.start("Intro");
  }

  async share() {
    audio.play("pop");
    const where = machine(this.run.machine).name.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
    const words = this.cashedOut
      ? `I cashed out with ${coins(this.score)} Christmas coins on ${where} at Grandma Felicia's Christmas Casino! 🎄🎰 Can you beat that?`
      : `I had ${coins(this.score)} Christmas coins on ${where} at Grandma Felicia's Christmas Casino! 🎄🎰 Can you beat that?`;
    const outcome = await shareWin(words, this.picture || null);
    if (outcome !== "cancelled") this.shareText.setText("📣 SHARED! AGAIN?");
  }
}
