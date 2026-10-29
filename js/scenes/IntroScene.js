// Between the title and the slots: Grandma Felicia welcomes everyone in (out loud: PLAY's tap has
// already let the phone play sound) and three big lines say what the game is about.
// It goes on to the casino floor by itself after a few seconds, or straight away on a tap.
import * as audio from "../audio.js";
import * as store from "../storage.js";
import { listenForTaps } from "../taps.js";
import { W, backdrop, coins, setupCamera, snow, text } from "../ui.js";

const FIRST_WAIT = 6000; // the first time on this phone, there's more to read
const WAIT = 3500;

export class IntroScene extends Phaser.Scene {
  constructor() {
    super("Intro");
  }

  create() {
    setupCamera(this);
    backdrop(this);
    snow(this, 30);
    this.started = false;
    const game = store.get("game");
    const first = !store.get("seenIntro");
    store.set("seenIntro", true);

    // Felicia, big, with a speech bubble
    const felicia = this.add.image(W / 2 - 70, 470, "felicia").setOrigin(0.5, 1);
    felicia.setScale(380 / felicia.height);
    this.tweens.add({ targets: felicia, y: 462, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    const bubble = this.add.graphics();
    bubble.fillStyle(0x2a0a14).fillRoundedRect(W - 250, 96, 236, 150, 30);
    bubble.fillStyle(0xffffff).fillRoundedRect(W - 246, 100, 228, 142, 27);
    bubble.fillTriangle(W - 236, 200, W - 236, 236, W - 290, 250);
    const words = game ? "Welcome back, sweetie!" : "Let's go to the casino!";
    const said = text(this, W - 132, 171, words, 30, { color: "#a3122a", stroke: "#ffffff", strokeThickness: 2, wrap: 210 });
    said.setScale(0);
    this.tweens.add({ targets: said, scale: 1, duration: 350, delay: 250, ease: "Back.easeOut" });
    audio.say(game ? "feliciaBack" : "feliciaHello", 0.35);

    // what the game is about
    const box = this.add.graphics();
    box.fillStyle(0x000000, 0.5).fillRoundedRect(30, 492, W - 60, 250, 24);
    const lines = [
      ["🎰", "PULL THE SLOTS"],
      ["🎟️", "WIN SCRATCH-OFFS"],
      ["🎅", "SANTA DROPS BY"],
    ];
    lines.forEach(([icon, words], i) => {
      const y = 540 + i * 70;
      this.add.text(70, y, icon, { fontSize: "44px", resolution: 2, padding: { y: 6 } }).setOrigin(0, 0.5);
      text(this, 140, y, words, 36, { originX: 0, strokeThickness: 7 });
    });
    const coinLine = game ? `YOU HAVE ${coins(game.coins)} COINS` : "CASH OUT WHILE YOU'RE AHEAD!";
    text(this, W / 2, 744, coinLine, 28, { color: "#ffe066", strokeThickness: 6 });

    const go = text(this, W / 2, 870, "TAP TO PLAY!", 52, { color: "#7CFC9A", strokeThickness: 9 });
    this.tweens.add({ targets: go, scale: 1.1, duration: 500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    this.time.delayedCall(first ? FIRST_WAIT : WAIT, () => this.start());
    listenForTaps(this, () => this.start(), { lockMs: 600 });
  }

  start() {
    if (this.started) return;
    this.started = true;
    audio.play("pop");
    this.scene.start("Floor");
  }
}
